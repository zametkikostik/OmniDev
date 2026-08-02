import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, files, name, userId } = body as {
      projectId?: string;
      files: Record<string, string>;
      name?: string;
      userId?: string;
    };
    if (!files || typeof files !== 'object') {
      return NextResponse.json({ error: 'files required' }, { status: 400 });
    }

    const slug = randomBytes(6).toString('hex');
    const project = await db.saveProject({
      id: projectId,
      userId: userId || null,
      name: name || 'Preview',
      files,
      shareSlug: slug,
      isPublic: true,
      previewUrl: `/p/${slug}`,
    });

    const hook = process.env.PREVIEW_HOOK_URL;
    if (hook) {
      fetch(hook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, slug, files }),
      }).catch(() => {});
    }

    return NextResponse.json({
      previewId: project.id,
      slug,
      previewPath: `/p/${slug}`,
      message: 'Превью по публичной ссылке',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
