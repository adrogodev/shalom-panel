import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@/widgets/layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../src/features/whatsapp/api/whatsapp.api', () => ({
  fetchInstances: vi.fn(),
  fetchInstanceStatus: vi.fn(),
  connectInstance: vi.fn(),
  disconnectInstance: vi.fn(),
  syncInstance: vi.fn(),
  fetchConversations: vi.fn(),
  fetchConversationMessages: vi.fn(),
  sendConversationMessage: vi.fn(),
  searchProducts: vi.fn(),
  fetchProductVariants: vi.fn(),
  createQuickOrder: vi.fn(),
  fetchAttachmentLink: vi.fn(),
}));

let realtime: import('../src/features/whatsapp/lib/realtime').RealtimeHandlers = {};
const disconnectSocket = vi.fn();
vi.mock('../src/features/whatsapp/lib/realtime', () => ({
  realtimeUrl: () => 'http://localhost:3001/realtime',
  connectRealtime: (handlers: any) => {
    realtime = handlers;
    return disconnectSocket;
  },
}));

import { WhatsAppPage } from '../src/pages/whatsapp';
import * as api from '../src/features/whatsapp/api/whatsapp.api';
import type { InboxConversation, InboxMessage } from '../src/features/whatsapp/model/types';

const m = vi.mocked(api);

const laura: InboxConversation = {
  id: 'conv-1',
  customerId: 'cust-1',
  externalChatJid: '573009998877@s.whatsapp.net',
  status: 'OPEN',
  unreadCount: 2,
  lastMessageAt: '2026-11-17T15:00:00.000Z',
  customer: { id: 'cust-1', firstName: 'Laura', lastName: 'Gómez', phone: '+573009998877', totalOrders: 1, totalSpent: '120000' },
  messages: [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      senderType: 'CUSTOMER',
      content: '¿Tienen talla M?',
      status: 'DELIVERED',
      timestamp: '2026-11-17T15:00:00.000Z',
    },
  ],
};

const lauraMessages: InboxMessage[] = [
  { id: 'msg-0', conversationId: 'conv-1', senderType: 'AGENT', content: 'Hola Laura', status: 'READ', timestamp: '2026-11-17T14:59:00.000Z' },
  laura.messages![0],
];

beforeEach(() => {
  vi.clearAllMocks();
  realtime = {};
  m.fetchInstanceStatus.mockResolvedValue({ name: 'shalom-main', status: 'DISCONNECTED', phoneNumber: null, qrCode: null });
  m.fetchConversations.mockResolvedValue([]);
  m.fetchConversationMessages.mockResolvedValue({ conversation: laura, messages: lauraMessages });
});

describe('WhatsApp page', () => {
  it('explains how to start when WhatsApp is not connected and there are no chats', async () => {
    render(<WhatsAppPage />);

    expect(await screen.findByTestId('whatsapp-status')).toHaveTextContent('Sin conectar');
    expect(await screen.findByText(/Aún no tienes conversaciones/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Conectar WhatsApp/ })).toBeInTheDocument();
    expect(screen.queryByText('Valentina Mejía')).not.toBeInTheDocument();
  });

  it('shows the QR image and pairing code after pressing "Conectar WhatsApp"', async () => {
    m.connectInstance.mockResolvedValue({
      name: 'shalom-main',
      status: 'CONNECTING',
      phoneNumber: null,
      qrCode: 'data:image/png;base64,QR',
      pairingCode: 'WZYEH1YY',
    });
    render(<WhatsAppPage />);

    fireEvent.change(await screen.findByLabelText('Número de WhatsApp a vincular'), { target: { value: '+57 300 111 2233' } });
    fireEvent.click(screen.getByRole('button', { name: /Conectar WhatsApp/ }));

    expect(await screen.findByAltText('Código QR para vincular WhatsApp')).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(screen.getByTestId('pairing-code')).toHaveTextContent('WZYEH1YY');
    expect(m.connectInstance).toHaveBeenCalledWith('shalom-main', '+57 300 111 2233');
  });

  it('updates the status from the realtime socket when the phone is linked', async () => {
    render(<WhatsAppPage />);
    await screen.findByTestId('whatsapp-status');

    act(() => {
      realtime.onStatus?.({ instanceName: 'shalom-main', status: 'CONNECTED', qrCode: null, phoneNumber: '+573001112233' });
    });

    expect(screen.getByTestId('whatsapp-status')).toHaveTextContent('Conectado');
    expect(screen.getByText(/\+573001112233/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Desconectar/ })).toBeInTheDocument();
  });

  it('lists real conversations, opens the messages and sends a reply', async () => {
    m.fetchConversations.mockResolvedValue([laura]);
    m.sendConversationMessage.mockResolvedValue({
      id: 'msg-2',
      conversationId: 'conv-1',
      senderType: 'AGENT',
      content: 'Sí, tenemos talla M',
      status: 'SENT',
      timestamp: '2026-11-17T15:01:00.000Z',
    });
    render(<WhatsAppPage />);

    const list = await screen.findByRole('list', { name: 'Conversaciones' });
    fireEvent.click(within(list).getByText('Laura Gómez'));

    expect(await screen.findByText('Hola Laura')).toBeInTheDocument();
    expect(m.fetchConversationMessages).toHaveBeenCalledWith('conv-1');

    fireEvent.change(screen.getByPlaceholderText(/Escribe un mensaje/), { target: { value: 'Sí, tenemos talla M' } });
    fireEvent.click(screen.getByTitle('Enviar mensaje'));

    await waitFor(() => expect(m.sendConversationMessage).toHaveBeenCalledWith('conv-1', 'Sí, tenemos talla M'));
    expect(await screen.findAllByText('Sí, tenemos talla M')).not.toHaveLength(0);
  });

  it('shows "Número oculto por WhatsApp" for a customer known only by LID', async () => {
    const paula: InboxConversation = {
      ...laura,
      id: 'conv-lid',
      customerId: 'cust-lid',
      externalChatJid: '211234567890123@lid',
      customer: { id: 'cust-lid', firstName: 'Paula', lastName: 'Diaz', phone: null, totalOrders: 0, totalSpent: '0' },
    };
    m.fetchConversations.mockResolvedValue([paula]);
    m.fetchConversationMessages.mockResolvedValue({ conversation: paula, messages: [] });
    render(<WhatsAppPage />);

    const list = await screen.findByRole('list', { name: 'Conversaciones' });
    expect(within(list).getByText('Número oculto por WhatsApp')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Buscar/), { target: { value: 'paula' } });
    fireEvent.click(within(list).getByText('Paula Diaz'));

    await waitFor(() => expect(screen.getAllByText('Número oculto por WhatsApp').length).toBeGreaterThan(1));
  });

  it('shows a plain error when a message cannot be sent', async () => {
    m.fetchConversations.mockResolvedValue([laura]);
    m.sendConversationMessage.mockRejectedValue(new Error('Evolution API respondió con error (400)'));
    render(<WhatsAppPage />);

    fireEvent.click(within(await screen.findByRole('list', { name: 'Conversaciones' })).getByText('Laura Gómez'));
    await screen.findByText('Hola Laura');
    fireEvent.change(screen.getByPlaceholderText(/Escribe un mensaje/), { target: { value: 'Hola' } });
    fireEvent.click(screen.getByTitle('Enviar mensaje'));

    expect(await screen.findByText(/No se pudo enviar el mensaje/)).toBeInTheDocument();
  });

  it('appends incoming messages from the socket to the open chat', async () => {
    m.fetchConversations.mockResolvedValue([laura]);
    render(<WhatsAppPage />);
    fireEvent.click(within(await screen.findByRole('list', { name: 'Conversaciones' })).getByText('Laura Gómez'));
    await screen.findByText('Hola Laura');

    act(() => {
      realtime.onMessage?.({
        conversationId: 'conv-1',
        message: {
          id: 'msg-9',
          conversationId: 'conv-1',
          senderType: 'CUSTOMER',
          content: '¿Hacen envíos a Cali?',
          status: 'DELIVERED',
          timestamp: '2026-11-17T15:05:00.000Z',
        },
      });
    });

    expect(await screen.findAllByText('¿Hacen envíos a Cali?')).not.toHaveLength(0);
  });

  it('counts a message sent again with its file only once in the unread badge', async () => {
    m.fetchConversations.mockResolvedValue([laura]);
    render(<WhatsAppPage />);
    const list = await screen.findByRole('list', { name: 'Conversaciones' });
    expect(within(list).getByText('2')).toBeInTheDocument();
    const photo = {
      id: 'msg-11',
      conversationId: 'conv-1',
      senderType: 'CUSTOMER' as const,
      messageType: 'IMAGE',
      content: '[Imagen]',
      status: 'DELIVERED' as const,
      timestamp: '2026-11-17T15:07:00.000Z',
    };

    act(() => realtime.onMessage?.({ conversationId: 'conv-1', message: photo }));
    act(() => realtime.onMessage?.({ conversationId: 'conv-1', message: { ...photo, attachments: [] } }));

    expect(within(list).getByText('3')).toBeInTheDocument();
    expect(within(list).queryByText('4')).not.toBeInTheDocument();
  });

  it('replaces a message when the socket sends it again with its downloaded file', async () => {
    m.fetchConversations.mockResolvedValue([laura]);
    m.fetchAttachmentLink.mockResolvedValue({ url: 'http://minio/signed.jpg', mimeType: 'image/jpeg', fileName: 'x.jpg' });
    render(<WhatsAppPage />);
    fireEvent.click(within(await screen.findByRole('list', { name: 'Conversaciones' })).getByText('Laura Gómez'));
    await screen.findByText('Hola Laura');
    const photo = {
      id: 'msg-10',
      conversationId: 'conv-1',
      senderType: 'CUSTOMER' as const,
      messageType: 'IMAGE',
      content: 'Mira esta',
      status: 'DELIVERED' as const,
      timestamp: '2026-11-17T15:06:00.000Z',
    };

    act(() => realtime.onMessage?.({ conversationId: 'conv-1', message: photo }));
    act(() =>
      realtime.onMessage?.({
        conversationId: 'conv-1',
        message: {
          ...photo,
          attachments: [
            { id: 'att-1', messageId: 'msg-10', mimeType: 'image/jpeg', fileName: null, fileSize: 10, status: 'AVAILABLE', isAnimated: false, isVoiceNote: false },
          ],
        },
      }),
    );

    expect(await screen.findByRole('img', { name: 'Imagen recibida' })).toHaveAttribute('src', 'http://minio/signed.jpg');
    expect(m.fetchAttachmentLink).toHaveBeenCalledWith('msg-10', 'att-1');
  });

  it('syncs contacts and messages, then reloads the inbox', async () => {
    m.fetchInstanceStatus.mockResolvedValue({ name: 'shalom-main', status: 'CONNECTED', phoneNumber: '+573001112233', qrCode: null });
    m.syncInstance.mockResolvedValue({ contacts: 12, conversations: 3, messages: 40 });
    render(<WhatsAppPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Sincronizar contactos y mensajes/ }));

    expect(await screen.findByText(/12 contactos, 3 chats y 40 mensajes/)).toBeInTheDocument();
    expect(m.syncInstance).toHaveBeenCalledWith('shalom-main');
    await waitFor(() => expect(m.fetchConversations).toHaveBeenCalledTimes(2));
  });

  it('disconnects WhatsApp', async () => {
    m.fetchInstanceStatus.mockResolvedValue({ name: 'shalom-main', status: 'CONNECTED', phoneNumber: '+573001112233', qrCode: null });
    m.disconnectInstance.mockResolvedValue({ message: 'ok' });
    render(<WhatsAppPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Desconectar/ }));

    await waitFor(() => expect(screen.getByTestId('whatsapp-status')).toHaveTextContent('Sin conectar'));
    expect(m.disconnectInstance).toHaveBeenCalledWith('shalom-main');
  });

  it('shows a friendly message when the inbox cannot be loaded', async () => {
    m.fetchConversations.mockRejectedValue(new Error('boom'));
    render(<WhatsAppPage />);

    expect(await screen.findByText(/No pudimos cargar las conversaciones/)).toBeInTheDocument();
  });
});
