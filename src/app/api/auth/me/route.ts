import { NextRequest, NextResponse } from "next/server";
import { User } from "@/types";

const CORE_BACKEND_URL = process.env.CORE_BACKEND_URL || "http://localhost:8000";

/**
 * GET /api/auth/me
 *
 * Membaca token dari:
 *  - Cookie `auth_token` (browser Web)
 *  - Header `Authorization: Bearer <token>` (Mobile App)
 *
 * Mengembalikan profil user aktif.
 * Jika backend offline: decode mock token (base64 JSON).
 */
export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get("auth_token")?.value;
  const headerToken = request.headers
    .get("authorization")
    ?.replace("Bearer ", "")
    .trim();

  const token = cookieToken || headerToken;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Tidak terautentikasi." },
      { status: 401 }
    );
  }

  // Coba teruskan ke Core Backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const beRes = await fetch(`${CORE_BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (beRes.ok) {
      const data = await beRes.json();
      const user: User = data.user || data.data;
      return NextResponse.json({ success: true, data: user });
    }

    // Token tidak valid di backend
    return NextResponse.json(
      { success: false, message: "Sesi tidak valid. Silakan login kembali." },
      { status: 401 }
    );
  } catch {
    // Backend offline → decode mock token
    return handleMockMe(token);
  }
}

function handleMockMe(token: string): NextResponse {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    if (decoded.id && decoded.username && decoded.role) {
      return NextResponse.json({
        success: true,
        data: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          isActive: true,
          createdAt: new Date().toISOString(),
        } satisfies User,
      });
    }
  } catch {
    // Token tidak bisa di-decode → tidak valid
  }

  return NextResponse.json(
    { success: false, message: "Token tidak valid." },
    { status: 401 }
  );
}
