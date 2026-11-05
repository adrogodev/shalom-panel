'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/widgets/layout';
import { formatCOP, formatDateBogota } from '@/shared/lib/utils';
import {
  ShoppingCart,
  Search,
  Plus,
  ArrowRight,
  CreditCard,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
} from 'lucide-react';

export function OrdersPage() {
  const [selectedTab, setSelectedTab] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // Demostración de pedidos
  const orders = [
    {
      id: 'ord-1',
      orderNumber: 'SH-2026-0001',
      customerName: 'Mariana Rodríguez',
      customerPhone: '+573001234567',
      statusId: 3,
      statusName: 'Confirmado',
      statusColor: '#3A9D24',
      total: 420000,
      totalPaid: 420000,
      isFullyPaid: true,
      itemsCount: 2,
      createdAt: '2026-11-04T18:00:00Z',
    },
    {
      id: 'ord-2',
      orderNumber: 'SH-2026-0002',
      customerName: 'Andrés Felipe Morales',
      customerPhone: '+573159876543',
      statusId: 1,
      statusName: 'Nuevo',
      statusColor: '#717E80',
      total: 130000,
      totalPaid: 0,
      isFullyPaid: false,
      itemsCount: 2,
      createdAt: '2026-11-04T19:30:00Z',
    },
    {
      id: 'ord-3',
      orderNumber: 'SH-2026-0003',
      customerName: 'Carlos Gómez',
      customerPhone: '+573205551212',
      statusId: 8,
      statusName: 'Enviado',
      statusColor: '#7B1FA2',
      total: 210000,
      totalPaid: 210000,
      isFullyPaid: true,
      itemsCount: 1,
      createdAt: '2026-11-04T16:15:00Z',
    },
  ];

  const statusTabs = [
    { label: 'Todos', statusId: null },
    { label: 'Nuevos', statusId: 1 },
    { label: 'Confirmados', statusId: 3 },
    { label: 'En preparación', statusId: 6 },
    { label: 'Enviados', statusId: 8 },
    { label: 'Entregados', statusId: 9 },
  ];

  const filtered = orders.filter((o) => {
    const matchesTab = selectedTab === null || o.statusId === selectedTab;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search);
    return matchesTab && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-base">
              Gestión de Pedidos
            </h1>
            <p className="text-sm text-muted-dark">
              Máquina de estados comercial con snapshots de costo (CPP), reserva de stock y cobros
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-deep-olive hover:bg-deep-olive/90 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Pedido</span>
          </button>
        </header>

        {/* Pestañas de Estados */}
        <div className="flex items-center gap-2 border-b border-border-slate/20 pb-2 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setSelectedTab(tab.statusId)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                selectedTab === tab.statusId
                  ? 'bg-deep-olive text-white shadow-sm'
                  : 'text-muted-dark hover:bg-surface-light hover:text-primary-base'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Barra de Búsqueda */}
        <div className="bg-white p-3 rounded-xl border border-border-slate/20 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 text-border-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número de pedido (SH-2026-...), cliente o teléfono..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-light border border-border-slate/30 rounded-lg text-xs text-primary-base placeholder:text-muted-dark/50 focus:outline-none focus:ring-2 focus:ring-deep-olive/20"
            />
          </div>
        </div>

        {/* Tabla de Pedidos */}
        <div className="bg-white rounded-xl border border-border-slate/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-light text-muted-dark border-b border-border-slate/20 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No. Pedido</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Fecha (Bogotá)</th>
                  <th className="py-3 px-4 text-center">Ítems</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Estado del Pedido</th>
                  <th className="py-3 px-4">Pago</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-slate/10 text-xs">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-light/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-deep-olive">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-primary-base block">{o.customerName}</span>
                      <span className="font-mono text-[10px] text-muted-dark">{o.customerPhone}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-dark whitespace-nowrap">
                      {formatDateBogota(o.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-primary-base">
                      {o.itemsCount}
                    </td>
                    <td className="py-3 px-4 font-bold text-primary-base">
                      {formatCOP(o.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-xs"
                        style={{ backgroundColor: o.statusColor }}
                      >
                        {o.statusName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {o.isFullyPaid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-active-green">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pagado (100%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          <Clock className="w-3.5 h-3.5" />
                          Pendiente ({formatCOP(o.total - o.totalPaid)})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-deep-olive hover:underline font-semibold"
                      >
                        <span>Avanzar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
