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
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 detik timeout

    const fetchHeaders = new Headers(options.headers);
    if (options.body !== undefined && !fetchHeaders.has("Content-Type")) {
      fetchHeaders.set("Content-Type", "application/json");
    }

    const method = (options.method || "GET").toUpperCase();
    const res = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (res.ok) {
      if (res.status === 204) {
        return NextResponse.json({ success: true } as ApiResponse<T>, { status: 200 });
      }
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    // Jika server merespons 4xx/5xx (termasuk 401/403/429), kembalikan error asli backend
    const responseHeaders =
      res.status === 429 && res.headers.has("retry-after")
        ? { "Retry-After": res.headers.get("retry-after")! }
        : undefined;

    try {
      const errJson = await res.json();
      return NextResponse.json(errJson, { status: res.status, headers: responseHeaders });
    } catch {
      return NextResponse.json(
        { success: false, message: `Backend error HTTP ${res.status}` },
        { status: res.status, headers: responseHeaders }
      );
    }
  } catch {
    const method = (options.method || "GET").toUpperCase();
    const isReadMethod = method === "GET" || method === "HEAD";

    // Jangan pernah pakai fallback mock untuk operasi mutasi (POST/PATCH/PUT/DELETE)
    if (!isReadMethod || options.fallbackData === undefined) {
      return NextResponse.json(
        { success: false, message: "The backend is unreachable." },
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
