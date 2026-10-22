import { NextRequest } from "next/server";
import { forwardToBackend } from "@/lib/bffProxy";
import { getMock24HourAggregation } from "@/lib/mockData";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const hours = url.searchParams.get("hours") || "24";

  const cookieStore = await cookies();
  const token =
    cookieStore.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return forwardToBackend(`/api/readings/history?hours=${hours}`, {
    headers,
    fallbackData: getMock24HourAggregation(),
  });
}
