import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomePage } from '../src/pages/home';

describe('HomePage', () => {
  it('debe renderizar el título principal de SHALOM', () => {
    render(<HomePage />);
    expect(screen.getByText('SHALOM — Panel de Control')).toBeInTheDocument();
  });

  it('debe mostrar las 4 métricas base de la plataforma', () => {
    render(<HomePage />);
    expect(screen.getByText('Ventas Reconocidas')).toBeInTheDocument();
    expect(screen.getAllByText('Pedidos Activos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Clientes CRM').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('WhatsApp Chats').length).toBeGreaterThanOrEqual(1);
  });
});
