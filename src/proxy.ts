import { NextRequest, NextResponse } from "next/server";

function isAllowedCorsOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|100\.\d+\.\d+\.\d+)(:\d+)?$/.test(
    origin
  );
}

function applyCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );
  response.headers.set("Vary", "Origin");
  return response;
}

/**
 * Middleware Proteksi Rute
 *
 * Aturan:
 * - Rute public: /login, /api/* → selalu boleh diakses (+ CORS dev/LAN untuk Expo Web)
 * - Rute dashboard (/*, kecuali public) → wajib ada cookie auth_token
 *   Jika tidak ada → redirect ke /login
 * - Jika sudah login dan akses /login → redirect ke /
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Biarkan semua rute BFF /api/* diakses bebas + tangani CORS preflight untuk Expo Web
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    if (request.method === "OPTIONS") {
      const preflight = new NextResponse(null, { status: 204 });
      return origin && isAllowedCorsOrigin(origin)
        ? applyCorsHeaders(preflight, origin)
        : preflight;
    }

    const response = NextResponse.next();
    return origin && isAllowedCorsOrigin(origin)
      ? applyCorsHeaders(response, origin)
      : response;
  }

  // Jika sudah login dan mencoba akses /login → redirect ke dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Jika belum login dan mencoba akses rute non-public → redirect ke /login
  if (pathname !== "/login" && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match semua path KECUALI:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - file publik (svg, png, dll)
     * Catatan: /api/* ikut di-match agar header CORS & OPTIONS preflight untuk Expo Web tertangani
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
