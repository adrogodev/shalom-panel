'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/widgets/layout';
import { formatCOP } from '@/shared/lib/utils';
import { Users, Search, Phone, Mail, MapPin, Tag, Plus } from 'lucide-react';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Demostración inicial
  const customers = [
    {
      id: 'cust-1',
      name: 'Mariana Rodríguez',
      phone: '+573001234567',
      email: 'mariana.rodriguez@example.com',
      city: 'Bogotá',
      address: 'Calle 100 # 15-20, Apto 402',
      totalOrders: 4,
      totalSpent: 840000,
      tags: ['VIP', 'WhatsApp'],
    },
    {
      id: 'cust-2',
      name: 'Andrés Felipe Morales',
      phone: '+573159876543',
      email: 'andres.morales@example.com',
      city: 'Medellín',
      address: 'Carrera 43A # 1-50',
      totalOrders: 1,
      totalSpent: 210000,
      tags: ['Nuevo', 'WhatsApp'],
    },
  ];

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    const matchesTag = !tagFilter || c.tags.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-base">
              Directorio de Clientes CRM
            </h1>
            <p className="text-sm text-muted-dark">
              Base de clientes con teléfonos normalizados E.164, historial de compras y etiquetas
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-deep-olive hover:bg-deep-olive/90 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </header>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-border-slate/20 shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-border-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono (+57...) o correo..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-light border border-border-slate/30 rounded-lg text-sm text-primary-base placeholder:text-muted-dark/50 focus:outline-none focus:ring-2 focus:ring-deep-olive/20 focus:border-deep-olive"
            />
          </div>

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-border-slate" />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="bg-surface-light border border-border-slate/30 rounded-lg text-xs py-2 px-3 text-primary-base focus:outline-none focus:ring-2 focus:ring-deep-olive/20"
            >
              <option value="">Todas las etiquetas</option>
              <option value="VIP">VIP</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Nuevo">Nuevo</option>
            </select>
          </div>
        </div>

        {/* Tabla CRM */}
        <div className="bg-white rounded-xl border border-border-slate/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-light text-muted-dark border-b border-border-slate/20 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Teléfono (E.164)</th>
                  <th className="py-3 px-4">Ubicación / Dirección</th>
                  <th className="py-3 px-4 text-center">Pedidos</th>
                  <th className="py-3 px-4">Total Comprado</th>
                  <th className="py-3 px-4">Etiquetas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-slate/10">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-light/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-deep-olive/10 text-deep-olive flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium text-primary-base block">{c.name}</span>
                          <span className="text-xs text-muted-dark flex items-center gap-1">
                            <Mail className="w-3 h-3 text-border-slate" />
                            {c.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 font-mono text-xs text-primary-base bg-surface-light px-2.5 py-1 rounded-md border border-border-slate/20">
                        <Phone className="w-3 h-3 text-active-green" />
                        {c.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-dark">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-border-slate shrink-0" />
                        <span>{c.city} &bull; {c.address}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-primary-base">
                      {c.totalOrders}
                    </td>
                    <td className="py-3 px-4 font-semibold text-primary-base">
                      {formatCOP(c.totalSpent)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {c.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-accent-sage/30 text-deep-olive"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="text-deep-olive hover:underline text-xs font-medium"
                      >
                        Ver Perfil
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
