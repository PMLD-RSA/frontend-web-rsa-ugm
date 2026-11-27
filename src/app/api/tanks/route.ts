import { cookies } from "next/headers";
import { forwardToBackend } from "@/lib/bffProxy";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return forwardToBackend("/api/tanks", {
    headers,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ success: false, message: 'Invalid JSON.' }, { status: 400 }); }
  const response = await forwardToBackend('/api/tanks/with-sensor', {
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status === 404) {
    return Response.json({ success: false, message: 'The server does not support tank and sensor registration yet.' }, { status: 503 });
  }
  return response;
}
