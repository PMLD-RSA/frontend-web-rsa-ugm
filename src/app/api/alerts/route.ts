import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { forwardToBackend } from "@/lib/bffProxy";
import { MOCK_ALERTS } from "@/lib/mockData";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const cookieStore = await cookies();
  const token =
    cookieStore.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let fallbackAlerts = [...MOCK_ALERTS];
  if (status) {
    fallbackAlerts = fallbackAlerts.filter((a) => a.status === status);
  }

  const queryPath = status ? `/api/alerts?status=${status}` : "/api/alerts";

  return forwardToBackend(queryPath, {
    headers,
    fallbackData: fallbackAlerts,
  });
}
