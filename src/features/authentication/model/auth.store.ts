import { create } from 'zustand';
import {
  apiClient,
  clearStoredSession,
  getStoredSession,
  storeSession,
  subscribeSession,
} from '@/shared/api';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  /** True once the store has been loaded from browser storage on the client. */
  hydrated: boolean;
  hydrate: () => void;
  setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => void;
  clearAuth: () => void;
}

function fromStorage() {
  const session = getStoredSession<UserProfile>();
  return {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    user: session.user,
    isAuthenticated: !!session.accessToken,
  };
}

/**
 * The initial state is always empty so server and first client render match;
 * components call `hydrate()` after mount to load the stored session.
 */
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  hydrated: false,

  hydrate: () => {
    set({ ...fromStorage(), hydrated: true });
  },

  setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => {
    storeSession(accessToken, refreshToken, user);
    set({ accessToken, refreshToken, user, isAuthenticated: true, hydrated: true });
  },

  clearAuth: () => {
    clearStoredSession();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      hydrated: true,
    });
  },
}));

// Keep the store in sync when the API layer renews or expires the session.
if (typeof window !== 'undefined') {
  subscribeSession(() => {
    if (useAuthStore.getState().hydrated) {
      useAuthStore.setState(fromStorage());
    }
  });
}

/**
 * Ends the session: revokes the refresh token on the server (best effort),
 * then clears the local session. Server data is never touched.
 */
export async function logout(): Promise<void> {
  const { refreshToken } = getStoredSession();
  if (refreshToken) {
    try {
      await apiClient<{ success: boolean }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Logout must succeed locally even if the server is unreachable.
    }
  }
  useAuthStore.getState().clearAuth();
}
