import { apiClient } from '@/shared/api';
import type { CustomerProfile, CustomerProfileNote, CustomerProfileTag } from '../model/types';

const enc = encodeURIComponent;
const base = (customerId: string) => `/customer-profiles/${enc(customerId)}`;

export const fetchCustomerProfile = (customerId: string) => apiClient<CustomerProfile>(base(customerId));

export const addCustomerTag = (customerId: string, tag: { name: string; color?: string }) =>
  apiClient<CustomerProfileTag>(`${base(customerId)}/tags`, { method: 'POST', body: JSON.stringify(tag) });

export const removeCustomerTag = (customerId: string, tagId: string) =>
  apiClient<{ removed: boolean }>(`${base(customerId)}/tags/${enc(tagId)}`, { method: 'DELETE' });

export const addCustomerNote = (customerId: string, text: string) =>
  apiClient<CustomerProfileNote>(`${base(customerId)}/notes`, { method: 'POST', body: JSON.stringify({ text }) });

/** WhatsApp profile photo URL; any failure (404, network, private photo) means "no photo". */
export async function fetchProfilePicture(customerId: string): Promise<string | null> {
  try {
    const result = await apiClient<{ url: string | null }>(`/whatsapp/customers/${enc(customerId)}/profile-picture`);
    return result?.url || null;
  } catch {
    return null;
  }
}
