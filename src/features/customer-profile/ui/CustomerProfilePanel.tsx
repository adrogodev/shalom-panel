'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BellOff,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  ShoppingBag,
  StickyNote,
  Tag,
  X,
  Zap,
} from 'lucide-react';
import { formatCOP } from '@/shared/lib/utils';
import * as api from '../api/customer-profile.api';
import type { CustomerProfile, CustomerProfileAutomation } from '../model/types';

export interface CustomerProfilePanelProps {
  customerId: string | null;
  onClose?: () => void;
  /** Change this value (e.g. increment it on new messages/orders) to reload the profile silently. */
  refreshKey?: string | number;
}

const AUTOMATION_STATUS: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Completada', className: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Fallida', className: 'bg-red-50 text-red-700' },
  RUNNING: { label: 'En curso', className: 'bg-sky-50 text-sky-700' },
  WAITING: { label: 'En espera', className: 'bg-amber-50 text-amber-700' },
};

const dateFmt = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium' });
const dateTimeFmt = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'medium',
  timeStyle: 'short',
});
const formatDate = (value: string | null) => (value ? dateFmt.format(new Date(value)) : '—');
const formatDateTime = (value: string | null) => (value ? dateTimeFmt.format(new Date(value)) : '—');

function initials(profile: CustomerProfile): string {
  const parts = [profile.firstName, profile.lastName ?? ''].join(' ').trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="p-4 bg-white rounded-xl border border-border-slate/30 space-y-3">
      <h4 className="text-xs font-bold text-primary-base flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-xs text-muted-dark">{children}</p>;

/** Right-side inbox panel with the customer's live CRM profile, tags and internal notes. */
export function CustomerProfilePanel({ customerId, onClose, refreshKey }: CustomerProfilePanelProps) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picture, setPicture] = useState<string | null>(null);
  const [pictureFailed, setPictureFailed] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [saving, setSaving] = useState<'tag' | 'note' | null>(null);
  const requestId = useRef(0);
  const loadedFor = useRef<string | null>(null);

  const load = useCallback(async (id: string, silent: boolean) => {
    const current = ++requestId.current;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await api.fetchCustomerProfile(id);
      if (current === requestId.current) setProfile(data);
    } catch (err) {
      if (current === requestId.current) setError(errorMessage(err, 'No se pudo cargar el perfil del cliente'));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!customerId) {
      requestId.current++;
      loadedFor.current = null;
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    const sameCustomer = loadedFor.current === customerId;
    if (!sameCustomer) {
      setProfile(null);
      setTagError(null);
      setNoteError(null);
    }
    loadedFor.current = customerId;
    void load(customerId, sameCustomer);
  }, [customerId, refreshKey, load]);

  useEffect(() => {
    let cancelled = false;
    setPicture(null);
    setPictureFailed(false);
    if (!customerId) return;
    api.fetchProfilePicture(customerId).then((url) => {
      if (!cancelled) setPicture(url);
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const addTag = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = tagName.trim();
    if (!customerId || !profile || !name) return;
    setSaving('tag');
    setTagError(null);
    try {
      const tag = await api.addCustomerTag(customerId, { name });
      setProfile((p) => (p && !p.tags.some((t) => t.id === tag.id) ? { ...p, tags: [...p.tags, tag] } : p));
      setTagName('');
    } catch (err) {
      setTagError(errorMessage(err, 'No se pudo agregar la etiqueta'));
    } finally {
      setSaving(null);
    }
  };

  const removeTag = async (tagId: string) => {
    if (!customerId) return;
    setTagError(null);
    try {
      await api.removeCustomerTag(customerId, tagId);
      setProfile((p) => (p ? { ...p, tags: p.tags.filter((t) => t.id !== tagId) } : p));
    } catch (err) {
      setTagError(errorMessage(err, 'No se pudo quitar la etiqueta'));
    }
  };

  const addNote = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = noteText.trim();
    if (!customerId || !profile || !text) return;
    setSaving('note');
    setNoteError(null);
    try {
      const note = await api.addCustomerNote(customerId, text);
      setProfile((p) => (p ? { ...p, notes: [note, ...p.notes] } : p));
      setNoteText('');
    } catch (err) {
      setNoteError(errorMessage(err, 'No se pudo guardar la nota'));
    } finally {
      setSaving(null);
    }
  };

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-bold text-sm text-primary-base">Perfil del Cliente</h3>
        <p className="text-xs text-muted-dark">Datos consolidados del comprador</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar perfil"
          title="Cerrar perfil"
          className="p-1.5 text-muted-dark hover:text-primary-base hover:bg-surface-light rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (!customerId) {
    return (
      <div className="space-y-5">
        {header}
        <Empty>Selecciona una conversación para ver el perfil del cliente.</Empty>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-5">
        {header}
        {error ? (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 space-y-2">
            <p className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
            <button
              type="button"
              onClick={() => void load(customerId, false)}
              className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              Reintentar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-dark" role="status">
            <Loader2 className="w-4 h-4 animate-spin" />
            Cargando perfil…
          </div>
        )}
      </div>
    );
  }

  const { whatsapp, orders } = profile;
  const stats = [
    { label: 'Pedidos', value: String(orders.count), className: 'text-primary-base' },
    { label: 'Total gastado', value: formatCOP(orders.totalSpent), className: 'text-emerald-700' },
    { label: 'Pagado', value: formatCOP(orders.totalPaid), className: 'text-primary-base' },
    {
      label: 'Saldo pendiente',
      value: formatCOP(orders.pendingBalance),
      className: orders.pendingBalance > 0 ? 'text-amber-700' : 'text-primary-base',
    },
  ];
  const activity: Array<[string, string]> = [
    ['Cliente desde', formatDate(profile.customerSince)],
    ['Primer mensaje', formatDateTime(whatsapp.firstMessageAt)],
    ['Último mensaje', formatDateTime(whatsapp.lastMessageAt)],
    ['Mensajes recibidos', String(whatsapp.messagesFromCustomer)],
    ['Mensajes enviados', String(whatsapp.messagesToCustomer)],
  ];

  return (
    <div className="space-y-5">
      {header}

      <div className="p-4 bg-surface-light rounded-xl border border-border-slate/20 space-y-3">
        <div className="flex items-center gap-3">
          <div
            data-testid="customer-avatar"
            className="w-12 h-12 shrink-0 rounded-full bg-deep-olive/20 text-deep-olive font-bold text-base flex items-center justify-center overflow-hidden"
          >
            {picture && !pictureFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={picture}
                alt={`Foto de ${profile.displayName}`}
                className="w-full h-full object-cover"
                onError={() => setPictureFailed(true)}
              />
            ) : (
              initials(profile)
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-primary-base truncate">{profile.displayName}</h4>
            {profile.phone ? (
              <div className="text-xs font-mono text-muted-dark">{profile.phone}</div>
            ) : (
              <div className="text-xs italic text-muted-dark">Número oculto por WhatsApp</div>
            )}
            {profile.email && <div className="text-xs text-muted-dark truncate">{profile.email}</div>}
          </div>
        </div>
        {(profile.whatsappLinked || profile.optedOut) && (
          <div className="flex flex-wrap gap-1.5">
            {profile.whatsappLinked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                <Link2 className="w-2.5 h-2.5" />
                Vinculado
              </span>
            )}
            {profile.optedOut && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700">
                <BellOff className="w-2.5 h-2.5" />
                Dio de baja
              </span>
            )}
          </div>
        )}
      </div>

      <div data-testid="customer-stats" className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-3 bg-white border border-border-slate/30 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-muted-dark tracking-wider">{s.label}</span>
            <div className={`text-sm font-bold mt-0.5 ${s.className}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card title="Actividad en WhatsApp" icon={<MessageCircle className="w-3.5 h-3.5 text-muted-dark" />}>
        <dl className="space-y-1.5 text-xs">
          {activity.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2">
              <dt className="text-muted-dark">{label}</dt>
              <dd className="font-semibold text-primary-base text-right">{value}</dd>
            </div>
          ))}
        </dl>
        {whatsapp.lastInboundText && (
          <p className="text-xs text-muted-dark italic border-t border-border-slate/20 pt-2 break-words">
            “{whatsapp.lastInboundText}”
          </p>
        )}
      </Card>

      <Card title="Pedidos recientes" icon={<ShoppingBag className="w-3.5 h-3.5 text-muted-dark" />}>
        {orders.recent.length === 0 ? (
          <Empty>Sin pedidos todavía</Empty>
        ) : (
          <ul className="space-y-2">
            {orders.recent.map((order) => (
              <li key={order.id} className="flex items-start justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-semibold text-primary-base">{order.orderNumber}</div>
                  <span
                    className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{ backgroundColor: `${order.status.color}1A`, color: order.status.color }}
                  >
                    {order.status.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-primary-base">{formatCOP(order.total)}</div>
                  <div className="text-[10px] text-muted-dark">Pagado {formatCOP(order.paid)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {profile.addresses.length > 0 && (
        <Card title="Direcciones" icon={<MapPin className="w-3.5 h-3.5 text-muted-dark" />}>
          <ul className="space-y-1.5 text-xs">
            {profile.addresses.map((a) => (
              <li key={a.id}>
                <div className="font-semibold text-primary-base">{a.street}</div>
                <div className="text-muted-dark">
                  {[a.detail, a.city, a.state].filter(Boolean).join(', ')}
                  {a.isDefault && ' · Principal'}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Etiquetas" icon={<Tag className="w-3.5 h-3.5 text-muted-dark" />}>
        {profile.tags.length === 0 ? (
          <Empty>Sin etiquetas</Empty>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {profile.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ backgroundColor: `${tag.color}26`, color: 'var(--color-primary-base)' }}
              >
                {tag.name}
                <button
                  type="button"
                  aria-label={`Quitar etiqueta ${tag.name}`}
                  onClick={() => void removeTag(tag.id)}
                  className="text-muted-dark hover:text-red-600"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <form onSubmit={addTag} className="flex gap-1.5">
          <input
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="Nueva etiqueta"
            maxLength={50}
            className="flex-1 min-w-0 px-2 py-1 text-xs border border-border-slate/40 rounded-lg focus:outline-none focus:border-deep-olive"
          />
          <button
            type="submit"
            aria-label="Agregar etiqueta"
            disabled={saving === 'tag'}
            className="p-1.5 rounded-lg bg-deep-olive text-white disabled:opacity-50"
          >
            {saving === 'tag' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        </form>
        {tagError && <p className="text-[11px] text-red-600">{tagError}</p>}
      </Card>

      <Card title="Notas internas" icon={<StickyNote className="w-3.5 h-3.5 text-muted-dark" />}>
        <form onSubmit={addNote} className="space-y-1.5">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Escribe una nota interna…"
            maxLength={2000}
            rows={2}
            className="w-full px-2 py-1.5 text-xs border border-border-slate/40 rounded-lg resize-none focus:outline-none focus:border-deep-olive"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving === 'note'}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-deep-olive text-white disabled:opacity-50"
            >
              Guardar nota
            </button>
          </div>
        </form>
        {noteError && <p className="text-[11px] text-red-600">{noteError}</p>}
        {profile.notes.length === 0 ? (
          <Empty>Sin notas internas</Empty>
        ) : (
          <ul className="space-y-2">
            {profile.notes.map((note) => (
              <li key={note.id} className="text-xs border-l-2 border-deep-olive/30 pl-2">
                <p className="text-primary-base whitespace-pre-wrap break-words">{note.text}</p>
                <p className="text-[10px] text-muted-dark mt-0.5">
                  {note.authorName} · {formatDateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Automatizaciones recibidas" icon={<Zap className="w-3.5 h-3.5 text-muted-dark" />}>
        {profile.automations.length === 0 ? (
          <Empty>Sin automatizaciones recibidas</Empty>
        ) : (
          <ul className="space-y-1.5">
            {profile.automations.map((run) => (
              <AutomationRow key={run.id} run={run} />
            ))}
          </ul>
        )}
      </Card>

      {loading && (
        <div className="flex items-center gap-2 text-[11px] text-muted-dark" role="status">
          <Loader2 className="w-3 h-3 animate-spin" />
          Actualizando…
        </div>
      )}
    </div>
  );
}

function AutomationRow({ run }: { run: CustomerProfileAutomation }) {
  const status = AUTOMATION_STATUS[run.status] ?? { label: run.status, className: 'bg-surface-light text-muted-dark' };
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <div className="min-w-0">
        <div className="font-semibold text-primary-base truncate">{run.automationName}</div>
        <div className="text-[10px] text-muted-dark">{formatDateTime(run.createdAt)}</div>
      </div>
      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${status.className}`}>
        {status.label}
      </span>
    </li>
  );
}
