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
    expect(screen.getByText('Pedidos Activos')).toBeInTheDocument();
    expect(screen.getByText('Clientes CRM')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp Chats')).toBeInTheDocument();
  });
});
