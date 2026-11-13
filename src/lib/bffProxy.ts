import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

const CORE_BACKEND_URL = process.env.CORE_BACKEND_URL || "http://localhost:8000";

/**
 * Proksi HTTP ke Core Backend Fastify, dengan fallback opsional ke data contoh.
 */
export async function forwardToBackend<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: HeadersInit;
    fallbackData?: T;
  }
): Promise<NextResponse<ApiResponse<T>>> {
  const url = `${CORE_BACKEND_URL}${path}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2 detik timeout

    const fetchHeaders = new Headers(options.headers);
    if (options.body !== undefined && !fetchHeaders.has("Content-Type")) {
      fetchHeaders.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
      method: options.method || "GET",
      headers: fetchHeaders,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Jika server merespons 4xx/5xx, kembalikan pesan error asli dari backend
    try {
      const errJson = await res.json();
      return NextResponse.json(errJson, { status: res.status });
    } catch {
      return NextResponse.json(
        { success: false, message: `Backend error HTTP ${res.status}` },
        { status: res.status }
      );
    }
  } catch {
    if (options.fallbackData === undefined) {
      return NextResponse.json(
        { success: false, message: "Backend tidak dapat diakses." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      source: "mock",
      data: options.fallbackData,
    });
  }
}
