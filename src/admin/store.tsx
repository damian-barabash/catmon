import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, getToken, isMock, setToken, setUnauthorizedHandler, type Admin, type Lang } from './api'
import { DICTS, type Key } from './i18n'

/* ---------- theme / lang / auth / toast ---------- */
type Theme = 'light' | 'dark'
interface Toast { id: number; kind: 'ok' | 'err' | 'info'; text: string }
interface Store {
  theme: Theme; setTheme: (t: Theme) => void
  lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string
  admin: Admin | null; setAdmin: (a: Admin | null) => void; ready: boolean
  login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>
  toasts: Toast[]; toast: (text: string, kind?: Toast['kind']) => void; dismiss: (id: number) => void
  mock: boolean
}
const Ctx = createContext<Store | null>(null)
const ls = { get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* */ } } }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => { try { const q = new URLSearchParams(location.search).get('theme'); if (q === 'dark' || q === 'light') { ls.set('admin.theme', q); return q } } catch { /* */ } return (ls.get('admin.theme') as Theme) || 'light' })
  const [lang, setLangState] = useState<Lang>(() => { const l = ls.get('admin.lang'); return (l === 'en' || l === 'pl' || l === 'ru') ? l : 'ru' })
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [ready, setReady] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const setTheme = (t: Theme) => { setThemeState(t); ls.set('admin.theme', t) }
  const setLang = (l: Lang) => { setLangState(l); ls.set('admin.lang', l) }
  const t = useCallback((k: Key) => DICTS[lang][k] ?? k, [lang])
  const dismiss = useCallback((id: number) => setToasts(ts => ts.filter(x => x.id !== id)), [])
  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts(ts => [...ts, { id, kind, text }])
    setTimeout(() => dismiss(id), kind === 'err' ? 6000 : 3500)
  }, [dismiss])

  useEffect(() => {
    setUnauthorizedHandler(() => { setAdmin(null); toast(DICTS[lang].unauthorized, 'err') })
  }, [lang, toast])

  useEffect(() => {
    let alive = true
    const tok = getToken()
    if (!tok) { setReady(true); return }
    api.me().then(r => { if (alive) { setAdmin(r.admin); if (r.admin.lang && ['ru', 'en', 'pl'].includes(r.admin.lang) && !ls.get('admin.lang')) setLangState(r.admin.lang as Lang) } }).catch(() => { setToken(null) }).finally(() => alive && setReady(true))
    return () => { alive = false }
  }, [])

  const login = async (email: string, password: string) => {
    const r = await api.login(email, password)
    setToken(r.token); setAdmin(r.admin)
  }
  const logout = async () => { try { await api.logout() } catch { /* ignore */ } setToken(null); setAdmin(null); clearAdminCache() }

  const value = useMemo<Store>(() => ({ theme, setTheme, lang, setLang, t, admin, setAdmin, ready, login, logout, toasts, toast, dismiss, mock: isMock() }), [theme, lang, t, admin, ready, toasts, toast, dismiss])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useStore() { const s = useContext(Ctx); if (!s) throw new Error('StoreProvider missing'); return s }
export const useT = () => useStore().t

/* ---------- async helper: stale-while-revalidate cache in localStorage ---------- */
const CACHE_PREFIX = 'admin.cache.'
function cacheGet<T>(key: string): T | null {
  try { const raw = localStorage.getItem(CACHE_PREFIX + key); if (!raw) return null; return (JSON.parse(raw) as { d: T }).d ?? null } catch { return null }
}
function cacheSet(key: string, d: unknown) {
  try { const raw = JSON.stringify({ t: Date.now(), d }); if (raw.length < 1_500_000) localStorage.setItem(CACHE_PREFIX + key, raw) } catch { /* quota */ }
}
export function clearAdminCache() {
  try { Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX)).forEach(k => localStorage.removeItem(k)) } catch { /* ignore */ }
}

/* tiny pub/sub: how many cached views are refreshing in background right now */
let refreshN = 0
const refreshSubs = new Set<(n: number) => void>()
const bumpRefresh = (d: number) => { refreshN = Math.max(0, refreshN + d); refreshSubs.forEach(f => f(refreshN)) }
export function useRefreshing() {
  const [n, setN] = useState(refreshN)
  useEffect(() => { refreshSubs.add(setN); setN(refreshN); return () => { refreshSubs.delete(setN) } }, [])
  return n > 0
}

/** useAsync(fn, deps, cacheKey?) — with cacheKey: last good response is drawn instantly from
 *  localStorage (no skeleton), then refreshed in background and swapped in (SWR). */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[], cacheKey?: string) {
  const [state, set] = useState<{ data: T | null; loading: boolean; error: string | null }>(() => {
    const cached = cacheKey ? cacheGet<T>(cacheKey) : null
    return { data: cached, loading: !cached, error: null }
  })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let alive = true
    const cached = cacheKey ? cacheGet<T>(cacheKey) : null
    if (cached) { set({ data: cached, loading: false, error: null }); bumpRefresh(1) }
    else set(s => ({ ...s, loading: true, error: null }))
    fn().then(d => { if (cacheKey) cacheSet(cacheKey, d); if (alive) set({ data: d, loading: false, error: null }) })
      .catch(e => alive && set(s => ({ ...s, loading: false, error: (e as Error).message || 'error' })))
      .finally(() => { if (cached) bumpRefresh(-1) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { ...state, reload: () => setTick(x => x + 1), setData: (d: T) => { if (cacheKey) cacheSet(cacheKey, d); set(s => ({ ...s, data: d })) } }
}

/* ---------- formatting ---------- */
export const fmtN = (n: number | undefined | null, lang = 'ru') => (n == null ? '—' : new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-GB').format(n))
export const fmtPct = (x: number | undefined | null) => (x == null ? '—' : `${Math.round(x * 100)}%`)
export const fmtDate = (s?: string | null, withTime = false) => {
  if (!s) return '—'
  const d = new Date(s); if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) })
}
export const fmtAgo = (s?: string | null) => {
  if (!s) return '—'
  const diff = (Date.now() - new Date(s).getTime()) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}
export const i18nText = (v: unknown, lang: Lang = 'ru'): string => {
  if (!v) return ''
  if (typeof v === 'string') return v
  const o = v as Record<string, string>
  return o[lang] ?? o.ru ?? o.en ?? Object.values(o)[0] ?? ''
}
export const dayStr = (d: Date) => d.toISOString().slice(0, 10)
