import { create } from 'zustand';
import { describeStep, type AutomationRecipe } from '@/features/automation-builder';
import { createSampleAutomations, type AutomationSummary } from './sample-automations';

/**
 * In-memory automations list shared by the list and the editor.
 * It lives for the browser session only, until the panel uses the API.
 */
interface AutomationsState {
  automations: AutomationSummary[];
  /** Message shown on the list right after saving from the editor. */
  notice: string | null;
  toggleActive: (id: string) => void;
  saveAutomation: (input: { id: string; recipe: AutomationRecipe; isActive: boolean }) => void;
  dismissNotice: () => void;
}

function summarize(recipe: AutomationRecipe): string {
  const steps = recipe.steps.map((step, index) => {
    const text = describeStep(step);
    return index === 0 ? text : `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  });
  return steps.length > 0 ? `${steps.join(', luego ')}.` : '';
}

export const useAutomationsStore = create<AutomationsState>((set) => ({
  automations: createSampleAutomations(),
  notice: null,

  toggleActive: (id) =>
    set((state) => ({
      automations: state.automations.map((automation) =>
        automation.id === id ? { ...automation, isActive: !automation.isActive } : automation,
      ),
    })),

  saveAutomation: ({ id, recipe, isActive }) =>
    set((state) => {
      const name = recipe.name.trim();
      const existing = state.automations.find((automation) => automation.id === id);
      const saved: AutomationSummary = {
        id: existing ? id : `auto-${Date.now().toString(36)}`,
        name,
        summary: summarize(recipe),
        recipe: { ...recipe, name },
        isActive,
        timesRun: existing?.timesRun ?? 0,
        lastRun: existing?.lastRun ?? 'Nunca',
      };

      return {
        automations: existing
          ? state.automations.map((automation) => (automation.id === id ? saved : automation))
          : [saved, ...state.automations],
        notice: isActive
          ? `"${name}" quedó guardada y encendida.`
          : `"${name}" quedó guardada. Está apagada hasta que la enciendas.`,
      };
    }),

  dismissNotice: () => set({ notice: null }),
}));

export function resetAutomationsStore() {
  useAutomationsStore.setState({ automations: createSampleAutomations(), notice: null });
}
