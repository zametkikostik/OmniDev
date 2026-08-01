import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/lib/llm';
import { buildLLMConfig, needsApiKey } from '@/lib/build-llm-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { errorLog, files, settings } = body as {
      errorLog: string;
      files: Record<string, string>;
      settings?: any;
    };

    if (!errorLog || !files) {
      return NextResponse.json({ error: 'errorLog and files required' }, { status: 400 });
    }

    const llmConfig = buildLLMConfig(settings);
    if (needsApiKey(llmConfig)) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const provider = createLLMProvider(llmConfig);
    const sample = Object.entries(files)
      .slice(0, 12)
      .map(([p, c]) => `--- ${p} ---\n${c.slice(0, 1200)}`)
      .join('\n\n');

    const raw = await provider.complete({
      messages: [
        {
          role: 'system',
          content: `Fix build/runtime errors in a Next.js project. Return ONLY JSON: { "files": { path: content }, "summary": "ru" }. Only changed files.`,
        },
        {
          role: 'user',
          content: `Error log:\n${errorLog.slice(0, 4000)}\n\nFiles:\n${sample}`,
        },
      ],
      json: true,
      temperature: 0.1,
      maxTokens: 8000,
    });

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json({
      files: { ...files, ...(parsed.files || {}) },
      summary: parsed.summary || 'Fixed',
    });
  } catch (err: any) {
    console.error('[heal]', err);
    return NextResponse.json({ error: err.message || 'Heal failed' }, { status: 500 });
  }
}
