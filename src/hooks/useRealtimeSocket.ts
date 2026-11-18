"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useTankStore } from "@/stores/tankStore";
import { useAlertStore } from "@/stores/alertStore";
import { Alert, WsLevelUpdateData } from "@/types";

export function useRealtimeSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    let wsToken = token;
    if (!wsToken && typeof window !== "undefined") {
      wsToken = sessionStorage.getItem("ws_token");
    }

    if (!wsToken) {
      setIsConnected(false);
      return;
    }

    const baseWsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const wsUrl = `${baseWsUrl}${
      baseWsUrl.includes("?") ? "&" : "?"
    }token=${encodeURIComponent(wsToken)}`;

    let socket: WebSocket | null = null;
    let isDisposed = false;

    function connect() {
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
            console.warn("WebSocket ditolak oleh server (1008). Token tidak valid.");
            return;
          }

          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch (err) {
        console.warn("Gagal inisialisasi WebSocket:", err);
        if (!isDisposed) {
          reconnectTimeoutRef.current = setTimeout(connect, 4000);
        }
      }
    }

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [token]);

  return { isConnected };
}
