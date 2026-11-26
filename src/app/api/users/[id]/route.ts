import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/bffProxy';

function getAuthHeader(request: NextRequest): Record<string, string> {
  const token = request.cookies.get('auth_token')?.value;
  const authorization =
    request.headers.get('authorization') || (token ? `Bearer ${token}` : '');
  return authorization ? { Authorization: authorization } : {};
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Request body JSON tidak valid.' },
      { status: 400 }
    );
  }

  return forwardToBackend(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body,
    headers: getAuthHeader(request),
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return forwardToBackend(`/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeader(request),
  });
}
