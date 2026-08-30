import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import en, { type Dict } from './en'
import ru from './ru'
import pl from './pl'
import fr from './fr'
import { LANGS, type Lang } from '../lib/config'

const dicts: Record<Lang, Dict> = { en, ru, pl, fr }
const KEY = 'catmon.lang'

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang
  } catch { /* ignore */ }
  const cands = [...(navigator.languages || []), navigator.language]
  for (const c of cands) {
    const short = (c || '').slice(0, 2).toLowerCase()
    if ((LANGS as readonly string[]).includes(short)) return short as Lang
  }
  return 'en'
}

interface Ctx { lang: Lang; t: Dict; setLang: (l: Lang) => void }
const I18nCtx = createContext<Ctx>({ lang: 'en', t: en, setLang: () => {} })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const value = useMemo(() => ({ lang, t: dicts[lang], setLang }), [lang, setLang])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}

export const useI18n = () => useContext(I18nCtx)
export const LANG_NAMES: Record<Lang, string> = { en: 'English', ru: 'Русский', pl: 'Polski', fr: 'Français' }
