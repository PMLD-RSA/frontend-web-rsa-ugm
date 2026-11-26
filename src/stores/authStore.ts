import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  fetchMe: () => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  fetchMe: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("ws_token");
        }
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
        return;
      }
      const data = await res.json();
      if (data.success) {
        let activeToken: string | null = null;
        if (typeof window !== "undefined") {
          activeToken = sessionStorage.getItem("ws_token");
        }
        if (!activeToken) {
          const tokenRes = await fetch("/api/auth/token");
          const tokenData = await tokenRes.json();
          if (tokenData.success && tokenData.data?.token) {
            const fetchedToken = String(tokenData.data.token);
            activeToken = fetchedToken;
            if (typeof window !== "undefined") {
              sessionStorage.setItem("ws_token", fetchedToken);
            }
          }
        }
        set({ user: data.data, token: activeToken, isAuthenticated: true });
      } else {
        set({ user: null, token: null, isAuthenticated: false });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

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
        const token = data.data?.token || null;
        if (token && typeof window !== "undefined") {
          sessionStorage.setItem("ws_token", token);
        }
        set({
          user: data.data.user,
          token,
          isAuthenticated: true,
          error: null,
        });
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

  logout: async () => {
    set({ isLoading: true });
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ws_token");
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Lanjutkan reset state
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export const isAdmin = (user: User | null) => user?.role === "admin";
export const isOperator = (user: User | null) =>
  user?.role === "admin" || user?.role === "operator";
