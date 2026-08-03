'use client';

import { useI18n } from '@/lib/i18n/context';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, locales, d } = useI18n();

  return (
    <label className="inline-flex items-center gap-1.5" title={d.language}>
      {!compact && (
        <span className="text-[10px] text-zinc-500 hidden sm:inline">{d.language}</span>
      )}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as any)}
        className="bg-zinc-900 border border-zinc-700 rounded-lg text-[11px] text-zinc-300 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 max-w-[5.5rem]"
        aria-label={d.language}
      >
        {locales.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag}
          </option>
        ))}
      </select>
    </label>
  );
}
