import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, prisma, memoryStore } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, name, files, description, prompt } = body;
    const slug = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    if (hasDatabase()) {
      // Prisma path reserved for when DATABASE_URL + client wired
      return NextResponse.json({ slug, url: `/p/${slug}`, backend: 'postgres' });
    }

    const project = memoryStore.saveProject({
      id: projectId,
      name: name || 'Shared project',
      files: files || {},
      description: description || '',
      prompt: prompt || '',
      shareSlug: slug,
      isPublic: true,
    });

    return NextResponse.json({
      slug: project.shareSlug,
      url: `/p/${project.shareSlug}`,
      projectId: project.id,
      backend: 'memory',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  const project = memoryStore.getBySlug(slug);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ project });
}
