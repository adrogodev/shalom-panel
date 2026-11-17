'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/widgets/layout';
import { AlertCircle, ArrowLeft, Power, Save } from 'lucide-react';
import {
  RecipeEditor,
  buildFlowDefinition,
  createEmptyRecipe,
  createRecipeFromTemplate,
  findTemplate,
  validateRecipe,
  type AutomationRecipe,
} from '@/features/automation-builder';
import { useAutomationsStore } from '../model/automations.store';

interface FlowBuilderPageProps {
  automationId: string;
  templateKey?: string;
}

function loadInitialRecipe(existing: AutomationRecipe | undefined, templateKey?: string): AutomationRecipe {
  if (existing) return existing;
  if (templateKey && findTemplate(templateKey)) return createRecipeFromTemplate(templateKey);
  return createEmptyRecipe();
}

/**
 * Guided automation editor. The user describes the automation in plain
 * language; the engine graph is generated from that description on save.
 */
export function FlowBuilderPage({ automationId, templateKey }: FlowBuilderPageProps) {
  const router = useRouter();
  const existing = useAutomationsStore((state) =>
    state.automations.find((automation) => automation.id === automationId),
  );
  const saveAutomation = useAutomationsStore((state) => state.saveAutomation);

  const isNew = !existing;
  const isActive = existing?.isActive ?? false;
  const [recipe, setRecipe] = useState<AutomationRecipe>(() => loadInitialRecipe(existing?.recipe, templateKey));
  const [problems, setProblems] = useState<string[]>([]);

  const definition = useMemo(() => buildFlowDefinition(recipe), [recipe]);

  const save = (activate: boolean) => {
    const found = validateRecipe(recipe);
    if (found.length > 0) {
      setProblems(found);
      return;
    }

    // TODO: send `definition` to POST /automations/:id/versions (and publish when activating)
    // once the panel is wired to the automations API.
    saveAutomation({ id: automationId, recipe, isActive: activate || isActive });
    router.push('/automations');
  };

  return (
    <AdminLayout>
      <main className="p-8 max-w-4xl mx-auto space-y-8">
        <header className="space-y-4 border-b border-border-slate/30 pb-5">
          <Link
            href="/automations"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-dark hover:text-primary-base transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a automatizaciones
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <label className="flex-1 block">
              <span className="block text-sm font-medium text-muted-dark mb-1">
                {isNew ? 'Nueva automatización' : 'Nombre de la automatización'}
              </span>
              <input
                type="text"
                value={recipe.name}
                placeholder="Ej. Avisar cuando el pedido va en camino"
                onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
                className="w-full text-2xl font-bold text-primary-base bg-transparent border-b-2 border-transparent hover:border-border-slate/40 focus:border-deep-olive focus:outline-none py-1 transition"
              />
            </label>

            <span
              className={`inline-flex items-center gap-1.5 self-start md:self-auto px-3 py-1 rounded-full text-xs font-semibold ${
                isActive ? 'bg-active-green/10 text-active-green' : 'bg-surface-light text-muted-dark'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {isActive ? 'Encendida' : 'Apagada'}
            </span>
          </div>
        </header>

        <RecipeEditor
          recipe={recipe}
          onChange={(next) => {
            setRecipe(next);
            setProblems([]);
          }}
        />

        {problems.length > 0 && (
          <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4" />
              Antes de guardar, revisa esto:
            </span>
            <ul className="list-disc list-inside text-sm text-rose-800 space-y-1">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        <footer className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-border-slate/30">
          <button
            type="button"
            onClick={() => save(false)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border-slate/40 text-primary-base rounded-lg text-sm font-semibold hover:bg-surface-light transition"
          >
            <Save className="w-4 h-4" />
            Guardar sin encender
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-base text-white rounded-lg text-sm font-semibold hover:bg-primary-base/90 shadow-sm transition"
          >
            <Power className="w-4 h-4" />
            Guardar y encender
          </button>
        </footer>

        <details className="text-xs text-muted-dark">
          <summary className="cursor-pointer select-none">Información para soporte técnico</summary>
          <pre className="mt-2 p-3 rounded-lg bg-surface-light border border-border-slate/30 overflow-x-auto">
            {JSON.stringify(definition, null, 2)}
          </pre>
        </details>
      </main>
    </AdminLayout>
  );
}
