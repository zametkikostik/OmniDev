import { NextRequest, NextResponse } from 'next/server';
import { memoryStore, db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, walletAddress, role } = await req.json();
    if (!workspaceId || !walletAddress) {
      return NextResponse.json({ error: 'workspaceId and walletAddress required' }, { status: 400 });
    }
    const user = await db.getOrCreateUserByWallet(walletAddress);
    const ws = memoryStore.addMember(workspaceId, user.id, role || 'member', walletAddress);
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    return NextResponse.json({ workspace: ws, user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
