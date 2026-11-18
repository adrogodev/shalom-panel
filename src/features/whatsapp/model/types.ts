export type InstanceStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export const DEFAULT_INSTANCE_NAME = 'shalom-main';

export interface WhatsAppInstance {
  id?: string;
  name: string;
  status: InstanceStatus;
  phoneNumber: string | null;
  qrCode: string | null;
  pairingCode?: string | null;
}

export interface SyncSummary {
  contacts: number;
  conversations: number;
  messages: number;
}

export interface InboxCustomer {
  id: string;
  firstName: string;
  lastName?: string | null;
  /** Null when WhatsApp only exposes a LID (privacy identifier) for the contact. */
  phone: string | null;
  totalOrders?: number;
  totalSpent?: number | string;
  tags?: { tag: { id: string; name: string } }[];
}

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'AUDIO'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'VIDEO'
  | 'STICKER'
  | 'CONTACT'
  | 'REACTION'
  | 'POLL'
  | 'OTHER';

/** AVAILABLE: stored and viewable; MISSING: could not be saved; TOO_LARGE: above the server size cap. */
export type AttachmentStatus = 'AVAILABLE' | 'MISSING' | 'TOO_LARGE';

export interface MessageAttachment {
  id: string;
  messageId: string;
  mimeType: string;
  fileName: string | null;
  fileSize: number | null;
  status: AttachmentStatus;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  isAnimated: boolean;
  isVoiceNote: boolean;
}

/** Structured data the server keeps for non-file kinds (see the server WhatsAppMessageParser). */
export interface MessageMetadata {
  viewOnce?: boolean;
  location?: { latitude: number; longitude: number; name?: string; address?: string; live?: boolean };
  contacts?: { name: string; phone?: string }[];
  poll?: { question: string; options: string[]; selectableCount?: number };
  reaction?: { emoji: string; targetProviderMessageId: string | null; targetMessageId?: string };
}

export interface AttachmentLink {
  url: string;
  mimeType: string;
  fileName: string;
  expiresInSeconds?: number;
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  providerMessageId?: string | null;
  senderType: 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'BOT';
  messageType?: MessageType | string;
  content: string;
  status: MessageStatus;
  timestamp: string;
  metadata?: MessageMetadata | null;
  attachments?: MessageAttachment[];
}

export interface InboxConversation {
  id: string;
  customerId: string;
  externalChatJid: string;
  status: string;
  unreadCount: number;
  lastMessageAt: string;
  customer: InboxCustomer;
  messages?: InboxMessage[];
}

export interface ConversationDetail {
  conversation: InboxConversation;
  messages: InboxMessage[];
}

export interface ProductOption {
  id: string;
  name: string;
  sku: string;
  salePrice: number;
}

export interface VariantOption {
  id: string;
  sku: string;
  salePrice: number;
  currentStock?: number;
  attributes?: Record<string, unknown>;
}

export const customerName = (customer?: InboxCustomer | null) =>
  customer ? [customer.firstName, customer.lastName].filter(Boolean).join(' ') : '';

export const HIDDEN_PHONE_LABEL = 'Número oculto por WhatsApp';

export const customerPhone = (customer?: InboxCustomer | null) => customer?.phone || HIDDEN_PHONE_LABEL;
