import { NextRequest } from 'next/server';
import { forwardToBackend } from '@/lib/bffProxy';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const authorization = request.headers.get('authorization') || (token ? `Bearer ${token}` : '');
  return forwardToBackend(`/api/users${request.nextUrl.search}`, {
    headers: authorization ? { Authorization: authorization } : {},
  });
}
