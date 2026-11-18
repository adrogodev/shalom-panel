'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminLayout } from '@/widgets/layout';
import { formatCOP } from '@/shared/lib/utils';
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  MessageSquare,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  X,
} from 'lucide-react';
import {
  WhatsAppConnectionCard,
  connectRealtime,
  customerName,
  customerPhone,
  useWhatsAppInstance,
  whatsappApi,
  type InboxConversation,
  type InboxMessage,
} from '@/features/whatsapp';
import { QuickOrderModal } from './QuickOrderModal';

type LoadState = 'loading' | 'ready' | 'error';

const QUICK_REPLIES = [
  { label: 'Disponibilidad', text: '¡Hola! Claro que sí, tenemos disponibilidad para envío inmediato.' },
  { label: 'Datos de Pago', text: 'Para confirmar tu pedido, puedes transferir a nuestra cuenta Bancolombia o Nequi.' },
  { label: 'Guía de Envío', text: 'Te adjunto nuestra guía de despacho para que rastrees tu paquete.' },
];

function formatTime(iso?: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() <= 0) return '';
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

const upsertById = (list: InboxMessage[], message: InboxMessage) =>
  list.some((m) => m.id === message.id) ? list : [...list, message];

const initial = (conv: InboxConversation) => (customerName(conv.customer) || '?').charAt(0).toUpperCase();

export function WhatsAppPage() {
  const line = useWhatsAppInstance();

  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [listState, setListState] = useState<LoadState>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [messagesState, setMessagesState] = useState<LoadState>('ready');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selectedId;
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await whatsappApi.fetchConversations());
      setListState('ready');
    } catch {
      setListState('error');
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const touchConversation = useCallback((conversationId: string, message: InboxMessage, isOpen: boolean) => {
    let known = false;
    setConversations((prev) => {
      const current = prev.find((c) => c.id === conversationId);
      if (!current) return prev;
      known = true;
      const updated: InboxConversation = {
        ...current,
        lastMessageAt: message.timestamp,
        messages: [message],
        unreadCount: isOpen ? 0 : current.unreadCount + (message.senderType === 'CUSTOMER' ? 1 : 0),
      };
      return [updated, ...prev.filter((c) => c.id !== conversationId)];
    });
    return known;
  }, []);

  // Realtime: connection status, new messages and delivery/read receipts.
  const { onStatus } = line;
  useEffect(
    () =>
      connectRealtime({
        onStatus,
        onMessage: ({ conversationId, message }) => {
          const isOpen = selectedRef.current === conversationId;
          if (isOpen) setMessages((prev) => upsertById(prev, message));
          if (!touchConversation(conversationId, message, isOpen)) {
            // First message of a new chat: reload the list to get the customer data.
            void loadConversations();
          }
        },
        onMessageStatus: ({ conversationId, providerMessageId, status }) => {
          if (selectedRef.current !== conversationId) return;
          setMessages((prev) => prev.map((m) => (m.providerMessageId === providerMessageId ? { ...m, status } : m)));
        },
      }),
    [onStatus, touchConversation, loadConversations],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  const openConversation = async (id: string) => {
    setSelectedId(id);
    setMessages([]);
    setSendError(null);
    setMessagesState('loading');
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    try {
      const detail = await whatsappApi.fetchConversationMessages(id);
      if (selectedRef.current === id) {
        setMessages(detail.messages);
        setMessagesState('ready');
      }
    } catch {
      if (selectedRef.current === id) setMessagesState('error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedId || sending) return;

    setSending(true);
    setSendError(null);
    try {
      const message = await whatsappApi.sendConversationMessage(selectedId, text);
      setMessages((prev) => upsertById(prev, message));
      touchConversation(selectedId, message, true);
      setInputText('');
    } catch (err) {
      const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
      setSendError(`No se pudo enviar el mensaje. Revisa que WhatsApp esté conectado e inténtalo de nuevo.${detail}`);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => customerName(c.customer).toLowerCase().includes(q) || (c.customer.phone ?? '').includes(q),
    );
  }, [conversations, searchQuery]);

  const activeConv = conversations.find((c) => c.id === selectedId) ?? null;
  const activeName = activeConv ? customerName(activeConv.customer) : '';
  const isConnected = line.instance?.status === 'CONNECTED';

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-surface-light">
        {/* COLUMNA 1: CONEXIÓN + LISTA DE CHATS */}
        <aside className="w-80 md:w-96 border-r border-border-slate/30 flex flex-col bg-white shrink-0">
          <div className="border-b border-border-slate/20">
            <div className="px-4 pt-4">
              <h2 className="font-bold text-lg text-primary-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-active-green" />
                Inbox
              </h2>
            </div>
            <WhatsAppConnectionCard
              instance={line.instance}
              loading={line.loading}
              action={line.action}
              error={line.error}
              syncSummary={line.syncSummary}
              onConnect={line.connect}
              onDisconnect={line.disconnect}
              onSync={() => line.sync(() => void loadConversations())}
            />
          </div>

          <div className="p-4 border-b border-border-slate/20">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-dark absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar cliente o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-surface-light border border-border-slate/30 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {listState === 'loading' && (
              <div className="p-6 flex items-center justify-center gap-2 text-xs text-muted-dark">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando conversaciones…
              </div>
            )}
            {listState === 'error' && (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-red-700">No pudimos cargar las conversaciones. Revisa tu conexión.</p>
                <button
                  type="button"
                  onClick={() => {
                    setListState('loading');
                    void loadConversations();
                  }}
                  className="text-xs font-semibold text-deep-olive underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}
            {listState === 'ready' && conversations.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-dark leading-relaxed">
                Aún no tienes conversaciones.{' '}
                {isConnected
                  ? 'Pulsa «Sincronizar contactos y mensajes» para traer tus chats de WhatsApp.'
                  : 'Conecta tu WhatsApp para empezar a recibir mensajes aquí.'}
              </div>
            )}
            {listState === 'ready' && conversations.length > 0 && filteredConversations.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-dark">Ningún cliente coincide con la búsqueda.</div>
            )}

            <ul aria-label="Conversaciones" className="divide-y divide-border-slate/10">
              {filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedId;
                const preview = conv.messages?.[0];
                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => void openConversation(conv.id)}
                      className={`w-full p-4 text-left flex items-start gap-3 transition ${
                        isSelected ? 'bg-deep-olive/10 border-l-4 border-deep-olive' : 'hover:bg-surface-light/60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-deep-olive/20 text-deep-olive font-bold text-sm flex items-center justify-center shrink-0">
                        {initial(conv)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-primary-base truncate">{customerName(conv.customer)}</span>
                          <span className="text-[10px] text-muted-dark font-medium">
                            {formatTime(preview?.timestamp ?? conv.lastMessageAt)}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-muted-dark truncate">{customerPhone(conv.customer)}</div>
                        <p className="text-xs text-muted-dark truncate mt-0.5">
                          {preview ? `${preview.senderType === 'CUSTOMER' ? '' : 'Tú: '}${preview.content}` : 'Sin mensajes todavía'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-active-green text-white shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* COLUMNA 2: ÁREA DE CONVERSACIÓN */}
        <section className="flex-1 flex flex-col bg-surface-light/40 min-w-0 border-r border-border-slate/30">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-2 text-muted-dark">
              <MessageSquare className="w-10 h-10 text-deep-olive/40" />
              <p className="text-sm font-semibold text-primary-base">Selecciona una conversación</p>
              <p className="text-xs max-w-xs">Elige un cliente de la lista para ver sus mensajes y responderle por WhatsApp.</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-white border-b border-border-slate/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-deep-olive/20 text-deep-olive font-bold flex items-center justify-center">
                    {initial(activeConv)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-primary-base">{activeName}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-dark font-mono">
                      <span>{customerPhone(activeConv.customer)}</span>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-active-green' : 'bg-muted-dark'}`} />
                      <span className={`text-[11px] font-sans font-medium ${isConnected ? 'text-active-green' : 'text-muted-dark'}`}>
                        {isConnected ? 'WhatsApp Conectado' : 'WhatsApp sin conectar'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsOrderModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-base text-white rounded-lg text-xs font-semibold hover:bg-primary-base/90 shadow-sm transition"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Tomar Pedido</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    title={isProfileOpen ? 'Ocultar perfil del cliente' : 'Ver perfil del cliente'}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isProfileOpen
                        ? 'bg-deep-olive/10 text-deep-olive border-deep-olive/30 hover:bg-deep-olive/20'
                        : 'bg-surface-light hover:bg-border-slate/20 text-primary-base border-border-slate/30'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isProfileOpen ? 'Ocultar Perfil' : 'Perfil del Cliente'}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {notice && (
                  <div role="status" className="text-center text-xs text-active-green font-medium">
                    {notice}
                  </div>
                )}
                {messagesState === 'loading' && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-dark">
                    <Loader2 className="w-4 h-4 animate-spin" /> Cargando mensajes…
                  </div>
                )}
                {messagesState === 'error' && (
                  <p className="text-center text-xs text-red-700">No pudimos cargar los mensajes de esta conversación.</p>
                )}
                {messagesState === 'ready' && messages.length === 0 && (
                  <p className="text-center text-xs text-muted-dark">Todavía no hay mensajes. Escribe el primero abajo.</p>
                )}
                {messages.map((msg) => {
                  const isAgent = msg.senderType !== 'CUSTOMER';
                  return (
                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isAgent
                            ? 'bg-primary-base text-white rounded-br-xs'
                            : 'bg-white text-primary-base border border-border-slate/20 rounded-bl-xs'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div
                          className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                            isAgent ? 'text-surface-light/60' : 'text-muted-dark'
                          }`}
                        >
                          <span>{formatTime(msg.timestamp)}</span>
                          {isAgent && (
                            <span title={msg.status}>
                              {msg.status === 'READ' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-accent-sage" />
                              ) : msg.status === 'DELIVERED' ? (
                                <CheckCheck className="w-3.5 h-3.5" />
                              ) : msg.status === 'FAILED' ? (
                                <AlertCircle className="w-3.5 h-3.5 text-red-300" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-border-slate/20 space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-muted-dark flex items-center gap-1 shrink-0 font-medium text-[11px]">
                    <Sparkles className="w-3 h-3 text-deep-olive" /> Rápidas:
                  </span>
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply.label}
                      type="button"
                      onClick={() => setInputText(reply.text)}
                      className="px-2.5 py-1 rounded-full bg-surface-light border border-border-slate/30 text-muted-dark hover:text-primary-base text-[11px] shrink-0"
                    >
                      {reply.label}
                    </button>
                  ))}
                </div>

                {sendError && (
                  <div role="alert" className="flex items-start gap-1.5 p-2 rounded-lg bg-red-50 text-red-700 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{sendError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Escribe un mensaje para el cliente por WhatsApp..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-surface-light border border-border-slate/30 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="p-2.5 bg-primary-base text-white rounded-lg hover:bg-primary-base/90 shadow-sm transition disabled:opacity-60"
                    title="Enviar mensaje"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>

        {/* COLUMNA 3: PERFIL DEL CLIENTE */}
        {activeConv && isProfileOpen && (
          <aside className="w-80 border-l border-border-slate/30 bg-white p-5 flex-col justify-between overflow-y-auto hidden lg:flex">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-primary-base">Perfil del Cliente</h3>
                  <p className="text-xs text-muted-dark">Datos consolidados del comprador</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  title="Cerrar perfil"
                  className="p-1.5 text-muted-dark hover:text-primary-base hover:bg-surface-light rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-surface-light rounded-xl border border-border-slate/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-deep-olive/20 text-deep-olive font-bold text-base flex items-center justify-center">
                    {initial(activeConv)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-primary-base">{activeName}</h4>
                    <div className="text-xs font-mono text-muted-dark">{customerPhone(activeConv.customer)}</div>
                  </div>
                </div>

                {!!activeConv.customer.tags?.length && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border-slate/20">
                    {activeConv.customer.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-deep-olive/10 text-deep-olive"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-border-slate/30 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-muted-dark tracking-wider">Pedidos</span>
                  <div className="text-base font-bold text-primary-base mt-0.5">{activeConv.customer.totalOrders ?? 0}</div>
                </div>
                <div className="p-3 bg-white border border-border-slate/30 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-muted-dark tracking-wider">Total Gastado</span>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5">
                    {formatCOP(Number(activeConv.customer.totalSpent ?? 0))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-primary-base flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-dark" />
                  Última actividad
                </span>
                <p className="text-xs text-muted-dark leading-relaxed">{formatTime(activeConv.lastMessageAt) || 'Sin actividad registrada'}</p>
              </div>
            </div>
          </aside>
        )}

        {isOrderModalOpen && activeConv && (
          <QuickOrderModal
            conversationId={activeConv.id}
            customerLabel={`${activeName} (${customerPhone(activeConv.customer)})`}
            onClose={() => setIsOrderModalOpen(false)}
            onCreated={(orderNumber) => {
              setIsOrderModalOpen(false);
              setNotice(`Pedido #${orderNumber} registrado. Se envió la confirmación al cliente.`);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
