import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider, LLMConfig } from '../../../../../../packages/llm/src/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { files, instruction, settings } = body as {
      files: Record<string, string>;
      instruction: string;
      settings?: any;
    };

    if (!files || !instruction) {
      return NextResponse.json({ error: 'files and instruction required' }, { status: 400 });
    }

    const llmConfig = buildConfig(settings);
    if ((llmConfig.provider === 'openrouter' || llmConfig.provider === 'openai') && !llmConfig.apiKey) {
      return NextResponse.json({ error: 'Нужен API-ключ. Добавь в Настройках.' });
    }

    const provider = createLLMProvider(llmConfig);
    const fileList = Object.keys(files).join('\n');
    const important = pickFiles(files, instruction);
    const blocks = Object.entries(important)
      .map(([p, c]) => `### ${p}\n\`\`\`\n${c.slice(0, 3500)}\n\`\`\``)
      .join('\n\n');

    const prompt = `You are OmniDev. Edit an existing project.

## Instruction
${instruction}

## File list
${fileList}

## Current files
${blocks}

Return ONLY valid JSON:
{
  "files": { "path/to/file.tsx": "full new content" },
  "explanation": "short summary in Russian"
}

Only return files that need to change. Minimal surgical edits. Pure JSON.`;

    const raw = await provider.complete({
      messages: [
        { role: 'system', content: 'You are a precise code editor. Always reply with pure JSON.' },
        { role: 'user', content: prompt },
      ],
      json: true,
      temperature: 0.15,
      maxTokens: 10000,
    });

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      files: parsed.files || {},
      explanation: parsed.explanation || 'Изменения внесены',
    });
  } catch (err: any) {
    console.error('[edit]', err);
    return NextResponse.json({ error: err.message || 'Edit failed' }, { status: 500 });
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

function pickFiles(files: Record<string, string>, instruction: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lower = instruction.toLowerCase();
  for (const key of Object.keys(files)) {
    if (key.includes('page.tsx') || key.includes('layout.tsx') || key.includes('globals.css') || key === 'package.json') {
      result[key] = files[key];
    }
  }
  if (lower.includes('кнопк') || lower.includes('button') || lower.includes('цвет') || lower.includes('стиль')) {
    for (const key of Object.keys(files)) {
      if (key.endsWith('.tsx') || key.endsWith('.css')) result[key] = files[key];
    }
  }
  return Object.fromEntries(Object.entries(result).slice(0, 10));
}
