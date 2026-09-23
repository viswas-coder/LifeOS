import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { WhatsAppSuggestion } from './types';
import { analyzeWhatsAppMessageWithGemini } from './analyzer';
import {
  getWhatsAppConfig,
  saveWhatsAppConfig,
  isMessageProcessed,
  markMessageProcessed,
  getSuggestions,
  addSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
  clearProcessedSuggestions,
} from './storage';

export function createWhatsAppRouter(
  getAiClient: () => GoogleGenAI | null,
  getUserFromToken: (token?: string) => any,
  extractToken: (req: Request) => string | undefined
): Router {
  const router = Router();

  // Webhook Verification (Meta WhatsApp Cloud API requirement)
  // GET /api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=...&hub.verify_token=...
  router.get('/webhook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const config = getWhatsAppConfig();

    if (mode === 'subscribe' && token === config.verifyToken) {
      console.log('[WhatsApp Webhook] Verification successful');
      return res.status(200).send(challenge);
    }

    console.warn('[WhatsApp Webhook] Verification failed with token:', token);
    return res.status(403).json({ error: 'Verification token mismatch' });
  });

  // Webhook Receiver (Meta WhatsApp Cloud API payload format & standard proxy payload)
  router.post('/webhook', async (req: Request, res: Response) => {
    try {
      const config = getWhatsAppConfig();
      if (!config.enabled) {
        return res.status(200).json({ status: 'ignored', reason: 'WhatsApp integration is disabled in config.' });
      }

      const body = req.body;
      const ai = getAiClient();

      // Parse Meta Cloud API structure:
      // entry[].changes[].value.messages[]
      let incomingMessages: Array<{ from: string; name?: string; text: string; id: string; timestamp: string }> = [];

      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          const changes = entry.changes || [];
          for (const change of changes) {
            const value = change.value || {};
            const contacts = value.contacts || [];
            const contactName = contacts[0]?.profile?.name;

            const messages = value.messages || [];
            for (const msg of messages) {
              if (msg.type === 'text' && msg.text?.body) {
                incomingMessages.push({
                  from: msg.from || 'Unknown',
                  name: contactName,
                  text: msg.text.body,
                  id: msg.id || `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  timestamp: msg.timestamp
                    ? new Date(Number(msg.timestamp) * 1000).toISOString()
                    : new Date().toISOString(),
                });
              }
            }
          }
        }
      } else if (body.text || body.message) {
        // Direct lightweight webhook format (e.g. from custom webhook forwarder / twilio / test bridge)
        incomingMessages.push({
          from: body.from || body.sender || 'Unknown',
          name: body.name || body.senderName,
          text: body.text || body.message,
          id: body.id || `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: body.timestamp || new Date().toISOString(),
        });
      }

      if (incomingMessages.length === 0) {
        return res.status(200).json({ status: 'received_no_text_messages' });
      }

      const processedResults = [];

      for (const msg of incomingMessages) {
        // Whitelist check
        if (config.allowedSenders.length > 0) {
          const isAllowed = config.allowedSenders.some(s =>
            msg.from.replace(/\D/g, '').includes(s.replace(/\D/g, ''))
          );
          if (!isAllowed) {
            console.log(`[WhatsApp Webhook] Sender ${msg.from} not in allowed whitelist. Ignoring.`);
            continue;
          }
        }

        // Deduplication
        if (isMessageProcessed(undefined, undefined, msg.id)) {
          console.log(`[WhatsApp Webhook] Message ${msg.id} already processed. Skipping duplicate.`);
          continue;
        }

        // Analyze message
        const parsed = ai
          ? await analyzeWhatsAppMessageWithGemini(ai, msg.text, msg.name || msg.from, msg.timestamp)
          : await (await import('./analyzer')).fallbackWhatsAppAnalyze(msg.text, msg.name || msg.from);

        const suggestion: WhatsAppSuggestion = {
          id: `wa-sug-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          messageId: msg.id,
          sender: msg.from,
          senderName: msg.name,
          rawMessage: msg.text,
          receivedAt: msg.timestamp,
          status: 'pending',
          parsedData: parsed,
          targetType: parsed.type,
        };

        addSuggestion(undefined, undefined, suggestion);
        markMessageProcessed(undefined, undefined, msg.id);
        processedResults.push(suggestion.id);
      }

      return res.status(200).json({ success: true, processedCount: processedResults.length, ids: processedResults });
    } catch (err: any) {
      console.error('[WhatsApp Webhook] Error processing webhook:', err);
      // Return 200 to WhatsApp to avoid perpetual retries on malformed payloads
      return res.status(200).json({ status: 'error', error: err.message });
    }
  });

  // Test Message Simulation endpoint (Allows full interactive testing without external tunnel)
  router.post('/test-message', async (req: Request, res: Response) => {
    try {
      const token = extractToken(req);
      const user = getUserFromToken(token);
      const { message, sender = '+1 (555) 019-2834', senderName = 'Alex Mercer' } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message content is required.' });
      }

      const ai = getAiClient();
      const timestamp = new Date().toISOString();

      const parsed = ai
        ? await analyzeWhatsAppMessageWithGemini(ai, message.trim(), senderName, timestamp)
        : (await import('./analyzer')).fallbackWhatsAppAnalyze(message.trim(), senderName);

      const suggestion: WhatsAppSuggestion = {
        id: `wa-sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        messageId: `msg-sim-${Date.now()}`,
        sender,
        senderName,
        rawMessage: message.trim(),
        receivedAt: timestamp,
        status: 'pending',
        parsedData: parsed,
        targetType: parsed.type,
      };

      addSuggestion(user, token, suggestion);
      markMessageProcessed(user, token, suggestion.messageId);

      return res.json({
        success: true,
        suggestion,
        message: 'Test WhatsApp message analyzed and added to LifeOS queue.',
      });
    } catch (err: any) {
      console.error('[WhatsApp Test] Error analyzing test message:', err);
      return res.status(500).json({ error: err.message || 'Failed to analyze test message.' });
    }
  });

  // Get Suggestions
  router.get('/suggestions', (req: Request, res: Response) => {
    const token = extractToken(req);
    const user = getUserFromToken(token);
    const suggestions = getSuggestions(user, token);
    return res.json({ success: true, suggestions });
  });

  // Approve Suggestion
  router.post('/suggestions/:id/approve', (req: Request, res: Response) => {
    const token = extractToken(req);
    const user = getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { createdItemId } = req.body;
    const success = updateSuggestionStatus(user, token!, id, 'approved', createdItemId);
    return res.json({ success });
  });

  // Reject / Dismiss Suggestion
  router.post('/suggestions/:id/reject', (req: Request, res: Response) => {
    const token = extractToken(req);
    const user = getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const success = updateSuggestionStatus(user, token!, id, 'rejected');
    return res.json({ success });
  });

  // Delete Suggestion
  router.delete('/suggestions/:id', (req: Request, res: Response) => {
    const token = extractToken(req);
    const user = getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const success = deleteSuggestion(user, token!, id);
    return res.json({ success });
  });

  // Clear Processed Suggestions
  router.post('/suggestions/clear', (req: Request, res: Response) => {
    const token = extractToken(req);
    const user = getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const success = clearProcessedSuggestions(user, token!);
    return res.json({ success });
  });

  // Get WhatsApp Configuration
  router.get('/config', (req: Request, res: Response) => {
    const token = extractToken(req);
    const user = getUserFromToken(token);
    const config = getWhatsAppConfig(user, token);
    return res.json({
      success: true,
      config: {
        enabled: config.enabled,
        verifyToken: config.verifyToken,
        allowedSenders: config.allowedSenders,
        autoCategorize: config.autoCategorize,
        notificationOnReceived: config.notificationOnReceived,
        defaultPriority: config.defaultPriority,
      },
    });
  });

  // Save WhatsApp Configuration
  router.post('/config', (req: Request, res: Response) => {
    const token = extractToken(req);
    const user = getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const updated = saveWhatsAppConfig(user, token!, req.body);
    return res.json({ success: true, config: updated });
  });

  return router;
}
