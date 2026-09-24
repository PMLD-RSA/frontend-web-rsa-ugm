// src/app/api/tanks/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const dummyTanks = [
    {
      id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      name: "Tangki Reservoir Utama",
      location: "Gedung A, Atap",
      heightCm: 300,
      radiusCm: 150,
      capacityLiters: 21205.75,
      minThresholdPercent: 30.00,
      maxThresholdPercent: 90.00,
      createdAt: "2024-03-01T10:00:00Z"
    },
    {
      id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
      name: "Tangki Cadangan B",
      location: "Gedung B, Basement",
      heightCm: 250,
      radiusCm: 100,
      capacityLiters: 7853.98,
      minThresholdPercent: 20.00,
      maxThresholdPercent: 85.00,
      createdAt: "2024-03-02T11:00:00Z"
    }
  ];

  return NextResponse.json({
    status: "success",
    data: dummyTanks
  });
}
