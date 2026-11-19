import { create } from "zustand";
import { Tank, WsLevelUpdateData, Alert } from "@/types";

interface TankState {
  tanks: Tank[];
  isLoading: boolean;
  error: string | null;

  setTanks: (tanks: Tank[]) => void;
  fetchTanks: (signal?: AbortSignal) => Promise<void>;
  updateTankFromWs: (update: WsLevelUpdateData) => void;
  setTankActiveAlert: (tankId: string, alert: Alert | null) => void;
}

export const useTankStore = create<TankState>((set) => ({
  tanks: [],
  isLoading: false,
  error: null,

  setTanks: (tanks) => set({ tanks, error: null }),

  fetchTanks: async (signal) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/tanks", { signal });
      const result = await response.json();
      if (response.status === 401) throw new Error("Sesi login tidak valid. Silakan masuk kembali.");
      if (response.status === 403) throw new Error("Akun ini tidak memiliki akses ke data tangki.");
      if (!response.ok || !result.success) throw new Error(result.message || "Gagal memuat data tangki.");
      if (result.source === "mock") throw new Error("Backend tidak dapat dihubungi; data contoh tidak ditampilkan sebagai data realtime.");
      if (!Array.isArray(result.data)) throw new Error("Format daftar tangki dari backend tidak sesuai.");
      set({ tanks: result.data, error: null });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      set({ error: err instanceof Error ? err.message : "Data tangki tidak dapat dimuat.", tanks: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTankFromWs: (update) => {
    set((state) => ({
      tanks: state.tanks.map((tank) => {
        if (tank.id !== update.tankId) return tank;

        const currentReading = tank.latestReading;
        const newReading = {
          id: currentReading?.id ?? Date.now(),
          tankId: update.tankId,
          sensorNodeId: update.sensorNodeId ?? currentReading?.sensorNodeId ?? null,
          levelPercent: update.levelPercent,
          volumeLiters: update.volumeLiters,
          rawValue: update.rawValue ?? update.distanceCm ?? currentReading?.rawValue ?? null,
          distanceCm: update.distanceCm ?? currentReading?.distanceCm ?? null,
          rssi: update.rssi !== undefined ? update.rssi : currentReading?.rssi ?? null,
          recordedAt: update.recordedAt,
        };

        return {
          ...tank,
          latestReading: newReading,
        };
      }),
    }));
  },

  setTankActiveAlert: (tankId, alert) => {
    set((state) => ({
      tanks: state.tanks.map((tank) => {
        if (tank.id !== tankId) return tank;
        return {
          ...tank,
          activeAlert: alert,
        };
      }),
    }));
  },
}));
