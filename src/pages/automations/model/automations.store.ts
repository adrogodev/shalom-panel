import { create } from 'zustand';
import { describeStep, type AutomationRecipe } from '@/features/automation-builder';
import {
  fetchAutomations,
  persistAutomation,
  setAutomationActive,
  type AutomationSummary,
} from '../api/automations.api';

export type { AutomationSummary };

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AutomationsState {
  automations: AutomationSummary[];
  status: LoadStatus;
  error: string | null;
  /** Message shown on the list right after saving from the editor. */
  notice: string | null;
  load: () => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
  /** Saves on the server. Throws a user-facing message when it fails. */
  saveAutomation: (input: { id?: string; recipe: AutomationRecipe; isActive: boolean }) => Promise<void>;
  dismissNotice: () => void;
}

export function summarize(recipe: AutomationRecipe): string {
  const steps = recipe.steps.map((step, index) => {
    const text = describeStep(step);
    return index === 0 ? text : `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  });
  return steps.length > 0 ? `${steps.join(', luego ')}.` : '';
}

function friendlyError(err: unknown, action: string): string {
  const detail = err instanceof Error ? err.message : '';
  return `No pudimos ${action}. Revisa tu conexión e intenta de nuevo.${detail ? ` (${detail})` : ''}`;
}

export const useAutomationsStore = create<AutomationsState>((set, get) => ({
  automations: [],
  status: 'idle',
  error: null,
  notice: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ automations: await fetchAutomations(), status: 'ready' });
    } catch (err) {
      set({ status: 'error', error: friendlyError(err, 'cargar tus automatizaciones') });
    }
  },

  toggleActive: async (id) => {
    const current = get().automations.find((automation) => automation.id === id);
    if (!current) return;
    const isActive = !current.isActive;

    // Optimistic update, reverted if the server rejects it.
    const apply = (value: boolean) =>
      set((state) => ({
        automations: state.automations.map((automation) =>
          automation.id === id ? { ...automation, isActive: value } : automation,
        ),
      }));

    apply(isActive);
    try {
      await setAutomationActive(id, isActive);
    } catch (err) {
      apply(!isActive);
      set({ error: friendlyError(err, isActive ? 'encender la automatización' : 'apagar la automatización') });
    }
  },

  saveAutomation: async ({ id, recipe, isActive }) => {
    const name = recipe.name.trim();
    try {
      await persistAutomation({ id, recipe, summary: summarize(recipe), isActive });
    } catch (err) {
      throw new Error(friendlyError(err, 'guardar la automatización'));
    }

    set({
      notice: isActive
        ? `"${name}" quedó guardada y encendida.`
        : `"${name}" quedó guardada. Está apagada hasta que la enciendas.`,
    });
    await get().load();
  },

  dismissNotice: () => set({ notice: null }),
}));

export function resetAutomationsStore(automations: AutomationSummary[] = []) {
  useAutomationsStore.setState({ automations, status: 'idle', error: null, notice: null });
}
