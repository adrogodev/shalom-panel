'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Clock,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import {
  CHECK_OPTIONS,
  MESSAGE_VARIABLES,
  ORDER_STATUS_OPTIONS,
  TRIGGER_OPTIONS,
  WAIT_UNIT_LABELS,
  createStep,
  describeStep,
  describeTrigger,
  renderMessagePreview,
  type AutomationRecipe,
  type CheckKey,
  type OrderStatusKey,
  type RecipeStep,
  type RecipeStepKind,
  type SystemTriggerType,
  type TriggerType,
  type WaitUnit,
} from '../model/recipe';
import { useTriggersStore } from '../model/triggers.store';
import { CreateTriggerForm } from './CreateTriggerForm';

interface RecipeEditorProps {
  recipe: AutomationRecipe;
  onChange: (recipe: AutomationRecipe) => void;
}

const STEP_KIND_META: Record<
  RecipeStepKind,
  { label: string; hint: string; icon: React.ElementType; accent: string }
> = {
  send_message: {
    label: 'Enviar un mensaje',
    hint: 'Le escribe al cliente por WhatsApp.',
    icon: MessageSquare,
    accent: 'text-deep-olive bg-deep-olive/10',
  },
  wait: {
    label: 'Esperar un tiempo',
    hint: 'Hace una pausa antes del siguiente paso.',
    icon: Clock,
    accent: 'text-blue-700 bg-blue-50',
  },
  check: {
    label: 'Revisar algo antes de seguir',
    hint: 'Continúa solo si se cumple lo que elijas.',
    icon: ShieldCheck,
    accent: 'text-amber-700 bg-amber-50',
  },
};

export function RecipeEditor({ recipe, onChange }: RecipeEditorProps) {
  const updateSteps = (steps: RecipeStep[]) => onChange({ ...recipe, steps });

  const replaceStep = (updated: RecipeStep) =>
    updateSteps(recipe.steps.map((step) => (step.id === updated.id ? updated : step)));

  const removeStep = (id: string) => updateSteps(recipe.steps.filter((step) => step.id !== id));

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= recipe.steps.length) return;
    const steps = [...recipe.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    updateSteps(steps);
  };

  const addStep = (kind: RecipeStepKind) => updateSteps([...recipe.steps, createStep(kind)]);

  return (
    <div className="space-y-8">
      <TriggerSection recipe={recipe} onChange={onChange} />

      <section aria-labelledby="steps-title" className="space-y-4">
        <SectionTitle number={2} id="steps-title" title="¿Qué debe hacer SHALOM?">
          Agrega los pasos en el orden en que deben ocurrir.
        </SectionTitle>

        <ol className="space-y-3">
          {recipe.steps.map((step, index) => (
            <li key={step.id}>
              <StepCard
                step={step}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === recipe.steps.length - 1}
                onChange={replaceStep}
                onRemove={() => removeStep(step.id)}
                onMoveUp={() => moveStep(index, -1)}
                onMoveDown={() => moveStep(index, 1)}
              />
            </li>
          ))}
        </ol>

        <AddStepMenu onAdd={addStep} />
      </section>

      <SummarySection recipe={recipe} />
    </div>
  );
}

function SectionTitle({
  number,
  id,
  title,
  children,
}: {
  number: number;
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-base text-white text-sm font-bold shrink-0">
        {number}
      </span>
      <div>
        <h2 id={id} className="text-lg font-bold text-primary-base">
          {title}
        </h2>
        <p className="text-sm text-muted-dark">{children}</p>
      </div>
    </div>
  );
}

function TriggerSection({ recipe, onChange }: RecipeEditorProps) {
  const triggers = useTriggersStore((state) => state.triggers);
  const status = useTriggersStore((state) => state.status);
  const error = useTriggersStore((state) => state.error);
  const load = useTriggersStore((state) => state.load);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (status === 'idle') load();
  }, [status, load]);

  const selectTrigger = (type: TriggerType) =>
    onChange({
      ...recipe,
      trigger:
        type === 'ORDER_STATUS_CHANGED'
          ? { type, statusKey: recipe.trigger.statusKey ?? 'SHIPPED' }
          : { type },
    });

  // Cards come from the server catalog; the system ones stay usable if it cannot be loaded.
  const options =
    triggers.length > 0
      ? triggers.map((trigger) => ({ key: trigger.key, title: trigger.name, hint: trigger.description ?? '' }))
      : status === 'error'
        ? (Object.keys(TRIGGER_OPTIONS) as SystemTriggerType[]).map((key) => ({
            key,
            title: TRIGGER_OPTIONS[key].title,
            hint: TRIGGER_OPTIONS[key].hint,
          }))
        : [];

  return (
    <section aria-labelledby="trigger-title" className="space-y-4">
      <SectionTitle number={1} id="trigger-title" title="¿Cuándo debe empezar?">
        Elige el momento en que esta automatización se pone en marcha.
      </SectionTitle>

      {status === 'loading' && triggers.length === 0 && (
        <p className="text-sm text-muted-dark">Cargando los disparadores…</p>
      )}

      {status === 'error' && error && (
        <p className="text-sm text-rose-700">
          {error}{' '}
          <button type="button" onClick={() => load()} className="font-semibold underline">
            Reintentar
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => {
          const selected = recipe.trigger.type === option.key;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={selected}
              onClick={() => selectTrigger(option.key)}
              className={`text-left p-4 rounded-xl border-2 transition ${
                selected
                  ? 'border-deep-olive bg-deep-olive/5'
                  : 'border-border-slate/30 bg-white hover:border-deep-olive/40'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-primary-base">
                <Zap className={`w-4 h-4 ${selected ? 'text-deep-olive' : 'text-muted-dark'}`} />
                {option.title}
              </span>
              {option.hint && <span className="block text-xs text-muted-dark mt-1">{option.hint}</span>}
            </button>
          );
        })}

        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="text-left p-4 rounded-xl border-2 border-dashed border-border-slate/50 bg-white hover:border-deep-olive hover:bg-deep-olive/5 transition"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-deep-olive">
              <Sparkles className="w-4 h-4" />
              Crear un nuevo disparador
            </span>
            <span className="block text-xs text-muted-dark mt-1">
              Por ejemplo, cuando un cliente pregunta por el precio.
            </span>
          </button>
        )}
      </div>

      {isCreating && (
        <CreateTriggerForm
          onCancel={() => setIsCreating(false)}
          onCreated={(trigger) => {
            selectTrigger(trigger.key);
            setIsCreating(false);
          }}
        />
      )}

      {recipe.trigger.type === 'ORDER_STATUS_CHANGED' && (
        <label className="block max-w-sm">
          <span className="block text-sm font-medium text-primary-base mb-1">
            ¿A qué estado debe pasar el pedido?
          </span>
          <select
            value={recipe.trigger.statusKey ?? ''}
            onChange={(e) =>
              onChange({
                ...recipe,
                trigger: { type: 'ORDER_STATUS_CHANGED', statusKey: e.target.value as OrderStatusKey },
              })
            }
            className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deep-olive"
          >
            <option value="" disabled>
              Elige un estado
            </option>
            {(Object.keys(ORDER_STATUS_OPTIONS) as OrderStatusKey[]).map((key) => (
              <option key={key} value={key}>
                {ORDER_STATUS_OPTIONS[key]}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

interface StepCardProps {
  step: RecipeStep;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (step: RecipeStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function StepCard({ step, position, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown }: StepCardProps) {
  const meta = STEP_KIND_META[step.kind];
  const Icon = meta.icon;

  return (
    <div className="p-5 bg-white rounded-xl border border-border-slate/30 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`p-2 rounded-lg ${meta.accent}`}>
            <Icon className="w-4 h-4" />
          </span>
          <div>
            <span className="block text-xs text-muted-dark">Paso {position}</span>
            <span className="block text-sm font-semibold text-primary-base">{meta.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <IconButton label={`Subir paso ${position}`} disabled={isFirst} onClick={onMoveUp}>
            <ArrowUp className="w-4 h-4" />
          </IconButton>
          <IconButton label={`Bajar paso ${position}`} disabled={isLast} onClick={onMoveDown}>
            <ArrowDown className="w-4 h-4" />
          </IconButton>
          <IconButton label={`Quitar paso ${position}`} onClick={onRemove} danger>
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      </div>

      {step.kind === 'send_message' && <MessageStepFields step={step} onChange={onChange} />}
      {step.kind === 'wait' && <WaitStepFields step={step} onChange={onChange} />}
      {step.kind === 'check' && <CheckStepFields step={step} onChange={onChange} />}
    </div>
  );
}

function IconButton({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded-lg text-muted-dark transition disabled:opacity-30 disabled:cursor-not-allowed ${
        danger ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-surface-light hover:text-primary-base'
      }`}
    >
      {children}
    </button>
  );
}

function MessageStepFields({
  step,
  onChange,
}: {
  step: Extract<RecipeStep, { kind: 'send_message' }>;
  onChange: (step: RecipeStep) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (token: string) => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? step.message.length;
    const end = textarea?.selectionEnd ?? step.message.length;
    const message = step.message.slice(0, start) + token + step.message.slice(end);
    onChange({ ...step, message });

    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      const caret = start + token.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block">
          <span className="block text-sm font-medium text-primary-base mb-1">Mensaje</span>
          <textarea
            ref={textareaRef}
            rows={5}
            value={step.message}
            placeholder="Escribe aquí lo que le quieres decir al cliente…"
            onChange={(e) => onChange({ ...step, message: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm focus:outline-none focus:ring-2 focus:ring-deep-olive"
          />
        </label>
        <div>
          <span className="block text-xs text-muted-dark mb-1.5">
            Toca un dato para agregarlo al mensaje. Se reemplaza automáticamente para cada cliente.
          </span>
          <div className="flex flex-wrap gap-1.5">
            {MESSAGE_VARIABLES.map((variable) => (
              <button
                key={variable.token}
                type="button"
                onClick={() => insertVariable(variable.token)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-light border border-border-slate/30 text-primary-base hover:border-deep-olive hover:text-deep-olive transition"
              >
                + {variable.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-primary-base">Así lo verá el cliente</span>
        <div className="p-4 rounded-xl bg-[#ECE5DD] min-h-[120px]">
          <div className="ml-auto max-w-[90%] px-3 py-2 rounded-lg rounded-tr-none bg-[#DCF8C6] text-sm text-gray-800 whitespace-pre-wrap shadow-sm">
            {step.message.trim() ? (
              renderMessagePreview(step.message)
            ) : (
              <span className="italic text-gray-500">Tu mensaje aparecerá aquí</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitStepFields({
  step,
  onChange,
}: {
  step: Extract<RecipeStep, { kind: 'wait' }>;
  onChange: (step: RecipeStep) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label>
        <span className="block text-sm font-medium text-primary-base mb-1">Esperar</span>
        <input
          type="number"
          min={1}
          value={Number.isFinite(step.amount) ? step.amount : ''}
          onChange={(e) => onChange({ ...step, amount: e.target.valueAsNumber })}
          className="w-24 px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm focus:outline-none focus:ring-2 focus:ring-deep-olive"
        />
      </label>
      <label>
        <span className="sr-only">Unidad de tiempo</span>
        <select
          value={step.unit}
          onChange={(e) => onChange({ ...step, unit: e.target.value as WaitUnit })}
          className="px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deep-olive"
        >
          {(Object.keys(WAIT_UNIT_LABELS) as WaitUnit[]).map((unit) => (
            <option key={unit} value={unit}>
              {WAIT_UNIT_LABELS[unit].many}
            </option>
          ))}
        </select>
      </label>
      <span className="text-sm text-muted-dark pb-2.5">y luego continúa con el siguiente paso.</span>
    </div>
  );
}

function CheckStepFields({
  step,
  onChange,
}: {
  step: Extract<RecipeStep, { kind: 'check' }>;
  onChange: (step: RecipeStep) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block max-w-md">
        <span className="block text-sm font-medium text-primary-base mb-1">Seguir solo si…</span>
        <select
          value={step.check}
          onChange={(e) => onChange({ ...step, check: e.target.value as CheckKey })}
          className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-deep-olive"
        >
          {(Object.keys(CHECK_OPTIONS) as CheckKey[]).map((key) => (
            <option key={key} value={key}>
              {CHECK_OPTIONS[key]}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-muted-dark">Si no se cumple, la automatización se detiene aquí.</p>
    </div>
  );
}

function AddStepMenu({ onAdd }: { onAdd: (kind: RecipeStepKind) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-border-slate/50 text-sm font-semibold text-deep-olive hover:border-deep-olive hover:bg-deep-olive/5 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Agregar un paso
      </button>
    );
  }

  return (
    <div className="p-4 rounded-xl border-2 border-dashed border-deep-olive/40 bg-deep-olive/5 space-y-3">
      <span className="block text-sm font-semibold text-primary-base">¿Qué quieres agregar?</span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(STEP_KIND_META) as RecipeStepKind[]).map((kind) => {
          const meta = STEP_KIND_META[kind];
          const Icon = meta.icon;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => {
                onAdd(kind);
                setOpen(false);
              }}
              className="text-left p-3 rounded-lg bg-white border border-border-slate/30 hover:border-deep-olive transition"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-primary-base">
                <span className={`p-1.5 rounded-md ${meta.accent}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {meta.label}
              </span>
              <span className="block text-xs text-muted-dark mt-1">{meta.hint}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs font-medium text-muted-dark hover:text-primary-base"
      >
        Cancelar
      </button>
    </div>
  );
}

function SummarySection({ recipe }: { recipe: AutomationRecipe }) {
  const triggers = useTriggersStore((state) => state.triggers);
  return (
    <section aria-labelledby="summary-title" className="p-5 rounded-xl bg-surface-light border border-border-slate/30 space-y-3">
      <h2 id="summary-title" className="text-sm font-bold text-primary-base">
        En resumen, esta automatización hará esto:
      </h2>
      <ol className="space-y-1.5 text-sm text-primary-base list-decimal list-inside">
        <li>{describeTrigger(recipe.trigger, triggers)}…</li>
        {recipe.steps.map((step) => (
          <li key={step.id}>{describeStep(step)}</li>
        ))}
      </ol>
    </section>
  );
}
