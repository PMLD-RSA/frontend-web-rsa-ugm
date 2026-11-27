"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useTankStore } from "@/stores/tankStore";
import { useAlertStore } from "@/stores/alertStore";
import type { Alert, NodeStatus, WsLevelUpdateData } from "@/types";
import { sensorRealtimeEvent, type SensorRealtimeEvent } from "@/lib/devicePresence";

function publishSensorUpdate(update: SensorRealtimeEvent) {
  window.dispatchEvent(new CustomEvent(sensorRealtimeEvent, { detail: update }));
}

export function useRealtimeSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isDisposed = false;
    const tokenController = new AbortController();

    async function resolveToken(): Promise<string | null> {
      if (token) return token;
      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem("ws_token");
        if (cached) return cached;
      }
      try {
        const res = await fetch("/api/auth/token", { signal: tokenController.signal });
        if (!res.ok) return null;
        const json = await res.json();
        const fetched = json?.data?.token;
        if (typeof fetched === "string" && fetched) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("ws_token", fetched);
          }
          return fetched;
        }
      } catch {
        // ignore abort or network error
      }
      return null;
    }

    function connect(wsUrl: string) {
      if (isDisposed) return;

      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          if (isDisposed) {
            socket?.close();
            return;
          }
          setIsConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            const eventType = payload.type || payload.event;
            const data = payload.data || {};

            if (eventType === "LEVEL_UPDATE" && (data.tank_id || data.tankId)) {
              const tankId = data.tank_id || data.tankId;
              const update: WsLevelUpdateData = {
                tankId,
                sensorNodeId: data.sensor_node_id || data.sensorNodeId,
                tankName: data.tank_name || data.tankName,
                levelPercent: Number(data.level_percent ?? data.levelPercent ?? 0),
                volumeLiters: Number(data.volume_liters ?? data.volumeLiters ?? 0),
                rawValue:
                  data.raw_value != null
                    ? Number(data.raw_value)
                    : data.distance_cm != null
                    ? Number(data.distance_cm)
                    : undefined,
                distanceCm:
                  data.distance_cm != null ? Number(data.distance_cm) : undefined,
                rssi: data.rssi != null ? Number(data.rssi) : undefined,
                sequence: data.sequence != null ? Number(data.sequence) : undefined,
                isBuffered: Boolean(data.is_buffered ?? data.isBuffered),
                recordedAt: data.timestamp || data.recordedAt || new Date().toISOString(),
              };

              useTankStore.getState().updateTankFromWs(update);
              if (update.sensorNodeId && !update.isBuffered && (data.timestamp || data.recordedAt)) {
                publishSensorUpdate({ type: "reading", data: update });
              }
            }

            const nodeIdentifier = data.sensor_node_id || data.sensorNodeId || data.node_code || data.nodeCode;
            if (eventType === "NODE_STATUS" && (nodeIdentifier || data.tank_id || data.tankId)) {
              const rawStatus = String(data.status || "").trim().toLowerCase();
              const normalizedStatus: NodeStatus | undefined =
                rawStatus === "online" || rawStatus === "active"
                  ? "active"
                  : rawStatus === "offline" || rawStatus === "inactive"
                  ? "offline"
                  : rawStatus === "error"
                  ? "error"
                  : undefined;
              const update = {
                nodeCode: nodeIdentifier,
                tankId: data.tank_id || data.tankId,
                status: normalizedStatus,
                rssi: data.rssi != null ? Number(data.rssi) : undefined,
                lastSeen: data.last_seen || data.lastSeen || data.timestamp || new Date().toISOString(),
              };
              useTankStore.getState().updateNodeStatusFromWs(update);
              if (nodeIdentifier && normalizedStatus) {
                publishSensorUpdate({
                  type: "status",
                  data: { ...update, identifier: nodeIdentifier, status: normalizedStatus },
                });
              }
            }

            if (eventType === "ALERT_TRIGGERED" && data.id) {
              const alert: Alert = {
                id: data.id,
                tankId: data.tankId || data.tank_id,
                tankName: data.tankName || data.tank_name,
                level: data.level,
                message: data.message,
                status: "active",
                createdAt: data.createdAt || data.timestamp || new Date().toISOString(),
              };

              useAlertStore.getState().addAlertFromWs(alert);
              useTankStore.getState().setTankActiveAlert(alert.tankId, alert);
            }

            if (eventType === "ALERT_RESOLVED" && data.id) {
              const alertId = data.id;
              const resolvedAt =
                data.resolvedAt || payload.timestamp || new Date().toISOString();

              useAlertStore.getState().resolveAlertFromWs(alertId, resolvedAt);
              const tankId = data.tankId || data.tank_id;
              if (tankId) {
                useTankStore.getState().setTankActiveAlert(tankId, null);
              }
            }
          } catch (err) {
            console.warn("Gagal parse payload realtime WebSocket:", err);
          }
        };

        socket.onclose = (event) => {
          setIsConnected(false);
          if (isDisposed) return;

          // Jangan reconnect jika ditolak karena policy violation (token invalid/expired)
          if (event.code === 1008) {
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("ws_token");
            }
            console.warn("WebSocket ditolak oleh server (1008). Token tidak valid.");
            return;
          }

          reconnectTimeoutRef.current = setTimeout(() => connect(wsUrl), 3000);
        };

        socket.onerror = () => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
          }
        };
      } catch (err) {
        console.warn("Gagal inisialisasi WebSocket:", err);
        if (!isDisposed) {
          reconnectTimeoutRef.current = setTimeout(() => connect(wsUrl), 4000);
        }
      }
    }

    void resolveToken().then((wsToken) => {
      if (isDisposed || !wsToken) return;
      const baseWsUrl =
        process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
      const wsUrl = `${baseWsUrl}${
        baseWsUrl.includes("?") ? "&" : "?"
      }token=${encodeURIComponent(wsToken)}`;
      connect(wsUrl);
    });

    return () => {
      isDisposed = true;
      tokenController.abort();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [token]);

  return { isConnected };
}
