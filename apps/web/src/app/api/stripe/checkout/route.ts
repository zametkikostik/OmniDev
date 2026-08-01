import { NextRequest, NextResponse } from 'next/server';

const PACKS: Record<string, { credits: number; priceCents: number; name: string }> = {
  starter: { credits: 100, priceCents: 900, name: 'OmniDev Starter (100 credits)' },
  pro: { credits: 500, priceCents: 3900, name: 'OmniDev Pro (500 credits)' },
  team: { credits: 2000, priceCents: 12900, name: 'OmniDev Team (2000 credits)' },
};

export async function POST(req: NextRequest) {
  try {
    const { planId, walletAddress, successUrl, cancelUrl } = await req.json();
    const pack = PACKS[planId];
    if (!pack) return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({
        demo: true,
        message: 'STRIPE_SECRET_KEY not set. Add it to enable real Stripe checkout.',
        url: null,
        pack,
      });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', successUrl || `${origin}/billing?success=1&plan=${planId}`);
    params.append('cancel_url', cancelUrl || `${origin}/billing?cancel=1`);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][unit_amount]', String(pack.priceCents));
    params.append('line_items[0][price_data][product_data][name]', pack.name);
    params.append('line_items[0][quantity]', '1');
    params.append('metadata[planId]', planId);
    params.append('metadata[credits]', String(pack.credits));
    if (walletAddress) params.append('metadata[wallet]', walletAddress);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok) {
      return NextResponse.json({ error: session.error?.message || 'Stripe error' }, { status: 500 });
    }
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
