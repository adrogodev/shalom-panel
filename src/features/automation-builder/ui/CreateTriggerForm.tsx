'use client';

import React, { useEffect, useId, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ORDER_STATUS_OPTIONS } from '../model/recipe';
import {
  BASE_EVENT_OPTIONS,
  ORDER_STATUS_KEYS,
  createEmptyTriggerDraft,
  validateTriggerDraft,
  type AutomationTriggerOption,
  type BaseEvent,
  type TriggerDraft,
} from '../model/triggers';
import { useTriggersStore } from '../model/triggers.store';

interface CreateTriggerFormProps {
  onCreated: (trigger: AutomationTriggerOption) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deep-olive';

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Inline form to create a custom trigger in plain language. */
export function CreateTriggerForm({ onCreated, onCancel }: CreateTriggerFormProps) {
  const id = useId();
  const createTrigger = useTriggersStore((state) => state.createTrigger);
  const paymentMethods = useTriggersStore((state) => state.paymentMethods);
  const paymentMethodsStatus = useTriggersStore((state) => state.paymentMethodsStatus);
  const loadPaymentMethods = useTriggersStore((state) => state.loadPaymentMethods);

  const [draft, setDraft] = useState<TriggerDraft>(createEmptyTriggerDraft);
  const [problems, setProblems] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (draft.baseEvent === 'PAYMENT_CONFIRMED' && paymentMethodsStatus === 'idle') loadPaymentMethods();
  }, [draft.baseEvent, paymentMethodsStatus, loadPaymentMethods]);

  const update = (changes: Partial<TriggerDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const save = async () => {
    const found = validateTriggerDraft(draft);
    setProblems(found);
    if (found.length > 0) return;

    setIsSaving(true);
    try {
      onCreated(await createTrigger(draft));
    } catch (err) {
      setProblems([err instanceof Error ? err.message : 'No pudimos crear el disparador.']);
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border-2 border-dashed border-deep-olive/40 bg-deep-olive/5 space-y-4">
      <div>
        <span className="block text-sm font-semibold text-primary-base">Nuevo disparador</span>
        <span className="block text-xs text-muted-dark">
          Elige un momento y, si quieres, limita cuándo debe activarse.
        </span>
      </div>

      {problems.length > 0 && (
        <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1 text-sm text-rose-800">
          {problems.map((problem) => (
            <p key={problem} className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {problem}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-name`} className="block text-sm font-medium text-primary-base mb-1">
            Nombre
          </label>
          <input
            id={`${id}-name`}
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Ej.: Cuando preguntan por el precio"
            maxLength={150}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${id}-description`} className="block text-sm font-medium text-primary-base mb-1">
            Descripción (opcional)
          </label>
          <input
            id={`${id}-description`}
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Para recordar para qué sirve"
            className={inputClass}
          />
        </div>
      </div>

      <div className="max-w-sm">
        <label htmlFor={`${id}-event`} className="block text-sm font-medium text-primary-base mb-1">
          ¿Basado en qué evento?
        </label>
        <select
          id={`${id}-event`}
          value={draft.baseEvent}
          onChange={(e) => update({ baseEvent: e.target.value as BaseEvent })}
          className={inputClass}
        >
          {(Object.keys(BASE_EVENT_OPTIONS) as BaseEvent[]).map((event) => (
            <option key={event} value={event}>
              {BASE_EVENT_OPTIONS[event]}
            </option>
          ))}
        </select>
      </div>

      {draft.baseEvent === 'ORDER_STATUS_CHANGED' && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-primary-base">¿A qué estados debe pasar el pedido?</legend>
          <p className="text-xs text-muted-dark">Si no marcas ninguno, se activa con cualquier cambio de estado.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ORDER_STATUS_KEYS.map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm text-primary-base">
                <input
                  type="checkbox"
                  checked={draft.statusKeys.includes(key)}
                  onChange={() => update({ statusKeys: toggle(draft.statusKeys, key) })}
                />
                {ORDER_STATUS_OPTIONS[key]}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {draft.baseEvent === 'MESSAGE_RECEIVED' && (
        <div>
          <label htmlFor={`${id}-keywords`} className="block text-sm font-medium text-primary-base mb-1">
            Palabras clave (separadas por coma)
          </label>
          <input
            id={`${id}-keywords`}
            value={draft.keywords}
            onChange={(e) => update({ keywords: e.target.value })}
            placeholder="Ej.: precio, catálogo, envío"
            className={inputClass}
          />
          <p className="text-xs text-muted-dark mt-1">
            Se activa solo si el mensaje del cliente contiene alguna de estas palabras.
          </p>
        </div>
      )}

      {draft.baseEvent === 'PAYMENT_CONFIRMED' && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-primary-base">¿Con qué métodos de pago?</legend>
          <p className="text-xs text-muted-dark">Si no marcas ninguno, se activa con cualquier pago.</p>
          {paymentMethodsStatus === 'loading' && <p className="text-xs text-muted-dark">Cargando métodos de pago…</p>}
          {paymentMethodsStatus === 'error' && (
            <p className="text-xs text-rose-700">
              No pudimos cargar los métodos de pago.{' '}
              <button type="button" onClick={() => loadPaymentMethods()} className="font-semibold underline">
                Reintentar
              </button>
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {paymentMethods.map((method) => (
              <label key={method.key} className="flex items-center gap-2 text-sm text-primary-base">
                <input
                  type="checkbox"
                  checked={draft.paymentMethodKeys.includes(method.key)}
                  onChange={() => update({ paymentMethodKeys: toggle(draft.paymentMethodKeys, method.key) })}
                />
                {method.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-deep-olive text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {isSaving ? 'Guardando…' : 'Guardar disparador'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-muted-dark hover:text-primary-base"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
