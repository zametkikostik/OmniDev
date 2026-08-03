import { NextRequest, NextResponse } from 'next/server';
import { memoryStore, db } from '@/lib/db';
import { audit } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, walletAddress, role } = await req.json();
    if (!workspaceId || !walletAddress) {
      return NextResponse.json(
        { error: 'workspaceId and walletAddress required' },
        { status: 400 }
      );
    }
    const allowed = ['owner', 'admin', 'member', 'viewer'];
    const r = allowed.includes(role) ? role : 'member';
    const user = await db.getOrCreateUserByWallet(walletAddress);
    const ws = memoryStore.addMember(workspaceId, user.id, r, walletAddress);
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    const m = ws.members.find((x) => x.userId === user.id);
    if (m) m.role = r;
    audit('workspace', 'member', {
      meta: { workspaceId, wallet: walletAddress.toLowerCase(), role: r },
    });
    return NextResponse.json({ workspace: ws, user, role: r });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const wallet = req.nextUrl.searchParams.get('walletAddress');
    if (!workspaceId || !wallet) {
      return NextResponse.json({ error: 'params required' }, { status: 400 });
    }
    const ws = memoryStore.getWorkspace(workspaceId);
    if (!ws) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const user = await db.getOrCreateUserByWallet(wallet);
    ws.members = ws.members.filter((m) => m.userId !== user.id);
    audit('workspace', 'remove_member', { meta: { workspaceId, wallet } });
    return NextResponse.json({ workspace: ws });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
