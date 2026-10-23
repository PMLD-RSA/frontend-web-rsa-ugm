import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { forwardToBackend } from "@/lib/bffProxy";
import { MOCK_TANKS } from "@/lib/mockData";
import { WaterLevelReading } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const hours = url.searchParams.get("hours") || "24";
  const limit = url.searchParams.get("limit") || "50";

  const cookieStore = await cookies();
  const token =
    cookieStore.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Generate fallback 50 readings for this tank
  const targetTank = MOCK_TANKS.find((t) => t.id === id) || MOCK_TANKS[0];
  const basePercent = Number(targetTank.latestReading?.levelPercent || 75);
  const baseVolume = Number(targetTank.latestReading?.volumeLiters || 7500);

  const fallbackReadings: WaterLevelReading[] = [];
  const now = Date.now();
  for (let i = 0; i < Number(limit); i++) {
    fallbackReadings.push({
      id: 1000 + i,
      tankId: targetTank.id,
      sensorNodeId: targetTank.nodes?.[0]?.id || "node-sample",
      levelPercent: (basePercent + Math.sin(i / 5) * 4).toFixed(2),
      volumeLiters: (baseVolume + Math.sin(i / 5) * 400).toFixed(2),
      rssi: -70 - (i % 10),
      recordedAt: new Date(now - i * 15 * 60 * 1000).toISOString(),
    });
  }

  return forwardToBackend(`/api/tanks/${id}/readings?hours=${hours}&limit=${limit}`, {
    headers,
    fallbackData: fallbackReadings,
  });
}
