import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider, LLMConfig } from '../../../../../../packages/llm/src/provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, settings } = body as { message: string; settings?: any };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const llmConfig = buildConfigFromSettings(settings);

    if (
      (llmConfig.provider === 'openrouter' || llmConfig.provider === 'openai') &&
      !llmConfig.apiKey
    ) {
      return NextResponse.json({
        reply: mockReply(message),
        status: 'Готов (нужен API-ключ в Настройках)',
        needsKey: true,
      });
    }

    const provider = createLLMProvider(llmConfig);

    const systemPrompt = `Ты — OmniDev, автономный ИИ-архитектор full-stack приложений.
Ты помогаешь пользователю создавать полноценные production-ready приложения.
Отвечай на русском, кратко и по делу.`;

    const reply = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
    });

    const lower = message.toLowerCase();
    let status = 'Готов';
    if (lower.includes('создай') || lower.includes('сделай') || lower.includes('приложение')) {
      status = 'Генерирую проект...';
    }

    return NextResponse.json({
      reply,
      status,
      provider: llmConfig.provider,
      model: llmConfig.model,
    });
  } catch (err: any) {
    console.error('[chat]', err);
    return NextResponse.json({
      reply: `Ошибка LLM: ${err.message || 'неизвестная ошибка'}. Проверь ключ и модель в Настройках.`,
      status: 'Ошибка',
      error: true,
    }, { status: 200 });
  }
}

function buildConfigFromSettings(s?: any): LLMConfig {
  if (!s) return { provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet' };

  switch (s.activeProvider) {
    case 'ollama':
      return {
        provider: 'ollama',
        baseURL: `${(s.ollamaBaseURL || 'http://localhost:11434').replace(/\/$/, '')}/v1`,
        model: s.ollamaModel || 'llama3.1',
        apiKey: 'ollama',
      };
    case 'openai':
      return { provider: 'openai', apiKey: s.openaiKey, model: 'gpt-4o' };
    case 'custom':
      return { provider: 'custom', baseURL: s.customBaseURL, model: s.customModel, apiKey: s.customKey };
    default:
      return {
        provider: 'openrouter',
        apiKey: s.openRouterKey,
        model: s.openRouterModel || 'anthropic/claude-3.5-sonnet',
      };
  }
}

function mockReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('создай') || lower.includes('сделай') || lower.includes('приложение') || lower.includes('saas')) {
    return `✅ Принял задачу: «${message}»\n\nЧтобы я реально сгенерировал код, добавь свой OpenRouter API Key в Настройках (или подключи Ollama).`;
  }
  return `Понял: «${message}».\n\nДобавь API-ключ OpenRouter или подключи Ollama в Настройках.`;
}
