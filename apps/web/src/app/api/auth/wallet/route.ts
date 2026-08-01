import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, memoryStore } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Valid address required' }, { status: 400 });
    }
    const user = memoryStore.getOrCreateUserByWallet(address);
    if (user.credits === 0) memoryStore.addCredits(user.id, 20);
    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        credits: memoryStore.getOrCreateUserByWallet(address).credits,
      },
      backend: hasDatabase() ? 'postgres' : 'memory',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
