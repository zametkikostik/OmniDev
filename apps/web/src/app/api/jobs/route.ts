import { NextRequest, NextResponse } from 'next/server';
import { enqueueGeneration, getJob, listJobs, publishToQStash } from '@/lib/job-queue';
import { moderatePrompt } from '@/lib/prompt-guard';
import { audit } from '@/lib/audit-log';
import { getClientIp } from '@/lib/redis-rate-limit';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt, settings } = body;
  const guard = moderatePrompt(prompt || '');
  const ip = getClientIp(req);
  if (!guard.ok) {
    audit('moderation', guard.code || 'block', { ip, meta: { reason: guard.reason } });
    return NextResponse.json({ error: guard.reason }, { status: 400 });
  }

  const job = enqueueGeneration(prompt);
  audit('job', 'enqueue', { ip, meta: { jobId: job.id } });

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const workerUrl = base ? `${base}/api/jobs/worker` : '';

  if (workerUrl && process.env.QSTASH_TOKEN) {
    await publishToQStash(workerUrl, { jobId: job.id, settings });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    worker: workerUrl ? '/api/jobs/worker' : null,
    async: Boolean(process.env.QSTASH_TOKEN),
  });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const job = getJob(id);
    if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json(job);
  }
  return NextResponse.json({ jobs: listJobs(30) });
}
