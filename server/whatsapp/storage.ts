import fs from 'fs';
import path from 'path';
import { WhatsAppSuggestion, WhatsAppConfig } from './types';
import { SessionUser, ensureDataDir } from '../authStorage';

const DATA_DIR = path.join(process.cwd(), 'data');
const ADMIN_WHATSAPP_FILE = path.join(DATA_DIR, 'whatsapp_admin.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'whatsapp_config.json');

const DEFAULT_CONFIG: WhatsAppConfig = {
  enabled: true,
  verifyToken: 'lifeos_whatsapp_verify_token_2026',
  allowedSenders: [], // empty = allow all
  autoCategorize: true,
  notificationOnReceived: true,
  defaultPriority: 'medium',
};

interface StoredWhatsAppStore {
  suggestions: WhatsAppSuggestion[];
  processedMessageIds: string[];
}

// In-memory isolated storage for guest sessions
const guestSuggestions = new Map<string, WhatsAppSuggestion[]>();
const guestProcessedIds = new Map<string, Set<string>>();
const guestConfigs = new Map<string, WhatsAppConfig>();

function readAdminWhatsAppStore(): StoredWhatsAppStore {
  ensureDataDir();
  if (!fs.existsSync(ADMIN_WHATSAPP_FILE)) {
    const initial: StoredWhatsAppStore = {
      suggestions: [],
      processedMessageIds: [],
    };
    fs.writeFileSync(ADMIN_WHATSAPP_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(ADMIN_WHATSAPP_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read admin WhatsApp store:', err);
    return { suggestions: [], processedMessageIds: [] };
  }
}

function writeAdminWhatsAppStore(store: StoredWhatsAppStore) {
  ensureDataDir();
  const tempFile = `${ADMIN_WHATSAPP_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tempFile, ADMIN_WHATSAPP_FILE);
}

export function getWhatsAppConfig(user?: SessionUser, token?: string): WhatsAppConfig {
  if (!user || user.role === 'admin') {
    ensureDataDir();
    if (!fs.existsSync(ADMIN_CONFIG_FILE)) {
      fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
      return { ...DEFAULT_CONFIG };
    }
    try {
      const raw = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  // Guest
  if (token && guestConfigs.has(token)) {
    return guestConfigs.get(token)!;
  }
  return { ...DEFAULT_CONFIG };
}

export function saveWhatsAppConfig(user: SessionUser, token: string, config: Partial<WhatsAppConfig>): WhatsAppConfig {
  const current = getWhatsAppConfig(user, token);
  const updated: WhatsAppConfig = { ...current, ...config };

  if (user.role === 'admin') {
    ensureDataDir();
    const tempFile = `${ADMIN_CONFIG_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), 'utf8');
    fs.renameSync(tempFile, ADMIN_CONFIG_FILE);
    return updated;
  }

  // Guest
  guestConfigs.set(token, updated);
  return updated;
}

export function isMessageProcessed(user: SessionUser | undefined, token: string | undefined, messageId: string): boolean {
  if (!messageId) return false;

  if (!user || user.role === 'admin') {
    const store = readAdminWhatsAppStore();
    return store.processedMessageIds.includes(messageId);
  }

  // Guest
  if (token && guestProcessedIds.has(token)) {
    return guestProcessedIds.get(token)!.has(messageId);
  }
  return false;
}

export function markMessageProcessed(user: SessionUser | undefined, token: string | undefined, messageId: string) {
  if (!messageId) return;

  if (!user || user.role === 'admin') {
    const store = readAdminWhatsAppStore();
    if (!store.processedMessageIds.includes(messageId)) {
      store.processedMessageIds.push(messageId);
      // Cap deduplication list to last 1000 items
      if (store.processedMessageIds.length > 1000) {
        store.processedMessageIds = store.processedMessageIds.slice(-1000);
      }
      writeAdminWhatsAppStore(store);
    }
    return;
  }

  // Guest
  if (token) {
    if (!guestProcessedIds.has(token)) {
      guestProcessedIds.set(token, new Set<string>());
    }
    guestProcessedIds.get(token)!.add(messageId);
  }
}

export function getSuggestions(user?: SessionUser, token?: string): WhatsAppSuggestion[] {
  if (!user || user.role === 'admin') {
    const store = readAdminWhatsAppStore();
    return store.suggestions;
  }

  // Guest
  if (token && guestSuggestions.has(token)) {
    return guestSuggestions.get(token)!;
  }
  return [];
}

export function addSuggestion(user: SessionUser | undefined, token: string | undefined, suggestion: WhatsAppSuggestion) {
  if (!user || user.role === 'admin') {
    const store = readAdminWhatsAppStore();
    // Avoid exact duplicate IDs
    const exists = store.suggestions.some(s => s.id === suggestion.id || s.messageId === suggestion.messageId);
    if (!exists) {
      store.suggestions.unshift(suggestion);
      // Cap at 200 items
      if (store.suggestions.length > 200) {
        store.suggestions = store.suggestions.slice(0, 200);
      }
      writeAdminWhatsAppStore(store);
    }
    return;
  }

  // Guest
  if (token) {
    if (!guestSuggestions.has(token)) {
      guestSuggestions.set(token, []);
    }
    const list = guestSuggestions.get(token)!;
    const exists = list.some(s => s.id === suggestion.id || s.messageId === suggestion.messageId);
    if (!exists) {
      list.unshift(suggestion);
      if (list.length > 200) list.length = 200;
    }
  }
}

export function updateSuggestionStatus(
  user: SessionUser,
  token: string,
  id: string,
  status: 'approved' | 'rejected' | 'pending',
  createdItemId?: string
): boolean {
  if (user.role === 'admin') {
    const store = readAdminWhatsAppStore();
    const item = store.suggestions.find(s => s.id === id);
    if (item) {
      item.status = status;
      if (status === 'approved') {
        item.approvedAt = new Date().toISOString();
        if (createdItemId) item.createdItemId = createdItemId;
      }
      writeAdminWhatsAppStore(store);
      return true;
    }
    return false;
  }

  // Guest
  const list = guestSuggestions.get(token);
  if (list) {
    const item = list.find(s => s.id === id);
    if (item) {
      item.status = status;
      if (status === 'approved') {
        item.approvedAt = new Date().toISOString();
        if (createdItemId) item.createdItemId = createdItemId;
      }
      return true;
    }
  }
  return false;
}

export function deleteSuggestion(user: SessionUser, token: string, id: string): boolean {
  if (user.role === 'admin') {
    const store = readAdminWhatsAppStore();
    const initialLen = store.suggestions.length;
    store.suggestions = store.suggestions.filter(s => s.id !== id);
    if (store.suggestions.length !== initialLen) {
      writeAdminWhatsAppStore(store);
      return true;
    }
    return false;
  }

  // Guest
  const list = guestSuggestions.get(token);
  if (list) {
    const initialLen = list.length;
    const filtered = list.filter(s => s.id !== id);
    guestSuggestions.set(token, filtered);
    return filtered.length !== initialLen;
  }
  return false;
}

export function clearProcessedSuggestions(user: SessionUser, token: string): boolean {
  if (user.role === 'admin') {
    const store = readAdminWhatsAppStore();
    // Keep pending suggestions, clear approved and rejected
    store.suggestions = store.suggestions.filter(s => s.status === 'pending');
    writeAdminWhatsAppStore(store);
    return true;
  }

  // Guest
  const list = guestSuggestions.get(token);
  if (list) {
    guestSuggestions.set(token, list.filter(s => s.status === 'pending'));
    return true;
  }
  return false;
}
