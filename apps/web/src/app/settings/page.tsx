'use client';

import { useEffect, useState } from 'react';
import { getLocalCredits, setLocalCredits } from '@/lib/credits';
import { SignInButton } from '@/components/wallet/SignInButton';

export default function SettingsPage() {
  const [credits, setCredits] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCredits(getLocalCredits());
    try {
      const n = localStorage.getItem('omnidev_display_name');
      if (n) setDisplayName(n);
    } catch {}
  }, []);

  function save() {
    try {
      localStorage.setItem('omnidev_display_name', displayName.trim());
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold">Настройки</h1>
            <p className="text-sm text-zinc-500 mt-1">Аккаунт и баланс</p>
          </div>
          <a href="/" className="text-sm text-violet-400 hover:text-violet-300">
            ← К генератору
          </a>
        </div>

        <section className="mb-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium">Вход</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Кошелёк · SIWE</p>
            </div>
            <SignInButton
              onAuth={(u) => {
                if (typeof u.credits === 'number') {
                  setLocalCredits(u.credits);
                  setCredits(u.credits);
                }
              }}
            />
          </div>
        </section>

        <section className="mb-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="font-medium mb-1">Кредиты</h2>
          <p className="text-3xl font-semibold text-violet-300 tabular-nums">{credits}</p>
          <p className="text-xs text-zinc-500 mt-2">
            Списываются за генерацию и правки.
          </p>
          <a href="/billing" className="inline-block mt-4 text-sm px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500">
            Пополнить
          </a>
        </section>

        <section className="mb-6 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 className="font-medium mb-3">Профиль</h2>
          <label className="block text-xs text-zinc-500 mb-1">Имя</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm mb-3"
            placeholder="Как к тебе обращаться"
          />
          <button onClick={save} className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm hover:bg-zinc-700">
            {saved ? '✓ Сохранено' : 'Сохранить'}
          </button>
        </section>

        <section className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30">
          <h2 className="font-medium mb-1">Как это работает</h2>
          <ul className="text-sm text-zinc-400 space-y-2 mt-3 list-disc list-inside">
            <li>Опиши продукт в чате — код и живое превью</li>
            <li>Правки обычным языком</li>
            <li>Шаринг и экспорт в GitHub</li>
          </ul>
          <p className="text-[11px] text-zinc-600 mt-4">
            ИИ настраивается администратором платформы.
          </p>
        </section>
      </div>
    </div>
  );
}
