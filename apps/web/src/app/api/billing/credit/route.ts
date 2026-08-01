import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '../../../../../../packages/billing/src/metamask';

const creditedTxs = new Set<string>();
const userCredits = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, txHash, chainId, userId = 'anonymous' } = body;

    if (!txHash || !planId) {
      return NextResponse.json({ error: 'Missing txHash or planId' }, { status: 400 });
    }

    if (creditedTxs.has(txHash)) {
      return NextResponse.json({ error: 'Transaction already credited' }, { status: 409 });
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    // TODO: real on-chain verification
    creditedTxs.add(txHash);
    const current = userCredits.get(userId) || 0;
    userCredits.set(userId, current + plan.credits);

    return NextResponse.json({
      success: true,
      creditsAdded: plan.credits,
      totalCredits: userCredits.get(userId),
      txHash,
      chainId,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
