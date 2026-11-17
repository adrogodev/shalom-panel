import { apiClient } from '@/shared/api';
import type {
  AutomationTriggerOption,
  CreateTriggerPayload,
  PaymentMethodOption,
} from '../model/triggers';

export function fetchTriggers(): Promise<AutomationTriggerOption[]> {
  return apiClient<AutomationTriggerOption[]>('/automations/triggers');
}

export function createTrigger(payload: CreateTriggerPayload): Promise<AutomationTriggerOption> {
  return apiClient<AutomationTriggerOption>('/automations/triggers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchPaymentMethods(): Promise<PaymentMethodOption[]> {
  return apiClient<PaymentMethodOption[]>('/payments/methods');
}
