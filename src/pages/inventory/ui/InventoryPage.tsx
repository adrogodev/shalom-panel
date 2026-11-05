'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/widgets/layout';
import { formatCOP, formatDateBogota } from '@/shared/lib/utils';
import {
  Layers,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';

export function InventoryPage() {
  const [filterType, setFilterType] = useState('');

  // Movimientos de demostración en Kardex
  const movements = [
    {
      id: 'mov-1',
      productName: 'Zapatilla Nike Air Max',
      variantSku: 'ZAP-NIK-NEG-40',
      type: 'IN_PURCHASE',
      quantity: 20,
      previousStock: 0,
      newStock: 20,
      unitCost: 120000,
      reason: 'Compra inicial según Factura #8942',
      userName: 'Administrador SHALOM',
      createdAt: '2026-11-04T18:00:00Z',
    },
    {
      id: 'mov-2',
      productName: 'Zapatilla Nike Air Max',
      variantSku: 'ZAP-NIK-NEG-40',
      type: 'OUT_SALE',
      quantity: 2,
      previousStock: 20,
      newStock: 18,
      unitCost: 120000,
      reason: 'Despacho de Pedido SH-2026-0001',
      userName: 'Sistema (WhatsApp Bot)',
      createdAt: '2026-11-04T18:30:00Z',
    },
    {
      id: 'mov-3',
      productName: 'Camiseta Dry-Fit Pro',
      variantSku: 'CAM-DRY-AZU-M',
      type: 'ADJUSTMENT_NEGATIVE',
      quantity: 1,
      previousStock: 4,
      newStock: 3,
      unitCost: 35000,
      reason: 'Muestra comercial dañada en exhibición',
      userName: 'Administrador SHALOM',
      createdAt: '2026-11-04T19:00:00Z',
    },
  ];

  const filteredMovements = filterType
    ? movements.filter((m) => m.type === filterType)
    : movements;

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-base">
              Control de Inventario y Kardex
            </h1>
            <p className="text-sm text-muted-dark">
              Trazabilidad completa de entradas, salidas, reservas y valorización de mercancía
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-deep-olive hover:bg-deep-olive/90 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Movimiento</span>
          </button>
        </header>

        {/* Tarjetas KPI de Inventario */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-dark">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Valorización de Bodega (CPP)
              </span>
              <TrendingUp className="w-5 h-5 text-deep-olive" />
            </div>
            <div className="text-2xl font-bold text-primary-base">
              {formatCOP(2265000)}
            </div>
            <p className="text-xs text-muted-dark">
              Calculado según Costo Promedio Ponderado
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-dark">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Unidades Totales en Existencia
              </span>
              <Layers className="w-5 h-5 text-deep-olive" />
            </div>
            <div className="text-2xl font-bold text-primary-base">21</div>
            <p className="text-xs text-muted-dark">Distribuidas en todas las variantes activas</p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-muted-dark">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Alertas de Stock Crítico
              </span>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600">1 producto</div>
            <p className="text-xs text-muted-dark">Artículos por debajo del stock mínimo configurado</p>
          </div>
        </section>

        {/* Tabla Kardex */}
        <div className="bg-white rounded-xl border border-border-slate/20 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border-slate/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary-base">
              Historial de Movimientos de Kardex
            </h2>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-surface-light border border-border-slate/30 rounded-lg text-xs py-1.5 px-3 text-primary-base focus:outline-none focus:ring-2 focus:ring-deep-olive/20"
            >
              <option value="">Todos los tipos</option>
              <option value="IN_PURCHASE">Entradas (Compras)</option>
              <option value="OUT_SALE">Salidas (Ventas)</option>
              <option value="ADJUSTMENT_NEGATIVE">Ajustes Negativos</option>
              <option value="RETURN">Devoluciones</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-light text-muted-dark border-b border-border-slate/20 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha (Bogotá)</th>
                  <th className="py-3 px-4">Producto y Variante</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-center">Stock Anterior</th>
                  <th className="py-3 px-4 text-center">Stock Resultante</th>
                  <th className="py-3 px-4">Costo Unitario</th>
                  <th className="py-3 px-4">Motivo / Referencia</th>
                  <th className="py-3 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-slate/10 text-xs">
                {filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-light/40 transition">
                    <td className="py-3 px-4 text-muted-dark whitespace-nowrap">
                      {formatDateBogota(m.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-primary-base block">{m.productName}</span>
                      <span className="font-mono text-[10px] text-muted-dark">{m.variantSku}</span>
                    </td>
                    <td className="py-3 px-4">
                      {m.type === 'IN_PURCHASE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-active-green/10 text-active-green">
                          <ArrowDownRight className="w-3 h-3" />
                          Compra
                        </span>
                      )}
                      {m.type === 'OUT_SALE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-deep-olive/10 text-deep-olive">
                          <ArrowUpRight className="w-3 h-3" />
                          Venta
                        </span>
                      )}
                      {m.type === 'ADJUSTMENT_NEGATIVE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-700">
                          <RefreshCw className="w-3 h-3" />
                          Ajuste Negativo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-primary-base">
                      {m.type === 'IN_PURCHASE' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-dark">{m.previousStock}</td>
                    <td className="py-3 px-4 text-center font-semibold text-primary-base">
                      {m.newStock}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-dark">
                      {formatCOP(m.unitCost)}
                    </td>
                    <td className="py-3 px-4 text-muted-dark max-w-xs truncate" title={m.reason}>
                      {m.reason}
                    </td>
                    <td className="py-3 px-4 text-muted-dark">{m.userName}</td>
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
