import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/widgets/layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../src/pages/automations/api/automations.api', () => ({
  fetchAutomations: vi.fn(),
  setAutomationActive: vi.fn(),
  persistAutomation: vi.fn(),
}));

import { AutomationsPage, FlowBuilderPage } from '../src/pages/automations';
import { resetAutomationsStore, useAutomationsStore } from '../src/pages/automations/model/automations.store';
import * as api from '../src/pages/automations/api/automations.api';
import { createRecipeFromTemplate } from '../src/features/automation-builder';

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

  it('offers the new "pago confirmado" idea', () => {
    render(<AutomationsPage />);

    expect(screen.getByText('Agradecer pagos recibidos')).toBeInTheDocument();
  });
});

describe('FlowBuilderPage', () => {
  it('offers the "Cuando se confirma un pago" trigger card', () => {
    render(<FlowBuilderPage automationId="new" templateKey="payment-thanks" />);

    expect(screen.getByRole('button', { name: /Cuando se confirma un pago/ })).toHaveAttribute('aria-pressed', 'true');
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
