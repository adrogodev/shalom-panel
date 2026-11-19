'use client';

import React, { useEffect, useState } from 'react';
import { Download, Eye, FileText, Loader2, MapPin, Mic, BarChart3, UserRound, AlertCircle, Music } from 'lucide-react';
import { fetchAttachmentLink, retryAttachment } from '../api/whatsapp.api';
import type { InboxMessage, MessageAttachment } from '../model/types';

interface MessageContentProps {
  message: InboxMessage;
  /** Outgoing bubbles use light text on a dark background. */
  isAgent?: boolean;
}

/** Kinds rendered without the bubble background (like WhatsApp does). */
export const isBareMessage = (message: InboxMessage) =>
  message.messageType === 'STICKER' || message.messageType === 'REACTION';

/** Server placeholders such as "[Imagen]" are not captions. */
const isPlaceholder = (text: string) => /^\[[^\]]+\]$/.test(text.trim());

export function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return '';
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;
};

type LinkState = { status: 'idle' | 'loading' | 'ready' | 'error'; url?: string };

/** Asks the server for a short-lived link to a stored file (only for AVAILABLE attachments). */
function useAttachmentUrl(messageId: string, attachment?: MessageAttachment): LinkState {
  const attachmentId = attachment?.status === 'AVAILABLE' ? attachment.id : undefined;
  const [state, setState] = useState<LinkState>({ status: attachmentId ? 'loading' : 'idle' });

  useEffect(() => {
    if (!attachmentId) {
      setState({ status: 'idle' });
      return;
    }
    let active = true;
    setState({ status: 'loading' });
    fetchAttachmentLink(messageId, attachmentId)
      .then((link) => active && setState({ status: 'ready', url: link.url }))
      .catch(() => active && setState({ status: 'error' }));
    return () => {
      active = false;
    };
  }, [messageId, attachmentId]);

  return state;
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] opacity-80">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Lets the agent download again from WhatsApp a file the server could not save. */
function RetryNotice({ messageId, attachment, onRecovered }: {
  messageId: string;
  attachment: MessageAttachment;
  onRecovered: (attachment: MessageAttachment) => void;
}) {
  const [state, setState] = useState<'idle' | 'retrying' | 'failed'>('idle');
  const [detail, setDetail] = useState<string | null>(null);
  const retry = async () => {
    setState('retrying');
    try {
      const updated = await retryAttachment(messageId, attachment.id);
      if (updated.status === 'AVAILABLE') onRecovered(updated);
      else {
        setState('failed');
        setDetail(updated.status === 'TOO_LARGE' ? 'El archivo es demasiado grande para mostrarlo aquí.' : null);
      }
    } catch (err) {
      setState('failed');
      setDetail(err instanceof Error && err.message ? err.message : null);
    }
  };
  return (
    <div className="space-y-1">
      <Notice>{detail ?? (state === 'failed' ? 'Todavía no se pudo recuperar el archivo.' : 'El archivo no se pudo guardar.')}</Notice>
      <button
        type="button"
        onClick={retry}
        disabled={state === 'retrying'}
        className="flex items-center gap-1 text-[11px] font-semibold underline disabled:opacity-60"
      >
        {state === 'retrying' && <Loader2 className="w-3 h-3 animate-spin" />}
        {state === 'retrying' ? 'Recuperando…' : 'Reintentar descarga'}
      </button>
    </div>
  );
}

/** Explains why a file cannot be shown; null when the file is (or will be) viewable. */
function unavailableNotice(attachment: MessageAttachment | undefined, link: LinkState) {
  if (attachment?.status === 'MISSING') return <Notice>Archivo no disponible. Ábrelo en WhatsApp en tu teléfono.</Notice>;
  if (attachment?.status === 'TOO_LARGE') {
    return <Notice>Archivo demasiado grande para mostrarlo aquí. Ábrelo en WhatsApp en tu teléfono.</Notice>;
  }
  if (link.status === 'error') return <Notice>No pudimos cargar el archivo.</Notice>;
  if (link.status === 'loading') {
    return (
      <p className="flex items-center gap-1.5 text-[11px] opacity-70">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando archivo…
      </p>
    );
  }
  return null;
}

function Caption({ text }: { text: string }) {
  return text && !isPlaceholder(text) ? <p className="mt-1.5">{text}</p> : null;
}

function MediaBody({ message, isAgent }: MessageContentProps) {
  const original = message.attachments?.[0];
  const [recovered, setRecovered] = useState<MessageAttachment | null>(null);
  const attachment = recovered?.id === original?.id ? recovered ?? original : original;
  const link = useAttachmentUrl(message.id, attachment);
  const type = message.messageType;

  // File still being saved by the server (or a message stored before media support).
  if (!attachment) return <p>{message.content}</p>;

  const notice =
    attachment.status === 'MISSING' ? (
      <RetryNotice messageId={message.id} attachment={attachment} onRecovered={setRecovered} />
    ) : (
      unavailableNotice(attachment, link)
    );
  const url = link.status === 'ready' ? link.url : undefined;

  if (type === 'DOCUMENT') {
    const name = attachment.fileName || (isPlaceholder(message.content) ? 'Documento' : message.content);
    return (
      <div className="space-y-1.5">
        <div className={`flex items-center gap-2.5 p-2 rounded-lg ${isAgent ? 'bg-white/10' : 'bg-surface-light'}`}>
          <FileText className="w-6 h-6 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{name}</p>
            <p className="text-[10px] opacity-70">{formatFileSize(attachment.fileSize)}</p>
          </div>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download={attachment.fileName ?? undefined}
              className="inline-flex items-center gap-1 text-[11px] font-semibold underline shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar
            </a>
          )}
        </div>
        {notice}
        {message.content !== name && <Caption text={message.content} />}
      </div>
    );
  }

  if (notice || !url) {
    return (
      <div className="space-y-1">
        {notice ?? <p>{message.content}</p>}
        {notice && <Caption text={message.content} />}
      </div>
    );
  }

  if (type === 'STICKER') {
    return <img src={url} alt="Sticker" className="w-32 h-32 object-contain" loading="lazy" />;
  }

  if (type === 'VIDEO') {
    return (
      <div>
        {attachment.isAnimated ? (
          <div className="relative">
            <video src={url} autoPlay loop muted playsInline className="max-w-64 rounded-lg" />
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">GIF</span>
          </div>
        ) : (
          <video src={url} controls preload="metadata" className="max-w-64 rounded-lg" />
        )}
        <Caption text={message.content} />
      </div>
    );
  }

  if (type === 'AUDIO') {
    const duration = formatDuration(attachment.durationSeconds);
    const label = attachment.isVoiceNote ? 'Nota de voz' : 'Audio';
    return (
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-[11px] opacity-80">
          {attachment.isVoiceNote ? <Mic className="w-3.5 h-3.5" /> : <Music className="w-3.5 h-3.5" />}
          <span>{duration ? `${label} · ${duration}` : label}</span>
        </p>
        <audio src={url} controls preload="metadata" className="max-w-64" />
      </div>
    );
  }

  // IMAGE
  return (
    <div>
      <button
        type="button"
        aria-label="Ver imagen completa"
        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        className="block"
      >
        <img src={url} alt="Imagen recibida" className="max-w-64 max-h-72 rounded-lg object-cover" loading="lazy" />
      </button>
      <Caption text={message.content} />
    </div>
  );
}

function LocationBody({ message }: MessageContentProps) {
  const location = message.metadata?.location;
  if (!location) return <p>{message.content}</p>;
  const href = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 font-semibold">
        <MapPin className="w-4 h-4 shrink-0" />
        <span>{location.name || (location.live ? 'Ubicación en tiempo real' : 'Ubicación compartida')}</span>
      </p>
      {location.address && <p className="text-[11px] opacity-80">{location.address}</p>}
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold underline">
        Ver en Google Maps
      </a>
    </div>
  );
}

function ContactBody({ message }: MessageContentProps) {
  const contacts = message.metadata?.contacts;
  if (!contacts?.length) return <p>{message.content}</p>;
  return (
    <ul className="space-y-1.5">
      {contacts.map((contact, index) => (
        <li key={`${contact.name}-${index}`} className="flex items-center gap-2">
          <UserRound className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-semibold">{contact.name}</p>
            {contact.phone && <p className="text-[11px] font-mono opacity-80">{contact.phone}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PollBody({ message }: MessageContentProps) {
  const poll = message.metadata?.poll;
  if (!poll) return <p>{message.content}</p>;
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 font-semibold">
        <BarChart3 className="w-4 h-4 shrink-0" />
        <span>{poll.question}</span>
      </p>
      <ul className="space-y-1">
        {poll.options.map((option) => (
          <li key={option} className="px-2 py-1 rounded border border-current/20 text-[11px]">
            {option}
          </li>
        ))}
      </ul>
      <p className="text-[10px] opacity-70">Encuesta: las respuestas se ven en WhatsApp.</p>
    </div>
  );
}

function ReactionBody({ message }: MessageContentProps) {
  const emoji = message.metadata?.reaction?.emoji;
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-dark italic">
      {emoji && <span className="text-base not-italic">{emoji}</span>}
      <span>{message.content}</span>
    </p>
  );
}

/** Renders the body of a chat bubble for every WhatsApp message kind (Spanish UI copy). */
export function MessageContent({ message, isAgent = false }: MessageContentProps) {
  const body = (() => {
    switch (message.messageType) {
      case 'IMAGE':
      case 'VIDEO':
      case 'STICKER':
      case 'AUDIO':
      case 'DOCUMENT':
        return <MediaBody message={message} isAgent={isAgent} />;
      case 'LOCATION':
        return <LocationBody message={message} />;
      case 'CONTACT':
        return <ContactBody message={message} />;
      case 'POLL':
        return <PollBody message={message} />;
      case 'REACTION':
        return <ReactionBody message={message} />;
      case 'OTHER':
        return <Notice>Este tipo de mensaje no se puede mostrar aquí. Ábrelo en WhatsApp en tu teléfono.</Notice>;
      default:
        return <p>{message.content}</p>;
    }
  })();

  return (
    <>
      {message.metadata?.viewOnce && (
        <p className="flex items-center gap-1 text-[10px] font-semibold opacity-70 mb-1">
          <Eye className="w-3 h-3" /> Ver una vez
        </p>
      )}
      {body}
    </>
  );
}
