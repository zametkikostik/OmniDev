import { NextRequest, NextResponse } from 'next/server';
import { db, memoryStore, ensureDb, hasDatabase } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || undefined;
  await ensureDb();
  return NextResponse.json({
    workspaces: memoryStore.listWorkspaces(userId),
    backend: hasDatabase() ? 'neon' : 'memory',
  });
}

export async function POST(req: NextRequest) {
  try {
    const { name, ownerWallet } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name required' }, { status: 400 });
    }
    let ownerId: string | null = null;
    if (ownerWallet) {
      const u = await db.getOrCreateUserByWallet(ownerWallet);
      ownerId = u.id;
    }
    const ws = await db.createWorkspace(name.trim(), ownerId);
    return NextResponse.json({ workspace: ws });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
