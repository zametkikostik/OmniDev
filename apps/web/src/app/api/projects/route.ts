import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, memoryStore } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || undefined;
  if (hasDatabase()) {
    return NextResponse.json({ projects: [], backend: 'postgres' });
  }
  return NextResponse.json({
    projects: memoryStore.listProjects(userId),
    backend: 'memory',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const project = memoryStore.saveProject({
      id: body.id,
      name: body.name || 'Untitled',
      files: body.files || {},
      description: body.description || '',
      prompt: body.prompt || '',
      userId: body.userId || null,
    });
    return NextResponse.json({ project, backend: hasDatabase() ? 'postgres' : 'memory' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
