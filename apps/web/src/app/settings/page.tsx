'use client';

import { useEffect, useState } from 'react';
import {
  loadSettings,
  saveSettings,
  OmniDevSettings,
  DEFAULT_SETTINGS,
} from '@/lib/settings-store';
import { OPENROUTER_POPULAR_MODELS, GOOGLE_AI_STUDIO_MODELS } from '@/lib/llm';

export default function SettingsPage() {
  const [settings, setSettings] = useState<OmniDevSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  async function checkOllama() {
    try {
      const res = await fetch('/api/llm/ollama-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseURL: settings.ollamaBaseURL }),
      });
      const data = await res.json();
      if (data.models?.length) {
        setOllamaModels(data.models);
        setOllamaStatus('ok');
      } else setOllamaStatus('error');
    } catch {
      setOllamaStatus('error');
    }
  }

  function update<K extends keyof OmniDevSettings>(key: K, value: OmniDevSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Настройки OmniDev</h1>
            <p className="text-sm text-zinc-500 mt-1">
              OpenRouter · Google AI Studio · Ollama · OpenAI · Custom
            </p>
          </div>
          <a href="/" className="text-sm text-violet-400 hover:text-violet-300">
            ← Назад к чату
          </a>
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Активный провайдер</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(['openrouter', 'google', 'ollama', 'openai', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => update('activeProvider', p)}
                className={`rounded-xl px-4 py-3 text-sm font-medium border transition ${
                  settings.activeProvider === p
                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {p === 'openrouter' && 'OpenRouter'}
                {p === 'google' && 'Google AI Studio'}
                {p === 'ollama' && 'Ollama'}
                {p === 'openai' && 'OpenAI'}
                {p === 'custom' && 'Custom'}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="font-medium mb-1">OpenRouter</h2>
          <p className="text-xs text-zinc-500 mb-4">
            API Key:{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
              openrouter.ai/keys
            </a>
          </p>
          <label className="block text-xs text-zinc-500 mb-1">API / Management Key</label>
          <input type="password" value={settings.openRouterKey} onChange={(e) => update('openRouterKey', e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <label className="block text-xs text-zinc-500 mb-1">Модель</label>
          <select value={settings.openRouterModel} onChange={(e) => update('openRouterModel', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
            {OPENROUTER_POPULAR_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </section>

        <section className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="font-medium mb-1">Google AI Studio (Gemini)</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Ключ:{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
              aistudio.google.com/apikey
            </a>
          </p>
          <label className="block text-xs text-zinc-500 mb-1">API Key</label>
          <input type="password" value={settings.googleApiKey} onChange={(e) => update('googleApiKey', e.target.value)}
            placeholder="AIza..."
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <label className="block text-xs text-zinc-500 mb-1">Модель</label>
          <select value={settings.googleModel} onChange={(e) => update('googleModel', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
            {GOOGLE_AI_STUDIO_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </section>

        <section className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="font-medium mb-1">Ollama</h2>
          <p className="text-xs text-zinc-500 mb-4">Локальные модели</p>
          <label className="block text-xs text-zinc-500 mb-1">Base URL</label>
          <div className="flex gap-2 mb-4">
            <input value={settings.ollamaBaseURL} onChange={(e) => update('ollamaBaseURL', e.target.value)}
              placeholder="http://localhost:11434"
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            <button onClick={checkOllama} className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm">Проверить</button>
          </div>
          {ollamaStatus === 'ok' && <p className="text-xs text-green-400 mb-3">✓ Ollama OK</p>}
          {ollamaStatus === 'error' && <p className="text-xs text-red-400 mb-3">✗ Не доступна</p>}
          <label className="block text-xs text-zinc-500 mb-1">Модель</label>
          {ollamaModels.length > 0 ? (
            <select value={settings.ollamaModel} onChange={(e) => update('ollamaModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm">
              {ollamaModels.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <input value={settings.ollamaModel} onChange={(e) => update('ollamaModel', e.target.value)}
              placeholder="llama3.1"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm" />
          )}
        </section>

        <section className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="font-medium mb-1">Баланс</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-semibold">{settings.credits}</span>
              <span className="text-zinc-500 text-sm ml-2">кредитов</span>
            </div>
            <a href="/billing" className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium">Пополнить</a>
          </div>
        </section>

        <button onClick={handleSave}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-medium transition">
          {saved ? '✓ Сохранено' : 'Сохранить настройки'}
        </button>
      </div>
    </div>
  );
}
