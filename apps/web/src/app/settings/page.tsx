'use client';

import { useEffect, useState } from 'react';
import {
  loadSettings, saveSettings, OmniDevSettings, DEFAULT_SETTINGS,
} from '@/lib/settings-store';
import { OPENROUTER_POPULAR_MODELS, GOOGLE_AI_STUDIO_MODELS } from '@/lib/llm';

export default function SettingsPage() {
  const [settings, setSettings] = useState<OmniDevSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [adminSecret, setAdminSecret] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [publicInfo, setPublicInfo] = useState<any>(null);

  useEffect(() => {
    setSettings(loadSettings());
    if (sessionStorage.getItem('omnidev_admin_ok') === '1') setIsAdmin(true);
    fetch('/api/llm/public-config').then((r) => r.json()).then(setPublicInfo).catch(() => {});
  }, []);

  async function unlockAdmin() {
    setAdminError('');
    const res = await fetch('/api/admin/credits?list=1', {
      headers: { 'x-admin-secret': adminSecret },
    });
    if (!res.ok) {
      setAdminError('\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 ADMIN_SECRET');
      return;
    }
    setIsAdmin(true);
    sessionStorage.setItem('omnidev_admin_ok', '1');
  }

  function update<K extends keyof OmniDevSettings>(key: K, value: OmniDevSettings[K]) {
    setSettings((p) => ({ ...p, [key]: value }));
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
            <h1 className="text-2xl font-semibold">\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438</h1>
            <p className="text-sm text-zinc-500 mt-1">\u0410\u043a\u043a\u0430\u0443\u043d\u0442 \u0438 \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b OmniDev</p>
          </div>
          <a href="/" className="text-sm text-violet-400 hover:text-violet-300">\u2190 \u041d\u0430\u0437\u0430\u0434</a>
        </div>

        <section className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="font-medium mb-1">\u0418\u0418-\u043f\u0440\u043e\u0432\u0430\u0439\u0434\u0435\u0440</h2>
          <p className="text-sm text-zinc-400">
            \u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u0447\u0435\u0440\u0435\u0437 <span className="text-violet-300">{publicInfo?.label || 'OmniDev AI'}</span>.
            \u041a\u043b\u044e\u0447\u0438 \u0438 \u043c\u043e\u0434\u0435\u043b\u0438 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b \u0441\u043a\u0440\u044b\u0442\u044b. Ollama \u043d\u0435 \u043e\u0442\u043e\u0431\u0440\u0430\u0436\u0430\u0435\u0442\u0441\u044f.
          </p>
          {publicInfo?.modelPublic && (
            <p className="text-xs text-zinc-500 mt-2">\u041c\u043e\u0434\u0435\u043b\u044c: {publicInfo.modelPublic}</p>
          )}
        </section>

        {publicInfo?.byokEnabled && (
          <section className="mb-8 p-5 rounded-2xl border border-amber-900/40 bg-amber-950/20">
            <h2 className="font-medium mb-2 text-amber-200">BYOK</h2>
            <input type="password" value={settings.openRouterKey}
              onChange={(e) => update('openRouterKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-3"
              placeholder="OpenRouter sk-or-..." />
            <select value={settings.openRouterModel}
              onChange={(e) => update('openRouterModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-3">
              {OPENROUTER_POPULAR_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-violet-600 text-sm">
              {saved ? '\u2713' : 'Save BYOK'}
            </button>
          </section>
        )}

        <section className="mb-8 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <h2 className="font-medium mb-1">Admin \u00b7 LLM</h2>
          <p className="text-xs text-zinc-500 mb-3">
            OpenRouter \u00b7 Google \u00b7 Ollama \u00b7 OpenAI \u00b7 Custom \u2014 only with ADMIN_SECRET
          </p>
          {!isAdmin ? (
            <div className="flex gap-2">
              <input type="password" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm"
                placeholder="ADMIN_SECRET" />
              <button onClick={unlockAdmin}
                className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm">Login</button>
            </div>
          ) : (
            <p className="text-xs text-emerald-400 mb-4">\u2713 Admin mode</p>
          )}
          {adminError && <p className="text-xs text-red-400 mt-2">{adminError}</p>}
        </section>

        {isAdmin && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {(['openrouter', 'ollama', 'google', 'openai', 'custom'] as const).map((p) => (
                <button key={p} onClick={() => update('activeProvider', p)}
                  className={`rounded-xl px-3 py-2.5 text-sm border ${
                    settings.activeProvider === p
                      ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                      : 'border-zinc-800 text-zinc-400'
                  }`}>{p}</button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-600 mb-4">
              Prod env: OPENROUTER_API_KEY, GOOGLE_AI_API_KEY, PLATFORM_LLM_PROVIDER, PLATFORM_LLM_MODEL
            </p>
            <input type="password" value={settings.openRouterKey}
              onChange={(e) => update('openRouterKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-2"
              placeholder="OpenRouter key" />
            <select value={settings.openRouterModel}
              onChange={(e) => update('openRouterModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-4">
              {OPENROUTER_POPULAR_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="password" value={settings.googleApiKey}
              onChange={(e) => update('googleApiKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-2"
              placeholder="Google AI key" />
            <select value={settings.googleModel}
              onChange={(e) => update('googleModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-4">
              {GOOGLE_AI_STUDIO_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="p-4 rounded-xl border border-zinc-800 mb-4">
              <p className="text-xs text-zinc-500 mb-2">Ollama (admin only, hidden from clients)</p>
              <input value={settings.ollamaBaseURL}
                onChange={(e) => update('ollamaBaseURL', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-2"
                placeholder="http://localhost:11434" />
              <input value={settings.ollamaModel}
                onChange={(e) => update('ollamaModel', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm"
                placeholder="llama3.3" />
              <p className="text-[10px] text-zinc-600 mt-2">Needs ALLOW_OLLAMA=1 + self-host (Vercel cannot reach localhost)</p>
            </div>
            <input type="password" value={settings.openaiKey}
              onChange={(e) => update('openaiKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-2"
              placeholder="OpenAI key" />
            <input value={settings.customBaseURL}
              onChange={(e) => update('customBaseURL', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-2"
              placeholder="Custom base URL" />
            <input value={settings.customModel}
              onChange={(e) => update('customModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-2"
              placeholder="Custom model" />
            <input type="password" value={settings.customKey}
              onChange={(e) => update('customKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-4"
              placeholder="Custom key" />
            <button onClick={handleSave}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium">
              {saved ? '\u2713 Saved' : 'Save'}
            </button>
          </>
        )}

        <p className="text-center text-xs text-zinc-600 mt-8">
          <a href="/admin" className="text-violet-400">/admin</a> \u00b7 credits
        </p>
      </div>
    </div>
  );
}
