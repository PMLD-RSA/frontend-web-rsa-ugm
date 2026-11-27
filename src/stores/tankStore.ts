import { create } from "zustand";
import type { Tank, WsLevelUpdateData, Alert, NodeStatus } from "@/types";
import { isNewerContact } from "@/lib/devicePresence";

let latestFetch = 0;

function mergeTankSnapshot(snapshot: Tank, current?: Tank): Tank {
  if (!current) return snapshot;
  const reading = current.latestReading;
  const keepReading = reading && isNewerContact(reading.recordedAt, snapshot.latestReading?.recordedAt);
  return {
    ...snapshot,
    latestReading: keepReading ? reading : snapshot.latestReading,
    nodes: snapshot.nodes?.map(node => {
      const live = current.nodes?.find(candidate => candidate.id === node.id);
      return live?.lastSeen && isNewerContact(live.lastSeen, node.lastSeen)
        ? { ...node, status: live.status, lastSeen: live.lastSeen, lastRssi: live.lastRssi }
        : node;
    }),
  };
}

interface WsNodeStatusUpdate {
  nodeCode?: string;
  tankId?: string;
  status?: NodeStatus;
  rssi?: number | null;
  lastSeen?: string;
}

interface TankState {
  tanks: Tank[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;

  setTanks: (tanks: Tank[]) => void;
  fetchTanks: (signal?: AbortSignal, background?: boolean) => Promise<void>;
  updateTankFromWs: (update: WsLevelUpdateData) => void;
  updateNodeStatusFromWs: (update: WsNodeStatusUpdate) => void;
  setTankActiveAlert: (tankId: string, alert: Alert | null) => void;
}

export const useTankStore = create<TankState>((set, get) => ({
  tanks: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  setTanks: (tanks) => set({ tanks, error: null }),

  fetchTanks: async (signal, background = false) => {
    if (signal?.aborted || (background && get().isLoading)) return;
    const fetchId = ++latestFetch;
    if (!background) set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/tanks", { signal, cache: "no-store" });
      const result = await response.json();
      if (response.status === 401) throw new Error("Your session has expired. Please sign in again.");
      if (response.status === 403) throw new Error("This account cannot access tank data.");
      if (!response.ok || !result.success) throw new Error(result.message || "Could not load tank data.");
      if (result.source === "mock") throw new Error("Live data is unavailable because the backend could not be reached.");
      if (!Array.isArray(result.data)) throw new Error("The server returned an invalid tank list.");
      if (signal?.aborted || fetchId !== latestFetch) return;
      const snapshots: Tank[] = result.data;
      set(state => {
        const current = new Map(state.tanks.map(tank => [tank.id, tank]));
        return {
          tanks: snapshots.map(tank => mergeTankSnapshot(tank, current.get(tank.id))),
          lastFetchedAt: Date.now(),
          error: null,
        };
      });
    } catch (err: unknown) {
      if (signal?.aborted || fetchId !== latestFetch || (background && get().lastFetchedAt !== null)) return;
      set({ error: err instanceof Error ? err.message : "Could not load tank data.", tanks: [], lastFetchedAt: null });
    } finally {
      if (!background && fetchId === latestFetch) set({ isLoading: false });
    }
  },

  updateTankFromWs: (update) => {
    if (update.isBuffered) return;
    set((state) => ({
      tanks: state.tanks.map((tank) => {
        if (tank.id !== update.tankId) return tank;

        const currentReading = tank.latestReading;
        if (!isNewerContact(update.recordedAt, currentReading?.recordedAt)) return tank;
        const newReading = {
          id: currentReading?.id ?? Date.now(),
          tankId: update.tankId,
          sensorNodeId: update.sensorNodeId ?? null,
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

  updateNodeStatusFromWs: (update) => {
    if (!update.status) return;
    set((state) => ({
      tanks: state.tanks.map((tank) => {
        if (!tank.nodes?.length) return tank;
        if (update.tankId && tank.id !== update.tankId) return tank;
        let changed = false;

        const updatedNodes = tank.nodes.map((node) => {
          const matchesNode = Boolean(
            update.nodeCode &&
              (node.id.toLowerCase() === update.nodeCode.toLowerCase() ||
                node.deviceCode.toLowerCase() === update.nodeCode.toLowerCase())
          );
          const matches = update.nodeCode ? matchesNode : Boolean(update.tankId && tank.nodes?.length === 1);
          if (!matches || (update.lastSeen && !isNewerContact(update.lastSeen, node.lastSeen))) return node;
          changed = true;
          return {
            ...node,
            status: update.status ?? node.status,
            lastRssi: update.rssi !== undefined ? update.rssi : node.lastRssi,
            lastSeen: update.lastSeen ?? node.lastSeen,
          };
        });

        return changed ? { ...tank, nodes: updatedNodes } : tank;
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
