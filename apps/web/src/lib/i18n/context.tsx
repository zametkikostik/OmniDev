'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DICTS, Locale, t as getDict, type Dict, LOCALES } from './translations';

const STORAGE_KEY = 'omnidev_locale_v1';

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  d: Dict;
  locales: typeof LOCALES;
};

const Ctx = createContext<I18nCtx | null>(null);

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && DICTS[saved]) return saved;
  } catch {}
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('bg')) return 'bg';
  if (nav.startsWith('uk')) return 'uk';
  if (nav.startsWith('th')) return 'th';
  return 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = l;
    }
  }, []);

  useEffect(() => {
    if (ready && typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale, ready]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      d: getDict(locale),
      locales: LOCALES,
    }),
    [locale, setLocale]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      locale: 'en' as Locale,
      setLocale: (_: Locale) => {},
      d: DICTS.en,
      locales: LOCALES,
    };
  }
  return ctx;
}
