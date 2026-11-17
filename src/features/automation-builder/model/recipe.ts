/**
 * Automation "recipes": the plain-language model the user edits.
 *
 * Users never see nodes or edges. They pick *when* something happens and a
 * list of simple steps. `buildFlowDefinition` translates that recipe into the
 * graph definition `{ nodes, edges }` the automation engine stores and runs
 * (node types: trigger, send_whatsapp, wait, condition).
 */

import type { AutomationTriggerOption } from './triggers';

/** Triggers seeded by the server; their key equals their base event. */
export type SystemTriggerType =
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'CUSTOMER_CREATED'
  | 'MESSAGE_RECEIVED'
  | 'PAYMENT_CONFIRMED';

/** Key of a trigger from GET /automations/triggers (system or custom). */
export type TriggerType = string;

export type OrderStatusKey =
  | 'NEW'
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'IN_PREPARATION'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export type WaitUnit = 'minutes' | 'hours' | 'days';

export type CheckKey =
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_NOT_DELIVERED'
  | 'OUTSIDE_BUSINESS_HOURS'
  | 'FIRST_CONVERSATION';

export interface RecipeTrigger {
  type: TriggerType;
  /** Only used when type is ORDER_STATUS_CHANGED. */
  statusKey?: OrderStatusKey;
}

export type RecipeStep =
  | { id: string; kind: 'send_message'; message: string }
  | { id: string; kind: 'wait'; amount: number; unit: WaitUnit }
  | { id: string; kind: 'check'; check: CheckKey };

export type RecipeStepKind = RecipeStep['kind'];

export interface AutomationRecipe {
  name: string;
  trigger: RecipeTrigger;
  steps: RecipeStep[];
}

// ---------------------------------------------------------------------------
// Plain-language catalogs
// ---------------------------------------------------------------------------

/** Labels for the system triggers, used when the server catalog is not loaded. */
export const TRIGGER_OPTIONS: Record<SystemTriggerType, { title: string; hint: string }> = {
  ORDER_CREATED: {
    title: 'Cuando llega un pedido nuevo',
    hint: 'Apenas registras o recibes un pedido.',
  },
  ORDER_STATUS_CHANGED: {
    title: 'Cuando un pedido cambia de estado',
    hint: 'Por ejemplo, cuando pasa a "Enviado".',
  },
  CUSTOMER_CREATED: {
    title: 'Cuando se registra un cliente nuevo',
    hint: 'La primera vez que guardas a un cliente.',
  },
  MESSAGE_RECEIVED: {
    title: 'Cuando un cliente te escribe por WhatsApp',
    hint: 'Cada vez que entra un mensaje.',
  },
  PAYMENT_CONFIRMED: {
    title: 'Cuando se confirma un pago',
    hint: 'Apenas verificas un abono o pago del cliente.',
  },
};

export const ORDER_STATUS_OPTIONS: Record<OrderStatusKey, string> = {
  NEW: 'Nuevo',
  PENDING_CONFIRMATION: 'Pendiente de confirmación',
  CONFIRMED: 'Confirmado',
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pagado',
  IN_PREPARATION: 'En preparación',
  READY_TO_SHIP: 'Listo para despacho',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
};

export const CHECK_OPTIONS: Record<CheckKey, string> = {
  PAYMENT_PENDING: 'el pedido todavía no está pagado',
  PAYMENT_CONFIRMED: 'el pago ya fue confirmado',
  ORDER_NOT_DELIVERED: 'el pedido todavía no se ha entregado',
  OUTSIDE_BUSINESS_HOURS: 'es fuera del horario de atención',
  FIRST_CONVERSATION: 'es la primera vez que el cliente escribe',
};

export const WAIT_UNIT_LABELS: Record<WaitUnit, { one: string; many: string }> = {
  minutes: { one: 'minuto', many: 'minutos' },
  hours: { one: 'hora', many: 'horas' },
  days: { one: 'día', many: 'días' },
};

const MINUTES_PER_UNIT: Record<WaitUnit, number> = { minutes: 1, hours: 60, days: 1440 };

/** Variables the user can insert in a message, with the sample used in previews. */
export const MESSAGE_VARIABLES = [
  { token: '{{nombre_cliente}}', label: 'Nombre del cliente', sample: 'María' },
  { token: '{{numero_pedido}}', label: 'Número de pedido', sample: 'SH-2026-0042' },
  { token: '{{total_pedido}}', label: 'Total del pedido', sample: '$ 185.000' },
  { token: '{{estado_pedido}}', label: 'Estado del pedido', sample: 'Enviado' },
] as const;

// ---------------------------------------------------------------------------
// Human descriptions
// ---------------------------------------------------------------------------

export function formatWait(amount: number, unit: WaitUnit): string {
  const labels = WAIT_UNIT_LABELS[unit];
  return `${amount} ${amount === 1 ? labels.one : labels.many}`;
}

export function describeTrigger(trigger: RecipeTrigger, triggers: AutomationTriggerOption[] = []): string {
  if (trigger.type === 'ORDER_STATUS_CHANGED' && trigger.statusKey) {
    return `Cuando un pedido pasa a "${ORDER_STATUS_OPTIONS[trigger.statusKey]}"`;
  }
  const fromCatalog = triggers.find((option) => option.key === trigger.type);
  if (fromCatalog) return fromCatalog.name;
  return TRIGGER_OPTIONS[trigger.type as SystemTriggerType]?.title ?? 'Cuando ocurre un evento personalizado';
}

export function describeStep(step: RecipeStep): string {
  switch (step.kind) {
    case 'send_message':
      return 'Enviar un mensaje por WhatsApp';
    case 'wait':
      return `Esperar ${formatWait(step.amount, step.unit)}`;
    case 'check':
      return `Seguir solo si ${CHECK_OPTIONS[step.check]}`;
  }
}

export function renderMessagePreview(message: string): string {
  return MESSAGE_VARIABLES.reduce(
    (text, variable) => text.split(variable.token).join(variable.sample),
    message,
  );
}

// ---------------------------------------------------------------------------
// Validation (messages are shown to non-technical users)
// ---------------------------------------------------------------------------

export function validateRecipe(recipe: AutomationRecipe): string[] {
  const problems: string[] = [];

  if (!recipe.name.trim()) {
    problems.push('Ponle un nombre a la automatización.');
  }

  if (recipe.trigger.type === 'ORDER_STATUS_CHANGED' && !recipe.trigger.statusKey) {
    problems.push('Elige a qué estado debe cambiar el pedido.');
  }

  if (recipe.steps.length === 0) {
    problems.push('Agrega al menos un paso: por ejemplo, enviar un mensaje.');
  }

  recipe.steps.forEach((step, index) => {
    const position = index + 1;

    if (step.kind === 'send_message' && !step.message.trim()) {
      problems.push(`El paso ${position} no tiene mensaje. Escribe lo que quieres enviar.`);
    }

    if (step.kind === 'wait' && (!Number.isFinite(step.amount) || step.amount < 1)) {
      problems.push(`El paso ${position} debe esperar al menos 1 ${WAIT_UNIT_LABELS[step.unit].one}.`);
    }

    if (step.kind === 'check' && index === recipe.steps.length - 1) {
      problems.push(`Después de la verificación del paso ${position} agrega qué debe pasar.`);
    }
  });

  return problems;
}

// ---------------------------------------------------------------------------
// Recipe -> engine graph definition
// ---------------------------------------------------------------------------

export interface FlowNode {
  id: string;
  type: 'trigger' | 'send_whatsapp' | 'wait' | 'condition';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'true' | 'false';
}

export interface FlowDefinition {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const NODE_X = 250;
const NODE_SPACING_Y = 140;

function stepToNode(step: RecipeStep, index: number): FlowNode {
  const base = { id: `step-${step.id}`, position: { x: NODE_X, y: (index + 1) * NODE_SPACING_Y } };

  switch (step.kind) {
    case 'send_message':
      return { ...base, type: 'send_whatsapp', data: { message: step.message } };
    case 'wait':
      return {
        ...base,
        type: 'wait',
        data: {
          delay: formatWait(step.amount, step.unit),
          amount: step.amount,
          unit: step.unit,
          delayMinutes: step.amount * MINUTES_PER_UNIT[step.unit],
        },
      };
    case 'check':
      return {
        ...base,
        type: 'condition',
        data: { condition: describeStep(step), check: step.check },
      };
  }
}

/** Stored definition: the engine graph plus the recipe so the editor can reopen it. */
export interface StoredFlowDefinition extends FlowDefinition {
  recipe: AutomationRecipe;
}

export function toStoredDefinition(recipe: AutomationRecipe): StoredFlowDefinition {
  return { ...buildFlowDefinition(recipe), recipe };
}

export function isTriggerType(value: unknown): value is TriggerType {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Rebuilds the recipe saved inside a definition. Automations created outside
 * the guided editor fall back to an empty recipe for their trigger.
 */
export function recipeFromDefinition(
  definition: unknown,
  fallback: { name: string; triggerType: string },
): AutomationRecipe {
  const stored = (definition as Partial<StoredFlowDefinition> | null)?.recipe;
  if (stored && isTriggerType(stored.trigger?.type) && Array.isArray(stored.steps)) {
    return { ...stored, name: fallback.name, steps: stored.steps.map((step) => ({ ...step, id: step.id || newStepId() })) };
  }
  return {
    name: fallback.name,
    trigger: { type: isTriggerType(fallback.triggerType) ? fallback.triggerType : 'ORDER_CREATED' },
    steps: [],
  };
}

export function buildFlowDefinition(recipe: AutomationRecipe): FlowDefinition {
  const triggerNode: FlowNode = {
    id: 'trigger',
    type: 'trigger',
    position: { x: NODE_X, y: 0 },
    data: {
      label: describeTrigger(recipe.trigger),
      triggerType: recipe.trigger.type,
      ...(recipe.trigger.type === 'ORDER_STATUS_CHANGED' && recipe.trigger.statusKey
        ? { statusKey: recipe.trigger.statusKey }
        : {}),
    },
  };

  const nodes = [triggerNode, ...recipe.steps.map(stepToNode)];

  const edges: FlowEdge[] = nodes.slice(1).map((target, index) => {
    const source = nodes[index];
    return {
      id: `e-${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
      // A check only lets the flow continue when it is true.
      ...(source.type === 'condition' ? { sourceHandle: 'true' as const } : {}),
    };
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Step factory and ready-made templates
// ---------------------------------------------------------------------------

let idCounter = 0;

export function newStepId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function createStep(kind: RecipeStepKind): RecipeStep {
  const id = newStepId();
  switch (kind) {
    case 'send_message':
      return { id, kind, message: '' };
    case 'wait':
      return { id, kind, amount: 1, unit: 'hours' };
    case 'check':
      return { id, kind, check: 'PAYMENT_PENDING' };
  }
}

type TemplateStep =
  | Omit<Extract<RecipeStep, { kind: 'send_message' }>, 'id'>
  | Omit<Extract<RecipeStep, { kind: 'wait' }>, 'id'>
  | Omit<Extract<RecipeStep, { kind: 'check' }>, 'id'>;

export interface AutomationTemplate {
  key: string;
  title: string;
  summary: string;
  trigger: RecipeTrigger;
  steps: TemplateStep[];
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    key: 'order-confirmation',
    title: 'Confirmar pedidos nuevos',
    summary: 'Le avisa al cliente que recibiste su pedido y le comparte cómo pagar.',
    trigger: { type: 'ORDER_CREATED' },
    steps: [
      {
        kind: 'send_message',
        message:
          '¡Hola {{nombre_cliente}}! 🛍️ Recibimos tu pedido {{numero_pedido}} por {{total_pedido}}. Puedes pagar por Nequi o Bancolombia y enviarnos el comprobante por aquí.',
      },
    ],
  },
  {
    key: 'payment-reminder',
    title: 'Recordar pagos pendientes',
    summary: 'Si en 4 horas el pedido sigue sin pagar, le envía un recordatorio amable.',
    trigger: { type: 'ORDER_STATUS_CHANGED', statusKey: 'PENDING_PAYMENT' },
    steps: [
      { kind: 'wait', amount: 4, unit: 'hours' },
      { kind: 'check', check: 'PAYMENT_PENDING' },
      {
        kind: 'send_message',
        message:
          'Hola {{nombre_cliente}}, te recordamos que tu pedido {{numero_pedido}} está pendiente de pago. Cuando pagues, envíanos el comprobante y lo despachamos. 🙌',
      },
    ],
  },
  {
    key: 'shipping-notice',
    title: 'Avisar cuando se envía',
    summary: 'Cuando marcas un pedido como enviado, le avisa al cliente que va en camino.',
    trigger: { type: 'ORDER_STATUS_CHANGED', statusKey: 'SHIPPED' },
    steps: [
      {
        kind: 'send_message',
        message:
          '¡Buenas noticias, {{nombre_cliente}}! 🚚 Tu pedido {{numero_pedido}} ya va en camino. Te avisaremos cualquier novedad.',
      },
    ],
  },
  {
    key: 'payment-thanks',
    title: 'Agradecer pagos recibidos',
    summary: 'Cuando confirmas un pago, le da las gracias al cliente y le confirma el pedido.',
    trigger: { type: 'PAYMENT_CONFIRMED' },
    steps: [
      {
        kind: 'send_message',
        message:
          '¡Gracias, {{nombre_cliente}}! 🙌 Confirmamos tu pago del pedido {{numero_pedido}}. Ya lo estamos preparando.',
      },
    ],
  },
  {
    key: 'after-hours',
    title: 'Responder fuera de horario',
    summary: 'Si te escriben cuando no estás atendiendo, responde por ti.',
    trigger: { type: 'MESSAGE_RECEIVED' },
    steps: [
      { kind: 'check', check: 'OUTSIDE_BUSINESS_HOURS' },
      {
        kind: 'send_message',
        message:
          '¡Hola! Gracias por escribirnos. En este momento estamos fuera de horario, pero te respondemos apenas abramos. 😊',
      },
    ],
  },
];

export function findTemplate(key: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((template) => template.key === key);
}

export function createRecipeFromTemplate(key: string): AutomationRecipe {
  const template = findTemplate(key);
  if (!template) {
    throw new Error(`Unknown automation template: ${key}`);
  }
  return {
    name: template.title,
    trigger: { ...template.trigger },
    steps: template.steps.map((step) => ({ ...step, id: newStepId() }) as RecipeStep),
  };
}

export function createEmptyRecipe(trigger: RecipeTrigger = { type: 'ORDER_CREATED' }): AutomationRecipe {
  return { name: '', trigger, steps: [createStep('send_message')] };
}
