'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/widgets/layout';
import { AlertCircle, ArrowRight, CheckCircle2, Pencil, Plus, Sparkles, X } from 'lucide-react';
import { AUTOMATION_TEMPLATES, describeTrigger, useTriggersStore } from '@/features/automation-builder';
import { useAutomationsStore } from '../model/automations.store';

export function formatLastRun(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'Nunca';
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  const days = Math.round(hours / 24);
  return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
}

export function AutomationsPage() {
  const automations = useAutomationsStore((state) => state.automations);
  const status = useAutomationsStore((state) => state.status);
  const error = useAutomationsStore((state) => state.error);
  const notice = useAutomationsStore((state) => state.notice);
  const load = useAutomationsStore((state) => state.load);
  const toggleActive = useAutomationsStore((state) => state.toggleActive);
  const dismissNotice = useAutomationsStore((state) => state.dismissNotice);
  const triggers = useTriggersStore((state) => state.triggers);
  const loadTriggers = useTriggersStore((state) => state.load);

  useEffect(() => {
    load();
    // Trigger names for custom triggers; system ones have a local fallback.
    loadTriggers();
  }, [load, loadTriggers]);

  return (
    <AdminLayout>
      <main className="p-8 max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-slate/30 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-base">Automatizaciones</h1>
            <p className="text-muted-dark text-sm mt-1 max-w-2xl">
              Deja que SHALOM le escriba a tus clientes por ti: confirma pedidos, recuerda pagos y avisa
              envíos sin que tengas que hacerlo a mano.
            </p>
          </div>

          <Link
            href="/automations/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-base text-white rounded-lg text-sm font-semibold hover:bg-primary-base/90 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Crear desde cero
          </Link>
        </header>

        {notice && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-sm font-semibold text-emerald-800"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {notice}
            </span>
            <button
              type="button"
              aria-label="Cerrar aviso"
              onClick={dismissNotice}
              className="p-1 rounded-md hover:bg-emerald-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <section aria-labelledby="templates-title" className="space-y-4">
          <div>
            <h2 id="templates-title" className="flex items-center gap-2 text-lg font-bold text-primary-base">
              <Sparkles className="w-5 h-5 text-deep-olive" />
              Empieza con una idea lista
            </h2>
            <p className="text-sm text-muted-dark">
              Elige una, revisa el mensaje y actívala. Puedes cambiar lo que quieras.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AUTOMATION_TEMPLATES.map((template) => (
              <Link
                key={template.key}
                href={`/automations/new?template=${template.key}`}
                className="group p-5 bg-white rounded-xl border border-border-slate/30 shadow-sm hover:border-deep-olive transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <span className="block text-sm font-bold text-primary-base">{template.title}</span>
                  <span className="block text-xs text-muted-dark leading-relaxed">{template.summary}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-deep-olive">
                  Usar esta idea
                  <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="mine-title" className="space-y-4">
          <h2 id="mine-title" className="text-lg font-bold text-primary-base">
            Tus automatizaciones
          </h2>

          {error && (
            <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => load()} className="font-semibold underline">
                Reintentar
              </button>
            </div>
          )}

          {status === 'loading' && automations.length === 0 && (
            <p className="text-sm text-muted-dark">Cargando tus automatizaciones…</p>
          )}

          {status === 'ready' && automations.length === 0 && (
            <p className="p-6 rounded-xl border border-dashed border-border-slate/50 text-sm text-muted-dark text-center">
              Todavía no tienes automatizaciones. Empieza con una de las ideas de arriba.
            </p>
          )}

          <ul className="space-y-3">
            {automations.map((automation) => (
              <li
                key={automation.id}
                className="p-5 bg-white rounded-xl border border-border-slate/20 shadow-sm flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="flex-1 space-y-1">
                  <span className="block text-xs font-medium text-deep-olive">
                    {describeTrigger(automation.recipe.trigger, triggers)}
                  </span>
                  <h3 className="text-base font-bold text-primary-base">{automation.name}</h3>
                  <p className="text-sm text-muted-dark">{automation.summary}</p>
                  <p className="text-xs text-muted-dark pt-1">
                    Se ha usado {automation.timesRun} {automation.timesRun === 1 ? 'vez' : 'veces'} · Última
                    vez: {formatLastRun(automation.lastRunAt)}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <ActiveSwitch
                    isActive={automation.isActive}
                    name={automation.name}
                    onToggle={() => toggleActive(automation.id)}
                  />
                  <Link
                    href={`/automations/${automation.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border-slate/40 text-sm font-semibold text-primary-base hover:bg-surface-light transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </AdminLayout>
  );
}

function ActiveSwitch({
  isActive,
  name,
  onToggle,
}: {
  isActive: boolean;
  name: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={`${isActive ? 'Apagar' : 'Encender'} "${name}"`}
      onClick={onToggle}
      className="inline-flex items-center gap-2 text-sm font-medium"
    >
      <span
        className={`relative inline-flex h-6 w-11 rounded-full transition ${
          isActive ? 'bg-active-green' : 'bg-slate-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            isActive ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </span>
      <span className={isActive ? 'text-active-green' : 'text-muted-dark'}>
        {isActive ? 'Encendida' : 'Apagada'}
      </span>
    </button>
  );
}
