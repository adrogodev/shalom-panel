'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Mic,
  Music,
  Paperclip,
  Smile,
  Square,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import {
  sendConversationAttachment,
  sendConversationContact,
  sendConversationLocation,
  type OutgoingMediaKind,
} from '../api/whatsapp.api';
import type { InboxMessage } from '../model/types';
import {
  ACCEPT_BY_INTENT,
  KIND_LABEL,
  kindForFile,
  readAsBase64,
  recorderMimeType,
  sizeError,
  type AttachIntent,
} from '../lib/outgoing-media';
import { formatFileSize } from './MessageContent';

export interface ChatAttachmentsProps {
  conversationId: string;
  disabled?: boolean;
  onSent: (message: InboxMessage) => void;
  onError: (message: string | null) => void;
}

type Panel =
  | { type: 'none' }
  | { type: 'menu' }
  | { type: 'file'; file: File; kind: OutgoingMediaKind; previewUrl?: string }
  | { type: 'location' }
  | { type: 'contact' };

const MENU: { intent: AttachIntent | 'location' | 'contact'; label: string; icon: React.ElementType }[] = [
  { intent: 'media', label: 'Foto o video', icon: ImageIcon },
  { intent: 'document', label: 'Documento', icon: FileText },
  { intent: 'sticker', label: 'Sticker', icon: Smile },
  { intent: 'gif', label: 'GIF', icon: Film },
  { intent: 'audio', label: 'Audio', icon: Music },
  { intent: 'location', label: 'Ubicación', icon: MapPin },
  { intent: 'contact', label: 'Contacto', icon: UserRound },
];

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-surface-light border border-border-slate/30 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive';

const errorText = (err: unknown, fallback: string) =>
  `${fallback}${err instanceof Error && err.message ? ` (${err.message})` : ''}`;

/**
 * Attach menu and voice-note recorder of the chat composer. Everything is sent through the
 * server, which stores the file and renders it in the chat like a file the customer sent.
 */
export function ChatAttachments({ conversationId, disabled = false, onSent, onError }: ChatAttachmentsProps) {
  const [panel, setPanel] = useState<Panel>({ type: 'none' });
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [intent, setIntent] = useState<AttachIntent>('media');

  // Close everything when the agent switches chats.
  useEffect(() => {
    setPanel({ type: 'none' });
    setCaption('');
  }, [conversationId]);

  useEffect(() => {
    const url = panel.type === 'file' ? panel.previewUrl : undefined;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [panel]);

  const close = () => {
    setPanel({ type: 'none' });
    setCaption('');
  };

  const run = async (action: () => Promise<InboxMessage>, fallback: string) => {
    setBusy(true);
    onError(null);
    try {
      onSent(await action());
      close();
    } catch (err) {
      onError(errorText(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const choose = (option: (typeof MENU)[number]['intent']) => {
    if (option === 'location' || option === 'contact') {
      setPanel({ type: option });
      return;
    }
    setIntent(option);
    setPanel({ type: 'none' });
    // Let React apply the accept attribute before opening the picker.
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const kind = kindForFile(file, intent);
    const tooBig = sizeError(kind, file.size);
    if (tooBig) {
      onError(tooBig);
      return;
    }
    onError(null);
    const previewable = kind === 'image' || kind === 'sticker' || kind === 'video' || kind === 'gif';
    setPanel({ type: 'file', file, kind, previewUrl: previewable ? URL.createObjectURL(file) : undefined });
  };

  const sendFile = (file: Blob, kind: OutgoingMediaKind, fileName: string, text?: string) =>
    run(
      async () =>
        sendConversationAttachment(conversationId, {
          kind,
          base64: await readAsBase64(file),
          mimeType: file.type || 'application/octet-stream',
          fileName,
          ...(text?.trim() ? { caption: text.trim() } : {}),
        }),
      `No se pudo enviar ${KIND_LABEL[kind].toLowerCase()}.`,
    );

  return (
    <div className="relative flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_BY_INTENT[intent]}
        onChange={onFilePicked}
        className="hidden"
        data-testid="attach-file-input"
      />

      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setPanel(panel.type === 'menu' ? { type: 'none' } : { type: 'menu' })}
        className="p-2.5 rounded-lg text-muted-dark hover:text-primary-base hover:bg-surface-light disabled:opacity-50"
        title="Adjuntar archivo, ubicación o contacto"
        aria-label="Adjuntar"
      >
        <Paperclip className="w-4 h-4" />
      </button>

      <VoiceRecorder
        disabled={disabled || busy}
        onError={onError}
        onRecorded={(blob, mimeType) => {
          const extension = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm';
          return sendFile(new Blob([blob], { type: mimeType.split(';')[0] }), 'voice', `nota-de-voz.${extension}`);
        }}
      />

      {panel.type !== 'none' && (
        <div className="absolute bottom-full left-0 mb-2 w-80 rounded-xl border border-border-slate/30 bg-white shadow-lg p-3 z-20 text-xs">
          {panel.type === 'menu' && (
            <div className="grid grid-cols-2 gap-1" role="menu">
              {MENU.map(({ intent: option, label, icon: Icon }) => (
                <button
                  key={option}
                  type="button"
                  role="menuitem"
                  onClick={() => choose(option)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface-light text-left text-primary-base"
                >
                  <Icon className="w-4 h-4 text-deep-olive" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {panel.type === 'file' && (
            <div className="space-y-2">
              <PanelHeader title={`Enviar ${KIND_LABEL[panel.kind].toLowerCase()}`} onClose={close} />
              {panel.previewUrl && (panel.kind === 'video' || panel.kind === 'gif') ? (
                <video src={panel.previewUrl} className="max-h-40 rounded-lg mx-auto" muted autoPlay loop playsInline />
              ) : panel.previewUrl ? (
                <img src={panel.previewUrl} alt="Vista previa" className="max-h-40 rounded-lg mx-auto object-contain" />
              ) : (
                <p className="flex items-center gap-2 p-2 rounded-lg bg-surface-light">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{panel.file.name}</span>
                  <span className="text-muted-dark shrink-0">{formatFileSize(panel.file.size)}</span>
                </p>
              )}
              {panel.kind !== 'sticker' && panel.kind !== 'audio' && (
                <input
                  className={inputClass}
                  placeholder="Mensaje opcional (pie de foto)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              )}
              <SendButton busy={busy} onClick={() => sendFile(panel.file, panel.kind, panel.file.name, caption)} />
            </div>
          )}

          {panel.type === 'location' && <LocationForm busy={busy} onClose={close} onSend={(loc) =>
            run(() => sendConversationLocation(conversationId, loc), 'No se pudo enviar la ubicación.')} />}

          {panel.type === 'contact' && <ContactForm busy={busy} onClose={close} onSend={(contact) =>
            run(() => sendConversationContact(conversationId, contact), 'No se pudo enviar el contacto.')} />}
        </div>
      )}
    </div>
  );
}

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className="font-semibold text-primary-base">{title}</p>
      <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-dark hover:text-primary-base">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function SendButton({ busy, disabled, onClick }: { busy: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary-base text-white font-medium disabled:opacity-60"
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {busy ? 'Enviando…' : 'Enviar'}
    </button>
  );
}

function LocationForm({
  busy,
  onClose,
  onSend,
}: {
  busy: boolean;
  onClose: () => void;
  onSend: (location: { latitude: number; longitude: number; name?: string; address?: string }) => void;
}) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latitude = Number(lat.replace(',', '.'));
  const longitude = Number(lng.replace(',', '.'));
  const valid =
    lat.trim() !== '' && lng.trim() !== '' && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 &&
    Number.isFinite(latitude) && Number.isFinite(longitude);

  const useCurrent = () => {
    if (!navigator.geolocation) {
      setError('Este navegador no permite obtener la ubicación.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
        setError(null);
      },
      () => {
        setLocating(false);
        setError('No se pudo obtener la ubicación; escríbela a mano.');
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="space-y-2">
      <PanelHeader title="Enviar ubicación" onClose={onClose} />
      <button
        type="button"
        onClick={useCurrent}
        disabled={locating}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border-slate/30 hover:bg-surface-light"
      >
        {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
        Usar mi ubicación actual
      </button>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder="Latitud" aria-label="Latitud" value={lat} onChange={(e) => setLat(e.target.value)} />
        <input className={inputClass} placeholder="Longitud" aria-label="Longitud" value={lng} onChange={(e) => setLng(e.target.value)} />
      </div>
      <input className={inputClass} placeholder="Nombre del lugar (opcional)" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={inputClass} placeholder="Dirección (opcional)" value={address} onChange={(e) => setAddress(e.target.value)} />
      {error && <p className="text-red-700">{error}</p>}
      <SendButton
        busy={busy}
        disabled={!valid}
        onClick={() =>
          onSend({
            latitude,
            longitude,
            ...(name.trim() ? { name: name.trim() } : {}),
            ...(address.trim() ? { address: address.trim() } : {}),
          })
        }
      />
    </div>
  );
}

function ContactForm({
  busy,
  onClose,
  onSend,
}: {
  busy: boolean;
  onClose: () => void;
  onSend: (contact: { fullName: string; phone: string }) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const valid = fullName.trim().length > 0 && phone.replace(/\D/g, '').length >= 7;
  return (
    <div className="space-y-2">
      <PanelHeader title="Enviar contacto" onClose={onClose} />
      <input className={inputClass} placeholder="Nombre" aria-label="Nombre del contacto" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input
        className={inputClass}
        placeholder="Teléfono con indicativo, ej. +57 300 123 4567"
        aria-label="Teléfono del contacto"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <SendButton busy={busy} disabled={!valid} onClick={() => onSend({ fullName: fullName.trim(), phone: phone.trim() })} />
    </div>
  );
}

/** Records a voice note with the browser microphone and hands it over when the agent sends it. */
function VoiceRecorder({
  disabled,
  onRecorded,
  onError,
}: {
  disabled: boolean;
  onRecorded: (blob: Blob, mimeType: string) => Promise<void> | void;
  onError: (message: string | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => () => recorderRef.current?.stream.getTracks().forEach((t) => t.stop()), []);

  const start = async () => {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      onError('Este navegador no permite grabar notas de voz.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = recorderMimeType((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      discardRef.current = false;
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (discardRef.current || !chunksRef.current.length) return;
        const type = recorder.mimeType || mimeType || 'audio/webm';
        void onRecorded(new Blob(chunksRef.current, { type }), type);
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setRecording(true);
      onError(null);
    } catch {
      onError('No se pudo usar el micrófono. Revisa los permisos del navegador.');
    }
  };

  const stop = (discard: boolean) => {
    discardRef.current = discard;
    recorderRef.current?.stop();
  };

  if (recording) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-red-700">
        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
        <span className="text-[11px] tabular-nums w-9">
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </span>
        <button type="button" onClick={() => stop(true)} title="Descartar nota de voz" aria-label="Descartar nota de voz">
          <Trash2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => stop(false)} title="Enviar nota de voz" aria-label="Enviar nota de voz">
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={start}
      className="p-2.5 rounded-lg text-muted-dark hover:text-primary-base hover:bg-surface-light disabled:opacity-50"
      title="Grabar nota de voz"
      aria-label="Grabar nota de voz"
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}
