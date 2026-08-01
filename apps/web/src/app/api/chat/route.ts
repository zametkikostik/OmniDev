import { NextRequest, NextResponse } from 'next/server';
import { createLLMProvider } from '@/lib/llm';
import { buildLLMConfig, needsApiKey } from '@/lib/build-llm-config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, settings } = body as { message: string; settings?: any };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const llmConfig = buildLLMConfig(settings);

    if (needsApiKey(llmConfig)) {
      return NextResponse.json({
        reply: mockReply(message),
        status: 'Готов (нужен API-ключ в Настройках)',
        needsKey: true,
      });
    }

    const provider = createLLMProvider(llmConfig);
    const systemPrompt = `Ты — OmniDev, автономный ИИ-архитектор full-stack приложений.
Помогай создавать production-ready приложения. Отвечай на русском, кратко и по делу.`;

    const reply = await provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.4,
      maxTokens: 2000,
    });

    return NextResponse.json({ reply, status: 'ok' });
  } catch (err: any) {
    console.error('[chat]', err);
    return NextResponse.json({ error: err.message || 'Chat failed' }, { status: 500 });
  }
}

function mockReply(message: string): string {
  return `Понял: «${message.slice(0, 200)}».\n\nДобавь API-ключ OpenRouter или Google AI Studio в Настройках — и я смогу генерировать полноценный код.`;
}
