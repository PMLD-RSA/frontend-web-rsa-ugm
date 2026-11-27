import type { NodeStatus, SensorNode, Tank, WaterLevelReading } from "@/types";

const configuredTimeout = Number(process.env.NEXT_PUBLIC_DEVICE_TIMEOUT_SECONDS);
const timeoutMs = (Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 120) * 1000;
const clockSkewToleranceMs = 5_000;

export function hasRecentContact(timestamp: string | null | undefined, now: number) {
  if (!timestamp) return false;
  const age = now - Date.parse(timestamp);
  return age >= -clockSkewToleranceMs && age < timeoutMs;
}
export function isNewerContact(candidate: string, current?: string | null) {
  const candidateTime = Date.parse(candidate);
  const currentTime = Date.parse(current ?? "");
  return Number.isFinite(candidateTime) && (!Number.isFinite(currentTime) || candidateTime > currentTime);
}

export function mergeSensorStatus(node: SensorNode, update: SensorStatusUpdate | undefined): SensorNode {
  if (!update || (update.tankId && update.tankId !== node.tankId) ||
      !isNewerContact(update.lastSeen, node.lastSeen)) return node;
  return {
    ...node,
    status: update.status,
    lastSeen: update.lastSeen,
    lastRssi: update.rssi ?? node.lastRssi,
  };
}

export function getSensorPresence(
  node: SensorNode,
  reading: SensorContact | undefined,
  now: number,
) {
  const status = String(node.status ?? "").trim().toLowerCase();
  // A newer reading from this exact sensor can arrive before its status is updated.
  const recentReading =
    reading?.sensorNodeId === node.id &&
    reading.tankId === node.tankId &&
    hasRecentContact(reading.recordedAt, now) &&
    isNewerContact(reading.recordedAt, node.lastSeen)
      ? reading
      : undefined;
  const online = status !== "error" && (
    Boolean(recentReading) ||
    ((status === "active" || status === "online") && hasRecentContact(node.lastSeen, now))
  );
  return {
    online,
    label: status === "error" ? "Error" : online ? "Online" : "Offline",
    lastSeen: recentReading?.recordedAt ?? node.lastSeen,
    rssi: recentReading?.rssi ?? node.lastRssi,
  };
}
export type SensorContact = Pick<WaterLevelReading, "tankId" | "sensorNodeId" | "recordedAt" | "rssi">;
export type SensorStatusUpdate = {
  identifier: string;
  tankId?: string;
  status: NodeStatus;
  lastSeen: string;
  rssi?: number;
};
export type SensorRealtimeEvent =
  | { type: "reading"; data: SensorContact }
  | { type: "status"; data: SensorStatusUpdate };

export const sensorRealtimeEvent = "sensor-realtime-update";

export function getTankMonitoring(tank: Tank, now: number) {
  const reading = tank.latestReading;
  const nodes = tank.nodes ?? [];
  const onlineNodes = nodes.filter(node => getSensorPresence(node, reading ?? undefined, now).online);
  const liveReading = reading &&
    hasRecentContact(reading.recordedAt, now) &&
    onlineNodes.some(node =>
      reading.sensorNodeId === node.id && reading.tankId === tank.id,
    )
      ? reading
      : null;

  const sensorLabel = liveReading ? "Sensor online"
    : onlineNodes.length ? "Sensor online · No recent reading"
    : !nodes.length ? "No sensor registered"
    : nodes.some(node => node.status === "error") ? "Sensor error"
    : "Sensor offline";

  return { liveReading, sensorLabel, online: onlineNodes.length > 0 };
}

