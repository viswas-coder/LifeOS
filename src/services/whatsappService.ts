import { WhatsAppSuggestion, WhatsAppConfig } from '../types';

function getAuthHeaders(token?: string): Record<string, string> {
  const activeToken = token || localStorage.getItem('lifeos_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

export async function fetchWhatsAppSuggestions(token?: string): Promise<WhatsAppSuggestion[]> {
  try {
    const res = await fetch('/api/whatsapp/suggestions', {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions || [];
  } catch (err) {
    console.error('Failed to fetch WhatsApp suggestions:', err);
    return [];
  }
}

export async function simulateWhatsAppMessage(
  message: string,
  sender?: string,
  senderName?: string,
  token?: string
): Promise<{ success: boolean; suggestion?: WhatsAppSuggestion; error?: string }> {
  try {
    const res = await fetch('/api/whatsapp/test-message', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ message, sender, senderName }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to simulate message' };
    }
    return { success: true, suggestion: data.suggestion };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error simulating message' };
  }
}

export async function approveWhatsAppSuggestionApi(
  id: string,
  createdItemId?: string,
  token?: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/whatsapp/suggestions/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ createdItemId }),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to approve suggestion:', err);
    return false;
  }
}

export async function rejectWhatsAppSuggestionApi(id: string, token?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/whatsapp/suggestions/${id}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to reject suggestion:', err);
    return false;
  }
}

export async function deleteWhatsAppSuggestionApi(id: string, token?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/whatsapp/suggestions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete suggestion:', err);
    return false;
  }
}

export async function clearProcessedWhatsAppSuggestionsApi(token?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/whatsapp/suggestions/clear', {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to clear processed suggestions:', err);
    return false;
  }
}

export async function getWhatsAppConfigApi(token?: string): Promise<WhatsAppConfig | null> {
  try {
    const res = await fetch('/api/whatsapp/config', {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.config || null;
  } catch (err) {
    console.error('Failed to get WhatsApp config:', err);
    return null;
  }
}

export async function saveWhatsAppConfigApi(
  config: Partial<WhatsAppConfig>,
  token?: string
): Promise<WhatsAppConfig | null> {
  try {
    const res = await fetch('/api/whatsapp/config', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(config),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.config || null;
  } catch (err) {
    console.error('Failed to save WhatsApp config:', err);
    return null;
  }
}
