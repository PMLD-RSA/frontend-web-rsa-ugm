import { cookies } from "next/headers";
import { forwardToBackend } from "@/lib/bffProxy";
import { MOCK_TANKS } from "@/lib/mockData";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return forwardToBackend("/api/tanks", {
    headers,
    fallbackData: MOCK_TANKS,
  });
}
