import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, prisma, memoryStore } from '../../../../../../../packages/db/src/client';

function assertAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get('x-admin-secret') === secret;
}

export async function GET(req: NextRequest) {
  if (!assertAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const list = req.nextUrl.searchParams.get('list');
  const address = req.nextUrl.searchParams.get('address');
  try {
    if (list === '1') {
      if (hasDatabase()) {
        const users = await prisma.user.findMany({
          orderBy: { updatedAt: 'desc' }, take: 100,
          select: { id: true, walletAddress: true, credits: true, createdAt: true, updatedAt: true },
        });
        return NextResponse.json({ users, backend: 'postgres' });
      }
      return NextResponse.json({ users: [], backend: 'memory', note: 'Memory store does not support listing' });
    }
    if (!address) return NextResponse.json({ error: 'address or list=1 required' }, { status: 400 });
    const wallet = address.toLowerCase();
    if (hasDatabase()) {
      const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
      return NextResponse.json({ credits: user?.credits ?? 0, user: user ? { id: user.id, walletAddress: user.walletAddress, credits: user.credits } : null });
    }
    const user = memoryStore.getOrCreateUserByWallet(wallet);
    return NextResponse.json({ credits: user.credits, user: { id: user.id, walletAddress: user.walletAddress, credits: user.credits } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!assertAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { address, amount, reason } = await req.json();
    if (!address || typeof amount !== 'number') {
      return NextResponse.json({ error: 'address and amount required' }, { status: 400 });
    }
    const wallet = address.toLowerCase();
    if (hasDatabase()) {
      const user = await prisma.user.upsert({
        where: { walletAddress: wallet },
        create: { walletAddress: wallet, credits: Math.max(0, amount) },
        update: { credits: { increment: amount } },
      });
      if (user.credits < 0) {
        await prisma.user.update({ where: { id: user.id }, data: { credits: 0 } });
        user.credits = 0;
      }
      return NextResponse.json({ success: true, credits: Math.max(0, user.credits), reason: reason || null });
    }
    const user = memoryStore.getOrCreateUserByWallet(wallet);
    const credits = memoryStore.addCredits(user.id, amount);
    return NextResponse.json({ success: true, credits: Math.max(0, credits), reason: reason || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
