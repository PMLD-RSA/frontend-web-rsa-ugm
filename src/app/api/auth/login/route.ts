import { NextRequest, NextResponse } from "next/server";

const CORE_BACKEND_URL = process.env.CORE_BACKEND_URL || "http://localhost:8000";

function isHttpsRequest(request: NextRequest): boolean {
  // TLS may terminate at a reverse proxy before the request reaches Next.js.
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return (forwardedProtocol || request.nextUrl.protocol.replace(":", "")) === "https";
}

/**
 * POST /api/auth/login
 *
 * Menerima { username, password }, meneruskan ke Core Backend.
 * Jika sukses:
 *  - Pasang cookie HttpOnly untuk browser Web
 *  - Kembalikan token JWT untuk Mobile App
 * Jika backend tidak dapat dihubungi, tampilkan kesalahan koneksi.
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
      const token: unknown = data.token || data.data?.token;
      const user = data.user || data.data?.user;

      if (data.success === false || typeof token !== "string" || !token || !user) {
        return NextResponse.json(
          { success: false, message: "Respons login dari backend tidak valid." },
          { status: 502 }
        );
      }

      const response = NextResponse.json({
        success: true,
        data: { token, user },
      });

      // Set cookie HttpOnly untuk browser Web
      response.cookies.set("auth_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isHttpsRequest(request),
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
        message: errData.message || (beRes.status === 401 || beRes.status === 403
          ? "Username atau password salah."
          : "Backend tidak dapat memproses login."),
      },
      { status: beRes.status }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Backend tidak dapat dihubungi. Periksa koneksi jaringan dan coba lagi." },
      { status: 503 }
    );
  }
}
