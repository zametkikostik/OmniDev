import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAsync, getClientIp } from '@/lib/redis-rate-limit';
import { audit } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimitAsync(`preview:${ip}`, 10, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { projectId, files, name } = body as {
      projectId?: string;
      files?: Record<string, string>;
      name?: string;
    };

    const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
    if (hook) {
      const res = await fetch(hook, { method: 'POST' });
      const ok = res.ok;
      audit('job', 'preview_hook', { ip, meta: { ok, projectId } });
      return NextResponse.json({
        mode: 'vercel_hook',
        ok,
        message: ok ? 'Deploy hook triggered' : 'Deploy hook failed',
      });
    }

    const slug =
      (name || projectId || 'app')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 32) +
      '-' +
      Math.random().toString(36).slice(2, 6);

    const base = process.env.PREVIEW_BASE_URL || '';
    const url = base ? `${base.replace(/\/$/, '')}/${slug}` : null;

    audit('job', 'preview_recipe', {
      ip,
      meta: { slug, fileCount: files ? Object.keys(files).length : 0 },
    });

    return NextResponse.json({
      mode: 'vds_recipe',
      slug,
      url,
      message: url
        ? `Preview URL (после синхронизации на VDS): ${url}`
        : 'Установи PREVIEW_BASE_URL или VERCEL_DEPLOY_HOOK_URL',
      filesCount: files ? Object.keys(files).length : 0,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
