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
  phone: string;
  totalOrders?: number;
  totalSpent?: number | string;
  tags?: { tag: { id: string; name: string } }[];
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  providerMessageId?: string | null;
  senderType: 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'BOT';
  messageType?: string;
  content: string;
  status: MessageStatus;
  timestamp: string;
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
