import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, prisma, memoryStore } from '../../../../../../packages/db/src/client';
import { CREDIT_COSTS, CreditAction } from '@/lib/credits';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
  const wallet = address.toLowerCase();
  try {
    if (hasDatabase()) {
      const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
      return NextResponse.json({ credits: user?.credits ?? 0, costs: CREDIT_COSTS });
    }
    const user = memoryStore.getOrCreateUserByWallet(wallet);
    return NextResponse.json({ credits: user.credits, costs: CREDIT_COSTS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, action } = body as { address?: string; action: CreditAction };
    if (!action || !(action in CREDIT_COSTS)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    const cost = CREDIT_COSTS[action];
    if (!address) {
      return NextResponse.json({ ok: true, mode: 'local', cost });
    }
    const wallet = address.toLowerCase();
    if (hasDatabase()) {
      const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
      if (!user || user.credits < cost) {
        return NextResponse.json({ ok: false, error: 'Insufficient credits', credits: user?.credits ?? 0, cost }, { status: 402 });
      }
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: cost } },
      });
      return NextResponse.json({ ok: true, credits: updated.credits, cost });
    }
    const user = memoryStore.getOrCreateUserByWallet(wallet);
    if (user.credits < cost) {
      return NextResponse.json({ ok: false, error: 'Insufficient credits', credits: user.credits, cost }, { status: 402 });
    }
    const remaining = memoryStore.addCredits(user.id, -cost);
    return NextResponse.json({ ok: true, credits: remaining, cost });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
