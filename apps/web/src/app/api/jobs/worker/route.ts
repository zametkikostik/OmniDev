import { NextRequest, NextResponse } from 'next/server';
import { getJob, updateJob } from '@/lib/job-queue';
import { createLLMProvider } from '@/lib/llm';
import { buildLLMConfig, needsApiKey } from '@/lib/build-llm-config';
import { moderatePrompt } from '@/lib/prompt-guard';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, settings, prompt: directPrompt } = body;

    let prompt = directPrompt as string | undefined;
    if (jobId) {
      const job = getJob(jobId);
      if (!job) return NextResponse.json({ error: 'job not found' }, { status: 404 });
      if (job.status === 'done') return NextResponse.json(job);
      prompt = job.prompt;
      updateJob(jobId, { status: 'running' });
    }
    if (!prompt) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

    const guard = moderatePrompt(prompt);
    if (!guard.ok) {
      if (jobId) updateJob(jobId, { status: 'failed', error: guard.reason });
      return NextResponse.json({ error: guard.reason }, { status: 400 });
    }

    const llmConfig = buildLLMConfig(settings);
    if (needsApiKey(llmConfig)) {
      const err = 'Platform LLM key not configured';
      if (jobId) updateJob(jobId, { status: 'failed', error: err });
      return NextResponse.json({ error: err }, { status: 503 });
    }

    const provider = createLLMProvider(llmConfig);
    const raw = await provider.complete({
      messages: [
        {
          role: 'system',
          content:
            'You are OmniDev. Return ONLY JSON { "files": { path: content }, "description": "..." } for a Next.js 15 App Router + Tailwind app. Dark UI. No markdown.',
        },
        { role: 'user', content: `\u0421\u043e\u0437\u0434\u0430\u0439 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435: ${prompt}` },
      ],
      json: true,
      temperature: 0.2,
      maxTokens: 12000,
    });

    let parsed: { files: Record<string, string>; description: string };
    try {
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      if (jobId) updateJob(jobId, { status: 'failed', error: 'invalid JSON' });
      return NextResponse.json({ error: 'invalid JSON' }, { status: 500 });
    }

    if (jobId) {
      updateJob(jobId, { status: 'done', result: parsed });
      return NextResponse.json(getJob(jobId));
    }
    return NextResponse.json({ status: 'done', result: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
