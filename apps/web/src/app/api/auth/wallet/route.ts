import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, prisma, memoryStore } from '../../../../../../../packages/db/src/client';

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address || typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }
    const wallet = address.toLowerCase();
    if (hasDatabase()) {
      const user = await prisma.user.upsert({
        where: { walletAddress: wallet },
        create: { walletAddress: wallet, credits: 50 },
        update: {},
      });
      return NextResponse.json({
        user: { id: user.id, walletAddress: user.walletAddress, credits: user.credits },
      });
    }
    const user = memoryStore.getOrCreateUserByWallet(wallet);
    if (user.credits === 0) memoryStore.addCredits(user.id, 50);
    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        credits: memoryStore.getOrCreateUserByWallet(wallet).credits,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address');
  if (!address) return NextResponse.json({ error: 'address required' }, { status: 400 });
  const wallet = address.toLowerCase();
  try {
    if (hasDatabase()) {
      const user = await prisma.user.findUnique({ where: { walletAddress: wallet } });
      if (!user) return NextResponse.json({ user: null });
      return NextResponse.json({
        user: { id: user.id, walletAddress: user.walletAddress, credits: user.credits },
      });
    }
    const user = memoryStore.getOrCreateUserByWallet(wallet);
    return NextResponse.json({
      user: { id: user.id, walletAddress: user.walletAddress, credits: user.credits },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
