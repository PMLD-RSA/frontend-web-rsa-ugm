import { create } from "zustand";
import { Alert } from "@/types";

interface AlertState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;

  setAlerts: (alerts: Alert[]) => void;
  fetchAlerts: (status?: string, signal?: AbortSignal) => Promise<void>;
  addAlertFromWs: (alert: Alert) => void;
  resolveAlertFromWs: (alertId: number, resolvedAt: string) => void;
  resolveAlert: (alertId: number) => Promise<boolean>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,

  setAlerts: (alerts) => set({ alerts, error: null }),

  fetchAlerts: async (status, signal) => {
    set({ isLoading: true, error: null });
    try {
      const url = status ? `/api/alerts?status=${encodeURIComponent(status)}` : "/api/alerts";
      const response = await fetch(url, { signal });
      const result = await response.json();
      if (response.status === 401) throw new Error("Your session has expired. Please sign in again.");
      if (response.status === 403) throw new Error("This account cannot access alert data.");
      if (!response.ok || !result.success) throw new Error(result.message || "Could not load alerts.");
      if (result.source === "mock") throw new Error("Live data is unavailable because the backend could not be reached.");
      if (!Array.isArray(result.data)) throw new Error("The server returned an invalid alert list.");
      set({ alerts: result.data, error: null });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      set({ error: err instanceof Error ? err.message : "Could not load alerts.", alerts: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  addAlertFromWs: (newAlert) => {
    set((state) => {
      const exists = state.alerts.some((a) => a.id === newAlert.id);
      if (exists) {
        return {
          alerts: state.alerts.map((a) => (a.id === newAlert.id ? newAlert : a)),
        };
      }
      return {
        alerts: [newAlert, ...state.alerts],
      };
    });
  },

  resolveAlertFromWs: (alertId, resolvedAt) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, status: "resolved", resolvedAt } : a
      ),
    }));
  },

  resolveAlert: async (alertId) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: "PATCH",
      });
      const result = await response.json();
      if (response.ok && result.success && result.source !== "mock") {
        get().resolveAlertFromWs(alertId, new Date().toISOString());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));
