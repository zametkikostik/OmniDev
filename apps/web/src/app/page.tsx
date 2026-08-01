'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * OmniDev — Main Chat + Preview Interface
 * 
 * Lovable-style conversational UI on the left,
 * Live WebContainer preview on the right.
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function OmniDevPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я OmniDev. Опиши, какое приложение хочешь создать — и я сделаю его полностью рабочим.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('Готов');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    setStatus('Думаю...');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply || 'Готово!' },
      ]);

      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
      }

      setStatus(data.status || 'Готов');
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Произошла ошибка. Попробуй ещё раз.',
        },
      ]);
      setStatus('Ошибка');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Left: Chat */}
      <div className="w-full md:w-[420px] flex flex-col border-r border-zinc-800">
        <header className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm">
            O
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-none">OmniDev</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{status}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-400">
                Генерирую...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Опиши приложение или правку..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-5 py-3 text-sm font-medium transition"
            >
              →
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-2 text-center">
            OmniDev сам исправит ошибки и запустит приложение
          </p>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="hidden md:flex flex-1 flex-col bg-zinc-900">
        <div className="h-10 border-b border-zinc-800 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center text-xs text-zinc-500 truncate">
            {previewUrl || 'Превью появится здесь'}
          </div>
        </div>

        <div className="flex-1 relative">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="absolute inset-0 w-full h-full border-0"
              title="OmniDev Preview"
              allow="cross-origin-isolated"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-30">◈</div>
                <p className="text-sm">Напиши, что хочешь создать</p>
                <p className="text-xs mt-1 text-zinc-700">
                  Например: «SaaS дашборд с авторизацией и Stripe»
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
