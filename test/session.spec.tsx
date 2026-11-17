import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';

// Modules are re-imported per test (cold imports of the widgets are slow).
vi.setConfig({ testTimeout: 60_000 });

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

const user = {
  id: 'u1',
  email: 'admin@shalom.local',
  firstName: 'Mariana',
  lastName: 'Lopez',
  roles: ['Administrador'],
  permissions: [],
};

function seedSession() {
  localStorage.setItem('shalom_access_token', 'access-1');
  localStorage.setItem('shalom_refresh_token', 'refresh-1');
  localStorage.setItem('shalom_user', JSON.stringify(user));
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  localStorage.clear();
  navigation.push.mockReset();
  navigation.replace.mockReset();
  window.history.pushState({}, '', '/');
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Header logout', () => {
  it('revokes the refresh token on the server, clears the session and redirects to /login', async () => {
    seedSession();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true }));
    vi.stubGlobal('fetch', fetchMock);
    const { Header } = await import('../src/widgets/header');
    const { useAuthStore } = await import('../src/features/authentication');

    render(<Header />);
    fireEvent.click(await screen.findByTitle('Cerrar sesión'));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/login'));
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/auth\/logout$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ refreshToken: 'refresh-1' });
    expect(localStorage.getItem('shalom_access_token')).toBeNull();
    expect(localStorage.getItem('shalom_refresh_token')).toBeNull();
    expect(localStorage.getItem('shalom_user')).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('still clears the session and redirects when the server call fails', async () => {
    seedSession();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const { Header } = await import('../src/widgets/header');

    render(<Header />);
    fireEvent.click(await screen.findByTitle('Cerrar sesión'));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/login'));
    expect(localStorage.getItem('shalom_access_token')).toBeNull();
    expect(localStorage.getItem('shalom_refresh_token')).toBeNull();
  });
});

describe('Header hydration', () => {
  it('server markup does not depend on browser storage; the user appears after mount', async () => {
    seedSession();
    const { Header } = await import('../src/widgets/header');

    const serverMarkup = renderToString(<Header />);
    expect(serverMarkup).not.toContain('Mariana');

    render(<Header />);
    expect(await screen.findByText('Mariana Lopez')).toBeInTheDocument();
  });
});

describe('Route protection', () => {
  it('admin layout redirects to /login when there is no session', async () => {
    const { AdminLayout } = await import('../src/widgets/layout');

    render(
      <AdminLayout>
        <p>contenido</p>
      </AdminLayout>,
    );

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/login'));
  });

  it('admin layout does not redirect when a session exists', async () => {
    seedSession();
    const { AdminLayout } = await import('../src/widgets/layout');

    render(
      <AdminLayout>
        <p>contenido</p>
      </AdminLayout>,
    );

    expect(await screen.findByText('contenido')).toBeInTheDocument();
    await act(async () => {});
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('login page redirects to / when already logged in', async () => {
    seedSession();
    const { LoginPage } = await import('../src/pages/login');

    render(<LoginPage />);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/'));
  });

  it('login page shows the expired-session message when expired=1', async () => {
    window.history.pushState({}, '', '/login?expired=1');
    const { LoginPage } = await import('../src/pages/login');

    render(<LoginPage />);

    expect(await screen.findByText('Tu sesión expiró, vuelve a iniciar sesión.')).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('login page without expired=1 shows no expired message (previous behavior)', async () => {
    const { LoginPage } = await import('../src/pages/login');

    render(<LoginPage />);

    expect(await screen.findByText('Ingresar a SHALOM')).toBeInTheDocument();
    expect(screen.queryByText('Tu sesión expiró, vuelve a iniciar sesión.')).not.toBeInTheDocument();
  });
});

describe('Login flow (previous behavior)', () => {
  it('stores access token, refresh token and user, then calls onSuccess', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, { accessToken: 'a-1', refreshToken: 'r-1', user }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { LoginForm, useAuthStore } = await import('../src/features/authentication');
    const onSuccess = vi.fn();

    render(<LoginForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText('admin@shalom.local'), { target: { value: 'admin@shalom.local' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secreto123' } });
    fireEvent.click(screen.getByText('Ingresar a SHALOM'));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/auth\/login$/);
    expect(localStorage.getItem('shalom_access_token')).toBe('a-1');
    expect(localStorage.getItem('shalom_refresh_token')).toBe('r-1');
    expect(useAuthStore.getState().user?.email).toBe('admin@shalom.local');
  });
});
