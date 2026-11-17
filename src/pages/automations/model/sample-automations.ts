import { createRecipeFromTemplate, type AutomationRecipe } from '@/features/automation-builder';

/**
 * Sample automations shown until the panel is wired to the automations API.
 */
export interface AutomationSummary {
  id: string;
  name: string;
  summary: string;
  recipe: AutomationRecipe;
  isActive: boolean;
  timesRun: number;
  lastRun: string;
}

function sample(
  id: string,
  templateKey: string,
  summary: string,
  isActive: boolean,
  timesRun: number,
  lastRun: string,
): AutomationSummary {
  const recipe = createRecipeFromTemplate(templateKey);
  return { id, name: recipe.name, summary, recipe, isActive, timesRun, lastRun };
}

export function createSampleAutomations(): AutomationSummary[] {
  return [
    sample(
      'auto-1',
      'order-confirmation',
      'Le avisa al cliente que recibiste su pedido y le comparte cómo pagar.',
      true,
      142,
      'Hace 15 min',
    ),
    sample(
      'auto-2',
      'payment-reminder',
      'Si en 4 horas el pedido sigue sin pagar, le envía un recordatorio amable.',
      true,
      38,
      'Hace 2 horas',
    ),
    sample(
      'auto-3',
      'after-hours',
      'Si te escriben cuando no estás atendiendo, responde por ti.',
      false,
      0,
      'Nunca',
    ),
    sample(
      'auto-4',
      'shipping-notice',
      'Cuando marcas un pedido como enviado, le comparte la guía al cliente.',
      true,
      95,
      'Hace 1 hora',
    ),
  ];
}
