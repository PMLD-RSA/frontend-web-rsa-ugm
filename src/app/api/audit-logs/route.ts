import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/bffProxy';
import { MOCK_AUDIT_LOGS } from '@/lib/mockData';

/**
 * GET /api/audit-logs
 *
 * Query params (forwarded as-is to Core Backend):
 *   ?limit=20   – jumlah item per halaman (default 20)
 *   ?page=1     – halaman (default 1)
 *   ?user_id=   – filter by user id (opsional)
 *   ?action=    – filter by action type (opsional)
 *
 * Support:
 *   - Web: cookie-based session (auto dari browser)
 *   - Mobile: Authorization: Bearer <token> header (diteruskan ke backend)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const backendPath = queryString
    ? `/api/audit-logs?${queryString}`
    : '/api/audit-logs';

  // Forward Authorization header agar Mobile App bisa akses
  const authHeader = request.headers.get('Authorization');
  const extraHeaders: Record<string, string> = {};
  if (authHeader) {
    extraHeaders['Authorization'] = authHeader;
  }

  return forwardToBackend(backendPath, {
    method: 'GET',
    headers: extraHeaders,
    fallbackData: MOCK_AUDIT_LOGS,
  });
}
