/**
 * Tipe Data Resmi Frontend Web & BFF (SI-POTA RSA UGM)
 * Selaras 100% dengan skema Backend Core (Fastify + TimescaleDB)
 */

export type UserRole = "admin" | "operator" | "viewer";
export type AlertLevel = "WARNING" | "CRITICAL";
export type AlertStatus = "active" | "resolved";
export type GatewayStatus = "online" | "offline";
export type NodeStatus = "active" | "offline" | "error";
export type TankStatusCategory = "NORMAL" | "WARNING" | "CRITICAL";

/**
 * Standard Response Envelope dari Core Backend & BFF
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  source?: 'mock';
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Entitas Log Pembacaan Level Air Sensor (Hypertable)
 */
export interface WaterLevelReading {
  id: number;
  tankId: string;
  sensorNodeId?: string | null;
  levelPercent: string | number; // "72.40" atau 72.4
  volumeLiters: string | number; // "7240.00" atau 7240
  rawValue?: string | number | null;
  rssi?: number | null;
  recordedAt: string; // ISO 8601 UTC
}

/**
 * Entitas Peringatan (Alert)
 */
export interface Alert {
  id: number;
  tankId: string;
  tankName?: string;
  level: AlertLevel;
  message: string;
  status: AlertStatus;
  createdAt: string;
  resolvedAt?: string | null;
}

/**
 * Entitas Modul Sensor STM32
 */
export interface SensorNode {
  id: string;
  tankId?: string | null;
  gatewayId?: string | null;
  deviceCode: string;
  sensorType: string; // "ultrasonic"
  status: NodeStatus;
  lastRssi?: number | null;
  lastSeen?: string | null;
  createdAt?: string;
}

/**
 * Entitas Gateway Raspberry Pi
 */
export interface Gateway {
  id: string;
  deviceCode: string;
  status: GatewayStatus;
  lastHeartbeat?: string | null;
  createdAt?: string;
  nodes?: SensorNode[];
}

/**
 * Entitas Master Tangki Air
 */
export interface Tank {
  id: string;
  name: string;
  location?: string | null;
  capacityLiters: string | number; // e.g. "10000.00"
  minThresholdPercent: string | number; // e.g. "30.00"
  maxThresholdPercent: string | number; // e.g. "90.00"
  latitude?: string | null;
  longitude?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Computed & Joined Properties dari endpoint GET /api/tanks
  latestReading?: WaterLevelReading | null;
  activeAlert?: Alert | null;
  nodes?: SensorNode[];
}

/**
 * Entitas Pengguna Sistem
 */
export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

/**
 * Entitas Jejak Rekam Audit
 */
export interface AuditLog {
  id: number;
  userId?: string | null;
  username?: string | null;
  action: string; // "LOGIN" | "UPDATE_TANK" | "RESOLVE_ALERT"
  entity?: string | null;
  entityId?: string | null;
  detail?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

/**
 * Agregasi Histori 24 Jam Multi-Tangki
 */
export interface TankHourlyAggregation {
  timeBucket: string;
  tankId: string;
  tankName: string;
  avgLevel: number;
  avgVolume: number;
}

/**
 * Event Types WebSocket Realtime (ws://localhost:8000/ws)
 */
export type WebSocketEventType =
  | "CONNECTED"
  | "LEVEL_UPDATE"
  | "ALERT_TRIGGERED"
  | "ALERT_RESOLVED"
  | "NODE_STATUS";

export interface WsLevelUpdateData {
  tankId: string;
  tankName: string;
  levelPercent: number;
  volumeLiters: number;
  rssi?: number;
  recordedAt: string;
}

export interface WsAlertTriggeredData {
  id: number;
  tankId: string;
  tankName: string;
  level: AlertLevel;
  message: string;
  createdAt: string;
}

export interface WsAlertResolvedData {
  id: number;
  tankId: string;
  resolvedAt: string;
}

export interface WsNodeStatusData {
  nodeId: string;
  deviceCode: string;
  status: NodeStatus;
  lastRssi?: number;
  lastSeen: string;
}
