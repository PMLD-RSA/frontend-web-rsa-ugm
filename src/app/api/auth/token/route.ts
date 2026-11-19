import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Sesi tidak ditemukan." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { token },
  });
}
