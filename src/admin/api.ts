/* CatMon admin API client — strictly follows scratchpad contract.md (admin-api edge).
 * Mocks: `?mock=1` in URL (persisted to localStorage `admin.mock`) or VITE_ADMIN_MOCK=1.
 */
import { mockCall } from './mocks'

export const SUPABASE_URL = 'https://grdhdjksxkstahjtlqqb.supabase.co'
export const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGhkamtzeGtzdGFoanRscXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NTAxMTYsImV4cCI6MjEwMDEyNjExNn0.K8CvWIW5bZJGhVJZfZEsLvbcDPoaHqLzcuSgjSknFlM'
export const ADMIN_API = `${SUPABASE_URL}/functions/v1/admin-api`
export const SITE_API = `${SUPABASE_URL}/functions/v1/site-api`
export const CAT_PHOTO_BASE = `${SUPABASE_URL}/storage/v1/object/public/cat-photos/`
export const SITE_MEDIA_BASE = `${SUPABASE_URL}/storage/v1/object/public/site-media/`

/* ---------- types ---------- */
export type Lang = 'ru' | 'en' | 'pl'
export type I18n = { ru?: string; en?: string; pl?: string; fr?: string }
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type Role = 'owner' | 'admin' | 'editor'

export interface Admin { id: string; email: string; name: string; role: Role; lang: string }

export interface SubsSeries {
  today: number; today_test: number; active_now: number
  daily: { day: string; paid: number; test: number; pln: number }[]
}
export interface DashboardKpi {
  subs_paid: number; subs_test: number; subs_active: number
  donations_pln_real: number; donations_pln_test: number
  players_total: number; players_new: number; players_active_period: number
  dau_today: number; online_now: number
  cats_found_total: number; cats_found_period: number
  gems_bank: number; eyes_bank: number
  chests_opened_period: number
  arena_battles_today: number; arena_battles_period: number
  cats_on_expedition: number
  market_cards: number; market_fish: number
  scans_period: number; scan_reject_rate: number; avg_scan_ms: number
  tournaments_period: number; dungeon_runs_period: number; fish_caught_period: number; messages_period: number
}
export interface DailyPoint {
  day: string; new_players: number; active: number; scans: number; cats: number
  battles: number; chests: number; gems_spent: number; revenue_pln: number
  gems_issued?: number
}
export interface TopCat { id: string; name: string; rarity: Rarity; owners_count: number; photo_path?: string; card_no?: number }
export interface Dashboard {
  kpi: DashboardKpi
  series: { daily: DailyPoint[]; hourly?: { hour: number; scans: number; battles: number }[] }
  map_usage: { day: string; tiles: number }[]
  map_tile_limit: number
  server: { edge_errors_24h: number; ai_busy_24h: number; avg_scan_ms_24h: number }
  rarity_split: Record<Rarity, number>
  top_cats: TopCat[]
  retention: { d1: number; d7: number }
  funnel?: { registered: number; one_cat: number; three_cats: number }
  top_players?: { id: string; username: string; xp: number; cards_count: number; pvp_rating: number }[]
}

export interface PlayerRow {
  id: string; username: string; email?: string | null; is_guest: boolean; providers: string[]
  cards_count: number; xp: number; gems: number; cat_eyes: number; plus_until?: string | null
  banned_until?: string | null; ban_reason?: string | null; last_seen?: string | null; created_at: string; pvp_rating: number
  level?: number; energy?: number; avatar_url?: string | null
}
export interface PlayerCard { id: string; cat_id: string; name: string; rarity: Rarity; card_no?: number; photo_path?: string; evolution?: number; power?: number; obtained_at?: string }
export interface PlayerItem { code: string; qty: number; name?: string; kind?: string; rarity?: Rarity; icon?: string }
export interface Acceptance { code: string; version: number; accepted_at: string; ip?: string; app_build?: number }
export interface Notice { id: string; kind: string; title?: I18n | string; body?: I18n | string; created_at: string; read_at?: string | null; payload?: Record<string, unknown> }
export interface AuditRow { id: string; admin_id?: string; admin_email?: string; action: string; target?: string; payload?: Record<string, unknown>; created_at: string }
export interface PlayerFull extends PlayerRow { cards: PlayerCard[]; items: PlayerItem[]; acceptances: Acceptance[]; notices: Notice[]; audit: AuditRow[] }

export interface Item { code: string; kind: string; name: string; description?: string; rarity: Rarity; icon?: string; plus_only?: boolean }

/* ---------- cats & items admin ---------- */
export const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary']
export const ARCHETYPES = ['hunter', 'guardian', 'shadow', 'royal', 'street', 'mystic', 'explorer', 'lazy', 'chaos', 'noble'] as const
export const COAT_CLASSES = ['black-white', 'calico', 'colorpoint', 'grey', 'orange', 'orange-white', 'solid-black', 'tabby', 'tabby-white', 'tortie']
/** Информативные коридоры суммы 4 статов по редкости (админ может выходить за них) */
export const RARITY_SUM: Record<Rarity, [number, number]> = { common: [200, 276], rare: [284, 324], epic: [332, 360], legendary: [368, 392] }
export interface CatRow {
  id: string; card_no: number; name: string; name_i18n?: I18n | null; rarity: Rarity; archetype: string
  coat_class?: string | null; power: number; owners_count: number; photo_path?: string | null
  first_found_by?: string | null; first_found_username?: string | null; first_found_at?: string
}
export interface CatFull extends CatRow {
  description: string; description_i18n?: I18n | null
  charm: number; agility: number; dominance: number; mystery: number
  lat?: number | null; lng?: number | null; show_location: boolean
}
export interface CatOwner { user_card_id: string; user_id: string; username?: string | null; evolution: number; rarity_boost: number; is_first_discovery: boolean; accessory_code?: string | null; created_at?: string }
export interface CatPatch { name_ru?: string; description_ru?: string; rarity?: Rarity; archetype?: string; coat_class?: string | null; charm?: number; agility?: number; dominance?: number; mystery?: number; show_location?: boolean }
export interface ItemFull { code: string; kind: string; name: string; description: string; rarity: Rarity; effect: Record<string, unknown>; plus_only: boolean; dungeon_only: boolean; exclusive: boolean; dungeon?: number | null; sort?: number; name_i18n?: I18n | null; description_i18n?: I18n | null }
export interface ItemPatch { name_ru?: string; description_ru?: string; rarity?: Rarity; effect?: Record<string, unknown>; plus_only?: boolean; dungeon_only?: boolean; exclusive?: boolean }

export interface BlogPost {
  id: string; slug: string; status: 'draft' | 'published'
  title_i18n: I18n; excerpt_i18n: I18n; body_i18n: I18n
  cover_path?: string | null; gallery: string[]; tags: string[]
  published_at?: string | null; created_at: string; updated_at?: string; translated_at?: string | null
}
export interface ContactRequest {
  id: string; kind: 'partnership' | 'bug' | 'support'; name: string; email: string; message: string
  meta?: Record<string, unknown>; status: 'new' | 'in_progress' | 'done'; created_at: string; ip?: string
}
export interface RewardTier { from: number; to: number; gems: number; chest?: string; key?: boolean; frame?: string; title?: string; items?: { code: string; qty: number }[] }
export interface Season {
  id: string; no: number; name_i18n: I18n; starts_at: string; ends_at: string
  status: 'active' | 'finished'; rewards: RewardTier[]; finished_at?: string | null
}
export interface SeasonResult { user_id: string; username?: string; place: number; rating: number; wins: number; prize: Record<string, unknown>; claimed: boolean }
export interface SeasonPublic { season: { no: number; name: string; ends_at: string; rewards: RewardTier[] } | null; top: { place: number; username: string; rating: number; avatar_url?: string; frame_code?: string }[] }
export interface Policy { code: string; version: number; title_i18n: I18n; body_i18n: I18n; required: boolean; active: boolean; updated_at?: string }
export interface Setting { key: string; value: unknown; updated_at?: string; updated_by?: string }

export class ApiError extends Error {
  code: string; status: number
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status }
}

/* ---------- mock switch / token ---------- */
export function isMock(): boolean {
  try {
    const p = new URLSearchParams(location.search)
    if (p.get('mock') === '1') { localStorage.setItem('admin.mock', '1'); if (p.get('auto') === '1') localStorage.setItem('admin.token', 'mock-token'); if (p.get('theme')) localStorage.setItem('admin.theme', p.get('theme')!); return true }
    if (p.get('mock') === '0') { localStorage.removeItem('admin.mock'); return false }
    if (localStorage.getItem('admin.mock') === '1') return true
  } catch { /* ignore */ }
  return import.meta.env.VITE_ADMIN_MOCK === '1'
}
export function setMock(on: boolean) { try { on ? localStorage.setItem('admin.mock', '1') : localStorage.removeItem('admin.mock') } catch { /* ignore */ } }
export const getToken = () => { try { return localStorage.getItem('admin.token') } catch { return null } }
export const setToken = (t: string | null) => { try { t ? localStorage.setItem('admin.token', t) : localStorage.removeItem('admin.token') } catch { /* ignore */ } }

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn }

/* ---------- core call ---------- */
export async function call<T = unknown>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  if (isMock()) return mockCall(action, params) as Promise<T>
  const headers: Record<string, string> = { 'content-type': 'application/json', apikey: ANON_KEY }
  const tok = getToken()
  if (tok) headers['x-admin-token'] = tok
  let res: Response
  try {
    res = await fetch(ADMIN_API, { method: 'POST', headers, body: JSON.stringify({ action, ...params }) })
  } catch (e) {
    throw new ApiError('network', (e as Error).message, 0)
  }
  let data: Record<string, unknown> = {}
  try { data = await res.json() } catch { /* empty body */ }
  if (res.status === 401 || data.error === 'unauthorized' || data.error === 'bad_token') {
    if (action !== 'login') { setToken(null); onUnauthorized?.() }
    throw new ApiError(String(data.error ?? 'unauthorized'), String(data.message ?? 'Unauthorized'), 401)
  }
  if (!res.ok || data.error) throw new ApiError(String(data.error ?? `http_${res.status}`), String(data.message ?? data.error ?? res.statusText), res.status)
  return data as T
}

/* ---------- normalizers (live backend shapes → UI types) ---------- */
type Raw = Record<string, unknown>
const normAudit = (a: Raw): AuditRow => {
  const join = a.admin_users as { email?: string; name?: string } | undefined
  return { ...(a as unknown as AuditRow), id: String(a.id), admin_email: (a.admin_email as string) ?? join?.email }
}
const normCard = (c: Raw): PlayerCard => {
  const cat = (c.cats ?? {}) as Raw
  const nameI18n = cat.name_i18n as Record<string, string> | undefined
  return {
    id: String(c.id), cat_id: String(c.cat_id ?? cat.id ?? ''),
    name: (c.name as string) ?? nameI18n?.ru ?? (cat.name as string) ?? '—',
    rarity: ((c.rarity ?? cat.rarity) as Rarity) ?? 'common',
    card_no: (c.card_no ?? cat.card_no) as number | undefined,
    photo_path: (c.photo_path ?? cat.photo_path ?? c.photo_url) as string | undefined,
    evolution: c.evolution as number | undefined, power: c.power as number | undefined,
    obtained_at: (c.obtained_at ?? c.found_at) as string | undefined,
  }
}
const normItem = (it: Raw): PlayerItem => {
  const join = (it.items ?? {}) as Raw
  return {
    code: (it.code ?? it.item_code) as string, qty: (it.qty as number) ?? 1,
    name: (it.name ?? join.name) as string | undefined, kind: (it.kind ?? join.kind) as string | undefined,
    rarity: (it.rarity ?? join.rarity) as Rarity | undefined,
  }
}
const normPlayerFull = (r: Raw): PlayerFull => {
  const base = (r.player ?? r) as unknown as PlayerRow
  return {
    ...base,
    cards: ((r.cards as Raw[]) ?? []).map(normCard),
    items: ((r.items as Raw[]) ?? []).map(normItem),
    acceptances: ((r.acceptances as PlayerFull['acceptances']) ?? []),
    notices: ((r.notices as PlayerFull['notices']) ?? []),
    audit: ((r.audit as Raw[]) ?? []).map(normAudit),
  }
}

/* ---------- typed actions (contract order) ---------- */
export const api = {
  // auth
  login: (email: string, password: string) => call<{ token: string; admin: Admin }>('login', { email, password }),
  logout: () => call<{ ok: true }>('logout'),
  me: () => call<{ admin: Admin }>('me'),
  changePassword: (old: string, nw: string) => call<{ ok: true }>('change_password', { old, new: nw }),
  // dashboard
  dashboard: (from: string, to: string) => call<Dashboard>('dashboard', { from, to }),
  subsSeries: (from: string, to: string) => call<SubsSeries>('subs_series', { from, to }),
  // players
  players: (p: { q?: string; filter?: 'all' | 'guests' | 'linked' | 'banned' | 'plus'; sort?: string; limit?: number; offset?: number }) =>
    call<{ players: PlayerRow[]; total: number }>('players', p),
  player: async (id: string): Promise<PlayerFull> => normPlayerFull(await call<Raw>('player', { id })),
  playerAdjust: (p: { id: string; gems?: number; eyes?: number; xp?: number; energy?: number; plus_days?: number; reason: string }) => call<{ ok: true; player?: PlayerRow }>('player_adjust', p),
  playerGiveItem: (id: string, code: string, qty: number) => call<{ ok: true }>('player_give_item', { id, code, qty }),
  playerRemoveItem: (id: string, code: string, qty: number) => call<{ ok: true }>('player_remove_item', { id, code, qty }),
  playerAddCat: (id: string, photo_b64: string, lat?: number, lng?: number) => call<{ card?: PlayerCard; cat?: PlayerCard; ok?: boolean; status?: string; message?: string }>('player_add_cat', { id, photo_b64, lat, lng }),
  playerNotice: (p: { id: string; kind: 'info' | 'gift' | 'warning'; title_i18n?: I18n; body_i18n?: I18n; gems?: number; eyes?: number; items?: { code: string; qty: number }[]; push: boolean }) => call<{ ok: true }>('player_notice', p),
  playerBan: (id: string, until: string | null, reason: string) => call<{ ok: true }>('player_ban', { id, until, reason }),
  playerUnban: (id: string) => call<{ ok: true }>('player_unban', { id }),
  playerDelete: (id: string) => call<{ ok: true }>('player_delete', { id }),
  // settings
  settingsGet: () => call<{ settings: Setting[] }>('settings_get'),
  settingsSet: (key: string, value: unknown) => call<{ ok: true }>('settings_set', { key, value }),
  // policies
  policiesList: () => call<{ policies: Policy[] }>('policies_list'),
  policySave: (p: { code: string; title_ru: string; body_ru: string; required: boolean; bump_version: boolean }) => call<{ ok: true; policy?: Policy }>('policy_save', p),
  policiesTranslateMissing: () => call<{ ok: true; translated?: string[] | null; remaining?: number }>('policies_translate_missing'),
  // blog
  blogList: () => call<{ posts: BlogPost[] }>('blog_list'),
  blogGet: (id: string) => call<{ post: BlogPost }>('blog_get', { id }),
  blogSave: (p: { id?: string; slug: string; title_ru: string; excerpt_ru: string; body_ru: string; tags: string[]; cover_path?: string | null; gallery: string[]; status: 'draft' | 'published' }) => call<{ ok: true; post?: BlogPost; id?: string }>('blog_save', p),
  blogDelete: (id: string) => call<{ ok: true }>('blog_delete', { id }),
  blogUpload: (filename: string, b64: string) => call<{ path: string; url: string }>('blog_upload', { filename, b64 }),
  blogTranslateMissing: () => call<{ ok: true; translated?: string[] | null; remaining?: number }>('blog_translate_missing'),
  // contacts
  contactsList: (status?: string) => call<{ contacts: ContactRequest[] }>('contacts_list', status ? { status } : {}),
  contactSetStatus: (id: string, status: ContactRequest['status']) => call<{ ok: true }>('contact_set_status', { id, status }),
  contactsUnread: () => call<{ count: number }>('contacts_unread'),
  contactDelete: (id: string) => call<{ ok: true }>('contact_delete', { id }),
  // seasons
  seasonsList: () => call<{ seasons: Season[] }>('seasons_list'),
  seasonCurrent: () => call<{ season: Season | null }>('season_current'),
  seasonCreate: (p: { name_ru: string; starts_at: string; ends_at: string; rewards: RewardTier[] }) => call<{ ok: true; season?: Season }>('season_create', p),
  seasonDelete: (id: string) => call<{ ok: true }>('season_delete', { id }),
  seasonFinishNow: (id: string, dry_run = false) => call<{ ok?: true; dry_run?: boolean; preview?: SeasonResult[]; results?: SeasonResult[] }>('season_finish_now', { id, dry_run }),
  seasonResults: (id: string) => call<{ results: SeasonResult[] }>('season_results', { id }),
  // misc
  mapUsage: (days: number) => call<{ map_usage: { day: string; tiles: number }[]; map_tile_limit: number; month_tiles?: number }>('map_usage', { days }),
  audit: async (limit: number, offset = 0): Promise<{ audit: AuditRow[] }> => {
    const r = await call<{ audit: Raw[] }>('audit', { limit, offset })
    return { audit: (r.audit ?? []).map(normAudit) }
  },
  adminsList: () => call<{ admins: Admin[] }>('admins_list'),
  adminCreate: (p: { email: string; password: string; name: string; role: Role }) => call<{ ok: true; admin?: Admin }>('admin_create', p),
  adminDelete: (id: string) => call<{ ok: true }>('admin_delete', { id }),
  aiTranslate: (text_ru: string) => call<{ en: string; pl: string; fr: string }>('ai_translate', { text_ru }),
  // cats & items admin
  catsList: (p: { q?: string; rarity?: string; archetype?: string; coat_class?: string; sort?: string; limit?: number; offset?: number }) =>
    call<{ cats: CatRow[]; total: number }>('cats_list', p),
  catGet: (id: string) => call<{ cat: CatFull; owners: CatOwner[] }>('cat_get', { id }),
  catUpdate: (id: string, patch: CatPatch) => call<{ ok: true; cat?: CatFull; translating?: boolean }>('cat_update', { id, patch }),
  cardUpdate: (p: { user_card_id: string; evolution?: number; rarity_boost?: number }) => call<{ ok: true }>('card_update', p),
  catDelete: (id: string) => call<{ ok: true }>('cat_delete', { id }),
  itemsFull: (p: { q?: string; kind?: string; rarity?: string; flag?: 'plus_only' | 'dungeon_only' | 'exclusive' | ''; limit?: number; offset?: number }) =>
    call<{ items: ItemFull[]; total: number }>('items_list', p),
  itemUpdate: (code: string, patch: ItemPatch) => call<{ ok: true; item?: ItemFull; translating?: boolean }>('item_update', { code, patch }),
  itemsList: async (): Promise<Item[]> => {
    if (isMock()) return (await mockCall('items_list', {}) as { items: Item[] }).items
    try {
      const r = await call<{ items: Item[] }>('items_list')
      if (Array.isArray(r.items)) return r.items
    } catch (e) {
      if ((e as ApiError).status === 401) throw e
    }
    // fallback: items table is publicly readable via PostgREST
    const res = await fetch(`${SUPABASE_URL}/rest/v1/items?select=code,kind,name,description,rarity,icon,plus_only&order=sort.asc&limit=2000`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } })
    if (!res.ok) throw new ApiError('items_fetch', res.statusText, res.status)
    return res.json()
  },
  seasonPublic: async (): Promise<SeasonPublic> => {
    if (isMock()) return mockCall('season_public', {}) as Promise<SeasonPublic>
    const res = await fetch(SITE_API, { method: 'POST', headers: { 'content-type': 'application/json', apikey: ANON_KEY }, body: JSON.stringify({ action: 'season_public' }) })
    if (!res.ok) throw new ApiError('site_api', res.statusText, res.status)
    return res.json()
  },
}

export const catPhotoUrl = (p?: string | null) => (!p ? '' : p.startsWith('http') ? p : CAT_PHOTO_BASE + p.replace(/^\//, ''))
export const catThumbUrl = (p?: string | null, width = 160) => (!p ? '' : p.startsWith('http') ? p : `${SUPABASE_URL}/storage/v1/render/image/public/cat-photos/${p.replace(/^\//, '')}?width=${width}`)
export const mediaUrl = (p?: string | null) => (!p ? '' : p.startsWith('http') ? p : SITE_MEDIA_BASE + p.replace(/^\//, ''))
export const itemIconUrl = (code: string) => `/admin/items/${code}.svg`

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
