import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider, LLMConfig } from '../../../../../../packages/llm/src/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files, error, log, settings } = body as {
      files: Record<string, string>;
      error: string;
      log: string;
      settings?: any;
    };

    if (!files || !error) {
      return NextResponse.json({ error: 'files and error required' }, { status: 400 });
    }

    const llmConfig = buildConfig(settings);

    if ((llmConfig.provider === 'openrouter' || llmConfig.provider === 'openai') && !llmConfig.apiKey) {
      return NextResponse.json({ error: 'Нужен API-ключ для self-healing. Добавь в Настройках.' });
    }

    const provider = createLLMProvider(llmConfig);

    const relevant = pickRelevantFiles(files, error + (log || ''));
    const fileBlocks = Object.entries(relevant)
      .map(([p, c]) => `### ${p}\n\`\`\`\n${c.slice(0, 4000)}\n\`\`\``)
      .join('\n\n');

    const prompt = `You are a precise code-fixing engine inside OmniDev.
Fix the build/runtime error by rewriting only the necessary files.

## Error
\`\`\`
${error}
\`\`\`

## Log (tail)
\`\`\`
${(log || '').slice(-4000)}
\`\`\`

## Files
${fileBlocks}

Return ONLY valid JSON:
{
  "files": { "path/to/file.tsx": "full new content" },
  "explanation": "short summary in Russian of what you fixed"
}

Prefer minimal surgical fixes. Pure JSON only.`;

    const raw = await provider.complete({
      messages: [
        { role: 'system', content: 'You are a precise code-fixing engine. Always reply with pure JSON.' },
        { role: 'user', content: prompt },
      ],
      json: true,
      temperature: 0.1,
      maxTokens: 8000,
    });

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      files: parsed.files || {},
      explanation: parsed.explanation || 'Исправлено',
    });
  } catch (err: any) {
    console.error('[heal]', err);
    return NextResponse.json({ error: err.message || 'Heal failed' }, { status: 500 });
  }
}

function buildConfig(s?: any): LLMConfig {
  if (!s) return { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' };
  switch (s.activeProvider) {
    case 'ollama':
      return { provider: 'ollama', baseURL: `${(s.ollamaBaseURL || 'http://localhost:11434').replace(/\/$/, '')}/v1`, model: s.ollamaModel || 'llama3.1', apiKey: 'ollama' };
    case 'openai':
      return { provider: 'openai', apiKey: s.openaiKey, model: 'gpt-4o' };
    case 'custom':
      return { provider: 'custom', baseURL: s.customBaseURL, model: s.customModel, apiKey: s.customKey };
    default:
      return { provider: 'openrouter', apiKey: s.openRouterKey, model: s.openRouterModel || 'anthropic/claude-3.5-sonnet' };
  }
}

function pickRelevantFiles(files: Record<string, string>, context: string): Record<string, string> {
  const result: Record<string, string> = {};
  const always = ['package.json', 'tsconfig.json', 'next.config.ts', 'next.config.js'];
  for (const key of always) if (files[key]) result[key] = files[key];
  for (const [path, content] of Object.entries(files)) {
    if (context.includes(path) || context.includes(path.split('/').pop() || '')) result[path] = content;
  }
  for (const key of Object.keys(files)) {
    if (key.includes('page.tsx') || key.includes('layout.tsx') || key.includes('globals.css')) result[key] = files[key];
  }
  return Object.fromEntries(Object.entries(result).slice(0, 8));
}
