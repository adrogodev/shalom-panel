'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/widgets/layout';
import {
  Workflow,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Settings2,
  X,
  History,
} from 'lucide-react';

interface AutomationItem {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  isActive: boolean;
  version: number;
  totalExecutions: number;
  lastExecutedAt?: string;
}

const mockAutomations: AutomationItem[] = [
  {
    id: 'auto-1',
    name: 'Confirmación de Pedido WhatsApp',
    description: 'Envía inmediatamente un mensaje con el resumen del pedido, datos de pago y tiempo estimado de entrega.',
    triggerType: 'ORDER_CREATED',
    isActive: true,
    version: 3,
    totalExecutions: 142,
    lastExecutedAt: 'Hace 15 min',
  },
  {
    id: 'auto-2',
    name: 'Recordatorio de Pago Pendiente',
    description: 'Si después de 4 horas el pedido sigue en PENDIENTE, envía un mensaje amigable con los datos de Nequi y Bancolombia.',
    triggerType: 'ORDER_STATUS_CHANGED',
    isActive: true,
    version: 2,
    totalExecutions: 38,
    lastExecutedAt: 'Hace 2 horas',
  },
  {
    id: 'auto-3',
    name: 'Bienvenida a Nuevos Contactos',
    description: 'Cuando un nuevo número inicia conversación por WhatsApp, responde con saludo de bienvenida y menú de catálogo.',
    triggerType: 'MESSAGE_RECEIVED',
    isActive: false,
    version: 1,
    totalExecutions: 0,
    lastExecutedAt: 'Nunca',
  },
  {
    id: 'auto-4',
    name: 'Notificación de Guía de Despacho',
    description: 'Al marcar un pedido como ENVIADO, despacha automáticamente la guía de transporte al WhatsApp del cliente.',
    triggerType: 'ORDER_STATUS_CHANGED',
    isActive: true,
    version: 2,
    totalExecutions: 95,
    lastExecutedAt: 'Hace 1 hora',
  },
];

export function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationItem[]>(mockAutomations);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Formulario nueva automatización
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('ORDER_CREATED');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAuto: AutomationItem = {
      id: `auto-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Flujo de automatización comercial',
      triggerType,
      isActive: false,
      version: 1,
      totalExecutions: 0,
    };

    setAutomations([newAuto, ...automations]);
    setIsNewModalOpen(false);
    setName('');
    setDescription('');
  };

  const toggleActive = (id: string) => {
    setAutomations(
      automations.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
    );
  };

  return (
    <AdminLayout>
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-slate/30 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-base">
              Constructor de Automatizaciones
            </h1>
            <p className="text-muted-dark text-sm mt-1">
              Flujos de trabajo visuales basados en grafos acíclicos (DAG): triggers por evento, mensajes de WhatsApp, condiciones y branching
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-base text-white rounded-lg text-sm font-semibold hover:bg-primary-base/90 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Nueva Automatización
          </button>
        </header>

        {/* Plantillas Recomendadas */}
        <section className="p-6 bg-deep-olive/5 rounded-2xl border border-deep-olive/20 space-y-4">
          <div className="flex items-center gap-2 text-deep-olive font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Plantillas Recomendadas para Comercio por WhatsApp</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-border-slate/30 shadow-xs space-y-2">
              <span className="text-xs font-bold text-primary-base flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-deep-olive" />
                Confirmación Inmediata
              </span>
              <p className="text-xs text-muted-dark leading-relaxed">
                Envía comprobante con el número SH-YYYY-XXXX y datos de transferencia tan pronto se registra un pedido.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-border-slate/30 shadow-xs space-y-2">
              <span className="text-xs font-bold text-primary-base flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Recuperación de Carrito / Pago
              </span>
              <p className="text-xs text-muted-dark leading-relaxed">
                Espera un retardo de 4 horas y si el pago no ha sido verificado, reenvía los datos bancarios.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-border-slate/30 shadow-xs space-y-2">
              <span className="text-xs font-bold text-primary-base flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-active-green" />
                Atención Fuera de Horario
              </span>
              <p className="text-xs text-muted-dark leading-relaxed">
                Detecta mensajes entrantes fuera del horario comercial y responde con preguntas frecuentes y catálogo digital.
              </p>
            </div>
          </div>
        </section>

        {/* Listado de Automatizaciones */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {automations.map((auto) => (
            <div
              key={auto.id}
              className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm flex flex-col justify-between space-y-4 hover:border-deep-olive/40 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-surface-light border border-border-slate/30 text-deep-olive">
                    {auto.triggerType}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        auto.isActive ? 'bg-active-green animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => toggleActive(auto.id)}
                      className={`text-xs font-bold px-2 py-0.5 rounded transition ${
                        auto.isActive
                          ? 'bg-active-green/10 text-active-green hover:bg-active-green/20'
                          : 'bg-surface-light text-muted-dark hover:bg-border-slate/20'
                      }`}
                    >
                      {auto.isActive ? 'Activo' : 'Pausado'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-primary-base">{auto.name}</h3>
                  <p className="text-xs text-muted-dark mt-1 leading-relaxed">{auto.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border-slate/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-muted-dark">
                  <span>Versión v{auto.version}</span>
                  <span>•</span>
                  <span>{auto.totalExecutions} ejecuciones</span>
                </div>

                <Link
                  href={`/automations/${auto.id}`}
                  className="inline-flex items-center gap-1.5 font-bold text-deep-olive hover:text-primary-base transition"
                >
                  Diseñar Flujo
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </section>

        {/* Modal Crear Automatización */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-border-slate/30 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border-slate/20 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-deep-olive/10 text-deep-olive rounded-lg">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary-base">Nueva Automatización</h3>
                    <p className="text-xs text-muted-dark">Configura el nombre y disparador inicial del flujo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="p-1.5 text-muted-dark hover:text-primary-base rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                    Nombre del Flujo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Notificación de Pedido Despachado"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                    Evento Disparador (Trigger) *
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
                  >
                    <option value="ORDER_CREATED">ORDER_CREATED — Cuando se crea un nuevo pedido</option>
                    <option value="ORDER_STATUS_CHANGED">ORDER_STATUS_CHANGED — Cuando cambia el estado del pedido</option>
                    <option value="CUSTOMER_CREATED">CUSTOMER_CREATED — Cuando se registra un nuevo cliente</option>
                    <option value="MESSAGE_RECEIVED">MESSAGE_RECEIVED — Cuando entra un mensaje por WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                    Descripción del Objetivo
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe qué hace este flujo para tu equipo comercial..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-slate/20">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 border border-border-slate/40 rounded-lg text-xs font-medium text-muted-dark hover:bg-surface-light"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary-base text-white rounded-lg text-xs font-semibold hover:bg-primary-base/90 shadow-sm"
                  >
                    Crear & Abrir Lienzo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}
