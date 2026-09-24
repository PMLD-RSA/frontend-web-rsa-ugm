// src/app/api/alerts/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const dummyAlerts = [
    {
      id: "alert-1234-5678",
      tankId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      tankName: "Tangki Reservoir Utama",
      severity: "critical",
      message: "Level air berada di bawah batas minimum (25%)",
      triggeredAt: new Date().toISOString(),
      resolvedAt: null,
      status: "active"
    }
  ];

  return NextResponse.json({
    status: "success",
    data: dummyAlerts,
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1
    }
  });
}
