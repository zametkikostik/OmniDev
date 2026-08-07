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

/** Always the same on server and first client paint — avoids hydration mismatch */
const SSR_LOCALE: Locale = 'en';

type I18nCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  d: Dict;
  locales: typeof LOCALES;
  /** false until client reads localStorage / navigator */
  hydrated: boolean;
};

const Ctx = createContext<I18nCtx | null>(null);

function detectLocale(): Locale {
  if (typeof window === 'undefined') return SSR_LOCALE;
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
  const [locale, setLocaleState] = useState<Locale>(SSR_LOCALE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setHydrated(true);
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
    if (hydrated && typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale, hydrated]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      d: getDict(locale),
      locales: LOCALES,
      hydrated,
    }),
    [locale, setLocale, hydrated]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      locale: SSR_LOCALE,
      setLocale: (_: Locale) => {},
      d: DICTS[SSR_LOCALE],
      locales: LOCALES,
      hydrated: false,
    };
  }
  return ctx;
}
