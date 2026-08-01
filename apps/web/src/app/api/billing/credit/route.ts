import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '../../../../../../packages/billing/src/metamask';
import { hasDatabase, prisma, memoryStore } from '../../../../../../packages/db/src/client';

const PLAN_CREDITS: Record<string, number> = { starter: 100, pro: 500, team: 2000 };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, txHash, chainId, amount, token, userId: wallet } = body;
    if (!txHash || !planId) {
      return NextResponse.json({ error: 'Missing txHash or planId' }, { status: 400 });
    }
    const credits = PLAN_CREDITS[planId] || PLANS.find((p) => p.id === planId)?.credits || 0;
    if (!credits) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

    if (hasDatabase()) {
      const existing = await prisma.payment.findUnique({ where: { txHash } });
      if (existing) return NextResponse.json({ error: 'Already credited' }, { status: 409 });
      let user = null;
      if (wallet) {
        user = await prisma.user.upsert({
          where: { walletAddress: wallet.toLowerCase() },
          create: { walletAddress: wallet.toLowerCase(), credits },
          update: { credits: { increment: credits } },
        });
      }
      await prisma.payment.create({
        data: {
          userId: user?.id, planId, txHash, chainId: Number(chainId) || 0,
          amount: String(amount || ''), token: token || 'native', credits,
        },
      });
      return NextResponse.json({ success: true, creditsAdded: credits, totalCredits: user?.credits, txHash, chainId });
    }

    if (memoryStore.hasPayment(txHash)) {
      return NextResponse.json({ error: 'Already credited' }, { status: 409 });
    }
    memoryStore.recordPayment(txHash);
    let total = credits;
    if (wallet) {
      const user = memoryStore.getOrCreateUserByWallet(wallet);
      total = memoryStore.addCredits(user.id, credits);
    }
    return NextResponse.json({ success: true, creditsAdded: credits, totalCredits: total, txHash, chainId });
  } catch (err: any) {
    console.error('[billing/credit]', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
