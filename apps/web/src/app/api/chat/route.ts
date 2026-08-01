import { NextRequest, NextResponse } from 'next/server';

/**
 * OmniDev Chat API
 * 
 * In production this wires to the full Orchestrator.
 * For now it returns a realistic mock that demonstrates the flow.
 */

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  // Simulate thinking delay
  await new Promise((r) => setTimeout(r, 800));

  // Very simple keyword routing for demo
  const lower = (message as string).toLowerCase();

  if (lower.includes('создай') || lower.includes('сделай') || lower.includes('приложение') || lower.includes('saas') || lower.includes('дашборд')) {
    return NextResponse.json({
      reply: `✅ Принял задачу: «${message}»\n\nЯ сейчас:\n1. Сгенерирую структуру Next.js + Tailwind + Shadcn\n2. Создам нужные страницы и компоненты\n3. Подниму WebContainer и запущу dev-сервер\n4. Если будут ошибки — сам их исправлю\n\nПревью появится справа через несколько секунд.`,
      status: 'Генерирую проект...',
      previewUrl: null,
    });
  }

  if (lower.includes('кнопк') || lower.includes('цвет') || lower.includes('круглее') || lower.includes('измени')) {
    return NextResponse.json({
      reply: `✏️ Понял правку. Вношу изменения в компоненты, сохраняя остальной код нетронутым.\n\nГотово. Превью обновится автоматически.`,
      status: 'Готов',
    });
  }

  if (lower.includes('база') || lower.includes('prisma') || lower.includes('api') || lower.includes('эндпоинт')) {
    return NextResponse.json({
      reply: `🗄️ Генерирую Prisma-схему и API-роуты на основе твоего описания.\n\nФайлы prisma/schema.prisma и app/api/* добавлены.`,
      status: 'Готов',
    });
  }

  if (lower.includes('web3') || lower.includes('кошелёк') || lower.includes('wallet') || lower.includes('wagmi')) {
    return NextResponse.json({
      reply: `🔗 Добавляю wagmi + RainbowKit.\n\nТеперь можешь использовать <WalletButton /> в любом компоненте. Авторизация через кошелёк готова.`,
      status: 'Готов',
    });
  }

  return NextResponse.json({
    reply: `Понял: «${message}».\n\nМогу создать приложение, править UI, генерировать базу данных, добавлять Web3 или исправлять ошибки. Просто скажи, что нужно.`,
    status: 'Готов',
  });
}
