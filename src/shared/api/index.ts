const isServer = typeof window === 'undefined';

export const API_BASE_URL = isServer
  ? process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró, vuelve a iniciar sesión.';
export const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';

/* -------------------------------------------------------------------------- */
/* Session storage                                                            */
/* -------------------------------------------------------------------------- */

export const SESSION_STORAGE_KEYS = {
  accessToken: 'shalom_access_token',
  refreshToken: 'shalom_refresh_token',
  user: 'shalom_user',
} as const;

export interface StoredSession<TUser = unknown> {
  accessToken: string | null;
  refreshToken: string | null;
  user: TUser | null;
}

type SessionListener = (session: StoredSession) => void;
const sessionListeners = new Set<SessionListener>();

function readUser(): unknown {
  try {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEYS.user) || 'null');
  } catch {
    return null;
  }
}

export function getStoredSession<TUser = unknown>(): StoredSession<TUser> {
  if (isServer) return { accessToken: null, refreshToken: null, user: null };
  return {
    accessToken: localStorage.getItem(SESSION_STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(SESSION_STORAGE_KEYS.refreshToken),
    user: readUser() as TUser | null,
  };
}

function notifySession() {
  const session = getStoredSession();
  sessionListeners.forEach((listener) => listener(session));
}

export function storeSession(accessToken: string, refreshToken: string, user: unknown): void {
  if (isServer) return;
  localStorage.setItem(SESSION_STORAGE_KEYS.accessToken, accessToken);
  localStorage.setItem(SESSION_STORAGE_KEYS.refreshToken, refreshToken);
  localStorage.setItem(SESSION_STORAGE_KEYS.user, JSON.stringify(user));
  notifySession();
}

export function clearStoredSession(): void {
  if (isServer) return;
  localStorage.removeItem(SESSION_STORAGE_KEYS.accessToken);
  localStorage.removeItem(SESSION_STORAGE_KEYS.refreshToken);
  localStorage.removeItem(SESSION_STORAGE_KEYS.user);
  notifySession();
}

/** Subscribes to session changes made by the API layer (refresh, expiry). */
export function subscribeSession(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

/* -------------------------------------------------------------------------- */
/* Token renewal                                                              */
/* -------------------------------------------------------------------------- */

let refreshInFlight: Promise<string | null> | null = null;

function buildUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

function isAuthEndpoint(endpoint: string): boolean {
  return /^\/?auth\/(login|refresh|logout)\b/.test(endpoint);
}

async function requestNewAccessToken(): Promise<string | null> {
  const { refreshToken } = getStoredSession();
  if (!refreshToken) return null;

  try {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      accessToken?: string;
      refreshToken?: string;
      user?: unknown;
    };
    if (!data?.accessToken || !data?.refreshToken) return null;

    storeSession(data.accessToken, data.refreshToken, data.user ?? getStoredSession().user);
    return data.accessToken;
  } catch {
    return null;
  }
}

/** Renews the access token; concurrent callers share the same request. */
function renewAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = requestNewAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function expireSession(): never {
  clearStoredSession();
  if (!isServer && window.location.pathname !== '/login') {
    window.location.assign('/login?expired=1');
  }
  throw new Error(SESSION_EXPIRED_MESSAGE);
}

function buildHeaders(options: RequestInit, token: string | null): Headers {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/**
 * Performs an authenticated request. On 401 it renews the session once and
 * retries the request once; if renewal fails the session is expired.
 */
async function authorizedFetch(endpoint: string, options: RequestInit): Promise<Response> {
  const url = buildUrl(endpoint);
  const callerHeaders = new Headers(options.headers || {});
  const callerSetsAuth = callerHeaders.has('Authorization');
  const token = !isServer && !callerSetsAuth ? getStoredSession().accessToken : null;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers: buildHeaders(options, token) });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  const canRenew = response.status === 401 && !!token && !isAuthEndpoint(endpoint);
  if (!canRenew) return response;

  const renewedToken = await renewAccessToken();
  if (!renewedToken) expireSession();

  try {
    response = await fetch(url, { ...options, headers: buildHeaders(options, renewedToken) });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }
  if (response.status === 401) expireSession();
  return response;
}

async function toError(response: Response): Promise<Error> {
  let errorData: any = null;
  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }
  const message = Array.isArray(errorData?.message)
    ? errorData.message.join('. ')
    : errorData?.message;
  return new Error(message || `Error HTTP ${response.status}`);
}

/* -------------------------------------------------------------------------- */
/* Public clients                                                             */
/* -------------------------------------------------------------------------- */

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await authorizedFetch(endpoint, options);

  if (!response.ok) {
    throw await toError(response);
  }

  return response.json();
}

function filenameFromDisposition(disposition: string | null): string | null {
  if (!disposition) return null;
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (encoded) return decodeURIComponent(encoded[1]);
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
}

/** Downloads a binary/text response with the same auth and renewal rules as apiClient. */
export async function apiDownload(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ blob: Blob; filename: string | null }> {
  const response = await authorizedFetch(endpoint, options);

  if (!response.ok) {
    throw await toError(response);
  }

  return {
    blob: await response.blob(),
    filename: filenameFromDisposition(response.headers.get('Content-Disposition')),
  };
}
