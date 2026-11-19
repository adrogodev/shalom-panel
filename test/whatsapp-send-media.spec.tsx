import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../src/features/whatsapp/api/whatsapp.api', () => ({
  fetchAttachmentLink: vi.fn(),
  retryAttachment: vi.fn(),
  sendConversationAttachment: vi.fn(),
  sendConversationLocation: vi.fn(),
  sendConversationContact: vi.fn(),
}));

import * as api from '../src/features/whatsapp/api/whatsapp.api';
import { ChatAttachments } from '../src/features/whatsapp/ui/ChatAttachments';
import { MessageContent } from '../src/features/whatsapp/ui/MessageContent';
import { kindForFile, recorderMimeType, sizeError } from '../src/features/whatsapp/lib/outgoing-media';
import type { InboxMessage } from '../src/features/whatsapp/model/types';

const m = vi.mocked(api);

const sent: InboxMessage = {
  id: 'msg-9',
  conversationId: 'conv-1',
  senderType: 'AGENT',
  messageType: 'IMAGE',
  content: '[Imagen]',
  status: 'SENT',
  timestamp: '2026-11-19T15:00:00.000Z',
};

describe('outgoing media helpers', () => {
  it('maps each picked file to the WhatsApp kind it will be sent as', () => {
    expect(kindForFile({ type: 'image/jpeg', name: 'a.jpg' }, 'media')).toBe('image');
    expect(kindForFile({ type: 'video/mp4', name: 'a.mp4' }, 'media')).toBe('video');
    expect(kindForFile({ type: 'video/mp4', name: 'a.mp4' }, 'gif')).toBe('gif');
    expect(kindForFile({ type: 'image/gif', name: 'a.gif' }, 'gif')).toBe('image');
    expect(kindForFile({ type: 'image/webp', name: 's.webp' }, 'sticker')).toBe('sticker');
    expect(kindForFile({ type: 'audio/mpeg', name: 'a.mp3' }, 'audio')).toBe('audio');
    expect(kindForFile({ type: 'image/png', name: 'a.png' }, 'document')).toBe('document');
    expect(kindForFile({ type: 'application/zip', name: 'a.zip' }, 'media')).toBe('document');
  });

  it('enforces the WhatsApp size limits per kind', () => {
    expect(sizeError('image', 1024)).toBeNull();
    expect(sizeError('video', 17 * 1024 * 1024)).toMatch(/16 MB/);
    expect(sizeError('document', 20 * 1024 * 1024)).toBeNull();
    expect(sizeError('document', 31 * 1024 * 1024)).toMatch(/30 MB/);
    expect(sizeError('image', 0)).toMatch(/vacío/);
  });

  it('records voice notes in the first format the browser supports', () => {
    expect(recorderMimeType((t) => t === 'audio/webm;codecs=opus')).toBe('audio/webm;codecs=opus');
    expect(recorderMimeType(() => false)).toBe('');
  });
});

describe('ChatAttachments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  const renderIt = () => {
    const onSent = vi.fn();
    const onError = vi.fn();
    render(<ChatAttachments conversationId="conv-1" onSent={onSent} onError={onError} />);
    return { onSent, onError };
  };

  it('lists every kind the agent can send', () => {
    renderIt();
    fireEvent.click(screen.getByLabelText('Adjuntar'));
    for (const label of ['Foto o video', 'Documento', 'Sticker', 'GIF', 'Audio', 'Ubicación', 'Contacto']) {
      expect(screen.getByRole('menuitem', { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByLabelText('Grabar nota de voz')).toBeInTheDocument();
  });

  it('previews a picked photo and sends it as base64 with its caption', async () => {
    m.sendConversationAttachment.mockResolvedValue(sent);
    const { onSent } = renderIt();
    const file = new File(['png-bytes'], 'foto.png', { type: 'image/png' });

    fireEvent.change(screen.getByTestId('attach-file-input'), { target: { files: [file] } });
    expect(await screen.findByAltText('Vista previa')).toHaveAttribute('src', 'blob:preview');
    fireEvent.change(screen.getByPlaceholderText(/pie de foto/), { target: { value: 'Así queda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(onSent).toHaveBeenCalledWith(sent));
    expect(m.sendConversationAttachment).toHaveBeenCalledWith('conv-1', {
      kind: 'image',
      base64: Buffer.from('png-bytes').toString('base64'),
      mimeType: 'image/png',
      fileName: 'foto.png',
      caption: 'Así queda',
    });
    expect(screen.queryByAltText('Vista previa')).not.toBeInTheDocument();
  });

  it('reports a server error and keeps the file ready to retry', async () => {
    m.sendConversationAttachment.mockRejectedValue(new Error('Evolution caído'));
    const { onError, onSent } = renderIt();
    fireEvent.change(screen.getByTestId('attach-file-input'), {
      target: { files: [new File(['x'], 'c.pdf', { type: 'application/pdf' })] },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar' }));
    await waitFor(() => expect(onError).toHaveBeenLastCalledWith('No se pudo enviar documento. (Evolution caído)'));
    expect(onSent).not.toHaveBeenCalled();
    expect(screen.getByText('c.pdf')).toBeInTheDocument();
  });

  it('rejects a file over the WhatsApp limit before uploading it', () => {
    const { onError } = renderIt();
    const big = new File(['x'], 'big.mp4', { type: 'video/mp4' });
    Object.defineProperty(big, 'size', { value: 17 * 1024 * 1024 });
    fireEvent.change(screen.getByTestId('attach-file-input'), { target: { files: [big] } });
    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/16 MB/));
    expect(m.sendConversationAttachment).not.toHaveBeenCalled();
  });

  it('sends a typed location and a contact card', async () => {
    m.sendConversationLocation.mockResolvedValue({ ...sent, messageType: 'LOCATION' });
    m.sendConversationContact.mockResolvedValue({ ...sent, messageType: 'CONTACT' });
    const { onSent } = renderIt();

    fireEvent.click(screen.getByLabelText('Adjuntar'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Ubicación/ }));
    fireEvent.change(screen.getByLabelText('Latitud'), { target: { value: '10,9685' } });
    fireEvent.change(screen.getByLabelText('Longitud'), { target: { value: '-74.7813' } });
    fireEvent.change(screen.getByPlaceholderText(/Nombre del lugar/), { target: { value: 'Tienda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() =>
      expect(m.sendConversationLocation).toHaveBeenCalledWith('conv-1', { latitude: 10.9685, longitude: -74.7813, name: 'Tienda' }),
    );

    fireEvent.click(screen.getByLabelText('Adjuntar'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Contacto/ }));
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Nombre del contacto'), { target: { value: 'Soporte' } });
    fireEvent.change(screen.getByLabelText('Teléfono del contacto'), { target: { value: '+57 300 123 4567' } });
    fireEvent.click(send);
    await waitFor(() =>
      expect(m.sendConversationContact).toHaveBeenCalledWith('conv-1', { fullName: 'Soporte', phone: '+57 300 123 4567' }),
    );
    expect(onSent).toHaveBeenCalledTimes(2);
  });
});

describe('MessageContent retry of a file that could not be saved', () => {
  beforeEach(() => vi.clearAllMocks());

  it('downloads it again and shows it once recovered', async () => {
    m.retryAttachment.mockResolvedValue({
      id: 'att-1',
      messageId: 'msg-1',
      mimeType: 'image/webp',
      fileName: null,
      fileSize: 10,
      status: 'AVAILABLE',
      isAnimated: false,
      isVoiceNote: false,
    });
    m.fetchAttachmentLink.mockResolvedValue({ url: 'http://files/s.webp', mimeType: 'image/webp', fileName: 's.webp' });
    render(
      <MessageContent
        message={{
          ...sent,
          id: 'msg-1',
          senderType: 'CUSTOMER',
          messageType: 'STICKER',
          content: '[Sticker]',
          attachments: [
            { id: 'att-1', messageId: 'msg-1', mimeType: 'image/webp', fileName: null, fileSize: null, status: 'MISSING', isAnimated: false, isVoiceNote: false },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar descarga' }));
    await waitFor(() => expect(m.retryAttachment).toHaveBeenCalledWith('msg-1', 'att-1'));
    await waitFor(() => expect(m.fetchAttachmentLink).toHaveBeenCalledWith('msg-1', 'att-1'));
    expect(screen.queryByRole('button', { name: 'Reintentar descarga' })).not.toBeInTheDocument();
  });

  it('explains why when the file still cannot be recovered', async () => {
    m.retryAttachment.mockRejectedValue(new Error('WhatsApp ya no tiene disponible este archivo'));
    render(
      <MessageContent
        message={{
          ...sent,
          messageType: 'IMAGE',
          attachments: [
            { id: 'att-1', messageId: 'msg-9', mimeType: 'image/jpeg', fileName: null, fileSize: null, status: 'MISSING', isAnimated: false, isVoiceNote: false },
          ],
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar descarga' }));
    expect(await screen.findByText('WhatsApp ya no tiene disponible este archivo')).toBeInTheDocument();
  });
});
