import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/lib/llm';
import { buildLLMConfig, needsApiKey } from '@/lib/build-llm-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instruction, files, settings } = body as {
      instruction: string;
      files: Record<string, string>;
      settings?: any;
    };

    if (!instruction || !files) {
      return NextResponse.json({ error: 'instruction and files required' }, { status: 400 });
    }

    const llmConfig = buildLLMConfig(settings);
    if (needsApiKey(llmConfig)) {
      return NextResponse.json({ error: 'API key required in Settings' }, { status: 401 });
    }

    const provider = createLLMProvider(llmConfig);
    const fileList = Object.keys(files).slice(0, 30).join(', ');
    const sample = Object.entries(files)
      .slice(0, 8)
      .map(([p, c]) => `--- ${p} ---\n${c.slice(0, 1500)}`)
      .join('\n\n');

    const raw = await provider.complete({
      messages: [
        {
          role: 'system',
          content: `You edit a Next.js project. Return ONLY JSON: { "files": { "path": "full new content" }, "summary": "ru" }.
Only include changed files. Keep code valid.`,
        },
        {
          role: 'user',
          content: `Files: ${fileList}\n\n${sample}\n\nInstruction: ${instruction}`,
        },
      ],
      json: true,
      temperature: 0.2,
      maxTokens: 8000,
    });

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    const merged = { ...files, ...(parsed.files || {}) };
    return NextResponse.json({
      files: merged,
      summary: parsed.summary || 'Правки применены',
    });
  } catch (err: any) {
    console.error('[edit]', err);
    return NextResponse.json({ error: err.message || 'Edit failed' }, { status: 500 });
  }
}
