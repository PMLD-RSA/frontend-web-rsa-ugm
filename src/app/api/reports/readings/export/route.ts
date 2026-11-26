import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { vokasiDisplayText } from "@/lib/vokasiLocations";

const CORE_BACKEND_URL = process.env.CORE_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const { searchParams } = new URL(request.url);
  const targetUrl = `${CORE_BACKEND_URL}/api/reports/readings/export?${searchParams.toString()}`;

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(targetUrl, {
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: "Could not download the CSV." },
        { status: res.status }
      );
    }

    const csvData = await res.text();
    return new NextResponse(vokasiDisplayText(csvData), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          res.headers.get("content-disposition") ||
          `attachment; filename="sensor-readings-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Could not reach the backend." },
      { status: 503 }
    );
  }
}
