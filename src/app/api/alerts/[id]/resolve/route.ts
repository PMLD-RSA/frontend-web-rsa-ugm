import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { forwardToBackend } from "@/lib/bffProxy";
import { MOCK_ALERTS } from "@/lib/mockData";

export async function PATCH(
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

  const alertIdNum = Number(id);
  const targetAlert = MOCK_ALERTS.find((a) => a.id === alertIdNum);
  if (targetAlert) {
    targetAlert.status = "resolved";
    targetAlert.resolvedAt = new Date().toISOString();
  }

  const fallbackData = targetAlert || {
    id: alertIdNum,
    status: "resolved",
    resolvedAt: new Date().toISOString(),
  };

  return forwardToBackend(`/api/alerts/${id}/resolve`, {
    method: "PATCH",
    headers,
    fallbackData,
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}
