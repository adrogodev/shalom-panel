'use client';

import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/widgets/layout';
import { formatCOP } from '@/shared/lib/utils';
import {
  Activity,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface MetricItem {
  current: number;
  previous: number;
  deltaPercent: number;
  trend: 'up' | 'down' | 'flat';
}

interface DashboardMetrics {
  sales: MetricItem;
  orders: MetricItem;
  lowStockAlerts: number;
}

const mockChartData = [
  { date: '10-25', sales: 1250000 },
  { date: '10-27', sales: 1890000 },
  { date: '10-29', sales: 2450000 },
  { date: '10-31', sales: 3100000 },
  { date: '11-02', sales: 2800000 },
  { date: '11-04', sales: 4200000 },
];

const mockStatusData = [
  { name: 'Entregado', value: 45, color: '#1B5E20' },
  { name: 'Enviado', value: 25, color: '#2B4C3F' },
  { name: 'Confirmado', value: 15, color: '#C59B27' },
  { name: 'Pendiente', value: 10, color: '#B3C9BF' },
  { name: 'Cancelado', value: 5, color: '#C62828' },
];

const mockTopProducts = [
  { name: 'Camiseta Básica Premium Algodón', sku: 'TSH-WHT-001', sold: 84, revenue: 4200000 },
  { name: 'Pantalón Jean Slim Fit', sku: 'JEA-SLM-002', sold: 52, revenue: 5720000 },
  { name: 'Chaqueta Impermeable Tech', sku: 'JAC-IMP-003', sold: 38, revenue: 6460000 },
  { name: 'Gorra Clásica Shalom Bordada', sku: 'CAP-SHL-004', sold: 65, revenue: 2275000 },
];

export function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    sales: { current: 18655000, previous: 14200000, deltaPercent: 31.4, trend: 'up' },
    orders: { current: 142, previous: 118, deltaPercent: 20.3, trend: 'up' },
    lowStockAlerts: 3,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AdminLayout>
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-slate/30 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-base">
              SHALOM
            </h1>
            <p className="text-muted-dark text-sm mt-1">
              Plataforma Integral de Gestión Comercial, Pedidos y Automatización de WhatsApp
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg bg-white border border-border-slate/30 p-1 text-xs">
              <button
                type="button"
                onClick={() => setPeriod('day')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  period === 'day' ? 'bg-primary-base text-white shadow-sm' : 'text-muted-dark hover:text-primary-base'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setPeriod('week')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  period === 'week' ? 'bg-primary-base text-white shadow-sm' : 'text-muted-dark hover:text-primary-base'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setPeriod('month')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  period === 'month' ? 'bg-primary-base text-white shadow-sm' : 'text-muted-dark hover:text-primary-base'
                }`}
              >
                Mes
              </button>
            </div>

            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-active-green/10 text-active-green">
              <span className="w-2 h-2 mr-1.5 bg-active-green rounded-full animate-pulse" />
              Sistema Activo
            </span>
          </div>
        </header>

        {/* Tarjetas KPI */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ventas Reconocidas */}
          <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-muted-dark">
              <span className="text-xs font-semibold uppercase tracking-wider">Ventas Reconocidas</span>
              <div className="p-2 bg-deep-olive/10 text-deep-olive rounded-lg">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-base">{formatCOP(metrics.sales.current)}</div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`inline-flex items-center font-semibold ${
                  metrics.sales.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {metrics.sales.trend === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                )}
                +{metrics.sales.deltaPercent}%
              </span>
              <span className="text-muted-dark">vs período anterior</span>
            </div>
          </div>

          {/* Pedidos Activos */}
          <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-muted-dark">
              <span className="text-xs font-semibold uppercase tracking-wider">Pedidos Activos</span>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-base">{metrics.orders.current}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +{metrics.orders.deltaPercent}%
              </span>
              <span className="text-muted-dark">En gestión</span>
            </div>
          </div>

          {/* WhatsApp Chats */}
          <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-muted-dark">
              <span className="text-xs font-semibold uppercase tracking-wider">WhatsApp Chats</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <Activity className="w-4 h-4 text-active-green" />
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-base">42</div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center font-semibold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                +14.5%
              </span>
              <span className="text-muted-dark">Conversaciones activas</span>
            </div>
          </div>
        </section>

        {/* Gráficos Analíticos */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evolución de Ventas */}
          <div className="lg:col-span-2 p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-primary-base">Evolución Comercial</h2>
                <p className="text-xs text-muted-dark">Ventas reconocidas en el período (COP)</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-primary-base font-medium">
                  <span className="w-3 h-3 bg-deep-olive rounded-sm inline-block" /> Ventas
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2B4C3F" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2B4C3F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#717E80" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#717E80"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(val: any) => formatCOP(Number(val) || 0)}
                      contentStyle={{ backgroundColor: '#1A292C', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#2B4C3F"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Distribución por Estado de Pedidos */}
          <div className="p-6 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-primary-base">Estados de Pedidos</h2>
              <p className="text-xs text-muted-dark">Distribución en ciclo comercial actual</p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {mockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => `${val}%`}
                      contentStyle={{ backgroundColor: '#1A292C', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border-slate/20">
              {mockStatusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-primary-base font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-muted-dark">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Productos Más Vendidos */}
        <section className="bg-white rounded-xl border border-border-slate/20 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-primary-base">Productos Más Vendidos</h2>
              <p className="text-xs text-muted-dark">Ranking por volumen de unidades y facturación COP</p>
            </div>
            <a
              href="/products"
              className="text-xs font-semibold text-deep-olive hover:underline inline-flex items-center gap-1"
            >
              Ver Catálogo Completo <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-light border-y border-border-slate/20 text-xs font-semibold text-muted-dark uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-right">Unidades Vendidas</th>
                  <th className="py-3 px-4 text-right">Facturación Generada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-slate/10">
                {mockTopProducts.map((p, index) => (
                  <tr key={p.sku} className="hover:bg-surface-light/50 transition">
                    <td className="py-3 px-4 font-medium text-primary-base flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full bg-deep-olive/10 text-deep-olive font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-muted-dark">{p.sku}</td>
                    <td className="py-3 px-4 text-right font-semibold text-primary-base">{p.sold} uds</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">{formatCOP(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}
