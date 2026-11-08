import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DICT, type Key } from '@/lib/dict';
import { cn } from '@/lib/utils';

export type Lang = 'sq' | 'en' | 'el' | 'it';
export const LANGS: { code: Lang; label: string; native: string; locale: string }[] = [
  { code: 'sq', label: 'SQ', native: 'Shqip', locale: 'sq-AL' },
  { code: 'en', label: 'EN', native: 'English', locale: 'en-GB' },
  { code: 'el', label: 'GR', native: 'Ελληνικά', locale: 'el-GR' },
  { code: 'it', label: 'IT', native: 'Italiano', locale: 'it-IT' },
];
const STORAGE = 'ylli-lang';

function initialLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE);
    if (v && LANGS.some((l) => l.code === v)) return v as Lang;
  } catch { /* storage unavailable */ }
  return 'sq';
}

export type TFn = (k: Key, vars?: Record<string, string | number>) => string;
interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: TFn; locale: string }
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE, l); } catch { /* ignore */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo<Ctx>(() => {
    const d = DICT[lang];
    const t: TFn = (k, vars) => {
      let s = d[k] ?? DICT.sq[k];
      if (vars) for (const [a, b] of Object.entries(vars)) s = s.split(`{${a}}`).join(String(b));
      return s;
    };
    return { lang, setLang, t, locale: LANGS.find((l) => l.code === lang)!.locale };
  }, [lang, setLang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useT() {
  const c = useContext(I18nCtx);
  if (!c) throw new Error('I18nProvider missing');
  return c;
}

export function LanguageSwitcher({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
  const { lang, setLang, t } = useT();
  return (
    <div role="group" aria-label={t('lang.choose')} className={cn('flex items-center gap-0.5 rounded-full p-0.5',
      tone === 'dark' ? 'bg-white/10' : 'bg-[#1f2a5c]/[0.07]', className)}>
      {LANGS.map((l) => (
        <button key={l.code} type="button" onClick={() => setLang(l.code)} aria-pressed={lang === l.code}
          title={l.native} lang={l.code} data-testid={`button-lang-${l.code}`}
          className={cn('rounded-full px-2 py-1 text-[11px] font-extrabold tracking-wide transition-colors sm:px-2.5',
            lang === l.code ? 'bg-[#ffc533] text-[#1f2a5c]'
              : tone === 'dark' ? 'text-white/70 hover:text-white' : 'text-[#1f2a5c]/65 hover:text-[#1f2a5c]')}>
          <span aria-hidden>{l.label}</span><span className="sr-only">{l.native}</span>
        </button>
      ))}
    </div>
  );
}
