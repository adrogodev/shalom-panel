import { apiClient } from '@/shared/api';
import {
  recipeFromDefinition,
  toStoredDefinition,
  type AutomationRecipe,
} from '@/features/automation-builder';

/** Automation as returned by GET /automations. */
interface AutomationDto {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  isActive: boolean;
  versions: { id: string; definition: unknown; isPublished: boolean }[];
  totalExecutions?: number;
  lastExecutedAt?: string | null;
}

export interface AutomationSummary {
  id: string;
  name: string;
  summary: string;
  recipe: AutomationRecipe;
  isActive: boolean;
  timesRun: number;
  lastRunAt: string | null;
}

function toSummary(dto: AutomationDto): AutomationSummary {
  return {
    id: dto.id,
    name: dto.name,
    summary: dto.description ?? '',
    recipe: recipeFromDefinition(dto.versions[0]?.definition, { name: dto.name, triggerType: dto.triggerType }),
    isActive: dto.isActive,
    timesRun: dto.totalExecutions ?? 0,
    lastRunAt: dto.lastExecutedAt ?? null,
  };
}

export async function fetchAutomations(): Promise<AutomationSummary[]> {
  const automations = await apiClient<AutomationDto[]>('/automations');
  return automations.map(toSummary);
}

export async function setAutomationActive(id: string, isActive: boolean): Promise<void> {
  await apiClient(`/automations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

/**
 * Saves an automation: creates it when new, stores the generated flow as a new
 * version and publishes it, then applies name, summary, trigger and on/off.
 */
export async function persistAutomation(input: {
  id?: string;
  recipe: AutomationRecipe;
  summary: string;
  isActive: boolean;
}): Promise<string> {
  const name = input.recipe.name.trim();
  const triggerType = input.recipe.trigger.type;

  const id =
    input.id ??
    (
      await apiClient<{ id: string }>('/automations', {
        method: 'POST',
        body: JSON.stringify({ name, triggerType, description: input.summary }),
      })
    ).id;

  const version = await apiClient<{ id: string }>(`/automations/${id}/versions`, {
    method: 'POST',
    body: JSON.stringify({ definition: toStoredDefinition({ ...input.recipe, name }) }),
  });

  await apiClient(`/automations/${id}/versions/${version.id}/publish`, { method: 'POST' });

  await apiClient(`/automations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, description: input.summary, triggerType, isActive: input.isActive }),
  });

  return id;
}
