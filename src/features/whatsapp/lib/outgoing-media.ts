import type { OutgoingMediaKind } from '../api/whatsapp.api';

/** What the agent chose in the attach menu; the file decides the final WhatsApp kind. */
export type AttachIntent = 'media' | 'document' | 'sticker' | 'gif' | 'audio';

/** WhatsApp limits (16 MB media); documents are capped by the server body limit. */
export const MAX_MEDIA_BYTES = 16 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 30 * 1024 * 1024;

/** `accept` attribute of the file picker for each menu option. */
export const ACCEPT_BY_INTENT: Record<AttachIntent, string> = {
  media: 'image/jpeg,image/png,image/webp,image/gif,video/*',
  document: '*/*',
  sticker: 'image/webp,image/png,image/jpeg',
  gif: 'video/mp4,image/gif',
  audio: 'audio/*',
};

export const KIND_LABEL: Record<OutgoingMediaKind, string> = {
  image: 'Imagen',
  video: 'Video',
  gif: 'GIF',
  audio: 'Audio',
  voice: 'Nota de voz',
  document: 'Documento',
  sticker: 'Sticker',
};

/**
 * WhatsApp kind for a picked file. Unknown types fall back to a document so nothing is rejected
 * silently. A .gif image goes as an image (WhatsApp shows it still); MP4 GIFs play animated.
 */
export function kindForFile(file: { type: string; name: string }, intent: AttachIntent): OutgoingMediaKind {
  const type = (file.type || '').toLowerCase();
  if (intent === 'document') return 'document';
  if (intent === 'sticker') return type.startsWith('image/') ? 'sticker' : 'document';
  if (intent === 'gif') {
    if (type === 'video/mp4') return 'gif';
    return type.startsWith('image/') ? 'image' : 'document';
  }
  if (intent === 'audio') return type.startsWith('audio/') ? 'audio' : 'document';
  if (/^image\/(jpeg|png|webp|gif)$/.test(type)) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
}

/** Error message when the file is too big for its kind, or null when it can be sent. */
export function sizeError(kind: OutgoingMediaKind, bytes: number): string | null {
  const limit = kind === 'document' ? MAX_DOCUMENT_BYTES : MAX_MEDIA_BYTES;
  if (bytes <= 0) return 'El archivo está vacío.';
  if (bytes > limit) {
    return `El archivo pesa más de ${Math.round(limit / 1024 / 1024)} MB, el máximo que WhatsApp permite para ${KIND_LABEL[kind].toLowerCase()}.`;
  }
  return null;
}

/** Reads a file or recorded blob as base64 (without the data: prefix). */
export function readAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo'));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/** Best audio format the browser can record for a WhatsApp voice note (Evolution converts it). */
export function recorderMimeType(isSupported: (type: string) => boolean): string {
  const candidates = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find((type) => isSupported(type)) ?? '';
}
