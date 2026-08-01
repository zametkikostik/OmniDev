'use client';

import { useState, useRef, useEffect } from 'react';
import { loadSettings } from '@/lib/settings-store';
import { useProjectRunner } from '@/hooks/useProjectRunner';
import { ExportGitHubModal } from '@/components/ExportGitHubModal';

interface Message { role: 'user' | 'assistant'; content: string; }

function isCreateIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('создай') || lower.includes('сделай') || lower.includes('приложение') ||
    lower.includes('сайт') || lower.includes('landing') || lower.includes('dashboard') ||
    lower.includes('дашборд') || lower.includes('saas') || lower.includes('сгенерируй');
}

function isEditIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('измени') || lower.includes('поменяй') || lower.includes('сделай кнопк') ||
    lower.includes('добавь') || lower.includes('убери') || lower.includes('цвет') ||
    lower.includes('круглее') || lower.includes('больше') || lower.includes('меньше') ||
    lower.includes('исправ') || lower.includes('стиль');
}

export default function OmniDevPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Привет! Я OmniDev. Опиши приложение — сгенерирую и запущу с живым превью.\n\nПотом можно править: «сделай кнопку круглее». Экспорт в GitHub и сохранение проектов — тоже есть.',
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runner = useProjectRunner();
  const prevStatus = useRef(runner.status);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, runner.logs]);

  useEffect(() => {
    if (prevStatus.current !== 'ready' && runner.status === 'ready' && runner.previewUrl) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `✅ ${runner.description || 'Проект готов!'}\n\nПревью справа. Можешь править или экспортировать в GitHub.`,
      }]);
    }
    if (prevStatus.current !== 'error' && runner.status === 'error' && runner.error) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `⚠️ ${runner.error}\n\nSelf-Healing пытался исправить. Переформулируй запрос или проверь ключ.`,
      }]);
    }
    prevStatus.current = runner.status;
  }, [runner.status, runner.previewUrl, runner.error, runner.description]);

  const busy = ['generating', 'booting', 'installing', 'starting', 'healing', 'editing'].includes(runner.status);

  const statusLabel =
    runner.status === 'generating' ? 'Генерирую код...' :
    runner.status === 'booting' ? 'Запускаю WebContainer...' :
    runner.status === 'installing' ? 'Ставлю зависимости...' :
    runner.status === 'starting' ? 'Стартую dev-сервер...' :
    runner.status === 'healing' ? '🔧 Исправляю...' :
    runner.status === 'editing' ? '✏️ Вношу правки...' :
    runner.status === 'ready' ? 'Готово' :
    runner.status === 'error' ? 'Ошибка' :
    isLoading ? 'Думаю...' : 'Готов';

  async function sendMessage() {
    if (!input.trim() || isLoading || busy) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const hasProject = Object.keys(runner.files).length > 0;

      if (isCreateIntent(userMsg) && !hasProject) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Принял. Генерирую проект и запускаю превью...' }]);
        await runner.generateAndRun(userMsg);
      } else if (hasProject && (isEditIntent(userMsg) || !isCreateIntent(userMsg))) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Вношу изменения...' }]);
        await runner.editProject(userMsg);
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Готово. Превью обновится (HMR).' }]);
      } else if (isCreateIntent(userMsg)) {
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Создаю новый проект...' }]);
        await runner.generateAndRun(userMsg);
      } else {
        const settings = loadSettings();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMsg, settings }),
        });
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Готово!' }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Ошибка: ${err.message || 'неизвестная'}` }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <div className="w-full md:w-[420px] flex flex-col border-r border-zinc-800">
        <header className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm">O</div>
            <div>
              <h1 className="font-semibold text-lg leading-none">OmniDev</h1>
              <p className="text-xs text-zinc-500 mt-0.5">{statusLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {Object.keys(runner.files).length > 0 && (
              <button onClick={() => setShowExport(true)} className="text-xs text-zinc-400 hover:text-violet-400 transition">GitHub</button>
            )}
            <a href="/projects" className="text-xs text-zinc-400 hover:text-violet-400 transition">Проекты</a>
            <a href="/settings" className="text-xs text-zinc-400 hover:text-violet-400 transition">Настройки</a>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-100'
              }`}>{m.content}</div>
            </div>
          ))}
          {(isLoading || busy) && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-400">{statusLabel}</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={Object.keys(runner.files).length ? 'Сделай кнопку круглее...' : 'Создай SaaS дашборд...'}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-zinc-600"
              disabled={isLoading || busy} />
            <button onClick={sendMessage} disabled={isLoading || busy || !input.trim()}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl px-5 py-3 text-sm font-medium transition">→</button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-2 text-center">Генерация · Правки · Self-Healing · GitHub Export</p>
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col bg-zinc-900">
        <div className="h-10 border-b border-zinc-800 flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 text-center text-xs text-zinc-500 truncate">{runner.previewUrl || 'Превью появится здесь'}</div>
        </div>
        <div className="flex-1 relative">
          {runner.previewUrl ? (
            <iframe src={runner.previewUrl} className="absolute inset-0 w-full h-full border-0" title="OmniDev Preview" allow="cross-origin-isolated" />
          ) : runner.logs.length > 0 ? (
            <div className="absolute inset-0 overflow-y-auto p-4 font-mono text-xs text-zinc-500 space-y-0.5">
              {runner.logs.slice(-40).map((line, i) => <div key={i} className="whitespace-pre-wrap break-all">{line}</div>)}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-30">◈</div>
                <p className="text-sm">Напиши, что хочешь создать</p>
                <p className="text-xs mt-1 text-zinc-700">Например: «SaaS дашборд с авторизацией»</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showExport && Object.keys(runner.files).length > 0 && (
        <ExportGitHubModal files={runner.files} defaultName="omnidev-app" onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
