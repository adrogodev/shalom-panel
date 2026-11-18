import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@/shared/api', () => ({ apiClient: vi.fn() }));

import { apiClient } from '@/shared/api';
import {
  CustomerProfilePanel,
  customerProfileApi,
  type CustomerProfile,
} from '../src/features/customer-profile';

const client = vi.mocked(apiClient);

const profile: CustomerProfile = {
  id: 'cust-1',
  displayName: 'Laura Gómez',
  firstName: 'Laura',
  lastName: 'Gómez',
  phone: null,
  hasHiddenNumber: true,
  whatsappLinked: true,
  email: null,
  customerSince: '2026-01-10T10:00:00.000Z',
  optedOut: true,
  whatsapp: {
    conversationsCount: 1,
    firstMessageAt: '2026-02-01T15:00:00.000Z',
    lastMessageAt: '2026-11-17T20:02:00.000Z',
    messagesFromCustomer: 12,
    messagesToCustomer: 8,
    lastInboundText: '¿Tienen talla M?',
  },
  orders: {
    count: 1,
    totalSpent: 95000,
    totalPaid: 60000,
    pendingBalance: 35000,
    recent: [
      {
        id: 'o-1',
        orderNumber: 'SH-2026-0004',
        status: { key: 'CONFIRMED', name: 'Confirmado', color: '#3A9D24' },
        total: 95000,
        paid: 60000,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    ],
  },
  addresses: [
    { id: 'a-1', street: 'Calle 1 # 2-3', detail: null, city: 'Bogotá', state: 'DC', country: 'Colombia', postalCode: null, isDefault: true },
  ],
  tags: [{ id: 't-1', name: 'VIP', color: '#ff0000' }],
  notes: [{ id: 'n-1', text: 'Prefiere entregas en la tarde', authorName: 'Ana Ruiz', createdAt: '2026-11-02T00:00:00.000Z' }],
  automations: [{ id: 'e-1', automationName: 'Bienvenida', status: 'COMPLETED', createdAt: '2026-11-02T00:00:00.000Z' }],
};

const emptyProfile: CustomerProfile = {
  ...profile,
  id: 'cust-2',
  displayName: 'Pedro Pérez',
  firstName: 'Pedro',
  lastName: 'Pérez',
  phone: '+573001112233',
  hasHiddenNumber: false,
  whatsappLinked: false,
  optedOut: false,
  whatsapp: {
    conversationsCount: 0,
    firstMessageAt: null,
    lastMessageAt: null,
    messagesFromCustomer: 0,
    messagesToCustomer: 0,
    lastInboundText: null,
  },
  orders: { count: 0, totalSpent: 0, totalPaid: 0, pendingBalance: 0, recent: [] },
  addresses: [],
  tags: [],
  notes: [],
  automations: [],
};

type Routes = Record<string, (options?: RequestInit) => unknown>;

function route(routes: Routes) {
  client.mockImplementation(async (url: string, options?: RequestInit) => {
    const key = `${options?.method ?? 'GET'} ${url}`;
    const handler = routes[key];
    if (!handler) throw new Error('Not Found');
    return handler(options);
  });
}

const notFound = () => {
  throw new Error('Not Found');
};

// Braces matter: vitest runs a function returned from beforeEach as teardown.
beforeEach(() => {
  client.mockReset();
});

describe('customerProfileApi', () => {
  it('calls the profile, tag, note and picture endpoints', async () => {
    client.mockResolvedValue({});
    await customerProfileApi.fetchCustomerProfile('c 1');
    await customerProfileApi.addCustomerTag('c1', { name: 'VIP' });
    await customerProfileApi.removeCustomerTag('c1', 't1');
    await customerProfileApi.addCustomerNote('c1', 'Hola');
    await customerProfileApi.fetchProfilePicture('c1');
    expect(client.mock.calls.map(([url, o]) => [url, o?.method ?? 'GET', o?.body])).toEqual([
      ['/customer-profiles/c%201', 'GET', undefined],
      ['/customer-profiles/c1/tags', 'POST', JSON.stringify({ name: 'VIP' })],
      ['/customer-profiles/c1/tags/t1', 'DELETE', undefined],
      ['/customer-profiles/c1/notes', 'POST', JSON.stringify({ text: 'Hola' })],
      ['/whatsapp/customers/c1/profile-picture', 'GET', undefined],
    ]);
  });

  it('treats a missing profile picture as no picture', async () => {
    client.mockRejectedValue(new Error('Not Found'));
    await expect(customerProfileApi.fetchProfilePicture('c1')).resolves.toBeNull();
  });
});

describe('CustomerProfilePanel', () => {
  it('shows a placeholder and fetches nothing without a customer', () => {
    render(<CustomerProfilePanel customerId={null} />);
    expect(screen.getByText(/Selecciona una conversación/i)).toBeInTheDocument();
    expect(client).not.toHaveBeenCalled();
  });

  it('renders identity, badges, live stats, activity, orders, tags, notes and automations', async () => {
    route({
      'GET /customer-profiles/cust-1': () => profile,
      'GET /whatsapp/customers/cust-1/profile-picture': () => ({ url: null }),
    });
    render(<CustomerProfilePanel customerId="cust-1" />);

    expect(await screen.findByText('Laura Gómez')).toBeInTheDocument();
    expect(screen.getByText('Número oculto por WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Vinculado')).toBeInTheDocument();
    expect(screen.getByText('Dio de baja')).toBeInTheDocument();
    // Fallback avatar with initials.
    expect(screen.getByTestId('customer-avatar')).toHaveTextContent('LG');

    const stats = screen.getByTestId('customer-stats');
    expect(within(stats).getByText('Pedidos').nextSibling).toHaveTextContent('1');
    expect(within(stats).getByText('Total gastado').nextSibling).toHaveTextContent(/\$\s95\.000/);
    expect(within(stats).getByText('Pagado').nextSibling).toHaveTextContent(/\$\s60\.000/);
    expect(within(stats).getByText('Saldo pendiente').nextSibling).toHaveTextContent(/\$\s35\.000/);

    expect(screen.getByText('Actividad en WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Cliente desde')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('Pedidos recientes')).toBeInTheDocument();
    expect(screen.getByText('SH-2026-0004')).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();

    expect(screen.getByText('VIP')).toBeInTheDocument();
    expect(screen.getByText('Prefiere entregas en la tarde')).toBeInTheDocument();
    expect(screen.getByText(/Ana Ruiz/)).toBeInTheDocument();
    expect(screen.getByText('Bienvenida')).toBeInTheDocument();
    expect(screen.getByText('Calle 1 # 2-3')).toBeInTheDocument();
  });

  it('shows the WhatsApp photo when available', async () => {
    route({
      'GET /customer-profiles/cust-1': () => profile,
      'GET /whatsapp/customers/cust-1/profile-picture': () => ({ url: 'https://pps.whatsapp.net/p.jpg' }),
    });
    render(<CustomerProfilePanel customerId="cust-1" />);
    const img = await screen.findByRole('img', { name: /Foto de Laura Gómez/ });
    expect(img).toHaveAttribute('src', 'https://pps.whatsapp.net/p.jpg');
  });

  it('falls back to initials when the profile picture endpoint fails', async () => {
    route({
      'GET /customer-profiles/cust-2': () => emptyProfile,
      'GET /whatsapp/customers/cust-2/profile-picture': notFound,
    });
    render(<CustomerProfilePanel customerId="cust-2" />);
    expect(await screen.findByText('Pedro Pérez')).toBeInTheDocument();
    expect(screen.getByTestId('customer-avatar')).toHaveTextContent('PP');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders empty states for a customer without history', async () => {
    route({
      'GET /customer-profiles/cust-2': () => emptyProfile,
      'GET /whatsapp/customers/cust-2/profile-picture': () => ({ url: null }),
    });
    render(<CustomerProfilePanel customerId="cust-2" />);
    expect(await screen.findByText('+573001112233')).toBeInTheDocument();
    expect(screen.queryByText('Vinculado')).not.toBeInTheDocument();
    expect(screen.queryByText('Dio de baja')).not.toBeInTheDocument();
    expect(screen.getByText('Sin pedidos todavía')).toBeInTheDocument();
    expect(screen.getByText('Sin etiquetas')).toBeInTheDocument();
    expect(screen.getByText('Sin notas internas')).toBeInTheDocument();
    expect(screen.getByText('Sin automatizaciones recibidas')).toBeInTheDocument();
  });

  it('shows an error with retry when the profile cannot load', async () => {
    let attempts = 0;
    route({
      'GET /customer-profiles/cust-1': () => {
        attempts += 1;
        if (attempts === 1) throw new Error('Error HTTP 500');
        return profile;
      },
      'GET /whatsapp/customers/cust-1/profile-picture': () => ({ url: null }),
    });
    render(<CustomerProfilePanel customerId="cust-1" />);
    expect(await screen.findByText('Error HTTP 500')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Laura Gómez')).toBeInTheDocument();
  });

  it('reloads when the customer changes or the refresh key changes', async () => {
    route({
      'GET /customer-profiles/cust-1': () => profile,
      'GET /customer-profiles/cust-2': () => emptyProfile,
      'GET /whatsapp/customers/cust-1/profile-picture': () => ({ url: null }),
      'GET /whatsapp/customers/cust-2/profile-picture': () => ({ url: null }),
    });
    const { rerender } = render(<CustomerProfilePanel customerId="cust-1" refreshKey={0} />);
    expect(await screen.findByText('Laura Gómez')).toBeInTheDocument();

    rerender(<CustomerProfilePanel customerId="cust-2" refreshKey={0} />);
    expect(await screen.findByText('Pedro Pérez')).toBeInTheDocument();

    const before = client.mock.calls.filter(([url]) => url === '/customer-profiles/cust-2').length;
    rerender(<CustomerProfilePanel customerId="cust-2" refreshKey={1} />);
    await waitFor(() =>
      expect(client.mock.calls.filter(([url]) => url === '/customer-profiles/cust-2').length).toBe(before + 1),
    );
  });

  it('adds and removes tags', async () => {
    route({
      'GET /customer-profiles/cust-1': () => profile,
      'GET /whatsapp/customers/cust-1/profile-picture': () => ({ url: null }),
      'POST /customer-profiles/cust-1/tags': () => ({ id: 't-2', name: 'Mayorista', color: '#B3C9BF' }),
      'DELETE /customer-profiles/cust-1/tags/t-1': () => ({ removed: true }),
    });
    render(<CustomerProfilePanel customerId="cust-1" />);
    await screen.findByText('Laura Gómez');

    fireEvent.change(screen.getByPlaceholderText('Nueva etiqueta'), { target: { value: '  Mayorista ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar etiqueta' }));
    expect(await screen.findByText('Mayorista')).toBeInTheDocument();
    expect(client).toHaveBeenCalledWith(
      '/customer-profiles/cust-1/tags',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Mayorista' }) }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Quitar etiqueta VIP' }));
    await waitFor(() => expect(screen.queryByText('VIP')).not.toBeInTheDocument());
    expect(client).toHaveBeenCalledWith('/customer-profiles/cust-1/tags/t-1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('adds an internal note and shows a server error', async () => {
    let fail = true;
    route({
      'GET /customer-profiles/cust-1': () => profile,
      'GET /whatsapp/customers/cust-1/profile-picture': () => ({ url: null }),
      'POST /customer-profiles/cust-1/notes': () => {
        if (fail) {
          fail = false;
          throw new Error('El cliente no tiene ninguna conversación de WhatsApp');
        }
        return { id: 'n-2', text: 'Llamar mañana', authorName: 'Ana Ruiz', createdAt: '2026-11-18T00:00:00.000Z' };
      },
    });
    render(<CustomerProfilePanel customerId="cust-1" />);
    await screen.findByText('Laura Gómez');

    const input = screen.getByPlaceholderText('Escribe una nota interna…');
    fireEvent.change(input, { target: { value: 'Llamar mañana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));
    expect(await screen.findByText(/no tiene ninguna conversación/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar nota' }));
    expect(await screen.findByText('Llamar mañana')).toBeInTheDocument();
    expect(client).toHaveBeenCalledWith(
      '/customer-profiles/cust-1/notes',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ text: 'Llamar mañana' }) }),
    );
  });

  it('calls onClose from the header button', async () => {
    route({
      'GET /customer-profiles/cust-1': () => profile,
      'GET /whatsapp/customers/cust-1/profile-picture': () => ({ url: null }),
    });
    const onClose = vi.fn();
    render(<CustomerProfilePanel customerId="cust-1" onClose={onClose} />);
    await screen.findByText('Laura Gómez');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar perfil' }));
    expect(onClose).toHaveBeenCalled();
  });
});
