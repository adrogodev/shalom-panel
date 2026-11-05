'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/widgets/layout';
import { formatCOP } from '@/shared/lib/utils';
import { Plus, Search, Filter, AlertTriangle, CheckCircle, Package } from 'lucide-react';

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Demostración inicial o carga desde API
  const products = [
    {
      id: 'prod-1',
      name: 'Zapatilla Nike Air Max',
      sku: 'ZAP-NIK-01',
      category: 'Calzado Deportivo',
      purchasePrice: 120000,
      salePrice: 210000,
      marginPercent: 42.85,
      totalStock: 18,
      minStock: 5,
      isLowStock: false,
      status: 'ACTIVE',
      mainImage: null,
    },
    {
      id: 'prod-2',
      name: 'Camiseta Dry-Fit Pro',
      sku: 'CAM-DRY-02',
      category: 'Ropa Deportiva',
      purchasePrice: 35000,
      salePrice: 65000,
      marginPercent: 46.15,
      totalStock: 3,
      minStock: 5,
      isLowStock: true,
      status: 'ACTIVE',
      mainImage: null,
    },
  ];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary-base">
              Catálogo de Productos
            </h1>
            <p className="text-sm text-muted-dark">
              Administre artículos, variantes, precios y márgenes comerciales
            </p>
          </div>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-deep-olive hover:bg-deep-olive/90 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>
        </header>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-border-slate/20 shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-border-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de producto o SKU..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-light border border-border-slate/30 rounded-lg text-sm text-primary-base placeholder:text-muted-dark/50 focus:outline-none focus:ring-2 focus:ring-deep-olive/20 focus:border-deep-olive"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-border-slate" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface-light border border-border-slate/30 rounded-lg text-xs py-2 px-3 text-primary-base focus:outline-none focus:ring-2 focus:ring-deep-olive/20"
            >
              <option value="">Todas las categorías</option>
              <option value="Calzado Deportivo">Calzado Deportivo</option>
              <option value="Ropa Deportiva">Ropa Deportiva</option>
            </select>
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="bg-white rounded-xl border border-border-slate/20 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-light text-muted-dark border-b border-border-slate/20 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Precio Compra</th>
                  <th className="py-3 px-4">Precio Venta</th>
                  <th className="py-3 px-4">Margen</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-slate/10">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-light/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-surface-light border border-border-slate/20 flex items-center justify-center text-border-slate shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-primary-base">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-dark">{p.sku}</td>
                    <td className="py-3 px-4 text-muted-dark">{p.category}</td>
                    <td className="py-3 px-4 text-muted-dark">{formatCOP(p.purchasePrice)}</td>
                    <td className="py-3 px-4 font-semibold text-primary-base">{formatCOP(p.salePrice)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-accent-sage/30 text-deep-olive">
                        {p.marginPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {p.isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {p.totalStock} (Bajo)
                          </span>
                        ) : (
                          <span className="text-xs text-primary-base font-medium">
                            {p.totalStock} unidades
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-active-green/10 text-active-green">
                        <CheckCircle className="w-3 h-3" />
                        Activo
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="text-deep-olive hover:underline text-xs font-medium"
                      >
                        Editar
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
