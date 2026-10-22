import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { forwardToBackend } from "@/lib/bffProxy";
import { MOCK_TANKS } from "@/lib/mockData";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token =
    cookieStore.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const fallbackTank = MOCK_TANKS.find((t) => t.id === id) || MOCK_TANKS[0];

  return forwardToBackend(`/api/tanks/${id}`, {
    headers,
    fallbackData: fallbackTank,
  });
}
