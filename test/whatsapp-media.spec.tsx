import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('../src/features/whatsapp/api/whatsapp.api', () => ({
  fetchAttachmentLink: vi.fn(),
}));

import { MessageContent, isBareMessage } from '../src/features/whatsapp/ui/MessageContent';
import * as api from '../src/features/whatsapp/api/whatsapp.api';
import type { InboxMessage, MessageAttachment } from '../src/features/whatsapp/model/types';

const m = vi.mocked(api);

const attachment = (over: Partial<MessageAttachment> = {}): MessageAttachment => ({
  id: 'att-1',
  messageId: 'msg-1',
  mimeType: 'image/jpeg',
  fileName: null,
  fileSize: 2048,
  status: 'AVAILABLE',
  isAnimated: false,
  isVoiceNote: false,
  ...over,
});

const message = (over: Partial<InboxMessage> = {}): InboxMessage => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  senderType: 'CUSTOMER',
  messageType: 'TEXT',
  content: 'Hola',
  status: 'DELIVERED',
  timestamp: '2026-11-18T15:00:00.000Z',
  ...over,
});

const URL_OF = 'http://localhost:9000/shalom-private/whatsapp/x?X-Amz-Signature=abc';

describe('MessageContent (every WhatsApp kind in the chat bubble)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    m.fetchAttachmentLink.mockResolvedValue({ url: URL_OF, mimeType: 'image/jpeg', fileName: 'x.jpg' });
  });

  it('renders plain text', () => {
    render(<MessageContent message={message({ content: '¿Tienen talla M?' })} />);
    expect(screen.getByText('¿Tienen talla M?')).toBeInTheDocument();
    expect(m.fetchAttachmentLink).not.toHaveBeenCalled();
  });

  it('renders an image through a short-lived link with its caption, and opens it full size on click', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<MessageContent message={message({ messageType: 'IMAGE', content: 'Esta camiseta', attachments: [attachment()] })} />);

    const img = await screen.findByRole('img', { name: 'Imagen recibida' });
    expect(m.fetchAttachmentLink).toHaveBeenCalledWith('msg-1', 'att-1');
    expect(img).toHaveAttribute('src', URL_OF);
    expect(screen.getByText('Esta camiseta')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver imagen completa' }));
    expect(open).toHaveBeenCalledWith(URL_OF, '_blank', 'noopener,noreferrer');
  });

  it('hides placeholder captions such as [Imagen]', async () => {
    render(<MessageContent message={message({ messageType: 'IMAGE', content: '[Imagen]', attachments: [attachment()] })} />);
    await screen.findByRole('img', { name: 'Imagen recibida' });
    expect(screen.queryByText('[Imagen]')).not.toBeInTheDocument();
  });

  it('renders a video with controls and a GIF as a muted looping autoplay video', async () => {
    const { container, unmount } = render(
      <MessageContent message={message({ messageType: 'VIDEO', content: '[Video]', attachments: [attachment({ mimeType: 'video/mp4' })] })} />,
    );
    await waitFor(() => expect(container.querySelector('video')).toHaveAttribute('src', URL_OF));
    expect(container.querySelector('video')).toHaveAttribute('controls');
    unmount();

    const gif = render(
      <MessageContent
        message={message({ messageType: 'VIDEO', content: '[GIF]', attachments: [attachment({ mimeType: 'video/mp4', isAnimated: true })] })}
      />,
    );
    await waitFor(() => expect(gif.container.querySelector('video')).toHaveAttribute('src', URL_OF));
    const video = gif.container.querySelector('video')!;
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video.muted).toBe(true);
    expect(video).not.toHaveAttribute('controls');
    expect(screen.getByText('GIF')).toBeInTheDocument();
  });

  it('renders a sticker as a small image without bubble background', async () => {
    const sticker = message({ messageType: 'STICKER', content: '[Sticker]', attachments: [attachment({ mimeType: 'image/webp' })] });
    render(<MessageContent message={sticker} />);
    expect(await screen.findByRole('img', { name: 'Sticker' })).toHaveAttribute('src', URL_OF);
    expect(isBareMessage(sticker)).toBe(true);
    expect(isBareMessage(message())).toBe(false);
  });

  it('renders audio and voice notes with a player', async () => {
    const { container } = render(
      <MessageContent
        message={message({
          messageType: 'AUDIO',
          content: '[Nota de voz]',
          attachments: [attachment({ mimeType: 'audio/ogg; codecs=opus', isVoiceNote: true, durationSeconds: 7 })],
        })}
      />,
    );
    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', URL_OF));
    expect(container.querySelector('audio')).toHaveAttribute('controls');
    expect(screen.getByText('Nota de voz · 0:07')).toBeInTheDocument();
  });

  it('renders a document with its name, size and a download link', async () => {
    m.fetchAttachmentLink.mockResolvedValue({ url: URL_OF, mimeType: 'application/pdf', fileName: 'cotizacion.pdf' });
    render(
      <MessageContent
        message={message({
          messageType: 'DOCUMENT',
          content: 'cotizacion.pdf',
          attachments: [attachment({ mimeType: 'application/pdf', fileName: 'cotizacion.pdf', fileSize: 250 * 1024 })],
        })}
      />,
    );
    expect(screen.getByText('cotizacion.pdf')).toBeInTheDocument();
    expect(screen.getByText('250 KB')).toBeInTheDocument();
    const link = await screen.findByRole('link', { name: 'Descargar' });
    expect(link).toHaveAttribute('href', URL_OF);
  });

  it('renders a location with a Google Maps link', () => {
    render(
      <MessageContent
        message={message({
          messageType: 'LOCATION',
          content: '[Ubicación] Tienda',
          metadata: { location: { latitude: 4.6, longitude: -74.1, name: 'Tienda', address: 'Calle 1' } },
        })}
      />,
    );
    expect(screen.getByText('Tienda')).toBeInTheDocument();
    expect(screen.getByText('Calle 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver en Google Maps' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=4.6,-74.1',
    );
  });

  it('renders shared contacts with name and phone', () => {
    render(
      <MessageContent
        message={message({ messageType: 'CONTACT', content: '[Contacto] Ana', metadata: { contacts: [{ name: 'Ana Ruiz', phone: '+573004445566' }] } })}
      />,
    );
    expect(screen.getByText('Ana Ruiz')).toBeInTheDocument();
    expect(screen.getByText('+573004445566')).toBeInTheDocument();
  });

  it('renders a reaction as a small line with the emoji', () => {
    const reaction = message({
      messageType: 'REACTION',
      content: 'Reaccionó 👍 a: "Ya pagué"',
      metadata: { reaction: { emoji: '👍', targetProviderMessageId: 'X' } },
    });
    render(<MessageContent message={reaction} />);
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('Reaccionó 👍 a: "Ya pagué"')).toBeInTheDocument();
    expect(isBareMessage(reaction)).toBe(true);
  });

  it('renders a poll with its question and options', () => {
    render(
      <MessageContent
        message={message({ messageType: 'POLL', content: '[Encuesta] ¿Qué talla?', metadata: { poll: { question: '¿Qué talla?', options: ['S', 'M'] } } })}
      />,
    );
    expect(screen.getByText('¿Qué talla?')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('shows a friendly placeholder for unsupported messages', () => {
    render(<MessageContent message={message({ messageType: 'OTHER', content: '[Mensaje no compatible]' })} />);
    expect(screen.getByText(/Este tipo de mensaje no se puede mostrar aquí/)).toBeInTheDocument();
  });

  it('explains when the file could not be saved or is too large, without asking for a link', () => {
    render(
      <>
        <MessageContent message={message({ id: 'a', messageType: 'IMAGE', content: '[Imagen]', attachments: [attachment({ status: 'MISSING' })] })} />
        <MessageContent message={message({ id: 'b', messageType: 'VIDEO', content: '[Video]', attachments: [attachment({ status: 'TOO_LARGE' })] })} />
      </>,
    );
    expect(screen.getByText('Archivo no disponible. Ábrelo en WhatsApp en tu teléfono.')).toBeInTheDocument();
    expect(screen.getByText('Archivo demasiado grande para mostrarlo aquí. Ábrelo en WhatsApp en tu teléfono.')).toBeInTheDocument();
    expect(m.fetchAttachmentLink).not.toHaveBeenCalled();
  });

  it('shows the placeholder while the file is still being saved and a notice when the link fails', async () => {
    const { rerender } = render(<MessageContent message={message({ messageType: 'IMAGE', content: '[Imagen]' })} />);
    expect(screen.getByText('[Imagen]')).toBeInTheDocument();

    m.fetchAttachmentLink.mockRejectedValue(new Error('404'));
    rerender(<MessageContent message={message({ messageType: 'IMAGE', content: '[Imagen]', attachments: [attachment()] })} />);
    expect(await screen.findByText('No pudimos cargar el archivo.')).toBeInTheDocument();
  });

  it('marks view-once messages', () => {
    render(<MessageContent message={message({ content: 'Hola', metadata: { viewOnce: true } })} />);
    expect(screen.getByText('Ver una vez')).toBeInTheDocument();
  });
});
