import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CREDIT_COSTS } from '@/lib/credits';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  let credits: number | null = null;
  let history: { action: string; cost: number; at: number }[] = [];

  try {
    if (address) {
      const user = await db.getOrCreateUserByWallet(address);
      credits = user.credits;
    }
    const mem = (db as any).listUsage?.() || [];
    history = mem.slice(-100);
  } catch {}

  const byDay: Record<string, number> = {};
  for (const h of history) {
    const day = new Date(h.at).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + (h.cost || 0);
  }

  return NextResponse.json({
    credits,
    costs: CREDIT_COSTS,
    history: history.slice(-50),
    byDay,
    neon: !!process.env.DATABASE_URL,
  });
}
