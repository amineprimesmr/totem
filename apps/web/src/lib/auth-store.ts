import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from './api';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser | null, token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined' && token) {
          localStorage.setItem('totem_token', token);
        }
        set({ user, token });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('totem_token');
        }
        set({ user: null, token: null });
      },
    }),
    { name: 'totem-auth' },
  ),
);
