import { create } from "zustand";
import { api, User } from "@/lib/api";
import Cookies from "js-cookie";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  register: async (email, username, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.register(email, username, password);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Registration failed",
      });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.login(email, password);
      const user = await api.getProfile();
      set({ isLoading: false, user, isAuthenticated: true });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Login failed",
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
      set({ isLoading: false, user: null, isAuthenticated: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Logout failed",
      });
    }
  },

  getProfile: async () => {
    try {
      const token = Cookies.get("access_token");
      if (!token) {
        set({ isAuthenticated: false });
        return;
      }
      const user = await api.getProfile();
      set({ user, isAuthenticated: true });
    } catch (error: any) {
      set({ isAuthenticated: false, user: null });
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
    }
  },

  clearError: () => set({ error: null }),
}));
