import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, prisma, memoryStore } from '../../../../../../packages/db/src/client';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || undefined;
  const id = req.nextUrl.searchParams.get('id');
  try {
    if (hasDatabase()) {
      if (id) {
        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ project });
      }
      const projects = await prisma.project.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({ projects });
    }
    if (id) {
      const project = memoryStore.getProject(id);
      if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ project });
    }
    return NextResponse.json({ projects: memoryStore.listProjects(userId) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, name, description, prompt, files, shareSlug, isPublic } = body;
    if (!name || !files) {
      return NextResponse.json({ error: 'name and files required' }, { status: 400 });
    }
    if (hasDatabase()) {
      if (id) {
        const project = await prisma.project.update({
          where: { id },
          data: {
            name, description: description || '', prompt: prompt || '', files,
            ...(shareSlug !== undefined ? { shareSlug } : {}),
            ...(isPublic !== undefined ? { isPublic } : {}),
          },
        });
        return NextResponse.json({ project });
      }
      const project = await prisma.project.create({
        data: {
          userId: userId || null, name, description: description || '', prompt: prompt || '',
          files, shareSlug: shareSlug || null, isPublic: isPublic || false,
        },
      });
      return NextResponse.json({ project });
    }
    const project = memoryStore.saveProject({ id, userId, name, description, prompt, files, shareSlug, isPublic });
    return NextResponse.json({ project });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  try {
    if (hasDatabase()) await prisma.project.delete({ where: { id } });
    else memoryStore.deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
