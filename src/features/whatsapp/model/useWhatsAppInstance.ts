'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  connectInstance,
  disconnectInstance,
  fetchInstanceStatus,
  syncInstance,
} from '../api/whatsapp.api';
import type { RealtimeHandlers } from '../lib/realtime';
import { DEFAULT_INSTANCE_NAME, type SyncSummary, type WhatsAppInstance } from './types';

export const STATUS_POLL_MS = 4000;

type Action = 'connect' | 'disconnect' | 'sync' | null;

const friendly = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

/** Connection state of the WhatsApp line plus its actions (connect by QR, disconnect, sync). */
export function useWhatsAppInstance(name = DEFAULT_INSTANCE_NAME) {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);

  const merge = useCallback((next: Partial<WhatsAppInstance>) => {
    setInstance((prev) => {
      const base: WhatsAppInstance = prev ?? { name, status: 'DISCONNECTED', phoneNumber: null, qrCode: null };
      const merged = { ...base, ...next };
      // Keep the last QR/pairing code while waiting for the scan if the update has none.
      if (merged.status === 'CONNECTING') {
        merged.qrCode = next.qrCode ?? base.qrCode;
        merged.pairingCode = next.pairingCode ?? base.pairingCode;
      } else {
        merged.qrCode = null;
        merged.pairingCode = null;
      }
      return merged;
    });
  }, [name]);

  const refresh = useCallback(async () => {
    try {
      const status = await fetchInstanceStatus(name);
      merge({ status: status.status, phoneNumber: status.phoneNumber ?? null, qrCode: status.qrCode ?? null });
      setError(null);
    } catch (err) {
      setError(friendly(err, 'No pudimos consultar el estado de WhatsApp.'));
    } finally {
      setLoading(false);
    }
  }, [name, merge]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Polling fallback while waiting for the QR scan (the socket may be unavailable).
  const waiting = instance?.status === 'CONNECTING';
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => void refresh(), STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [waiting, refresh]);

  const run = useCallback(async (kind: Exclude<Action, null>, task: () => Promise<void>, fallback: string) => {
    setAction(kind);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(friendly(err, fallback));
    } finally {
      setAction(null);
    }
  }, []);

  const connect = useCallback(
    (phoneNumber?: string) =>
      run('connect', async () => {
        setSyncSummary(null);
        const result = await connectInstance(name, phoneNumber?.trim() || undefined);
        merge(result);
      }, 'No pudimos generar el código QR. Inténtalo de nuevo.'),
    [name, merge, run],
  );

  const disconnect = useCallback(
    () =>
      run('disconnect', async () => {
        await disconnectInstance(name);
        merge({ status: 'DISCONNECTED' });
      }, 'No pudimos desconectar WhatsApp.'),
    [name, merge, run],
  );

  const sync = useCallback(
    (onDone?: () => void) =>
      run('sync', async () => {
        setSyncSummary(await syncInstance(name));
        onDone?.();
      }, 'No pudimos sincronizar los contactos y mensajes.'),
    [name, run],
  );

  const onStatus: NonNullable<RealtimeHandlers['onStatus']> = useCallback(
    (payload) => {
      if (payload.instanceName !== name) return;
      merge({
        status: payload.status,
        qrCode: payload.qrCode,
        ...(payload.pairingCode !== undefined ? { pairingCode: payload.pairingCode } : {}),
        ...(payload.phoneNumber ? { phoneNumber: payload.phoneNumber } : {}),
      });
    },
    [name, merge],
  );

  return { instance, loading, action, error, syncSummary, connect, disconnect, sync, refresh, onStatus };
}
