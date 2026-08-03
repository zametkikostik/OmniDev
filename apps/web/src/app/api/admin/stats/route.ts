import { NextRequest, NextResponse } from 'next/server';
import { auditStats } from '@/lib/audit-log';
import { memoryStore } from '@/lib/db';
import { CREDIT_COSTS } from '@/lib/credits';

function auth(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get('x-admin-secret') === secret;
}

export async function GET(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const users = memoryStore.listUsers?.() || [];
  const projects = memoryStore.listProjects?.() || [];
  const workspaces = memoryStore.listWorkspaces?.() || [];
  const totalCredits = users.reduce((s: number, u: any) => s + (u.credits || 0), 0);

  return NextResponse.json({
    audit: auditStats(),
    users: users.length,
    projects: projects.length,
    workspaces: workspaces.length,
    totalCreditsOnPlatform: totalCredits,
    creditCosts: CREDIT_COSTS,
    env: {
      hasDatabase: Boolean(process.env.DATABASE_URL),
      hasOpenRouter: Boolean(process.env.OPENROUTER_API_KEY),
      hasQStash: Boolean(process.env.QSTASH_TOKEN),
      hasAdmin: Boolean(process.env.ADMIN_SECRET),
    },
  });
}
