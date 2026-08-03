import { NextRequest, NextResponse } from 'next/server';
import { createJob, getJob, updateJob } from '@/lib/job-store';
import { audit } from '@/lib/audit-log';
import { getClientIp } from '@/lib/redis-rate-limit';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = String(body.prompt || '');
  if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });
  const job = await createJob(prompt, body.userId || null);
  audit('job', 'created', { ip: getClientIp(req), meta: { id: job.id } });
  if (!process.env.QSTASH_TOKEN) {
    void runLocal(job.id, prompt, body.settings);
  }
  return NextResponse.json({ jobId: job.id, status: job.status });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(job);
}

async function runLocal(jobId: string, prompt: string, settings: any) {
  await updateJob(jobId, { status: 'running' });
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, settings }),
    });
    const data = await res.json();
    if (!res.ok) {
      await updateJob(jobId, { status: 'failed', result: { error: data.error || 'fail' } });
      return;
    }
    await updateJob(jobId, {
      status: 'done',
      result: { files: data.files, description: data.description },
    });
  } catch (e: any) {
    await updateJob(jobId, { status: 'failed', result: { error: e.message } });
  }
}
