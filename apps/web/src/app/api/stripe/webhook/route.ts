import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, memoryStore } from '@/lib/db';
import { createHmac, timingSafeEqual } from 'crypto';

const PLAN_CREDITS: Record<string, number> = { starter: 100, pro: 500, team: 2000 };

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  try {
    const parts = sigHeader.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      acc[k.trim()] = v;
      return acc;
    }, {} as Record<string, string>);
    const timestamp = parts['t'];
    const signature = parts['v1'];
    if (!timestamp || !signature) return false;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
    const signed = `${timestamp}.${payload}`;
    const expected = createHmac('sha256', secret).update(signed).digest('hex');
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(signature, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const sig = req.headers.get('stripe-signature') || '';
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (secret && !verifyStripeSignature(payload, sig, secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    const event = JSON.parse(payload);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const planId = session.metadata?.planId || 'starter';
      const wallet = session.metadata?.wallet;
      const credits = Number(session.metadata?.credits) || PLAN_CREDITS[planId] || 100;
      const txHash = `stripe_${session.id}`;
      if (!memoryStore.hasPayment(txHash)) {
        memoryStore.recordPayment(txHash);
        if (wallet) {
          const user = memoryStore.getOrCreateUserByWallet(wallet);
          memoryStore.addCredits(user.id, credits);
        }
      }
    }
    return NextResponse.json({ received: true, backend: hasDatabase() ? 'postgres' : 'memory' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
