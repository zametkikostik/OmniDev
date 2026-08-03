import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDb } from '@/lib/db';
import { CREDIT_COSTS } from '@/lib/credits';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ costs: CREDIT_COSTS });
  }
  try {
    await ensureDb();
    const user = await db.getOrCreateUserByWallet(address);
    return NextResponse.json({
      credits: user.credits,
      costs: CREDIT_COSTS,
      userId: user.id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
