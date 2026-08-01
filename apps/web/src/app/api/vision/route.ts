import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider, LLMConfig } from '../../../../../../packages/llm/src/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/png', prompt, settings } = body as {
      imageBase64: string;
      mimeType?: string;
      prompt?: string;
      settings?: any;
    };

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 });
    }

    const llmConfig = buildConfig(settings);

    if (!llmConfig.apiKey && llmConfig.provider !== 'ollama') {
      return NextResponse.json({
        error: 'Для Screenshot→Code нужен OpenRouter / OpenAI ключ с multimodal-моделью (claude-3.5-sonnet или gpt-4o).',
      });
    }

    const visionModel =
      llmConfig.model.includes('claude') || llmConfig.model.includes('gpt-4o') || llmConfig.model.includes('gemini')
        ? llmConfig.model
        : 'anthropic/claude-3.5-sonnet';

    const provider = createLLMProvider({ ...llmConfig, model: visionModel });

    const userText = prompt
      ? `Скриншот UI. Сделай точную React + Tailwind + TypeScript реализацию. Дополнительно: ${prompt}`
      : 'Скриншот UI. Сделай точную React + Tailwind + TypeScript реализацию этого интерфейса.';

    const messages: any[] = [
      {
        role: 'system',
        content: `You are OmniDev vision engine.
Analyze the UI screenshot and generate a complete Next.js App Router component.

Return ONLY valid JSON:
{
  "files": { "app/page.tsx": "...", "app/globals.css": "..." },
  "description": "short description in Russian"
}

Use Tailwind. Pure JSON.`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      },
    ];

    const raw = await provider.complete({
      messages,
      json: true,
      temperature: 0.2,
      maxTokens: 12000,
    });

    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      files: parsed.files || {},
      description: parsed.description || 'UI по скриншоту',
    });
  } catch (err: any) {
    console.error('[vision]', err);
    return NextResponse.json({ error: err.message || 'Vision failed' }, { status: 500 });
  }
}

function buildConfig(s?: any): LLMConfig {
  if (!s) return { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' };
  switch (s.activeProvider) {
    case 'ollama':
      return { provider: 'ollama', baseURL: `${(s.ollamaBaseURL || 'http://localhost:11434').replace(/\/$/, '')}/v1`, model: s.ollamaModel || 'llava', apiKey: 'ollama' };
    case 'openai':
      return { provider: 'openai', apiKey: s.openaiKey, model: 'gpt-4o' };
    case 'custom':
      return { provider: 'custom', baseURL: s.customBaseURL, model: s.customModel, apiKey: s.customKey };
    default:
      return { provider: 'openrouter', apiKey: s.openRouterKey, model: s.openRouterModel || 'anthropic/claude-3.5-sonnet' };
  }
}
