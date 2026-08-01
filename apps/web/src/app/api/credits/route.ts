import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, memoryStore } from '@/lib/db';

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
  const user = memoryStore.getOrCreateUserByWallet(address);
  return NextResponse.json({
    credits: user.credits,
    backend: hasDatabase() ? 'postgres' : 'memory',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { address, amount } = await req.json();
    if (!address || typeof amount !== 'number') {
      return NextResponse.json({ error: 'address and amount required' }, { status: 400 });
    }
    const user = memoryStore.getOrCreateUserByWallet(address);
    const credits = memoryStore.addCredits(user.id, amount);
    return NextResponse.json({ credits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
