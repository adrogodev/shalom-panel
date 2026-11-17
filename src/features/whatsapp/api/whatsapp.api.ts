import { apiClient } from '@/shared/api';
import type {
  ConversationDetail,
  InboxConversation,
  InboxMessage,
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
