import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, memoryStore } from '@/lib/db';

function assertAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get('x-admin-secret') === secret;
}

export async function GET(req: NextRequest) {
  if (!assertAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const list = req.nextUrl.searchParams.get('list');
  const address = req.nextUrl.searchParams.get('address');

  if (list === '1') {
    return NextResponse.json({
      users: [],
      backend: hasDatabase() ? 'postgres' : 'memory',
      note: 'Memory store listing limited on serverless',
    });
  }
  if (!address) return NextResponse.json({ error: 'address or list=1 required' }, { status: 400 });
  const user = memoryStore.getOrCreateUserByWallet(address);
  return NextResponse.json({ credits: user.credits, user });
}

export async function POST(req: NextRequest) {
  if (!assertAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { address, amount, reason } = await req.json();
    if (!address || typeof amount !== 'number') {
      return NextResponse.json({ error: 'address and amount required' }, { status: 400 });
    }
    const user = memoryStore.getOrCreateUserByWallet(address);
    const credits = memoryStore.addCredits(user.id, amount);
    return NextResponse.json({ success: true, credits, reason: reason || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
