'use client';

import { useI18n } from '@/lib/i18n/context';

/**
 * suppressHydrationWarning: locale is applied after mount from localStorage.
 * First paint is always SSR_LOCALE (en) on server and client.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, locales, d, hydrated } = useI18n();

  return (
    <label
      className="inline-flex items-center gap-1.5"
      title={d.language}
      suppressHydrationWarning
    >
      {!compact && (
        <span className="text-[10px] text-zinc-500 hidden sm:inline" suppressHydrationWarning>
          {d.language}
        </span>
      )}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as any)}
        className="bg-zinc-900 border border-zinc-700 rounded-lg text-[11px] text-zinc-300 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 max-w-[5.5rem]"
        aria-label={d.language}
        suppressHydrationWarning
        disabled={!hydrated}
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
