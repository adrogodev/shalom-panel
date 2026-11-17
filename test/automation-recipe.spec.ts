import { describe, it, expect } from 'vitest';
import {
  buildFlowDefinition,
  validateRecipe,
  renderMessagePreview,
  createRecipeFromTemplate,
  toStoredDefinition,
  recipeFromDefinition,
  type AutomationRecipe,
} from '../src/features/automation-builder';

const paymentReminder: AutomationRecipe = {
  name: 'Recordatorio de pago',
  trigger: { type: 'ORDER_STATUS_CHANGED', statusKey: 'PENDING_PAYMENT' },
  steps: [
    { id: 'a', kind: 'wait', amount: 4, unit: 'hours' },
    { id: 'b', kind: 'check', check: 'PAYMENT_PENDING' },
    { id: 'c', kind: 'send_message', message: 'Hola {{nombre_cliente}}, tu pedido sigue pendiente.' },
  ],
};

describe('buildFlowDefinition', () => {
  it('creates a trigger node followed by one node per step, in order', () => {
    const { nodes } = buildFlowDefinition(paymentReminder);

    expect(nodes.map((n) => n.type)).toEqual(['trigger', 'wait', 'condition', 'send_whatsapp']);
    expect(nodes[0].data).toMatchObject({
      triggerType: 'ORDER_STATUS_CHANGED',
      statusKey: 'PENDING_PAYMENT',
    });
  });

  it('links each node to the next one and leaves the condition through its "true" branch', () => {
    const { nodes, edges } = buildFlowDefinition(paymentReminder);

    expect(edges).toEqual([
      { id: `e-${nodes[0].id}-${nodes[1].id}`, source: nodes[0].id, target: nodes[1].id },
      { id: `e-${nodes[1].id}-${nodes[2].id}`, source: nodes[1].id, target: nodes[2].id },
      {
        id: `e-${nodes[2].id}-${nodes[3].id}`,
        source: nodes[2].id,
        target: nodes[3].id,
        sourceHandle: 'true',
      },
    ]);
  });

  it('stores machine-readable values for waits, checks and messages', () => {
    const { nodes } = buildFlowDefinition(paymentReminder);

    expect(nodes[1].data).toMatchObject({ amount: 4, unit: 'hours', delayMinutes: 240 });
    expect(nodes[2].data).toMatchObject({ check: 'PAYMENT_PENDING' });
    expect(nodes[3].data).toMatchObject({
      message: 'Hola {{nombre_cliente}}, tu pedido sigue pendiente.',
    });
  });

  it('lays nodes out vertically so the graph can still be opened in a canvas', () => {
    const { nodes } = buildFlowDefinition(paymentReminder);
    const ys = nodes.map((n) => n.position.y);

    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
    expect(new Set(ys).size).toBe(ys.length);
  });

  it('produces only the trigger node when there are no steps', () => {
    const { nodes, edges } = buildFlowDefinition({ ...paymentReminder, steps: [] });

    expect(nodes).toHaveLength(1);
    expect(edges).toEqual([]);
  });
});

describe('validateRecipe', () => {
  it('accepts a complete recipe', () => {
    expect(validateRecipe(paymentReminder)).toEqual([]);
  });

  it('asks for a name, at least one step and a message text in plain language', () => {
    const problems = validateRecipe({
      name: '  ',
      trigger: { type: 'ORDER_CREATED' },
      steps: [{ id: 'x', kind: 'send_message', message: '' }],
    });

    expect(problems).toContain('Ponle un nombre a la automatización.');
    expect(problems).toContain('El paso 1 no tiene mensaje. Escribe lo que quieres enviar.');
  });

  it('requires at least one step', () => {
    expect(validateRecipe({ ...paymentReminder, steps: [] })).toContain(
      'Agrega al menos un paso: por ejemplo, enviar un mensaje.',
    );
  });

  it('rejects waits shorter than one unit', () => {
    const problems = validateRecipe({
      ...paymentReminder,
      steps: [{ id: 'w', kind: 'wait', amount: 0, unit: 'minutes' }, paymentReminder.steps[2]],
    });

    expect(problems).toContain('El paso 1 debe esperar al menos 1 minuto.');
  });

  it('requires something to happen after a check', () => {
    const problems = validateRecipe({
      ...paymentReminder,
      steps: [paymentReminder.steps[1]],
    });

    expect(problems).toContain('Después de la verificación del paso 1 agrega qué debe pasar.');
  });

  it('requires choosing the order status when the trigger is a status change', () => {
    const problems = validateRecipe({
      ...paymentReminder,
      trigger: { type: 'ORDER_STATUS_CHANGED' },
    });

    expect(problems).toContain('Elige a qué estado debe cambiar el pedido.');
  });
});

describe('renderMessagePreview', () => {
  it('replaces known variables with sample values and keeps unknown ones', () => {
    expect(renderMessagePreview('Hola {{nombre_cliente}}, pedido {{numero_pedido}} {{otra}}')).toBe(
      'Hola María, pedido SH-2026-0042 {{otra}}',
    );
  });
});

describe('createRecipeFromTemplate', () => {
  it('returns a valid recipe with fresh step ids each time', () => {
    const first = createRecipeFromTemplate('payment-reminder');
    const second = createRecipeFromTemplate('payment-reminder');

    expect(validateRecipe(first)).toEqual([]);
    expect(first.steps[0].id).not.toBe(second.steps[0].id);
  });
});

describe('stored definition round-trip', () => {
  it('keeps the recipe inside the definition so the editor can reopen it', () => {
    const recipe = createRecipeFromTemplate('payment-thanks');
    const stored = toStoredDefinition(recipe);

    expect(stored.nodes[0].data).toMatchObject({ triggerType: 'PAYMENT_CONFIRMED' });
    expect(recipeFromDefinition(stored, { name: 'Nuevo nombre', triggerType: 'PAYMENT_CONFIRMED' })).toEqual({
      ...recipe,
      name: 'Nuevo nombre',
    });
  });

  it('falls back to an empty recipe for its trigger when the definition has no recipe', () => {
    expect(recipeFromDefinition({ nodes: [], edges: [] }, { name: 'Vieja', triggerType: 'MESSAGE_RECEIVED' })).toEqual({
      name: 'Vieja',
      trigger: { type: 'MESSAGE_RECEIVED' },
      steps: [],
    });
  });
});
