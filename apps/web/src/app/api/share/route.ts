import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, prisma, memoryStore } from '../../../../../../packages/db/src/client';

function makeSlug() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    const slug = makeSlug();
    if (hasDatabase()) {
      const project = await prisma.project.update({
        where: { id: projectId },
        data: { shareSlug: slug, isPublic: true },
      });
      return NextResponse.json({ slug, url: `/p/${slug}`, project: { id: project.id, name: project.name } });
    }
    const existing = memoryStore.getProject(projectId);
    if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const project = memoryStore.saveProject({ ...existing, shareSlug: slug, isPublic: true });
    return NextResponse.json({ slug, url: `/p/${slug}`, project: { id: project.id, name: project.name } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });
  try {
    if (hasDatabase()) {
      const project = await prisma.project.findFirst({ where: { shareSlug: slug, isPublic: true } });
      if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ project });
    }
    const project = memoryStore.getBySlug(slug);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
