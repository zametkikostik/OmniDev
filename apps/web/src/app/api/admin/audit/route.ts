import { NextRequest, NextResponse } from 'next/server';
import { listAudit } from '@/lib/audit-log';

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get('x-admin-secret') === secret;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const type = req.nextUrl.searchParams.get('type') as any;
  const limit = Math.min(200, parseInt(req.nextUrl.searchParams.get('limit') || '50', 10));
  return NextResponse.json({ events: listAudit(limit, type || undefined) });
}
