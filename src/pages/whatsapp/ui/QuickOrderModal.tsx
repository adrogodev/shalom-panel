'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Search, ShoppingBag, X } from 'lucide-react';
import { formatCOP } from '@/shared/lib/utils';
import { whatsappApi, type ProductOption, type VariantOption } from '@/features/whatsapp';

interface Props {
  conversationId: string;
  customerLabel: string;
  onClose: () => void;
  onCreated: (orderNumber: string) => void;
}

const variantLabel = (v: VariantOption) => {
  const attrs = v.attributes && typeof v.attributes === 'object' ? Object.values(v.attributes).filter(Boolean).join(' / ') : '';
  return `${v.sku}${attrs ? ` — ${attrs}` : ''} · ${formatCOP(Number(v.salePrice))}${
    v.currentStock !== undefined ? ` · ${v.currentStock} disponibles` : ''
  }`;
};

/** Takes an order from the chat using the real catalog and the quick-order endpoint. */
export function QuickOrderModal({ conversationId, customerLabel, onClose, onCreated }: Props) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState('');
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [shippingCost, setShippingCost] = useState(0);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoadingCatalog(true);
      try {
        const items = await whatsappApi.searchProducts(search.trim());
        if (!cancelled) setProducts(items);
      } catch {
        if (!cancelled) setError('No pudimos cargar los productos.');
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    setVariants([]);
    setVariantId('');
    if (!productId) return;
    let cancelled = false;
    whatsappApi
      .fetchProductVariants(productId)
      .then((list) => {
        if (cancelled) return;
        setVariants(list);
        if (list.length === 1) setVariantId(list[0].id);
      })
      .catch(() => !cancelled && setError('No pudimos cargar las tallas/colores del producto.'));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const variant = variants.find((v) => v.id === variantId);
  const total = (variant ? Number(variant.salePrice) * quantity : 0) + shippingCost;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantId) {
      setError('Elige el producto y su variante.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const order = await whatsappApi.createQuickOrder(conversationId, {
        items: [{ variantId, quantity }],
        shippingCost,
      });
      onCreated(order.orderNumber);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'No pudimos registrar el pedido.');
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    'w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive bg-white';
  const label = 'block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-border-slate/30 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-border-slate/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-deep-olive/10 text-deep-olive rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-primary-base">Tomar Pedido Comercial</h3>
              <p className="text-xs text-muted-dark">Para {customerLabel}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} title="Cerrar" className="p-1.5 text-muted-dark hover:text-primary-base rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={label}>Buscar producto</label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-dark absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o referencia"
                className={`${field} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={label}>Producto *</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)} className={field}>
              <option value="">{loadingCatalog ? 'Cargando productos…' : products.length ? 'Elige un producto' : 'No hay productos activos'}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} · {formatCOP(Number(p.salePrice))}
                </option>
              ))}
            </select>
          </div>

          {productId && (
            <div>
              <label className={label}>Variante *</label>
              <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className={field}>
                <option value="">{variants.length ? 'Elige talla / color' : 'Este producto no tiene variantes'}</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {variantLabel(v)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Cantidad *</label>
              <input type="number" min={1} required value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className={field} />
            </div>
            <div>
              <label className={label}>Envío (COP)</label>
              <input type="number" min={0} value={shippingCost} onChange={(e) => setShippingCost(Math.max(0, Number(e.target.value)))} className={field} />
            </div>
          </div>

          <div className="p-4 bg-surface-light rounded-xl border border-border-slate/20 flex items-center justify-between">
            <span className="text-xs font-bold text-primary-base">Total a Cobrar:</span>
            <span className="text-lg font-black text-emerald-700">{formatCOP(total)}</span>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-1.5 p-2 rounded-lg bg-red-50 text-red-700 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-slate/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-slate/40 rounded-lg text-xs font-medium text-muted-dark hover:bg-surface-light transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary-base text-white rounded-lg text-xs font-semibold hover:bg-primary-base/90 shadow-sm transition disabled:opacity-60"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Registrar Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
