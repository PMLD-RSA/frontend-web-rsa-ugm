import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware Proteksi Rute
 *
 * Aturan:
 * - Rute public: /login, /api/* → selalu boleh diakses
 * - Rute dashboard (/*, kecuali public) → wajib ada cookie auth_token
 *   Jika tidak ada → redirect ke /login
 * - Jika sudah login dan akses /login → redirect ke /
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Biarkan semua rute BFF /api/* diakses bebas
  // (Mobile App menggunakan header Authorization, bukan cookie)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
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
     * - api/* (BFF — Mobile pakai header Authorization, tidak butuh proxy)
     * - file publik (svg, png, dll)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
