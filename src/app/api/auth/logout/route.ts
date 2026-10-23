import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Menghapus cookie auth_token dari browser.
 * Mobile App cukup membuang token dari penyimpanan lokal — tidak perlu call ini.
 */
export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ success: true, data: null });

  // Hapus cookie dengan Max-Age=0
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
