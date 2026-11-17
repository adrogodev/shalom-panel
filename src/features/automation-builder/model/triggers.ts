/**
 * Trigger catalog as served by GET /automations/triggers, plus the plain
 * language draft the user fills to create a custom trigger.
 */
import { ORDER_STATUS_OPTIONS, type OrderStatusKey } from './recipe';

export type BaseEvent =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'CUSTOMER_CREATED'
  | 'MESSAGE_RECEIVED'
  | 'PAYMENT_CONFIRMED';

export interface TriggerFilters {
  statusKeys?: string[];
  keywords?: string[];
  paymentMethodKeys?: string[];
}

export interface AutomationTriggerOption {
  id: string;
  /** Stored as the automation's triggerType. */
  key: string;
  name: string;
  description: string | null;
  baseEvent: BaseEvent;
  filters: TriggerFilters;
  isSystem: boolean;
}

export interface PaymentMethodOption {
  id: string;
  key: string;
  name: string;
}

/** Base events in plain language for the "¿Basado en qué evento?" choice. */
export const BASE_EVENT_OPTIONS: Record<BaseEvent, string> = {
  ORDER_CREATED: 'Cuando llega un pedido nuevo',
  ORDER_STATUS_CHANGED: 'Cuando un pedido cambia de estado',
  CUSTOMER_CREATED: 'Cuando se registra un cliente nuevo',
  MESSAGE_RECEIVED: 'Cuando un cliente escribe por WhatsApp',
  PAYMENT_CONFIRMED: 'Cuando se confirma un pago',
};

export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUS_OPTIONS) as OrderStatusKey[];

export interface TriggerDraft {
  name: string;
  description: string;
  baseEvent: BaseEvent;
  statusKeys: string[];
  /** Comma separated, as typed by the user. */
  keywords: string;
  paymentMethodKeys: string[];
}

export interface CreateTriggerPayload {
  name: string;
  description?: string;
  baseEvent: BaseEvent;
  filters: TriggerFilters;
}

export function createEmptyTriggerDraft(): TriggerDraft {
  return {
    name: '',
    description: '',
    baseEvent: 'ORDER_STATUS_CHANGED',
    statusKeys: [],
    keywords: '',
    paymentMethodKeys: [],
  };
}

export function parseKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(',')
        .map((word) => word.trim())
        .filter((word) => word.length > 0),
    ),
  );
}

/** Problems shown to non-technical users; empty when the draft can be saved. */
export function validateTriggerDraft(draft: TriggerDraft): string[] {
  const problems: string[] = [];
  if (!draft.name.trim()) problems.push('Ponle un nombre al disparador.');
  if (draft.baseEvent === 'MESSAGE_RECEIVED' && parseKeywords(draft.keywords).length === 0) {
    problems.push('Escribe al menos una palabra clave.');
  }
  return problems;
}

/** Only the filter that belongs to the chosen event is sent. */
export function toCreateTriggerPayload(draft: TriggerDraft): CreateTriggerPayload {
  const filters: TriggerFilters = {};
  if (draft.baseEvent === 'ORDER_STATUS_CHANGED' && draft.statusKeys.length > 0) {
    filters.statusKeys = [...draft.statusKeys];
  }
  if (draft.baseEvent === 'MESSAGE_RECEIVED') {
    const keywords = parseKeywords(draft.keywords);
    if (keywords.length > 0) filters.keywords = keywords;
  }
  if (draft.baseEvent === 'PAYMENT_CONFIRMED' && draft.paymentMethodKeys.length > 0) {
    filters.paymentMethodKeys = [...draft.paymentMethodKeys];
  }

  const description = draft.description.trim();
  return {
    name: draft.name.trim(),
    ...(description ? { description } : {}),
    baseEvent: draft.baseEvent,
    filters,
  };
}
