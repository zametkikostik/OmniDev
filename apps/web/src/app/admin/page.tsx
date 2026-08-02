'use client';

import { useEffect, useState } from 'react';
import { OPENROUTER_POPULAR_MODELS, GOOGLE_AI_STUDIO_MODELS } from '@/lib/llm';
import { loadSettings, saveSettings, OmniDevSettings, DEFAULT_SETTINGS } from '@/lib/settings-store';

interface UserRow { id: string; walletAddress: string | null; credits: number }

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState('');
  const [settings, setSettings] = useState<OmniDevSettings>(DEFAULT_SETTINGS);
  const [llmSaved, setLlmSaved] = useState(false);

  useEffect(() => { setSettings(loadSettings()); }, []);

  const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-secret': secret });

  async function loadUsers() {
    const res = await fetch('/api/admin/credits?list=1', { headers: headers() });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error || 'Unauthorized'); return; }
    setUsers(data.users || []);
    setMsg(`Backend: ${data.backend}`);
  }

  async function adjustCredits() {
    const res = await fetch('/api/admin/credits', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ address, amount, reason }),
    });
    const data = await res.json();
    setMsg(res.ok ? `OK \u00b7 ${data.credits}` : (data.error || 'Error'));
    if (res.ok) loadUsers();
  }

  function update<K extends keyof OmniDevSettings>(k: K, v: OmniDevSettings[K]) {
    setSettings((p) => ({ ...p, [k]: v }));
    setLlmSaved(false);
  }

  function saveLlm() {
    saveSettings(settings);
    setLlmSaved(true);
    setTimeout(() => setLlmSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Admin</h1>
            <p className="text-sm text-zinc-500">Кредиты + LLM (клиентам закрыто)</p>
          </div>
          <a href="/" className="text-sm text-violet-400">\u2190 App</a>
        </div>

        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm"
          placeholder="ADMIN_SECRET" />

        <section className="rounded-2xl border border-zinc-800 p-5 space-y-3">
          <h2 className="font-medium">Кредиты</h2>
          <input value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-mono" placeholder="0x..." />
          <div className="flex gap-2">
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
              className="w-28 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" />
            <input value={reason} onChange={(e) => setReason(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="reason" />
          </div>
          <div className="flex gap-2">
            <button onClick={adjustCredits} className="px-4 py-2 rounded-xl bg-violet-600 text-sm">Apply</button>
            <button onClick={loadUsers} className="px-4 py-2 rounded-xl border border-zinc-700 text-sm">List</button>
          </div>
          {msg && <p className="text-xs text-zinc-400 font-mono">{msg}</p>}
          {users.map((u) => (
            <div key={u.id} className="text-xs font-mono flex justify-between border-t border-zinc-800 pt-2">
              <span className="truncate">{u.walletAddress}</span>
              <span className="text-violet-300">{u.credits}</span>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-violet-900/40 bg-violet-950/10 p-5 space-y-3">
          <h2 className="font-medium">LLM под капотом</h2>
          <p className="text-xs text-zinc-500">Клиенты не видят. Prod: ключи в Vercel env.</p>
          <div className="grid grid-cols-3 gap-2">
            {(['openrouter', 'google', 'openai', 'ollama', 'custom'] as const).map((p) => (
              <button key={p} type="button" onClick={() => update('activeProvider', p)}
                className={`rounded-lg px-2 py-2 text-xs border ${
                  settings.activeProvider === p ? 'border-violet-500 text-violet-300' : 'border-zinc-800 text-zinc-500'
                }`}>{p}</button>
            ))}
          </div>
          <input type="password" value={settings.openRouterKey} onChange={(e) => update('openRouterKey', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="OpenRouter key" />
          <select value={settings.openRouterModel} onChange={(e) => update('openRouterModel', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm">
            {OPENROUTER_POPULAR_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="password" value={settings.googleApiKey} onChange={(e) => update('googleApiKey', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="Google AI key" />
          <select value={settings.googleModel} onChange={(e) => update('googleModel', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm">
            {GOOGLE_AI_STUDIO_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="password" value={settings.openaiKey} onChange={(e) => update('openaiKey', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="OpenAI key" />
          <input value={settings.ollamaBaseURL} onChange={(e) => update('ollamaBaseURL', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="Ollama URL" />
          <input value={settings.ollamaModel} onChange={(e) => update('ollamaModel', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="Ollama model" />
          <input value={settings.customBaseURL} onChange={(e) => update('customBaseURL', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="Custom URL" />
          <input value={settings.customModel} onChange={(e) => update('customModel', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="Custom model" />
          <input type="password" value={settings.customKey} onChange={(e) => update('customKey', e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm" placeholder="Custom key" />
          <button type="button" onClick={saveLlm} className="w-full py-3 rounded-xl bg-violet-600 text-sm">
            {llmSaved ? '\u2713 Saved' : 'Save LLM'}
          </button>
          <p className="text-[10px] text-zinc-600">
            Env: OPENROUTER_API_KEY, GOOGLE_AI_API_KEY, PLATFORM_LLM_PROVIDER, PLATFORM_LLM_MODEL, DATABASE_URL, ADMIN_SECRET, ALLOW_USER_BYOK=0
          </p>
        </section>
      </div>
    </div>
  );
}
