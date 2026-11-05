'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/widgets/layout';
import { formatCOP } from '@/shared/lib/utils';
import {
  MessageSquare,
  Search,
  Send,
  QrCode,
  CheckCheck,
  Check,
  User,
  ShoppingBag,
  Plus,
  Paperclip,
  Tag,
  Phone,
  Clock,
  Sparkles,
  X,
  CreditCard,
  AlertCircle,
} from 'lucide-react';

interface MockMessage {
  id: string;
  sender: 'CUSTOMER' | 'AGENT';
  text: string;
  time: string;
  status?: 'SENT' | 'DELIVERED' | 'READ';
}

interface MockConversation {
  id: string;
  customerName: string;
  phone: string;
  lastMessage: string;
  time: string;
  unread: number;
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  messages: MockMessage[];
}

const mockConversations: MockConversation[] = [
  {
    id: 'conv-1',
    customerName: 'Valentina Mejía',
    phone: '+573001234567',
    lastMessage: 'Perfecto, confírmame por favor el valor total con envío a Medellín.',
    time: '15:42',
    unread: 2,
    totalOrders: 3,
    totalSpent: 435000,
    tags: ['Cliente VIP', 'Medellín'],
    messages: [
      { id: 'm1', sender: 'CUSTOMER', text: '¡Hola! Quisiera saber si tienen disponible la camiseta básica en talla M blanca.', time: '15:30' },
      { id: 'm2', sender: 'AGENT', text: '¡Hola Valentina! Sí, tenemos stock disponible para entrega inmediata.', time: '15:32', status: 'READ' },
      { id: 'm3', sender: 'CUSTOMER', text: 'Excelente, quiero pedir 2 camisetas.', time: '15:35' },
      { id: 'm4', sender: 'AGENT', text: 'Con gusto. El valor unitario es $50.000 COP. ¿A qué dirección sería el despacho?', time: '15:38', status: 'READ' },
      { id: 'm5', sender: 'CUSTOMER', text: 'Perfecto, confírmame por favor el valor total con envío a Medellín.', time: '15:42' },
    ],
  },
  {
    id: 'conv-2',
    customerName: 'Carlos Mario Restrepo',
    phone: '+573109876543',
    lastMessage: 'Ya realicé la transferencia por Bancolombia.',
    time: '14:20',
    unread: 0,
    totalOrders: 2,
    totalSpent: 280000,
    tags: ['Pago Pendiente'],
    messages: [
      { id: 'm21', sender: 'CUSTOMER', text: 'Buenas tardes, les envío el comprobante de mi pedido.', time: '14:18' },
      { id: 'm22', sender: 'CUSTOMER', text: 'Ya realicé la transferencia por Bancolombia.', time: '14:20' },
      { id: 'm23', sender: 'AGENT', text: 'Recibido Carlos, en un momento verificamos tu pago.', time: '14:22', status: 'DELIVERED' },
    ],
  },
  {
    id: 'conv-3',
    customerName: 'Juliana Gómez',
    phone: '+573205551212',
    lastMessage: '¿Tienen chaquetas impermeables en color verde oliva?',
    time: '11:15',
    unread: 1,
    totalOrders: 1,
    totalSpent: 170000,
    tags: ['Nuevo Prospecto'],
    messages: [
      { id: 'm31', sender: 'CUSTOMER', text: '¿Tienen chaquetas impermeables en color verde oliva?', time: '11:15' },
    ],
  },
];

export function WhatsAppPage() {
  const [conversations, setConversations] = useState<MockConversation[]>(mockConversations);
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);

  // Formulario de Pedido Rápido desde WhatsApp
  const [selectedProduct, setSelectedProduct] = useState('TSH-WHT-001 (Camiseta Básica Blanca - M)');
  const [quantity, setQuantity] = useState(2);
  const [unitPrice, setUnitPrice] = useState(50000);
  const [shippingCost, setShippingCost] = useState(15000);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: MockMessage = {
      id: `msg-${Date.now()}`,
      sender: 'AGENT',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT',
    };

    setConversations(
      conversations.map((c) => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            lastMessage: inputText.trim(),
            time: newMsg.time,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      }),
    );

    setInputText('');
  };

  const handleCreateQuickOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const orderTotal = quantity * unitPrice + shippingCost;
    const orderNumber = `SH-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const confirmationMsg: MockMessage = {
      id: `msg-order-${Date.now()}`,
      sender: 'AGENT',
      text: `🛍️ ¡Hola ${activeConv.customerName}! Tu pedido *#${orderNumber}* ha sido generado exitosamente por un total de *${formatCOP(orderTotal)}* (${quantity} uds de ${selectedProduct} + flete). En breve te compartiremos el enlace de pago o guía de despacho.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
    };

    setConversations(
      conversations.map((c) => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            totalOrders: c.totalOrders + 1,
            totalSpent: c.totalSpent + orderTotal,
            lastMessage: `Pedido #${orderNumber} generado (${formatCOP(orderTotal)})`,
            messages: [...c.messages, confirmationMsg],
          };
        }
        return c;
      }),
    );

    setIsQuickOrderOpen(false);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery),
  );

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-surface-light">
        {/* COLUMNA 1: LISTA DE CHATS */}
        <aside className="w-80 md:w-96 border-r border-border-slate/30 flex flex-col bg-white shrink-0">
          <div className="p-4 border-b border-border-slate/20 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-primary-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-active-green" />
                WhatsApp Inbox
              </h2>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-light hover:bg-border-slate/20 text-primary-base border border-border-slate/30 transition"
              >
                <QrCode className="w-3.5 h-3.5 text-deep-olive" />
                Vincular
              </button>
            </div>

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

          <div className="flex-1 overflow-y-auto divide-y divide-border-slate/10">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <button
                  type="button"
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition ${
                    isSelected ? 'bg-deep-olive/10 border-l-4 border-deep-olive' : 'hover:bg-surface-light/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-deep-olive/20 text-deep-olive font-bold text-sm flex items-center justify-center shrink-0">
                    {conv.customerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-primary-base truncate">
                        {conv.customerName}
                      </span>
                      <span className="text-[10px] text-muted-dark font-medium">{conv.time}</span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-dark truncate">{conv.phone}</div>
                    <p className="text-xs text-muted-dark truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-active-green text-white shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* COLUMNA 2: ÁREA DE CONVERSACIÓN */}
        <section className="flex-1 flex flex-col bg-surface-light/40 min-w-0 border-r border-border-slate/30">
          {/* Cabecera del chat */}
          <div className="p-4 bg-white border-b border-border-slate/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-deep-olive/20 text-deep-olive font-bold flex items-center justify-center">
                {activeConv.customerName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-primary-base">{activeConv.customerName}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-dark font-mono">
                  <span>{activeConv.phone}</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-active-green" />
                  <span className="text-[11px] font-sans text-active-green font-medium">WhatsApp Conectado</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsQuickOrderOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-base text-white rounded-lg text-xs font-semibold hover:bg-primary-base/90 shadow-sm transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Crear Pedido Rápido
            </button>
          </div>

          {/* Mensajes del chat */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeConv.messages.map((msg) => {
              const isAgent = msg.sender === 'AGENT';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${
                      isAgent
                        ? 'bg-primary-base text-white rounded-br-xs'
                        : 'bg-white text-primary-base border border-border-slate/20 rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div
                      className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                        isAgent ? 'text-surface-light/60' : 'text-muted-dark'
                      }`}
                    >
                      <span>{msg.time}</span>
                      {isAgent && (
                        <span>
                          {msg.status === 'READ' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-accent-sage" />
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
          </div>

          {/* Input de respuesta */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-border-slate/20 space-y-2"
          >
            {/* Respuestas rápidas */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-muted-dark flex items-center gap-1 shrink-0 font-medium text-[11px]">
                <Sparkles className="w-3 h-3 text-deep-olive" /> Rápidas:
              </span>
              <button
                type="button"
                onClick={() => setInputText('¡Hola! Claro que sí, tenemos disponibilidad para envío inmediato.')}
                className="px-2.5 py-1 rounded-full bg-surface-light border border-border-slate/30 text-muted-dark hover:text-primary-base text-[11px] shrink-0"
              >
                Disponibilidad
              </button>
              <button
                type="button"
                onClick={() => setInputText('Para confirmar tu pedido, puedes transferir a nuestra cuenta Bancolombia o Nequi.')}
                className="px-2.5 py-1 rounded-full bg-surface-light border border-border-slate/30 text-muted-dark hover:text-primary-base text-[11px] shrink-0"
              >
                Datos de Pago
              </button>
              <button
                type="button"
                onClick={() => setInputText('Te adjunto nuestra guía de despacho para que rastrees tu paquete.')}
                className="px-2.5 py-1 rounded-full bg-surface-light border border-border-slate/30 text-muted-dark hover:text-primary-base text-[11px] shrink-0"
              >
                Guía de Envío
              </button>
            </div>

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
                className="p-2.5 bg-primary-base text-white rounded-lg hover:bg-primary-base/90 shadow-sm transition"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </section>

        {/* COLUMNA 3: CONTEXTO CRM & CREAR PEDIDO */}
        <aside className="w-80 border-l border-border-slate/30 bg-white p-5 flex flex-col justify-between overflow-y-auto hidden lg:flex">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-sm text-primary-base">Perfil del Cliente CRM</h3>
              <p className="text-xs text-muted-dark">Datos consolidados del comprador</p>
            </div>

            <div className="p-4 bg-surface-light rounded-xl border border-border-slate/20 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-deep-olive/20 text-deep-olive font-bold text-base flex items-center justify-center">
                  {activeConv.customerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-primary-base">{activeConv.customerName}</h4>
                  <div className="text-xs font-mono text-muted-dark">{activeConv.phone}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border-slate/20">
                {activeConv.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-deep-olive/10 text-deep-olive"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-border-slate/30 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-muted-dark tracking-wider">Pedidos</span>
                <div className="text-base font-bold text-primary-base mt-0.5">{activeConv.totalOrders}</div>
              </div>
              <div className="p-3 bg-white border border-border-slate/30 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-muted-dark tracking-wider">Total Gastado</span>
                <div className="text-sm font-bold text-emerald-700 mt-0.5">{formatCOP(activeConv.totalSpent)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-primary-base flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-dark" />
                Historial de Acciones
              </span>
              <p className="text-xs text-muted-dark leading-relaxed">
                El cliente interactúa regularmente por WhatsApp. Se ha identificado su número bajo el formato internacional E.164.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsQuickOrderOpen(true)}
            className="w-full py-2.5 bg-deep-olive text-white rounded-lg text-xs font-semibold hover:bg-deep-olive/90 shadow-sm transition flex items-center justify-center gap-2 mt-6"
          >
            <Plus className="w-4 h-4" />
            Crear Pedido desde Chat
          </button>
        </aside>

        {/* MODAL CREAR PEDIDO RÁPIDO */}
        {isQuickOrderOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-border-slate/30 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border-slate/20 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-deep-olive/10 text-deep-olive rounded-lg">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-primary-base">Crear Pedido Comercial Rápido</h3>
                    <p className="text-xs text-muted-dark">Para {activeConv.customerName} ({activeConv.phone})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickOrderOpen(false)}
                  className="p-1.5 text-muted-dark hover:text-primary-base rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateQuickOrder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                    Producto / Variante *
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
                  >
                    <option value="TSH-WHT-001 (Camiseta Básica Blanca - M)">
                      TSH-WHT-001 — Camiseta Básica Blanca (Talla M) - $50.000 COP
                    </option>
                    <option value="JEA-SLM-002 (Pantalón Jean Slim Fit - 32)">
                      JEA-SLM-002 — Pantalón Jean Slim Fit (Talla 32) - $110.000 COP
                    </option>
                    <option value="JAC-IMP-003 (Chaqueta Impermeable Tech - L)">
                      JAC-IMP-003 — Chaqueta Impermeable Tech (Talla L) - $170.000 COP
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                      Precio Unitario (COP) *
                    </label>
                    <input
                      type="number"
                      min={100}
                      required
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-dark uppercase tracking-wider mb-1">
                    Costo de Envío / Flete (COP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border-slate/40 text-xs focus:outline-none focus:ring-2 focus:ring-deep-olive"
                  />
                </div>

                <div className="p-4 bg-surface-light rounded-xl border border-border-slate/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-base">Total a Cobrar:</span>
                  <span className="text-lg font-black text-emerald-700">
                    {formatCOP(quantity * unitPrice + shippingCost)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-slate/20">
                  <button
                    type="button"
                    onClick={() => setIsQuickOrderOpen(false)}
                    className="px-4 py-2 border border-border-slate/40 rounded-lg text-xs font-medium text-muted-dark hover:bg-surface-light"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary-base text-white rounded-lg text-xs font-semibold hover:bg-primary-base/90 shadow-sm"
                  >
                    Generar Pedido & Enviar Confirmación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL VINCULACIÓN QR WHATSAPP */}
        {isQrModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-border-slate/30 shadow-2xl max-w-sm w-full p-6 space-y-4 text-center animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-dark uppercase tracking-wider">
                  Vincular WhatsApp
                </span>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="p-1 text-muted-dark hover:text-primary-base rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 bg-surface-light rounded-xl border border-border-slate/20 flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-border-slate/30">
                  <QrCode className="w-32 h-32 text-primary-base" />
                </div>
                <p className="text-xs text-muted-dark">
                  Abre WhatsApp en tu teléfono &gt; Dispositivos vinculados &gt; Escanea este código
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-full py-2 bg-primary-base text-white rounded-lg text-xs font-semibold hover:bg-primary-base/90 shadow-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
