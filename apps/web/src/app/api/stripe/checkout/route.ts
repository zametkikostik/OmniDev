import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const price = process.env.STRIPE_PRICE_ID;
  if (!key || !price) {
    return NextResponse.json(
      { error: 'Stripe not configured', hint: 'Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID' },
      { status: 501 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?ok=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?cancel=1`,
        'line_items[0][price]': price,
        'line_items[0][quantity]': '1',
        client_reference_id: body.address || '',
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || 'Stripe error' }, { status: 500 });
    }
    return NextResponse.json({ url: data.url, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
