import { create } from 'zustand';
import { createTrigger, fetchPaymentMethods, fetchTriggers } from '../api/triggers.api';
import {
  toCreateTriggerPayload,
  type AutomationTriggerOption,
  type PaymentMethodOption,
  type TriggerDraft,
} from './triggers';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface TriggersState {
  triggers: AutomationTriggerOption[];
  status: LoadStatus;
  error: string | null;
  paymentMethods: PaymentMethodOption[];
  paymentMethodsStatus: LoadStatus;
  load: () => Promise<void>;
  loadPaymentMethods: () => Promise<void>;
  /** Creates the trigger and refreshes the list. Throws a user-facing message on failure. */
  createTrigger: (draft: TriggerDraft) => Promise<AutomationTriggerOption>;
}

function friendlyError(err: unknown, action: string): string {
  const detail = err instanceof Error ? err.message : '';
  return `No pudimos ${action}. Revisa tu conexión e intenta de nuevo.${detail ? ` (${detail})` : ''}`;
}

export const useTriggersStore = create<TriggersState>((set, get) => ({
  triggers: [],
  status: 'idle',
  error: null,
  paymentMethods: [],
  paymentMethodsStatus: 'idle',

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      set({ triggers: await fetchTriggers(), status: 'ready' });
    } catch (err) {
      set({ status: 'error', error: friendlyError(err, 'cargar los disparadores') });
    }
  },

  loadPaymentMethods: async () => {
    set({ paymentMethodsStatus: 'loading' });
    try {
      set({ paymentMethods: await fetchPaymentMethods(), paymentMethodsStatus: 'ready' });
    } catch {
      set({ paymentMethodsStatus: 'error' });
    }
  },

  createTrigger: async (draft) => {
    let created: AutomationTriggerOption;
    try {
      created = await createTrigger(toCreateTriggerPayload(draft));
    } catch (err) {
      throw new Error(friendlyError(err, 'crear el disparador'));
    }
    await get().load();
    // Keep the new trigger selectable even if the refresh failed.
    if (!get().triggers.some((trigger) => trigger.key === created.key)) {
      set((state) => ({ triggers: [...state.triggers, created] }));
    }
    return created;
  },
}));

export function resetTriggersStore(triggers: AutomationTriggerOption[] = []) {
  useTriggersStore.setState({
    triggers,
    status: 'idle',
    error: null,
    paymentMethods: [],
    paymentMethodsStatus: 'idle',
  });
}
