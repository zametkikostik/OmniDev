import { NextRequest, NextResponse } from 'next/server';
import { enqueueGeneration, getJob } from '@/lib/job-queue';
import { moderatePrompt } from '@/lib/prompt-guard';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const guard = moderatePrompt(prompt || '');
  if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: 400 });
  const job = enqueueGeneration(prompt);
  return NextResponse.json({ jobId: job.id, status: job.status });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(job);
}
