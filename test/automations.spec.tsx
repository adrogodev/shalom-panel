import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/widgets/layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { AutomationsPage, FlowBuilderPage } from '../src/pages/automations';
import {
  resetAutomationsStore,
  useAutomationsStore,
} from '../src/pages/automations/model/automations.store';

beforeEach(() => {
  push.mockClear();
  resetAutomationsStore();
});

describe('AutomationsPage', () => {
  it('lists automations in plain language without technical event codes', () => {
    render(<AutomationsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Automatizaciones' })).toBeInTheDocument();
    expect(screen.getAllByText('Cuando un pedido pasa a "Enviado"').length).toBeGreaterThan(0);
    expect(screen.queryByText(/ORDER_STATUS_CHANGED|ORDER_CREATED|DAG/)).not.toBeInTheDocument();
  });

  it('turns an automation off with its switch', () => {
    render(<AutomationsPage />);
    const toggle = screen.getByRole('switch', { name: 'Apagar "Confirmar pedidos nuevos"' });

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});

describe('FlowBuilderPage', () => {
  it('opens a template as editable steps', () => {
    render(<FlowBuilderPage automationId="new" templateKey="payment-reminder" />);

    expect(screen.getByDisplayValue('Recordar pagos pendientes')).toBeInTheDocument();
    expect(screen.getByText('Esperar 4 horas')).toBeInTheDocument();
    expect(screen.getByText('Seguir solo si el pedido todavía no está pagado')).toBeInTheDocument();
  });

  it('explains what is missing and stays open instead of saving an incomplete automation', () => {
    render(<FlowBuilderPage automationId="new" />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar y encender/ }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Ponle un nombre a la automatización.');
    expect(alert).toHaveTextContent('El paso 1 no tiene mensaje.');
    expect(push).not.toHaveBeenCalled();
  });

  it('"Guardar y encender" closes the editor and adds the automation turned on', () => {
    render(<FlowBuilderPage automationId="new" templateKey="shipping-notice" />);

    fireEvent.click(screen.getByRole('button', { name: /Agregar un paso/ }));
    fireEvent.click(screen.getByRole('button', { name: /Esperar un tiempo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Guardar y encender/ }));

    expect(push).toHaveBeenCalledWith('/automations');
    const [saved] = useAutomationsStore.getState().automations;
    expect(saved).toMatchObject({ name: 'Avisar cuando se envía', isActive: true });
    expect(saved.recipe.steps.map((step) => step.kind)).toEqual(['send_message', 'wait']);
    expect(useAutomationsStore.getState().notice).toBe('"Avisar cuando se envía" quedó guardada y encendida.');
  });

  it('"Guardar sin encender" closes the editor and keeps a new automation off', () => {
    render(<FlowBuilderPage automationId="new" templateKey="order-confirmation" />);

    fireEvent.click(screen.getByRole('button', { name: /Guardar sin encender/ }));

    expect(push).toHaveBeenCalledWith('/automations');
    expect(useAutomationsStore.getState().automations[0]).toMatchObject({
      name: 'Confirmar pedidos nuevos',
      isActive: false,
    });
  });

  it('editing an existing automation updates it instead of adding a new one', () => {
    const before = useAutomationsStore.getState().automations.length;
    render(<FlowBuilderPage automationId="auto-2" />);

    fireEvent.change(screen.getByDisplayValue('Recordar pagos pendientes'), {
      target: { value: 'Recordatorio de pago' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar sin encender/ }));

    const automations = useAutomationsStore.getState().automations;
    expect(automations).toHaveLength(before);
    expect(automations.find((a) => a.id === 'auto-2')).toMatchObject({
      name: 'Recordatorio de pago',
      isActive: true,
    });
  });

  it('shows the saved notice on the list after closing the editor', () => {
    useAutomationsStore.getState().saveAutomation({
      id: 'new',
      recipe: { ...useAutomationsStore.getState().automations[0].recipe, name: 'Mi aviso' },
      isActive: true,
    });

    render(<AutomationsPage />);

    expect(screen.getByRole('status')).toHaveTextContent('"Mi aviso" quedó guardada y encendida.');
    expect(screen.getByText('Mi aviso')).toBeInTheDocument();
  });
});
