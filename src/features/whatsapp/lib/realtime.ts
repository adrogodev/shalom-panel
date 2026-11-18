import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL, getStoredSession } from '@/shared/api';
import type { InboxConversation, InboxMessage, InstanceStatus } from '../model/types';

/** Events emitted by the server RealtimeGateway (namespace /realtime). */
export interface RealtimeHandlers {
  onStatus?: (payload: {
    instanceName: string;
    status: InstanceStatus;
    qrCode: string | null;
    pairingCode?: string | null;
    phoneNumber?: string | null;
  }) => void;
  onMessage?: (payload: { conversationId: string; message: InboxMessage }) => void;
  onConversation?: (conversation: InboxConversation) => void;
  onMessageStatus?: (payload: { conversationId: string; providerMessageId: string; status: InboxMessage['status'] }) => void;
}

/** The socket server lives on the API origin, outside the /api/v1 prefix. */
export function realtimeUrl(apiBaseUrl = API_BASE_URL): string {
  try {
    return `${new URL(apiBaseUrl).origin}/realtime`;
  } catch {
    return '/realtime';
  }
}

/** Connects to the realtime gateway and returns a cleanup function. */
export function connectRealtime(handlers: RealtimeHandlers): () => void {
  const socket: Socket = io(realtimeUrl(), {
    transports: ['websocket', 'polling'],
    // Evaluated on every (re)connection, so a renewed access token is always used.
    auth: (cb) => cb({ token: getStoredSession().accessToken ?? '' }),
  });
  if (handlers.onStatus) socket.on('whatsapp:status', handlers.onStatus);
  if (handlers.onMessage) socket.on('message:new', handlers.onMessage);
  if (handlers.onConversation) socket.on('conversation:updated', handlers.onConversation);
  if (handlers.onMessageStatus) socket.on('message:status', handlers.onMessageStatus);
  return () => {
    socket.removeAllListeners();
    socket.disconnect();
  };
}
