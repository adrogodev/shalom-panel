import { create } from 'zustand';

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
  setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('shalom_access_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('shalom_refresh_token') : null,
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('shalom_user') || 'null') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('shalom_access_token') : false,

  setAuth: (accessToken: string, refreshToken: string, user: UserProfile) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shalom_access_token', accessToken);
      localStorage.setItem('shalom_refresh_token', refreshToken);
      localStorage.setItem('shalom_user', JSON.stringify(user));
    }
    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shalom_access_token');
      localStorage.removeItem('shalom_refresh_token');
      localStorage.removeItem('shalom_user');
    }
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
