import { forwardToBackend } from "@/lib/bffProxy";
import { MOCK_GATEWAY } from "@/lib/mockData";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return forwardToBackend("/api/gateways", {
    headers,
    fallbackData: [MOCK_GATEWAY],
  });
}
