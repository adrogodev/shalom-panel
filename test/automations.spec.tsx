import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/widgets/layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../src/features/automation-builder/api/triggers.api', () => ({
  fetchTriggers: vi.fn(),
  createTrigger: vi.fn(),
  fetchPaymentMethods: vi.fn(),
}));

vi.mock('../src/pages/automations/api/automations.api', () => ({
  fetchAutomations: vi.fn(),
  setAutomationActive: vi.fn(),
  persistAutomation: vi.fn(),
}));

import { AutomationsPage, FlowBuilderPage } from '../src/pages/automations';
import { resetAutomationsStore, useAutomationsStore } from '../src/pages/automations/model/automations.store';
import * as api from '../src/pages/automations/api/automations.api';
import * as triggersApi from '../src/features/automation-builder/api/triggers.api';
import { resetTriggersStore } from '../src/features/automation-builder/model/triggers.store';
import { createRecipeFromTemplate, type AutomationTriggerOption } from '../src/features/automation-builder';

const fetchTriggers = vi.mocked(triggersApi.fetchTriggers);
const createTrigger = vi.mocked(triggersApi.createTrigger);
const fetchPaymentMethods = vi.mocked(triggersApi.fetchPaymentMethods);

const system = (key: AutomationTriggerOption['baseEvent'], name: string): AutomationTriggerOption => ({
  id: `sys-${key}`,
  key,
  name,
  description: `Descripción de ${name}`,
  baseEvent: key,
  filters: {},
  isSystem: true,
});

const PRICE_TRIGGER: AutomationTriggerOption = {
  id: 't-1',
  key: 'PREGUNTAN_PRECIO',
  name: 'Cuando preguntan por el precio',
  description: 'Mensajes que dicen precio',
  baseEvent: 'MESSAGE_RECEIVED',
  filters: { keywords: ['precio'] },
  isSystem: false,
};

const TRIGGERS: AutomationTriggerOption[] = [
  system('ORDER_CREATED', 'Cuando llega un pedido nuevo'),
  system('ORDER_STATUS_CHANGED', 'Cuando un pedido cambia de estado'),
  system('CUSTOMER_CREATED', 'Cuando se registra un cliente nuevo'),
  system('MESSAGE_RECEIVED', 'Cuando un cliente te escribe por WhatsApp'),
  system('PAYMENT_CONFIRMED', 'Cuando se confirma un pago'),
  PRICE_TRIGGER,
];

const fetchAutomations = vi.mocked(api.fetchAutomations);
const setAutomationActive = vi.mocked(api.setAutomationActive);
const persistAutomation = vi.mocked(api.persistAutomation);

function serverAutomation(id: string, templateKey: string, isActive: boolean): api.AutomationSummary {
  const recipe = createRecipeFromTemplate(templateKey);
  return { id, name: recipe.name, summary: 'Resumen', recipe, isActive, timesRun: 3, lastRunAt: null };
}

const SERVER_LIST = [
  serverAutomation('a-1', 'order-confirmation', true),
  serverAutomation('a-2', 'shipping-notice', false),
];

beforeEach(() => {
  vi.clearAllMocks();
  resetAutomationsStore();
  resetTriggersStore();
  fetchTriggers.mockResolvedValue(TRIGGERS);
  fetchPaymentMethods.mockResolvedValue([
    { id: 'm-1', key: 'NEQUI', name: 'Nequi' },
    { id: 'm-2', key: 'CASH', name: 'Efectivo' },
  ]);
  fetchAutomations.mockResolvedValue(SERVER_LIST);
  setAutomationActive.mockResolvedValue();
  persistAutomation.mockResolvedValue('a-new');
});

describe('AutomationsPage', () => {
  it('loads the automations from the server and describes them in plain language', async () => {
    render(<AutomationsPage />);

    expect(await screen.findByText('Confirmar pedidos nuevos', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getAllByText('Cuando un pedido pasa a "Enviado"').length).toBeGreaterThan(0);
    expect(screen.queryByText(/ORDER_STATUS_CHANGED|ORDER_CREATED|DAG/)).not.toBeInTheDocument();
    expect(fetchAutomations).toHaveBeenCalledTimes(1);
  });

  it('turns an automation on through the server', async () => {
    render(<AutomationsPage />);
    const toggle = await screen.findByRole('switch', { name: 'Encender "Avisar cuando se envía"' });

    fireEvent.click(toggle);

    await waitFor(() => expect(setAutomationActive).toHaveBeenCalledWith('a-2', true));
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('reverts the switch and explains the problem when the server rejects it', async () => {
    setAutomationActive.mockRejectedValue(new Error('Error HTTP 500'));
    render(<AutomationsPage />);
    const toggle = await screen.findByRole('switch', { name: 'Apagar "Confirmar pedidos nuevos"' });

    fireEvent.click(toggle);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos apagar la automatización');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('shows a friendly message when the list cannot be loaded', async () => {
    fetchAutomations.mockRejectedValue(new Error('Failed to fetch'));
    render(<AutomationsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar tus automatizaciones');
  });

  it('describes automations of a custom trigger by the trigger name', async () => {
    const recipe = { name: 'Responder precios', trigger: { type: 'PREGUNTAN_PRECIO' }, steps: [] };
    fetchAutomations.mockResolvedValue([
      { id: 'a-3', name: recipe.name, summary: '', recipe, isActive: true, timesRun: 0, lastRunAt: null },
    ]);
    render(<AutomationsPage />);

    expect(await screen.findByText('Cuando preguntan por el precio')).toBeInTheDocument();
    expect(screen.queryByText('PREGUNTAN_PRECIO')).not.toBeInTheDocument();
  });

  it('offers the new "pago confirmado" idea', () => {
    render(<AutomationsPage />);

    expect(screen.getByText('Agradecer pagos recibidos')).toBeInTheDocument();
  });
});

describe('FlowBuilderPage', () => {
  it('offers the "Cuando se confirma un pago" trigger card', async () => {
    render(<FlowBuilderPage automationId="new" templateKey="payment-thanks" />);

    expect(await screen.findByRole('button', { name: /Cuando se confirma un pago/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('lists one card per trigger from the server, custom ones included', async () => {
    render(<FlowBuilderPage automationId="new" />);

    const card = await screen.findByRole('button', { name: /Cuando preguntan por el precio/ });
    expect(card).toHaveTextContent('Mensajes que dicen precio');
    expect(fetchTriggers).toHaveBeenCalledTimes(1);

    fireEvent.click(card);
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('¿A qué estado debe pasar el pedido?')).not.toBeInTheDocument();
  });

  it('keeps the status choice for the system "cambia de estado" trigger', async () => {
    render(<FlowBuilderPage automationId="new" templateKey="shipping-notice" />);

    expect(await screen.findByText('¿A qué estado debe pasar el pedido?')).toBeInTheDocument();
  });

  it('creates a new trigger from the form, refreshes the list and selects it', async () => {
    const created: AutomationTriggerOption = {
      id: 't-2',
      key: 'PEDIDOS_EN_CAMINO',
      name: 'Pedidos en camino',
      description: null,
      baseEvent: 'ORDER_STATUS_CHANGED',
      filters: { statusKeys: ['SHIPPED'] },
      isSystem: false,
    };
    createTrigger.mockResolvedValue(created);
    render(<FlowBuilderPage automationId="new" />);

    fireEvent.click(await screen.findByRole('button', { name: /Crear un nuevo disparador/ }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Pedidos en camino' } });
    fireEvent.change(screen.getByLabelText('¿Basado en qué evento?'), { target: { value: 'ORDER_STATUS_CHANGED' } });
    fireEvent.click(screen.getByLabelText('Enviado'));
    fetchTriggers.mockResolvedValue([...TRIGGERS, created]);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar disparador' }));

    await waitFor(() =>
      expect(createTrigger).toHaveBeenCalledWith({
        name: 'Pedidos en camino',
        baseEvent: 'ORDER_STATUS_CHANGED',
        filters: { statusKeys: ['SHIPPED'] },
      }),
    );
    expect(await screen.findByRole('button', { name: /Pedidos en camino/ })).toHaveAttribute('aria-pressed', 'true');
    expect(fetchTriggers).toHaveBeenCalledTimes(2);
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
  });

  it('offers the payment methods from the server when the trigger is based on payments', async () => {
    createTrigger.mockResolvedValue({ ...PRICE_TRIGGER, key: 'PAGO_NEQUI', name: 'Pago por Nequi' });
    render(<FlowBuilderPage automationId="new" />);

    fireEvent.click(await screen.findByRole('button', { name: /Crear un nuevo disparador/ }));
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Pago por Nequi' } });
    fireEvent.change(screen.getByLabelText('¿Basado en qué evento?'), { target: { value: 'PAYMENT_CONFIRMED' } });
    fireEvent.click(await screen.findByLabelText('Nequi'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar disparador' }));

    await waitFor(() =>
      expect(createTrigger).toHaveBeenCalledWith({
        name: 'Pago por Nequi',
        baseEvent: 'PAYMENT_CONFIRMED',
        filters: { paymentMethodKeys: ['NEQUI'] },
      }),
    );
  });

  it('explains in plain language when the new trigger cannot be created', async () => {
    createTrigger.mockRejectedValue(new Error('Error HTTP 500'));
    render(<FlowBuilderPage automationId="new" />);

    fireEvent.click(await screen.findByRole('button', { name: /Crear un nuevo disparador/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar disparador' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ponle un nombre al disparador.');
    expect(createTrigger).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Clientes nuevos VIP' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar disparador' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos crear el disparador');
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
  });

  it('explains what is missing and stays open instead of saving an incomplete automation', () => {
    render(<FlowBuilderPage automationId="new" />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar y encender/ }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Ponle un nombre a la automatización.');
    expect(alert).toHaveTextContent('El paso 1 no tiene mensaje.');
    expect(persistAutomation).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('"Guardar y encender" saves on the server, closes the editor and shows the notice', async () => {
    render(<FlowBuilderPage automationId="new" templateKey="shipping-notice" />);

    fireEvent.click(screen.getByRole('button', { name: /Agregar un paso/ }));
    fireEvent.click(screen.getByRole('button', { name: /Esperar un tiempo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Guardar y encender/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/automations'));
    expect(persistAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: undefined,
        isActive: true,
        summary: 'Enviar un mensaje por WhatsApp, luego esperar 1 hora.',
        recipe: expect.objectContaining({
          name: 'Avisar cuando se envía',
          trigger: { type: 'ORDER_STATUS_CHANGED', statusKey: 'SHIPPED' },
        }),
      }),
    );
    expect(useAutomationsStore.getState().notice).toBe('"Avisar cuando se envía" quedó guardada y encendida.');
  });

  it('"Guardar sin encender" keeps a new automation off', async () => {
    render(<FlowBuilderPage automationId="new" templateKey="order-confirmation" />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar sin encender/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/automations'));
    expect(persistAutomation).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
  });

  it('editing an existing automation saves it under its id and keeps it on', async () => {
    resetAutomationsStore(SERVER_LIST);
    render(<FlowBuilderPage automationId="a-1" />);

    fireEvent.change(screen.getByDisplayValue('Confirmar pedidos nuevos'), {
      target: { value: 'Confirmación de pedido' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar sin encender/ }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(persistAutomation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'a-1',
        isActive: true,
        recipe: expect.objectContaining({ name: 'Confirmación de pedido' }),
      }),
    );
  });

  it('stays open and explains the problem when the server cannot save', async () => {
    persistAutomation.mockRejectedValue(new Error('Error HTTP 500'));
    render(<FlowBuilderPage automationId="new" templateKey="order-confirmation" />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar y encender/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar la automatización');
    expect(push).not.toHaveBeenCalled();
  });

  it('loads an existing automation from the server when opened directly', async () => {
    render(<FlowBuilderPage automationId="a-2" />);

    expect(await screen.findByDisplayValue('Avisar cuando se envía')).toBeInTheDocument();
    expect(fetchAutomations).toHaveBeenCalledTimes(1);
  });
});
