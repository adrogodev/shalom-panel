import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, apiDownload, API_BASE_URL, SESSION_EXPIRED_MESSAGE } from '../src/shared/api';

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const user = {
  id: 'u1',
  email: 'admin@shalom.local',
  firstName: 'Admin',
  lastName: 'Shalom',
  roles: ['Administrador'],
  permissions: [],
};

describe('apiClient session handling', () => {
  const assign = vi.fn();
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('shalom_access_token', 'old-access');
    localStorage.setItem('shalom_refresh_token', 'old-refresh');
    localStorage.setItem('shalom_user', JSON.stringify(user));
    assign.mockReset();
    vi.stubGlobal('location', { ...window.location, assign, pathname: '/orders', search: '' });
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the previous success path: sends the bearer token and returns the JSON body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await apiClient<{ ok: boolean }>('/orders');

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/orders`);
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer old-access');
  });

  it('keeps the previous error path: throws the server message for non-401 errors', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { message: 'Datos inválidos' }));

    await expect(apiClient('/orders')).rejects.toThrow('Datos inválidos');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('on 401 renews the session with the refresh token and retries the request once', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'new-access', refreshToken: 'new-refresh', user }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { items: [1] }));

    const result = await apiClient<{ items: number[] }>('/orders');

    expect(result).toEqual({ items: [1] });
    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1];
    expect(refreshUrl).toBe(`${API_BASE_URL}/auth/refresh`);
    expect(refreshInit.method).toBe('POST');
    expect(JSON.parse(refreshInit.body)).toEqual({ refreshToken: 'old-refresh' });
    expect(new Headers(fetchMock.mock.calls[2][1].headers).get('Authorization')).toBe('Bearer new-access');
    expect(localStorage.getItem('shalom_access_token')).toBe('new-access');
    expect(localStorage.getItem('shalom_refresh_token')).toBe('new-refresh');
    expect(assign).not.toHaveBeenCalled();
  });

  it('when renewal fails clears the session and redirects to /login?expired=1', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Token de actualización expirado' }));

    await expect(apiClient('/orders')).rejects.toThrow(SESSION_EXPIRED_MESSAGE);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('shalom_access_token')).toBeNull();
    expect(localStorage.getItem('shalom_refresh_token')).toBeNull();
    expect(localStorage.getItem('shalom_user')).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login?expired=1');
  });

  it('never loops: a 401 on the retried request expires the session without a second refresh', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, {}))
      .mockResolvedValueOnce(jsonResponse(200, { accessToken: 'a2', refreshToken: 'r2', user }))
      .mockResolvedValueOnce(jsonResponse(401, {}));

    await expect(apiClient('/orders')).rejects.toThrow(SESSION_EXPIRED_MESSAGE);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(assign).toHaveBeenCalledWith('/login?expired=1');
  });

  it('concurrent 401s share a single refresh request', async () => {
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) {
        await refreshGate;
        return jsonResponse(200, { accessToken: 'new-access', refreshToken: 'new-refresh', user });
      }
      const auth = new Headers(init.headers).get('Authorization');
      return auth === 'Bearer new-access' ? jsonResponse(200, { url }) : jsonResponse(401, {});
    });

    const pending = Promise.all([apiClient('/orders'), apiClient('/products'), apiClient('/customers')]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    releaseRefresh();
    const results = await pending;

    expect(results).toHaveLength(3);
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('a 401 on login is reported as an error without trying to refresh (previous login behavior)', async () => {
    localStorage.clear();
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Credenciales inválidas' }));

    await expect(
      apiClient('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'a@b.co', password: 'x' }) }),
    ).rejects.toThrow('Credenciales inválidas');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });
});

describe('apiDownload', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('shalom_access_token', 'old-access');
    localStorage.setItem('shalom_refresh_token', 'old-refresh');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the API base URL with auth and returns the blob and server filename', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response('"a","b"', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="reporte-ventas.csv"',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiDownload('/reports/export', {
      method: 'POST',
      body: JSON.stringify({ type: 'SALES', format: 'csv' }),
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/reports/export`);
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer old-access');
    expect(result.filename).toBe('reporte-ventas.csv');
    expect(result.blob.size).toBe('"a","b"'.length);
  });
});
