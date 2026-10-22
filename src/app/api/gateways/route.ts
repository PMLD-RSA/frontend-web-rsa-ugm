// src/app/api/gateways/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const dummyGateways = [
    {
      id: "gw-001",
      deviceCode: "GW-LORA-01",
      location: "Atap RS",
      status: "online",
      lastHeartbeat: new Date().toISOString(),
      createdAt: "2024-03-01T10:00:00Z"
    }
  ];

  return NextResponse.json({
    status: "success",
    data: dummyGateways
  });
}
