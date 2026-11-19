import { apiClient } from '@/shared/api';
import type {
  AttachmentLink,
  ConversationDetail,
  InboxConversation,
  InboxMessage,
  MessageAttachment,
  ProductOption,
  SyncSummary,
  VariantOption,
  WhatsAppInstance,
} from '../model/types';

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
const enc = encodeURIComponent;

export const fetchInstances = () => apiClient<WhatsAppInstance[]>('/whatsapp/instances');

export const fetchInstanceStatus = (name: string) =>
  apiClient<WhatsAppInstance & { exists?: boolean }>(`/whatsapp/instances/${enc(name)}/status`);

export const connectInstance = (name: string, phoneNumber?: string) =>
  apiClient<WhatsAppInstance>(
    `/whatsapp/instances/connect?name=${enc(name)}`,
    json(phoneNumber ? { phoneNumber } : {}),
  );

export const disconnectInstance = (name: string) =>
  apiClient<{ message: string }>(`/whatsapp/instances/disconnect?name=${enc(name)}`, { method: 'DELETE' });

export const syncInstance = (name: string) =>
  apiClient<SyncSummary>(`/whatsapp/instances/${enc(name)}/sync`, { method: 'POST' });

export const fetchConversations = (search?: string) =>
  apiClient<InboxConversation[]>(`/whatsapp/conversations${search ? `?search=${enc(search)}` : ''}`);

export const fetchConversationMessages = (conversationId: string) =>
  apiClient<ConversationDetail>(`/whatsapp/conversations/${enc(conversationId)}/messages`);

export const sendConversationMessage = (conversationId: string, text: string) =>
  apiClient<InboxMessage>(`/whatsapp/conversations/${enc(conversationId)}/messages`, json({ text }));

/** Short-lived (presigned) link to the file of a WhatsApp message; usable directly in <img>/<video>. */
export const fetchAttachmentLink = (messageId: string, attachmentId: string) =>
  apiClient<AttachmentLink>(`/whatsapp/messages/${enc(messageId)}/attachments/${enc(attachmentId)}`);

/** WhatsApp profile photo of a customer; `url` is null when hidden or unavailable. */
export const fetchProfilePicture = (customerId: string) =>
  apiClient<{ url: string | null }>(`/whatsapp/customers/${enc(customerId)}/profile-picture`);

export const searchProducts = async (search: string) => {
  const page = await apiClient<{ items: ProductOption[] }>(
    `/products?limit=20&status=ACTIVE${search ? `&search=${enc(search)}` : ''}`,
  );
  return page.items;
};

export const fetchProductVariants = async (productId: string) => {
  const product = await apiClient<{ variants?: VariantOption[] }>(`/products/${enc(productId)}`);
  return product.variants ?? [];
};

export const createQuickOrder = (
  conversationId: string,
  body: { items: { variantId: string; quantity: number }[]; shippingCost?: number; notes?: string },
) =>
  apiClient<{ id: string; orderNumber: string; total: string | number }>(
    `/whatsapp/conversations/${enc(conversationId)}/quick-order`,
    json(body),
  );

export type OutgoingMediaKind = 'image' | 'video' | 'gif' | 'audio' | 'voice' | 'document' | 'sticker';

export interface OutgoingAttachment {
  kind: OutgoingMediaKind;
  /** File content in base64 (a data: URL is accepted). */
  base64: string;
  mimeType: string;
  fileName: string;
  caption?: string;
}

/** Sends a file (image, video, GIF, audio, voice note, document or sticker) to the chat. */
export const sendConversationAttachment = (conversationId: string, attachment: OutgoingAttachment) =>
  apiClient<InboxMessage>(`/whatsapp/conversations/${enc(conversationId)}/attachments`, json(attachment));

export const sendConversationLocation = (
  conversationId: string,
  location: { latitude: number; longitude: number; name?: string; address?: string },
) => apiClient<InboxMessage>(`/whatsapp/conversations/${enc(conversationId)}/location`, json(location));

export const sendConversationContact = (conversationId: string, contact: { fullName: string; phone: string }) =>
  apiClient<InboxMessage>(`/whatsapp/conversations/${enc(conversationId)}/contact`, json(contact));

/** Downloads again from WhatsApp a file that could not be saved; returns the updated attachment. */
export const retryAttachment = (messageId: string, attachmentId: string) =>
  apiClient<MessageAttachment>(
    `/whatsapp/messages/${enc(messageId)}/attachments/${enc(attachmentId)}/retry`,
    { method: 'POST' },
  );

export const retryMissingAttachments = () =>
  apiClient<{ pending: number; recovered: number; unavailable: number }>('/whatsapp/attachments/retry-missing', {
    method: 'POST',
  });
