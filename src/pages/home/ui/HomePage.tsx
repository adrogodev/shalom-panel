import React from 'react';
import { formatCOP } from '@/shared/lib/utils';
import { Activity, ShoppingBag, Users, MessageSquare } from 'lucide-react';

export function HomePage() {
  return (
    <main className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="border-b border-border-slate/30 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary-base">
            SHALOM — Panel de Control
          </h1>
          <p className="text-muted-dark text-sm mt-1">
            Plataforma Integral de Gestión Comercial, Pedidos y Automatización de WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-active-green/10 text-active-green">
            <span className="w-2 h-2 mr-1.5 bg-active-green rounded-full animate-pulse" />
            Sistema Operativo
          </span>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-dark">
            <span className="text-xs font-semibold uppercase tracking-wider">Ventas Reconocidas</span>
            <Activity className="w-5 h-5 text-deep-olive" />
          </div>
          <div className="text-2xl font-bold text-primary-base">{formatCOP(0)}</div>
          <p className="text-xs text-muted-dark">Período actual (COP)</p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-dark">
            <span className="text-xs font-semibold uppercase tracking-wider">Pedidos Activos</span>
            <ShoppingBag className="w-5 h-5 text-deep-olive" />
          </div>
          <div className="text-2xl font-bold text-primary-base">0</div>
          <p className="text-xs text-muted-dark">En preparación y despacho</p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-dark">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes CRM</span>
            <Users className="w-5 h-5 text-deep-olive" />
          </div>
          <div className="text-2xl font-bold text-primary-base">0</div>
          <p className="text-xs text-muted-dark">Contactos E.164 registrados</p>
        </div>

        <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-dark">
            <span className="text-xs font-semibold uppercase tracking-wider">WhatsApp Chats</span>
            <MessageSquare className="w-5 h-5 text-active-green" />
          </div>
          <div className="text-2xl font-bold text-primary-base">0</div>
          <p className="text-xs text-muted-dark">Conversaciones sincronizadas</p>
        </div>
      </section>
    </main>
  );
}
