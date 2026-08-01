import { NextRequest, NextResponse } from 'next/server';

const hits = new Map<string, { n: number; t: number }>();
const LIMIT = 60;
const WINDOW = 60_000;

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();
  if (req.nextUrl.pathname === '/api/health') return NextResponse.next();

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  let entry = hits.get(ip);
  if (!entry || now - entry.t > WINDOW) {
    entry = { n: 0, t: now };
    hits.set(ip, entry);
  }
  entry.n += 1;

  if (entry.n > LIMIT) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Remaining', String(Math.max(0, LIMIT - entry.n)));
  return res;
}

export const config = { matcher: '/api/:path*' };
