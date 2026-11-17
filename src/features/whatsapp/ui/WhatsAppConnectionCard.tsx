'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2, LogOut, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import type { SyncSummary, WhatsAppInstance } from '../model/types';

interface Props {
  instance: WhatsAppInstance | null;
  loading: boolean;
  action: 'connect' | 'disconnect' | 'sync' | null;
  error: string | null;
  syncSummary: SyncSummary | null;
  onConnect: (phoneNumber?: string) => void;
  onDisconnect: () => void;
  onSync: () => void;
}

const STATUS_LABEL: Record<WhatsAppInstance['status'], { text: string; dot: string }> = {
  CONNECTED: { text: 'Conectado', dot: 'bg-active-green' },
  CONNECTING: { text: 'Esperando que escanees el código', dot: 'bg-amber-500' },
  DISCONNECTED: { text: 'Sin conectar', dot: 'bg-muted-dark' },
};

/** WhatsApp line status with connect-by-QR, disconnect and sync actions. */
export function WhatsAppConnectionCard({
  instance,
  loading,
  action,
  error,
  syncSummary,
  onConnect,
  onDisconnect,
  onSync,
}: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const status = instance?.status ?? 'DISCONNECTED';
  const label = STATUS_LABEL[status];
  const busy = action !== null;

  return (
    <section aria-label="Conexión de WhatsApp" className="p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone className="w-4 h-4 text-deep-olive shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-primary-base">Línea de WhatsApp</div>
            {loading ? (
              <div className="text-[11px] text-muted-dark">Consultando estado…</div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-dark">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${label.dot}`} />
                <span data-testid="whatsapp-status">{label.text}</span>
                {status === 'CONNECTED' && instance?.phoneNumber && (
                  <span className="font-mono truncate">· {instance.phoneNumber}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-1.5 p-2 rounded-lg bg-red-50 text-red-700 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {status === 'CONNECTING' && (instance?.qrCode || instance?.pairingCode) && (
        <div className="p-3 bg-surface-light rounded-xl border border-border-slate/20 flex flex-col items-center gap-2 text-center">
          {instance?.qrCode && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={instance.qrCode}
              alt="Código QR para vincular WhatsApp"
              className="w-48 h-48 bg-white rounded-lg border border-border-slate/30 p-1"
            />
          )}
          {instance?.pairingCode && (
            <div className="text-xs text-primary-base">
              O escribe este código en tu teléfono:{' '}
              <span className="font-mono font-bold tracking-widest" data-testid="pairing-code">
                {instance.pairingCode}
              </span>
            </div>
          )}
          <p className="text-[11px] text-muted-dark">
            Abre WhatsApp en tu teléfono › Dispositivos vinculados › Vincular un dispositivo. El código se renueva solo.
          </p>
        </div>
      )}

      {status !== 'CONNECTED' && (
        <div className="space-y-2">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Tu número (opcional, para código de vinculación)"
            aria-label="Número de WhatsApp a vincular"
            className="w-full px-3 py-1.5 rounded-lg bg-surface-light border border-border-slate/30 text-[11px] focus:outline-none focus:ring-2 focus:ring-deep-olive"
          />
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => onConnect(phoneNumber)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary-base text-white hover:bg-primary-base/90 disabled:opacity-60 transition"
          >
            {action === 'connect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />}
            {status === 'CONNECTING' ? 'Generar un código nuevo' : 'Conectar WhatsApp'}
          </button>
        </div>
      )}

      {status === 'CONNECTED' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onSync}
            className="inline-flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-semibold rounded-lg bg-deep-olive/10 text-deep-olive border border-deep-olive/30 hover:bg-deep-olive/20 disabled:opacity-60 transition"
          >
            {action === 'sync' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sincronizar contactos y mensajes
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDisconnect}
            className="inline-flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-semibold rounded-lg bg-surface-light text-primary-base border border-border-slate/30 hover:bg-border-slate/20 disabled:opacity-60 transition"
          >
            {action === 'disconnect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Desconectar
          </button>
        </div>
      )}

      {action === 'sync' && (
        <p className="text-[11px] text-muted-dark">Importando tus chats… puede tardar un par de minutos.</p>
      )}
      {syncSummary && action !== 'sync' && (
        <p className="text-[11px] text-active-green font-medium" role="status">
          Listo: {syncSummary.contacts} contactos, {syncSummary.conversations} chats y {syncSummary.messages} mensajes
          nuevos.
        </p>
      )}
    </section>
  );
}
