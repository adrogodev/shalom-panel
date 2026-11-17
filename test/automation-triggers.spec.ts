import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/api', () => ({ apiClient: vi.fn() }));

import { apiClient } from '@/shared/api';
import {
  buildFlowDefinition,
  describeTrigger,
  recipeFromDefinition,
  toCreateTriggerPayload,
  validateTriggerDraft,
  type AutomationTriggerOption,
  type TriggerDraft,
} from '../src/features/automation-builder';
import { createTrigger, fetchPaymentMethods, fetchTriggers } from '../src/features/automation-builder/api/triggers.api';

const client = vi.mocked(apiClient);
beforeEach(() => client.mockReset());

const CUSTOM: AutomationTriggerOption = {
  id: 't-1',
  key: 'PREGUNTAN_PRECIO',
  name: 'Cuando preguntan por el precio',
  description: 'Mensajes con la palabra precio',
  baseEvent: 'MESSAGE_RECEIVED',
  filters: { keywords: ['precio'] },
  isSystem: false,
};

describe('custom trigger keys in recipes', () => {
  it('describes a custom trigger by its name', () => {
    expect(describeTrigger({ type: 'PREGUNTAN_PRECIO' }, [CUSTOM])).toBe('Cuando preguntan por el precio');
  });

  it('still describes system triggers without the catalog', () => {
    expect(describeTrigger({ type: 'PAYMENT_CONFIRMED' })).toBe('Cuando se confirma un pago');
    expect(describeTrigger({ type: 'ORDER_STATUS_CHANGED', statusKey: 'SHIPPED' }, [CUSTOM])).toBe(
      'Cuando un pedido pasa a "Enviado"',
    );
  });

  it('keeps a custom trigger key in the generated flow and when reopening it', () => {
    const recipe = { name: 'Precios', trigger: { type: 'PREGUNTAN_PRECIO' }, steps: [] };
    expect(buildFlowDefinition(recipe).nodes[0].data).toMatchObject({ triggerType: 'PREGUNTAN_PRECIO' });
    expect(recipeFromDefinition({ nodes: [] }, { name: 'Precios', triggerType: 'PREGUNTAN_PRECIO' }).trigger).toEqual({
      type: 'PREGUNTAN_PRECIO',
    });
  });
});

describe('trigger draft', () => {
  const draft = (overrides: Partial<TriggerDraft> = {}): TriggerDraft => ({
    name: 'Pedidos enviados o entregados',
    description: '',
    baseEvent: 'ORDER_STATUS_CHANGED',
    statusKeys: ['SHIPPED', 'DELIVERED'],
    keywords: 'precio, catálogo',
    paymentMethodKeys: ['NEQUI'],
    ...overrides,
  });

  it('asks for a name in plain language', () => {
    expect(validateTriggerDraft(draft({ name: '  ' }))).toEqual(['Ponle un nombre al disparador.']);
    expect(validateTriggerDraft(draft())).toEqual([]);
  });

  it('asks for at least one keyword when the trigger is based on messages', () => {
    expect(validateTriggerDraft(draft({ baseEvent: 'MESSAGE_RECEIVED', keywords: ' , ' }))).toEqual([
      'Escribe al menos una palabra clave.',
    ]);
  });

  it('sends only the filter that belongs to the chosen event', () => {
    expect(toCreateTriggerPayload(draft())).toEqual({
      name: 'Pedidos enviados o entregados',
      baseEvent: 'ORDER_STATUS_CHANGED',
      filters: { statusKeys: ['SHIPPED', 'DELIVERED'] },
    });
    expect(toCreateTriggerPayload(draft({ baseEvent: 'MESSAGE_RECEIVED', description: 'Ventas' }))).toEqual({
      name: 'Pedidos enviados o entregados',
      description: 'Ventas',
      baseEvent: 'MESSAGE_RECEIVED',
      filters: { keywords: ['precio', 'catálogo'] },
    });
    expect(toCreateTriggerPayload(draft({ baseEvent: 'PAYMENT_CONFIRMED' })).filters).toEqual({
      paymentMethodKeys: ['NEQUI'],
    });
    expect(toCreateTriggerPayload(draft({ baseEvent: 'CUSTOMER_CREATED' })).filters).toEqual({});
  });
});

describe('triggers api', () => {
  it('loads the trigger catalog', async () => {
    client.mockResolvedValue([CUSTOM]);
    expect(await fetchTriggers()).toEqual([CUSTOM]);
    expect(client).toHaveBeenCalledWith('/automations/triggers');
  });

  it('creates a trigger with a POST', async () => {
    client.mockResolvedValue(CUSTOM);
    const payload = { name: 'X', baseEvent: 'MESSAGE_RECEIVED' as const, filters: { keywords: ['precio'] } };

    expect(await createTrigger(payload)).toEqual(CUSTOM);
    expect(client).toHaveBeenCalledWith('/automations/triggers', { method: 'POST', body: JSON.stringify(payload) });
  });

  it('loads the payment methods', async () => {
    client.mockResolvedValue([{ id: 'm1', key: 'NEQUI', name: 'Nequi' }]);
    expect(await fetchPaymentMethods()).toEqual([{ id: 'm1', key: 'NEQUI', name: 'Nequi' }]);
    expect(client).toHaveBeenCalledWith('/payments/methods');
  });
});
