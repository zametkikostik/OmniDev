'use client';

import Link from 'next/link';

const FEATURES = [
  { title: 'Полный full-stack за минуты', desc: 'Next.js + Tailwind + API. Живое превью в браузере.' },
  { title: 'Self-Healing AI', desc: 'Агент читает ошибки и чинит код до успешного билда.' },
  { title: 'Screenshot → Code', desc: 'Скрин UI → React-компоненты и сразу запуск.' },
  { title: 'Свои модели', desc: 'OpenRouter, OpenAI или локальный Ollama.' },
  { title: 'Оплата криптой', desc: 'USDC и native через MetaMask в любой сети.' },
  { title: 'Шаринг и GitHub', desc: 'Публичная ссылка или экспорт репо.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800/80">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-xs">O</div>
            <span className="font-semibold">OmniDev</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/billing" className="text-zinc-400 hover:text-zinc-200">Тарифы</Link>
            <Link href="/" className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-medium">Открыть</Link>
          </div>
        </div>
      </nav>
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-violet-400 text-sm font-medium mb-4">AI Full-Stack Builder</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
          Создавай продукты<br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">с помощью ИИ</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto mb-10">
          Опиши идею — OmniDev сгенерирует рабочее приложение и чинит ошибки сам.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium">Начать бесплатно</Link>
          <a href="https://github.com/zametkikostik/OmniDev" target="_blank" rel="noreferrer"
            className="px-8 py-3.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium text-zinc-300">GitHub</a>
        </div>
        <p className="text-xs text-zinc-600 mt-4">50 бесплатных кредитов</p>
      </section>
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        OmniDev · MIT · <a href="https://github.com/zametkikostik/OmniDev" className="hover:text-zinc-400">GitHub</a>
      </footer>
    </div>
  );
}
