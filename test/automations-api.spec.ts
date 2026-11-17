import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/api', () => ({ apiClient: vi.fn() }));

import { apiClient } from '@/shared/api';
import { fetchAutomations, persistAutomation } from '../src/pages/automations/api/automations.api';
import { createRecipeFromTemplate } from '../src/features/automation-builder';

const client = vi.mocked(apiClient);

beforeEach(() => client.mockReset());

describe('persistAutomation', () => {
  const recipe = createRecipeFromTemplate('payment-thanks');

  it('creates, saves the generated flow, publishes it and applies on/off for a new automation', async () => {
    client
      .mockResolvedValueOnce({ id: 'a-9' }) // create
      .mockResolvedValueOnce({ id: 'v-1' }) // version
      .mockResolvedValueOnce({}) // publish
      .mockResolvedValueOnce({}); // patch

    const id = await persistAutomation({ recipe, summary: 'Resumen', isActive: false });

    expect(id).toBe('a-9');
    const calls = client.mock.calls.map(([url, options]) => [url, options?.method]);
    expect(calls).toEqual([
      ['/automations', 'POST'],
      ['/automations/a-9/versions', 'POST'],
      ['/automations/a-9/versions/v-1/publish', 'POST'],
      ['/automations/a-9', 'PATCH'],
    ]);

    expect(JSON.parse(client.mock.calls[0][1]!.body as string)).toEqual({
      name: 'Agradecer pagos recibidos',
      triggerType: 'PAYMENT_CONFIRMED',
      description: 'Resumen',
    });
    const version = JSON.parse(client.mock.calls[1][1]!.body as string);
    expect(version.definition.nodes.map((n: { type: string }) => n.type)).toEqual(['trigger', 'send_whatsapp']);
    expect(version.definition.recipe.trigger).toEqual({ type: 'PAYMENT_CONFIRMED' });
    expect(JSON.parse(client.mock.calls[3][1]!.body as string)).toEqual({
      name: 'Agradecer pagos recibidos',
      description: 'Resumen',
      triggerType: 'PAYMENT_CONFIRMED',
      isActive: false,
    });
  });

  it('does not create a new automation when editing an existing one', async () => {
    client.mockResolvedValueOnce({ id: 'v-2' }).mockResolvedValue({});

    await persistAutomation({ id: 'a-1', recipe, summary: 'Resumen', isActive: true });

    expect(client.mock.calls[0][0]).toBe('/automations/a-1/versions');
    expect(client.mock.calls.some(([url, options]) => url === '/automations' && options?.method === 'POST')).toBe(false);
  });
});

describe('fetchAutomations', () => {
  it('maps the server response and rebuilds each recipe from its latest version', async () => {
    const recipe = createRecipeFromTemplate('order-confirmation');
    client.mockResolvedValue([
      {
        id: 'a-1',
        name: 'Confirmar',
        description: 'Le avisa al cliente',
        triggerType: 'ORDER_CREATED',
        isActive: true,
        versions: [{ id: 'v-3', isPublished: true, definition: { nodes: [], edges: [], recipe } }],
        totalExecutions: 7,
        lastExecutedAt: '2026-11-17T15:00:00.000Z',
      },
    ]);

    const [automation] = await fetchAutomations();

    expect(automation).toMatchObject({
      id: 'a-1',
      name: 'Confirmar',
      summary: 'Le avisa al cliente',
      isActive: true,
      timesRun: 7,
      lastRunAt: '2026-11-17T15:00:00.000Z',
    });
    expect(automation.recipe.steps).toHaveLength(1);
    expect(automation.recipe.name).toBe('Confirmar');
  });
});
