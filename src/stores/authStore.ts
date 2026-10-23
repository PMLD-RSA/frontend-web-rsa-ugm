import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMe: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Restore sesi dari cookie yang sudah ada.
   * Dipanggil di (dashboard)/layout.tsx saat mount.
   */
  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        set({ user: data.data, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Login dengan username + password.
   * Mengembalikan true jika berhasil, false jika gagal.
   */
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        set({ user: data.data.user, isAuthenticated: true, error: null });
        return true;
      } else {
        set({ error: data.message || "Login gagal." });
        return false;
      }
    } catch {
      set({ error: "Gagal terhubung ke server." });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Logout: hapus cookie via BFF, reset state.
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Tetap lanjutkan logout di sisi client meski request gagal
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));

// Helper: cek apakah user adalah admin
export const isAdmin = (user: User | null) => user?.role === "admin";

// Helper: cek apakah user adalah admin atau operator
export const isOperator = (user: User | null) =>
  user?.role === "admin" || user?.role === "operator";
