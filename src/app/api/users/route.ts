import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/bffProxy';

function getAuthHeader(request: NextRequest): Record<string, string> {
  const token = request.cookies.get('auth_token')?.value;
  const authorization =
    request.headers.get('authorization') || (token ? `Bearer ${token}` : '');
  return authorization ? { Authorization: authorization } : {};
}

export async function GET(request: NextRequest) {
  return forwardToBackend(`/api/users${request.nextUrl.search}`, {
    headers: getAuthHeader(request),
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Request body JSON tidak valid.' },
      { status: 400 }
    );
  }

  return forwardToBackend('/api/users', {
    method: 'POST',
    body,
    headers: getAuthHeader(request),
  });
}
