export type WhatsAppItemType = 'task' | 'calendar_event' | 'idea' | 'casual';

export interface WhatsAppParsedData {
  isActionable: boolean;
  type: WhatsAppItemType;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedDuration?: number; // minutes
  tags: string[];
  confidence: number; // 0.0 - 1.0
  reasoning: string;
}

export interface WhatsAppSuggestion {
  id: string;
  messageId: string;
  sender: string; // phone number or display name
  senderName?: string;
  rawMessage: string;
  receivedAt: string; // ISO date
  status: 'pending' | 'approved' | 'rejected';
  parsedData: WhatsAppParsedData;
  approvedAt?: string;
  createdItemId?: string;
  targetType?: WhatsAppItemType;
}

export interface WhatsAppConfig {
  enabled: boolean;
  verifyToken: string;
  allowedSenders: string[]; // empty array = allow all
  autoCategorize: boolean;
  notificationOnReceived: boolean;
  defaultPriority: 'urgent' | 'high' | 'medium' | 'low';
}

export interface WhatsAppIncomingMessage {
  from: string;
  name?: string;
  id: string;
  timestamp: string | number;
  text: string;
}
