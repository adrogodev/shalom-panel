'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/widgets/layout';
import { formatCOP } from '@/shared/lib/utils';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Layers,
  Percent,
  Plus,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2,
  X,
  CreditCard,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  supplier?: string;
  paymentMethod?: string;
}

interface FinancialTransactionItem {
  id: string;
  type: 'INCOME_SALE' | 'EXPENSE_OPERATIONAL' | 'EXPENSE_PURCHASE' | 'REFUND';
  amount: number;
  date: string;
  reference: string;
}

const mockExpenses: ExpenseItem[] = [
  {
    id: 'exp-1',
    category: 'Publicidad Digital',
    description: 'Campaña Meta Ads WhatsApp conversión',
    amount: 450000,
    date: '2026-11-04',
    supplier: 'Meta Platforms Inc.',
    paymentMethod: 'Tarjeta de Crédito',
  },
  {
    id: 'exp-2',
    category: 'Empaques y Logística',
    description: 'Cajas ecológicas personalizadas (500 uds)',
    amount: 320000,
    date: '2026-11-02',
    supplier: 'Cartones & Empaques SAS',
    paymentMethod: 'Transferencia Bancolombia',
  },
  {
    id: 'exp-3',
    category: 'Suscripciones y Software',
    description: 'Servidor VPS y hosting Cloud',
    amount: 140000,
    date: '2026-11-01',
    supplier: 'DigitalOcean LLC',
    paymentMethod: 'Tarjeta de Crédito',
  },
  {
    id: 'exp-4',
    category: 'Envíos y Fletes',
    description: 'Recogida urbana mensajería local',
    amount: 95000,
    date: '2026-10-30',
    supplier: 'Mensajería Express',
    paymentMethod: 'Efectivo',
  },
];

const mockTransactions: FinancialTransactionItem[] = [
  {
    id: 'tx-1',
    type: 'INCOME_SALE',
    amount: 145000,
    date: '2026-11-04 15:30',
    reference: 'Pedido #SH-2026-0004 (Bancolombia)',
  },
  {
    id: 'tx-2',
    type: 'EXPENSE_OPERATIONAL',
    amount: 450000,
    date: '2026-11-04 10:15',
    reference: 'Meta Ads WhatsApp',
  },
  {
    id: 'tx-3',
    type: 'INCOME_SALE',
    amount: 220000,
    date: '2026-11-03 18:20',
    reference: 'Pedido #SH-2026-0003 (Nequi)',
  },
  {
    id: 'tx-4',
    type: 'EXPENSE_OPERATIONAL',
    amount: 320000,
    date: '2026-11-02 11:00',
    reference: 'Empaques Cajas 500 uds',
  },
  {
    id: 'tx-5',
    type: 'INCOME_SALE',
    amount: 85000,
    date: '2026-11-02 09:45',
    reference: 'Pedido #SH-2026-0002 (DaviPlata)',
  },
];

export function FinancesPage() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'transactions'>('expenses');
  const [expenses, setExpenses] = useState<ExpenseItem[]>(mockExpenses);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Formulario nuevo gasto
  const [category, setCategory] = useState('Publicidad Digital');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [supplier, setSupplier] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancolombia');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Métricas financieras calculadas
  const grossSales = 18655000;
  const cogs = 9240000;
  const grossProfit = grossSales - cogs;
  const grossMarginPercent = ((grossProfit / grossSales) * 100).toFixed(1);

  const totalOpex = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalOpex;
  const netMarginPercent = ((netProfit / grossSales) * 100).toFixed(1);
  const inventoryValuation = 14850000;
  const roi = (((netProfit) / (cogs + totalOpex)) * 100).toFixed(1);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const newExpense: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category,
      description,
      amount: Number(amount),
      date: expenseDate,
      supplier: supplier || undefined,
      paymentMethod,
    };

    setExpenses([newExpense, ...expenses]);
    setIsModalOpen(false);
    setAmount('');
    setDescription('');
    setSupplier('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  return (
    <AdminLayout>
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-slate/30 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-base">
              Finanzas y Ganancias
            </h1>
            <p className="text-muted-dark text-sm mt-1">
              Control P&L en tiempo real: Ventas reconocidas, Costo de Ventas (COGS), Gastos (OPEX) y Rentabilidad neta
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-base text-white rounded-lg text-sm font-semibold hover:bg-primary-base/90 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Registrar Egreso
          </button>
        </header>

        {/* Tarjetas P&L y Rentabilidad */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Ventas Reconocidas */}
          <div className="p-5 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-dark tracking-wider">Ventas Netas</span>
            <div className="text-2xl font-bold text-primary-base">{formatCOP(grossSales)}</div>
            <p className="text-xs text-muted-dark">Órdenes con estado comercial efectivo</p>
          </div>

          {/* Costo de Ventas (COGS) */}
          <div className="p-5 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-dark tracking-wider">Costo Mercancía (COGS)</span>
            <div className="text-2xl font-bold text-slate-700">{formatCOP(cogs)}</div>
            <p className="text-xs text-muted-dark">CPP histórico ponderado</p>
          </div>

          {/* Ganancia Bruta */}
          <div className="p-5 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-muted-dark tracking-wider">Ganancia Bruta</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                {grossMarginPercent}%
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-700">{formatCOP(grossProfit)}</div>
            <p className="text-xs text-muted-dark">Ventas - Costo de Ventas</p>
          </div>

          {/* Gastos Operativos (OPEX) */}
          <div className="p-5 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-dark tracking-wider">Gastos Operativos (OPEX)</span>
            <div className="text-2xl font-bold text-rose-600">{formatCOP(totalOpex)}</div>
            <p className="text-xs text-muted-dark">Publicidad, empaques, servicios</p>
          </div>

          {/* Ganancia Neta */}
          <div className="p-5 bg-white rounded-xl border-2 border-emerald-500/40 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-900 tracking-wider">Ganancia Neta</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Margen {netMarginPercent}%
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-700">{formatCOP(netProfit)}</div>
            <p className="text-xs text-muted-dark">Ganancia Bruta - OPEX</p>
          </div>

          {/* Valorización Inventario */}
          <div className="p-5 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-dark tracking-wider">Valorización Inventario</span>
            <div className="text-2xl font-bold text-deep-olive">{formatCOP(inventoryValuation)}</div>
            <p className="text-xs text-muted-dark">Activo corriente en bodega a CPP</p>
          </div>

          {/* ROI */}
          <div className="p-5 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-dark tracking-wider">Retorno Inversión (ROI)</span>
            <div className="text-2xl font-bold text-primary-base">+{roi}%</div>
            <p className="text-xs text-muted-dark">Ganancia neta vs Inversión total</p>
          </div>

          {/* Ticket Promedio */}
          <div className="p-5 bg-white rounded-xl border border-border-slate/20 shadow-sm space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-dark tracking-wider">Ticket Promedio</span>
            <div className="text-2xl font-bold text-primary-base">{formatCOP(131373)}</div>
            <p className="text-xs text-muted-dark">Valor medio por pedido reconocido</p>
          </div>
        </section>

        {/* Pestañas de detalle */}
        <section className="bg-white rounded-xl border border-border-slate/20 shadow-sm overflow-hidden">
          <div className="border-b border-border-slate/20 px-6 pt-4 flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`pb-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? 'border-primary-base text-primary-base'
                  : 'border-transparent text-muted-dark hover:text-primary-base'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Gastos Operativos ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`pb-4 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'transactions'
                  ? 'border-primary-base text-primary-base'
                  : 'border-transparent text-muted-dark hover:text-primary-base'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Libro Mayor de Transacciones
            </button>
          </div>

          {activeTab === 'expenses' ? (
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-light border-y border-border-slate/20 text-xs font-semibold text-muted-dark uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Descripción</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4">Método de Pago</th>
                      <th className="py-3 px-4 text-right">Monto (COP)</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-slate/10">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-surface-light/50 transition">
                        <td className="py-3 px-4 text-xs font-medium text-muted-dark flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {exp.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-deep-olive/10 text-deep-olive">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-primary-base">{exp.description}</td>
                        <td className="py-3 px-4 text-xs text-muted-dark">{exp.supplier || 'N/A'}</td>
                        <td className="py-3 px-4 text-xs text-muted-dark">{exp.paymentMethod || 'Efectivo'}</td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                          -{formatCOP(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-muted-dark hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Eliminar egreso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-light border-y border-border-slate/20 text-xs font-semibold text-muted-dark uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Fecha y Hora</th>
                      <th className="py-3 px-4">Tipo de Movimiento</th>
                      <th className="py-3 px-4">Referencia Comercial</th>
                      <th className="py-3 px-4 text-right">Monto (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-slate/10">
                    {mockTransactions.map((tx) => {
                      const isIncome = tx.type === 'INCOME_SALE';
                      return (
                        <tr key={tx.id} className="hover:bg-surface-light/50 transition">
                          <td className="py-3 px-4 text-xs font-mono text-muted-dark">{tx.date}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                                isIncome
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isIncome ? 'Ingreso por Venta' : 'Egreso Operativo'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-primary-base">{tx.reference}</td>
                          <td
                            className={`py-3 px-4 text-right font-bold ${
                              isIncome ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? `+${formatCOP(tx.amount)}` : `-${formatCOP(tx.amount)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Modal Registrar Gasto */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-border-slate/30 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border-slate/20 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-primary-base">Registrar Egreso Operativo</h3>
                    <p className="text-xs text-muted-dark">Afecta el P&L y el cálculo de Ganancia Neta</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-muted-dark hover:text-primary-base rounded-lg hover:bg-surface-light"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                    Categoría del Gasto *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm focus:outline-none focus:ring-2 focus:ring-deep-olive"
                  >
                    <option value="Publicidad Digital">Publicidad Digital (Meta, Google, TikTok)</option>
                    <option value="Empaques y Logística">Empaques y Logística</option>
                    <option value="Suscripciones y Software">Suscripciones y Software</option>
                    <option value="Envíos y Fletes">Envíos y Fletes</option>
                    <option value="Servicios Públicos y Arriendo">Servicios Públicos y Arriendo</option>
                    <option value="Nómina y Comisiones">Nómina y Comisiones</option>
                    <option value="Otros Gastos Operativos">Otros Gastos Operativos</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                      Monto en COP *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      placeholder="Ej. 150000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm focus:outline-none focus:ring-2 focus:ring-deep-olive"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm focus:outline-none focus:ring-2 focus:ring-deep-olive"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                    Descripción del Gasto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Campaña Facebook Ads para producto estrella"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm focus:outline-none focus:ring-2 focus:ring-deep-olive"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                      Proveedor / Beneficiario
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Meta Platforms Inc."
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm focus:outline-none focus:ring-2 focus:ring-deep-olive"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                      Método de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-sm focus:outline-none focus:ring-2 focus:ring-deep-olive"
                    >
                      <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
                      <option value="Nequi">Nequi</option>
                      <option value="DaviPlata">DaviPlata</option>
                      <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                      <option value="Efectivo">Efectivo</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-slate/20">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-border-slate/40 rounded-lg text-sm font-medium text-muted-dark hover:bg-surface-light"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary-base text-white rounded-lg text-sm font-semibold hover:bg-primary-base/90 shadow-sm"
                  >
                    Guardar Egreso
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
