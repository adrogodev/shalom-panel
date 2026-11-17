import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportsPage } from '../src/pages/reports';
import { API_BASE_URL } from '../src/shared/api';

describe('ReportsPage export', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('shalom_access_token', 'access-1');
    localStorage.setItem('shalom_refresh_token', 'refresh-1');
    window.URL.createObjectURL = vi.fn(() => 'blob:report');
    window.URL.revokeObjectURL = vi.fn();
    // jsdom does not implement navigation for anchor downloads.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('downloads the report from the API base URL with auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('"Numero Pedido"', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="reporte-ventas.csv"',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<ReportsPage />);
    fireEvent.click(screen.getAllByText('Descargar CSV')[0]);

    await waitFor(() => expect(screen.getByText(/descargado exitosamente/)).toBeInTheDocument());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/reports/export`);
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer access-1');
    expect(JSON.parse(init.body)).toMatchObject({ type: 'SALES', format: 'csv' });
  });

  it('shows a friendly Spanish error when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    render(<ReportsPage />);
    fireEvent.click(screen.getAllByText('Descargar CSV')[0]);

    expect(
      await screen.findByText('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/descargado exitosamente/)).not.toBeInTheDocument();
  });
});
