import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { hasDatabase, memoryStore } from '@/lib/db';
import { consumeNonce } from '@/lib/siwe-nonce';

export async function POST(req: NextRequest) {
  try {
    const { address, message, signature } = await req.json();

    if (!address || !message || !signature) {
      return NextResponse.json({ error: 'address, message, signature required' }, { status: 400 });
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/i);
    if (!nonceMatch) {
      return NextResponse.json({ error: 'Nonce missing in message' }, { status: 400 });
    }
    if (!consumeNonce(address, nonceMatch[1])) {
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 });
    }

    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const wallet = address.toLowerCase();
    const user = memoryStore.getOrCreateUserByWallet(wallet);
    if (user.credits === 0) memoryStore.addCredits(user.id, 50);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        credits: memoryStore.getOrCreateUserByWallet(wallet).credits,
      },
      backend: hasDatabase() ? 'postgres' : 'memory',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Verify failed' }, { status: 500 });
  }
}
