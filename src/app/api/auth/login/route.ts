import { NextRequest, NextResponse } from "next/server";
import { MOCK_USERS } from "@/lib/mockData";

const CORE_BACKEND_URL = process.env.CORE_BACKEND_URL || "http://localhost:8000";

/**
 * POST /api/auth/login
 *
 * Menerima { username, password }, meneruskan ke Core Backend.
 * Jika sukses:
 *  - Pasang cookie HttpOnly untuk browser Web
 *  - Kembalikan token JWT untuk Mobile App
 * Jika backend offline: gunakan mock auth (admin/admin123, operator/op123, viewer/view123)
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body tidak valid." },
      { status: 400 }
    );
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: "Username dan password wajib diisi." },
      { status: 400 }
    );
  }

  // Coba teruskan ke Core Backend
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const beRes = await fetch(`${CORE_BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (beRes.ok) {
      const data = await beRes.json();
      const token: string = data.token || data.data?.token;
      const user = data.user || data.data?.user;

      const response = NextResponse.json({
        success: true,
        data: { token, user },
      });

      // Set cookie HttpOnly untuk browser Web
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 hari
      });

      return response;
    }

    // Backend menolak (401/403)
    const errData = await beRes.json().catch(() => ({}));
    return NextResponse.json(
      {
        success: false,
        message: errData.message || "Username atau password salah.",
      },
      { status: beRes.status }
    );
  } catch {
    // Backend offline → fallback mock auth
    return handleMockLogin(username, password);
  }
}

// --- Mock login untuk pengembangan saat backend offline ---
const MOCK_CREDENTIALS: Record<string, string> = {
  admin: "admin123",
  operator: "op123",
  viewer: "view123",
};

function handleMockLogin(username: string, password: string): NextResponse {
  const expectedPwd = MOCK_CREDENTIALS[username];
  if (!expectedPwd || password !== expectedPwd) {
    return NextResponse.json(
      { success: false, message: "Username atau password salah. (Mock)" },
      { status: 401 }
    );
  }

  const mockUser = MOCK_USERS.find((u) => u.username === username);
  if (!mockUser) {
    return NextResponse.json(
      { success: false, message: "User tidak ditemukan." },
      { status: 401 }
    );
  }

  // Token mock (tidak terenkripsi — hanya untuk dev)
  const mockToken = Buffer.from(
    JSON.stringify({ id: mockUser.id, username: mockUser.username, role: mockUser.role })
  ).toString("base64");

  const response = NextResponse.json({
    success: true,
    data: {
      token: mockToken,
      user: { id: mockUser.id, username: mockUser.username, role: mockUser.role },
    },
  });

  response.cookies.set("auth_token", mockToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
