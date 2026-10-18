import { create } from 'zustand';
import { UserProfile } from '../types/game';
import { authService } from '../services/auth/authService';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  initAuth: () => Promise<void>;
  signUp: (username: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const current = await authService.getCurrentUser();
      set({ user: current, isLoading: false });
    } catch (err: unknown) {
      console.warn('Auth init failed:', err);
      set({ user: null, isLoading: false });
    }
  },

  signUp: async (username: string, password: string, displayName?: string) => {
    set({ isLoading: true, error: null });
    const res = await authService.signUp(username, password, displayName);
    if (res.user) {
      set({ user: res.user, isLoading: false, error: null });
      return { success: true };
    }
    set({ isLoading: false, error: res.error || 'Registration failed' });
    return { success: false, error: res.error };
  },

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    const res = await authService.login(username, password);
    if (res.user) {
      set({ user: res.user, isLoading: false, error: null });
      return { success: true };
    }
    set({ isLoading: false, error: res.error || 'Login failed' });
    return { success: false, error: res.error };
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, error: null });
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    try {
      const updated = await authService.updateProfile(updates);
      if (updated) {
        set({ user: updated });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
