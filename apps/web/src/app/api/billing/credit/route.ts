import { NextRequest, NextResponse } from 'next/server';
import { PLANS } from '@/lib/plans';
import { memoryStore } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { planId, address } = await req.json();
    const plan = PLANS[planId as keyof typeof PLANS];
    if (!plan) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
    const user = memoryStore.getOrCreateUserByWallet(address);
    // Client must still call /api/billing/verify after on-chain tx
    return NextResponse.json({
      plan,
      userId: user.id,
      message: 'Complete payment then call /api/billing/verify',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
