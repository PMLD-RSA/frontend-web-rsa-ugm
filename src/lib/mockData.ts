import { Tank, Alert, Gateway, SensorNode, User, AuditLog, TankHourlyAggregation } from "@/types";

export const MOCK_GATEWAY: Gateway = {
  id: "11111111-2222-3333-4444-555555555555",
  deviceCode: "GW-HUB-01",
  status: "online",
  lastHeartbeat: new Date().toISOString(),
  nodes: [
    {
      id: "c4d18723-5e72-46fa-b12e-188998abcf12",
      tankId: "e0a7e584-6091-4560-b6aa-cf4a852875a1",
      gatewayId: "11111111-2222-3333-4444-555555555555",
      deviceCode: "STM32-ATA",
      sensorType: "ultrasonic",
      status: "active",
      lastRssi: -72,
      lastSeen: new Date().toISOString(),
    },
    {
      id: "d5e29834-6f83-57ab-c23f-299009bcde23",
      tankId: "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      gatewayId: "11111111-2222-3333-4444-555555555555",
      deviceCode: "STM32-GED",
      sensorType: "ultrasonic",
      status: "active",
      lastRssi: -84,
      lastSeen: new Date().toISOString(),
    },
    {
      id: "e6f30945-7a94-68bc-d34a-300110cdef34",
      tankId: "c2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      gatewayId: "11111111-2222-3333-4444-555555555555",
      deviceCode: "STM32-BED",
      sensorType: "ultrasonic",
      status: "active",
      lastRssi: -68,
      lastSeen: new Date().toISOString(),
    },
  ],
};

export const MOCK_NODES: SensorNode[] = MOCK_GATEWAY.nodes || [];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 101,
    tankId: "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    tankName: "Tangki Gedung Rawat Inap",
    level: "WARNING",
    message: "Level air mendekati ambang batas: 42.0% (Ambang batas minimum 30.0%)",
    status: "active",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    resolvedAt: null,
  },
  {
    id: 98,
    tankId: "e0a7e584-6091-4560-b6aa-cf4a852875a1",
    tankName: "Tangki Atap Gedung Utama",
    level: "CRITICAL",
    message: "Level air kritis: 28.5% (di bawah batas 30.0%)",
    status: "resolved",
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
];

export const MOCK_TANKS: Tank[] = [
  {
    id: "e0a7e584-6091-4560-b6aa-cf4a852875a1",
    name: "Tangki Atap Gedung Utama",
    location: "Atap Gedung A (Utama), Lantai 5",
    capacityLiters: "10000.00",
    minThresholdPercent: "30.00",
    maxThresholdPercent: "90.00",
    latitude: "-7.7428450",
    longitude: "110.3511200",
    createdAt: "2026-09-14T06:02:15.123Z",
    updatedAt: "2026-09-14T06:02:15.123Z",
    latestReading: {
      id: 14205,
      tankId: "e0a7e584-6091-4560-b6aa-cf4a852875a1",
      sensorNodeId: "c4d18723-5e72-46fa-b12e-188998abcf12",
      levelPercent: "76.40",
      volumeLiters: "7640.00",
      rssi: -72,
      recordedAt: new Date().toISOString(),
    },
    activeAlert: null,
    nodes: [MOCK_NODES[0]],
  },
  {
    id: "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    name: "Tangki Gedung Rawat Inap",
    location: "Atap Gedung B (Rawat Inap), Lantai 4",
    capacityLiters: "8000.00",
    minThresholdPercent: "30.00",
    maxThresholdPercent: "90.00",
    latitude: "-7.7431200",
    longitude: "110.3515400",
    createdAt: "2026-09-15T08:14:00.000Z",
    updatedAt: "2026-09-15T08:14:00.000Z",
    latestReading: {
      id: 14206,
      tankId: "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      sensorNodeId: "d5e29834-6f83-57ab-c23f-299009bcde23",
      levelPercent: "42.00",
      volumeLiters: "3360.00",
      rssi: -84,
      recordedAt: new Date().toISOString(),
    },
    activeAlert: MOCK_ALERTS[0],
    nodes: [MOCK_NODES[1]],
  },
  {
    id: "c2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    name: "Tangki Instalasi Bedah Sentral",
    location: "Gedung Bedah Lantai 4",
    capacityLiters: "5000.00",
    minThresholdPercent: "35.00",
    maxThresholdPercent: "95.00",
    latitude: "-7.7425100",
    longitude: "110.3518900",
    createdAt: "2026-09-16T09:30:00.000Z",
    updatedAt: "2026-09-16T09:30:00.000Z",
    latestReading: {
      id: 14207,
      tankId: "c2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      sensorNodeId: "e6f30945-7a94-68bc-d34a-300110cdef34",
      levelPercent: "88.20",
      volumeLiters: "4410.00",
      rssi: -68,
      recordedAt: new Date().toISOString(),
    },
    activeAlert: null,
    nodes: [MOCK_NODES[2]],
  },
];

export const MOCK_USERS: User[] = [
  {
    id: "7b89f5c2-3e21-4f90-a548-d3c267b14002",
    username: "admin",
    role: "admin",
    isActive: true,
    createdAt: "2026-09-14T06:00:00.000Z",
  },
  {
    id: "8c90a6d3-4f32-5a01-b659-e4d378c25113",
    username: "operator01",
    role: "operator",
    isActive: true,
    createdAt: "2026-09-15T07:00:00.000Z",
  },
  {
    id: "9d01b7e4-5a43-6b12-c760-f5e489d36224",
    username: "viewer_medis",
    role: "viewer",
    isActive: true,
    createdAt: "2026-09-16T08:00:00.000Z",
  },
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    userId: "7b89f5c2-3e21-4f90-a548-d3c267b14002",
    username: "admin",
    action: "LOGIN",
    entity: "users",
    entityId: "7b89f5c2-3e21-4f90-a548-d3c267b14002",
    detail: "Pengguna admin berhasil masuk dari ruang pengawas",
    ipAddress: "192.168.1.10",
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    userId: "8c90a6d3-4f32-5a01-b659-e4d378c25113",
    username: "operator01",
    action: "RESOLVE_ALERT",
    entity: "alerts",
    entityId: "98",
    detail: "Operator menyelesaikan peringatan kritis Tangki Atap Gedung Utama",
    ipAddress: "192.168.1.45",
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    userId: "7b89f5c2-3e21-4f90-a548-d3c267b14002",
    username: "admin",
    action: "UPDATE_TANK",
    entity: "tanks",
    entityId: "c2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
    detail: "Admin menyetel threshold Tangki Bedah ke 35% min / 95% max",
    ipAddress: "192.168.1.10",
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
  },
];

/**
 * Generate 24 jam histori agregasi per jam untuk Recharts
 */
export function getMock24HourAggregation(): TankHourlyAggregation[] {
  const result: TankHourlyAggregation[] = [];
  const now = Date.now();

  for (let i = 23; i >= 0; i--) {
    const timeBucket = new Date(now - i * 60 * 60 * 1000).toISOString();
    
    // Tangki 1: Gedung Utama (~70% - 85%)
    result.push({
      timeBucket,
      tankId: "e0a7e584-6091-4560-b6aa-cf4a852875a1",
      tankName: "Tangki Atap Gedung Utama",
      avgLevel: Math.round(75 + Math.sin(i / 3) * 8),
      avgVolume: Math.round(7500 + Math.sin(i / 3) * 800),
    });

    // Tangki 2: Rawat Inap (~40% - 55%)
    result.push({
      timeBucket,
      tankId: "b1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      tankName: "Tangki Gedung Rawat Inap",
      avgLevel: Math.round(45 + Math.cos(i / 4) * 10),
      avgVolume: Math.round(3600 + Math.cos(i / 4) * 800),
    });

    // Tangki 3: Bedah (~80% - 92%)
    result.push({
      timeBucket,
      tankId: "c2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      tankName: "Tangki Instalasi Bedah Sentral",
      avgLevel: Math.round(85 + Math.sin(i / 2) * 5),
      avgVolume: Math.round(4250 + Math.sin(i / 2) * 250),
    });
  }

  return result;
}
