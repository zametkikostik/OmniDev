'use client';

import { useEffect, useState } from 'react';
import { OPENROUTER_POPULAR_MODELS, GOOGLE_AI_STUDIO_MODELS } from '@/lib/llm';
import {
  loadSettings,
  saveSettings,
  OmniDevSettings,
  DEFAULT_SETTINGS,
} from '@/lib/settings-store';

interface UserRow {
  id: string;
  walletAddress: string | null;
  credits: number;
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState(50);
  const [reason, setReason] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState('');
  const [settings, setSettings] = useState<OmniDevSettings>(DEFAULT_SETTINGS);
  const [llmSaved, setLlmSaved] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [tab, setTab] = useState<'llm' | 'credits' | 'stats' | 'audit'>('llm');

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-admin-secret': secret,
  });

  function update<K extends keyof OmniDevSettings>(k: K, v: OmniDevSettings[K]) {
    setSettings((p) => ({ ...p, [k]: v }));
    setLlmSaved(false);
  }

  function saveLlm() {
    saveSettings(settings);
    setLlmSaved(true);
    setTimeout(() => setLlmSaved(false), 2000);
  }

  async function loadUsers() {
    const res = await fetch('/api/admin/credits?list=1', { headers: headers() });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Unauthorized');
      return;
    }
    setUsers(data.users || []);
    setMsg(`Backend: ${data.backend}`);
  }

  async function adjustCredits() {
    const res = await fetch('/api/admin/credits', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ address, amount, reason }),
    });
    const data = await res.json();
    setMsg(res.ok ? `OK · ${data.credits}` : data.error || 'Error');
    if (res.ok) loadUsers();
  }

  async function loadStats() {
    const res = await fetch('/api/admin/stats', { headers: headers() });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Unauthorized');
      return;
    }
    setStats(data);
    setMsg('Stats OK');
  }

  async function loadAudit() {
    const res = await fetch('/api/admin/audit?limit=80', { headers: headers() });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || 'Unauthorized');
      return;
    }
    setAudit(data.events || []);
    setMsg(`Audit: ${data.events?.length || 0}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Admin</h1>
            <p className="text-sm text-zinc-500">LLM · кредиты · stats · audit</p>
          </div>
          <a href="/" className="text-sm text-violet-400">
            ← App
          </a>
        </div>

        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm"
          placeholder="ADMIN_SECRET"
        />

        <div className="flex gap-2 flex-wrap">
          {(
            [
              ['llm', 'LLM'],
              ['credits', 'Кредиты'],
              ['stats', 'Stats'],
              ['audit', 'Audit'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                tab === id
                  ? 'bg-violet-600 text-white'
                  : 'border border-zinc-700 text-zinc-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'llm' && (
          <section className="rounded-2xl border border-violet-900/40 bg-violet-950/10 p-5 space-y-3">
            <h2 className="font-medium">LLM под капотом</h2>
            <p className="text-xs text-zinc-500">
              Клиенты не видят. Prod: ключи в env (OPENROUTER_API_KEY и т.д.).
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['openrouter', 'google', 'openai', 'ollama', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => update('activeProvider', p)}
                  className={`rounded-lg px-2 py-2 text-xs border ${
                    settings.activeProvider === p
                      ? 'border-violet-500 text-violet-300'
                      : 'border-zinc-800 text-zinc-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="password"
              value={settings.openRouterKey}
              onChange={(e) => update('openRouterKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              placeholder="OpenRouter key"
            />
            <select
              value={settings.openRouterModel}
              onChange={(e) => update('openRouterModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
            >
              {OPENROUTER_POPULAR_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="password"
              value={settings.googleApiKey}
              onChange={(e) => update('googleApiKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              placeholder="Google AI key"
            />
            <select
              value={settings.googleModel}
              onChange={(e) => update('googleModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
            >
              {GOOGLE_AI_STUDIO_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="password"
              value={settings.openaiKey}
              onChange={(e) => update('openaiKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              placeholder="OpenAI key"
            />
            <input
              value={settings.ollamaBaseURL}
              onChange={(e) => update('ollamaBaseURL', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              placeholder="Ollama URL"
            />
            <input
              value={settings.ollamaModel}
              onChange={(e) => update('ollamaModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              placeholder="Ollama model"
            />
            <input
              value={settings.customBaseURL}
              onChange={(e) => update('customBaseURL', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              placeholder="Custom URL"
            />
            <input
              value={settings.customModel}
              onChange={(e) => update('customModel', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              placeholder="Custom model"
            />
            <input
              type="password"
              value={settings.customKey}
              onChange={(e) => update('customKey', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              placeholder="Custom key"
            />
            <button
              type="button"
              onClick={saveLlm}
              className="w-full py-3 rounded-xl bg-violet-600 text-sm"
            >
              {llmSaved ? '✓ Saved' : 'Save LLM'}
            </button>
          </section>
        )}

        {tab === 'credits' && (
          <section className="rounded-2xl border border-zinc-800 p-5 space-y-3">
            <h2 className="font-medium">Кредиты</h2>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-mono"
              placeholder="0x..."
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-28 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm"
                placeholder="reason"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={adjustCredits} className="px-4 py-2 rounded-xl bg-violet-600 text-sm">
                Apply
              </button>
              <button onClick={loadUsers} className="px-4 py-2 rounded-xl border border-zinc-700 text-sm">
                List
              </button>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="text-xs font-mono flex justify-between border-t border-zinc-800 pt-2"
              >
                <span className="truncate">{u.walletAddress}</span>
                <span className="text-violet-300">{u.credits}</span>
              </div>
            ))}
          </section>
        )}

        {tab === 'stats' && (
          <section className="rounded-2xl border border-zinc-800 p-5 space-y-4">
            <div className="flex justify-between">
              <h2 className="font-medium">Аналитика</h2>
              <button
                type="button"
                onClick={loadStats}
                className="text-xs px-3 py-1 rounded-lg border border-zinc-600"
              >
                Обновить
              </button>
            </div>
            {!stats ? (
              <p className="text-sm text-zinc-600">Введи секрет и Обновить</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-zinc-900 p-3">
                  <div className="text-zinc-500 text-xs">Users</div>
                  <div className="text-xl font-semibold">{stats.users}</div>
                </div>
                <div className="rounded-xl bg-zinc-900 p-3">
                  <div className="text-zinc-500 text-xs">Projects</div>
                  <div className="text-xl font-semibold">{stats.projects}</div>
                </div>
                <div className="rounded-xl bg-zinc-900 p-3">
                  <div className="text-zinc-500 text-xs">Workspaces</div>
                  <div className="text-xl font-semibold">{stats.workspaces}</div>
                </div>
                <div className="rounded-xl bg-zinc-900 p-3">
                  <div className="text-zinc-500 text-xs">Credits</div>
                  <div className="text-xl font-semibold">{stats.totalCreditsOnPlatform}</div>
                </div>
                <div className="col-span-2 rounded-xl bg-zinc-900 p-3 text-xs space-y-1">
                  <div>Audit total: {stats.audit?.total}</div>
                  <div>Last 24h: {stats.audit?.last24h}</div>
                  <div className="font-mono text-zinc-500">
                    {JSON.stringify(stats.audit?.byType || {})}
                  </div>
                  <div className="pt-2 text-zinc-500">
                    DB: {stats.env?.hasDatabase ? 'yes' : 'no'} · OR:{' '}
                    {stats.env?.hasOpenRouter ? 'yes' : 'no'} · QStash:{' '}
                    {stats.env?.hasQStash ? 'yes' : 'no'}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'audit' && (
          <section className="rounded-2xl border border-zinc-800 p-5 space-y-4">
            <div className="flex justify-between">
              <h2 className="font-medium">Audit log</h2>
              <button
                type="button"
                onClick={loadAudit}
                className="text-xs px-3 py-1 rounded-lg border border-zinc-600"
              >
                Загрузить
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2 text-xs font-mono">
              {audit.length === 0 && <p className="text-zinc-600">Пусто</p>}
              {audit.map((e) => (
                <div key={e.id} className="border border-zinc-800 rounded-lg px-3 py-2">
                  <div className="flex justify-between text-zinc-500">
                    <span>
                      {e.type}/{e.action}
                    </span>
                    <span>{new Date(e.at).toLocaleString()}</span>
                  </div>
                  {e.meta && (
                    <pre className="text-zinc-400 mt-1 whitespace-pre-wrap break-all">
                      {JSON.stringify(e.meta)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {msg && <p className="text-center text-xs text-zinc-400 font-mono">{msg}</p>}
      </div>
    </div>
  );
}
