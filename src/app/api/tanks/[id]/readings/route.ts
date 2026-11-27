import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { forwardToBackend } from "@/lib/bffProxy";

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

  const query = new URLSearchParams({ hours, limit });
  return forwardToBackend(`/api/tanks/${encodeURIComponent(id)}/readings?${query}`, { headers });
}
