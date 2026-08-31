/* Deterministic in-memory mocks for admin-api (dev only, `?mock=1`). */
import type { Admin, AuditRow, BlogPost, ContactRequest, Dashboard, Item, PlayerFull, PlayerRow, Policy, Rarity, Season, SeasonResult, Setting } from './api'

let seed = 7
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1))
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]
const iso = (d: Date) => d.toISOString()
const daysAgo = (n: number, h = 12) => { const d = new Date(); d.setUTCHours(h, 0, 0, 0); d.setUTCDate(d.getUTCDate() - n); return d }
const dayKey = (d: Date) => d.toISOString().slice(0, 10)
const delay = (ms = 250) => new Promise(r => setTimeout(r, ms))

const RAR: Rarity[] = ['common', 'rare', 'epic', 'legendary']
const NAMES = ['Мурзик', 'Барсик', 'Белый Пятныш', 'Рыжий Барон', 'Тень', 'Лунная Кошка', 'Дымок', 'Маркиз', 'Пират', 'Снежок', 'Гром', 'Уголёк', 'Персик', 'Лапка', 'Сфинкс', 'Бублик']
const USERS = ['kotofey', 'nastya_w', 'mrwhiskers', 'stasya', 'dmytrii', 'pawel_k', 'lena.cat', 'purrfect', 'alex_99', 'warsaw_hunter', 'nightcat', 'kittyq', 'mila', 'oleg_t', 'jane', 'tomasz', 'ira_v', 'fluffmaster', 'zosia', 'roman']
const ITEM_CODES = ['acc_rune_stone', 'acc_dragon', 'a4_c_street_bowtie', 'a4_e_crystal_crown', 'a4_l_cosmic_feather', 'a4_c_knit_goggles', 'a4_e_storm_bell', 'a4_l_divine_anklet', 'a4_c_paper_flower', 'a4_e_lunar_horns']

const admins: Admin[] = [
  { id: 'a1', email: 'dmytrii.barabash@greywolfgroup.pl', name: 'Dmytrii', role: 'owner', lang: 'ru' },
  { id: 'a2', email: 'editor@catmongame.app', name: 'Editor', role: 'editor', lang: 'pl' },
]

const players: PlayerRow[] = Array.from({ length: 137 }, (_, i) => {
  const guest = rnd() < 0.3
  const banned = rnd() < 0.05
  const plus = rnd() < 0.2
  return {
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    username: `${USERS[i % USERS.length]}${i >= USERS.length ? i : ''}`,
    email: guest ? null : `${USERS[i % USERS.length]}${i}@example.com`,
    is_guest: guest,
    providers: guest ? [] : [pick(['email', 'google', 'apple'])],
    cards_count: ri(0, 40), xp: ri(0, 25000), level: ri(1, 30), gems: ri(0, 9000), cat_eyes: ri(0, 400), energy: ri(0, 8),
    plus_until: plus ? iso(daysAgo(-ri(1, 60))) : null,
    banned_until: banned ? (rnd() < 0.5 ? null : iso(daysAgo(-ri(1, 30)))) : undefined,
    ban_reason: banned ? 'Мультиаккаунт и абуз маркета' : null,
    last_seen: iso(daysAgo(ri(0, 20), ri(0, 23))), created_at: iso(daysAgo(ri(1, 120))), pvp_rating: 1000 + ri(-200, 600),
  }
})
players[0].banned_until = undefined; players[0].ban_reason = null

const items: Item[] = [
  ...ITEM_CODES.map((code, i) => ({ code, kind: 'accessory', name: ['Рунный камень', 'Чешуя дракона', 'Уличная бабочка', 'Хрустальная корона', 'Космическое перо', 'Вязаные очки', 'Штормовой колокольчик', 'Божественный браслет', 'Бумажный цветок', 'Лунные рога'][i], rarity: RAR[i % 4], plus_only: false })),
  { code: 'battle_chest_rare', kind: 'battle_chest', name: 'Боевой сундук (rare)', rarity: 'rare' },
  { code: 'chest_key_epic', kind: 'chest_key', name: 'Ключ (epic)', rarity: 'epic' },
  { code: 'boost_xp_x2', kind: 'boost', name: 'Бустер XP ×2', rarity: 'common' },
  { code: 'title_newbie_hunter', kind: 'title', name: 'Титул «Охотник-новичок»', rarity: 'rare' },
  { code: 'frame_first_week', kind: 'frame', name: 'Рамка «Первая неделя»', rarity: 'rare' },
  { code: 'fish_calm_01', kind: 'fish', name: 'Рыба тихой заводи', rarity: 'common' },
]

const itemEffects: Record<string, Record<string, unknown>> = {
  acc_rune_stone: { stats: { mystery: 5 } },
  acc_dragon: { stats: { dominance: 6, agility: 6 }, active: true, special: 'fear' },
  a4_c_street_bowtie: { stats: { charm: 3 } },
  a4_e_crystal_crown: { stats: { charm: 7, mystery: 6 }, special: 'mirror' },
  a4_l_cosmic_feather: { stats: { mystery: 9, agility: 9 }, active: true, special: 'wish' },
  a4_c_knit_goggles: { stats: { agility: 4 } },
  a4_e_storm_bell: { stats: { dominance: 7, agility: 6 }, active: true, special: 'opener' },
  a4_l_divine_anklet: { stats: { charm: 10, mystery: 10 }, special: 'guardian_angel', charges: 1 },
  a4_c_paper_flower: { stats: { charm: 3, agility: 2 } },
  a4_e_lunar_horns: { stats: { mystery: 7, dominance: 6 }, special: 'aura' },
  boost_xp_x2: { type: 'xp_scans', scans: 5 },
}

const settings: Setting[] = [
  { key: 'maintenance', value: { on: false, message_i18n: { ru: 'Технические работы, вернёмся через час' } } },
  { key: 'scan_limits', value: { hour: 12, day: 60, plus_hour: 20, plus_day: 100 } },
  { key: 'energy', value: { cap: 5, plus_cap: 8, regen_min: 30 } },
  { key: 'chest_prices', value: { street: 150, gold: 400 } },
  { key: 'tournament', value: { entry_gems: 100 } },
  { key: 'market_fee_pct', value: 10 },
  { key: 'xp_event_mult', value: 1 },
  { key: 'min_build', value: 0 },
  { key: 'donation', value: { enabled: false, url: '', title_i18n: { ru: '' }, text_i18n: { ru: '' } } },
  { key: 'store_links', value: { appstore: '', googleplay: '' } },
  { key: 'map_tile_limit', value: 100000 },
  { key: 'experimental_flags', value: { newbie_trail: true, patrol: true } },
].map(s => ({ ...s, updated_at: iso(daysAgo(3)), updated_by: 'a1' }))

const POL = [
  ['privacy', 'Политика конфиденциальности', true], ['cookies', 'Политика cookies', false], ['terms', 'Условия использования', true],
  ['rules', 'Правила игры', true], ['data_processing', 'Согласие на обработку данных', true],
] as const
const policies: Policy[] = POL.map(([code, title, required]) => ({
  code, version: code === 'terms' ? 2 : 1, required, active: true, updated_at: iso(daysAgo(10)),
  title_i18n: { ru: title, en: title + ' (en)', pl: title + ' (pl)', fr: title + ' (fr)' },
  body_i18n: { ru: `# ${title}\n\n## 1. Общие положения\n\nНастоящий документ регулирует использование приложения **CatMon**.\n\n## 2. Данные\n\n- фото котов\n- геолокация (по желанию)\n- e-mail при привязке аккаунта\n\n## 3. Контакты\n\nsupport@catmongame.app`, en: '...', pl: '...', fr: '...' },
}))

const posts: BlogPost[] = [
  { id: 'b1', slug: 'catmon-launch', status: 'published', title_i18n: { ru: 'CatMon выходит в свет', en: 'CatMon launches', pl: 'CatMon startuje', fr: '…' }, excerpt_i18n: { ru: 'Первая версия игры уже доступна по OTA-ссылке.' }, body_i18n: { ru: '# Привет!\n\nМы запускаем **CatMon** — игру, где каждый кот становится карточкой.\n\n- сканируй\n- собирай\n- сражайся' }, cover_path: 'blog/cover1.jpg', gallery: ['blog/g1.jpg', 'blog/g2.jpg'], tags: ['релиз', 'новости'], published_at: iso(daysAgo(12)), created_at: iso(daysAgo(13)), translated_at: iso(daysAgo(12)) },
  { id: 'b2', slug: 'season-1-preview', status: 'draft', title_i18n: { ru: 'Сезон 1: что ждёт на Арене' }, excerpt_i18n: { ru: 'Призы, рамки и таймер.' }, body_i18n: { ru: 'Скоро.' }, cover_path: null, gallery: [], tags: ['арена'], published_at: null, created_at: iso(daysAgo(2)), translated_at: null },
  { id: 'b3', slug: 'how-scan-works', status: 'published', title_i18n: { ru: 'Как работает скан кота', en: 'How cat scanning works', pl: 'Jak działa skan kota', fr: '…' }, excerpt_i18n: { ru: 'Гейт → отпечаток → дедуп → карточка.' }, body_i18n: { ru: '## Пайплайн\n\n1. Гейт\n2. Отпечаток\n3. Дедупликация' }, cover_path: 'blog/cover3.jpg', gallery: [], tags: ['ИИ', 'технологии'], published_at: iso(daysAgo(30)), created_at: iso(daysAgo(31)), translated_at: iso(daysAgo(30)) },
]

const contacts: ContactRequest[] = Array.from({ length: 14 }, (_, i) => ({
  id: `c${i + 1}`, kind: pick(['partnership', 'bug', 'support'] as const), name: pick(['Anna', 'Paweł', 'Ирина', 'Tom', 'Zosia']), email: `user${i}@mail.com`,
  message: pick(['Хотим разместить постер в приюте, как связаться?', 'После скана приложение вылетает на iPhone 12', 'Не пришли кристаллы за сундук', 'Proposal: collaboration with pet shop chain', 'Jak usunąć konto?']),
  status: pick(['new', 'new', 'in_progress', 'done'] as const), created_at: iso(daysAgo(ri(0, 25), ri(8, 20))), meta: { build: 68, os: pick(['iOS 19', 'Android 15']) }, ip: '83.1.2.3',
}))

const rewards = [
  { from: 1, to: 1, gems: 2000, chest: 'legendary', key: true, frame: 'frame_season_1_1', title: 'Чемпион сезона' },
  { from: 2, to: 2, gems: 1200, chest: 'legendary', key: true, frame: 'frame_season_1_2' },
  { from: 3, to: 3, gems: 800, chest: 'legendary', key: true, frame: 'frame_season_1_3' },
  { from: 4, to: 10, gems: 500, chest: 'epic', key: true }, { from: 11, to: 30, gems: 250, chest: 'rare' }, { from: 31, to: 100, gems: 100, chest: 'street' },
]
const seasons: Season[] = [
  { id: 's0', no: 0, name_i18n: { ru: 'Сезон 0 — Пробный' }, starts_at: '2026-06-01T00:00:00Z', ends_at: '2026-08-31T21:59:00Z', status: 'finished', rewards, finished_at: '2026-08-31T22:10:00Z' },
  { id: 's1', no: 1, name_i18n: { ru: 'Сезон 1 — Осенняя охота', en: 'Season 1 — Autumn Hunt', pl: 'Sezon 1 — Jesienne łowy' }, starts_at: '2026-09-01T00:00:00Z', ends_at: '2026-12-31T22:59:00Z', status: 'active', rewards, finished_at: null },
]
const seasonResults = (): SeasonResult[] => players.slice(0, 40).map((p, i) => ({ user_id: p.id, username: p.username, place: i + 1, rating: 1900 - i * 17, wins: 60 - i, prize: rewards.find(r => i + 1 >= r.from && i + 1 <= r.to) ?? {}, claimed: rnd() < 0.5 }))

const audit: AuditRow[] = Array.from({ length: 60 }, (_, i) => ({
  id: `au${i}`, admin_id: 'a1', admin_email: admins[0].email, action: pick(['login', 'player_adjust', 'player_ban', 'settings_set', 'blog_save', 'policy_save', 'player_give_item', 'season_create']),
  target: pick(players).id, payload: { gems: ri(-100, 500), reason: 'тест' }, created_at: iso(daysAgo(ri(0, 30), ri(0, 23))),
}))

function dashboard(from: string, to: string): Dashboard {
  const f = new Date(from); const t = new Date(to)
  const n = Math.max(1, Math.min(120, Math.round((t.getTime() - f.getTime()) / 864e5) + 1))
  const daily = Array.from({ length: n }, (_, i) => { const d = new Date(f); d.setUTCDate(d.getUTCDate() + i); return { day: dayKey(d), new_players: ri(2, 25), active: ri(20, 90), scans: ri(30, 180), cats: ri(5, 60), battles: ri(10, 120), chests: ri(5, 50), gems_spent: ri(500, 6000), gems_issued: ri(800, 7000), revenue_pln: ri(0, 220) } })
  const mapUsage = Array.from({ length: 30 }, (_, i) => ({ day: dayKey(daysAgo(29 - i)), tiles: 1500 + i * 120 + ri(-300, 900) }))
  return {
    kpi: { subs_paid: 23, subs_test: 7, subs_active: 28, donations_pln_real: 410, donations_pln_test: 55, players_total: players.length, players_new: daily.reduce((s, d) => s + d.new_players, 0), players_active_period: 96, dau_today: 41, online_now: 6, cats_found_total: 94, cats_found_period: daily.reduce((s, d) => s + d.cats, 0), gems_bank: 184320, eyes_bank: 9120, chests_opened_period: daily.reduce((s, d) => s + d.chests, 0), arena_battles_today: 37, arena_battles_period: daily.reduce((s, d) => s + d.battles, 0), cats_on_expedition: 11, market_cards: 34, market_fish: 12, scans_period: daily.reduce((s, d) => s + d.scans, 0), scan_reject_rate: 0.23, avg_scan_ms: 13400, tournaments_period: 4, dungeon_runs_period: 212, fish_caught_period: 318, messages_period: 1421 },
    series: { daily, hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, scans: ri(0, 40) + (hour > 9 && hour < 22 ? 20 : 0), battles: ri(0, 30) + (hour > 17 ? 15 : 0) })) },
    map_usage: mapUsage, map_tile_limit: 100000,
    server: { edge_errors_24h: 3, ai_busy_24h: 12, avg_scan_ms_24h: 12800 },
    rarity_split: { common: 48, rare: 27, epic: 14, legendary: 5 },
    top_cats: NAMES.slice(0, 8).map((name, i) => ({ id: `cat${i}`, name, rarity: RAR[Math.min(3, Math.floor(i / 2))], owners_count: 40 - i * 4, card_no: i + 1 })),
    retention: { d1: 0.46, d7: 0.21 },
    funnel: { registered: 137, one_cat: 98, three_cats: 61 },
    top_players: [...players].sort((a, b) => b.xp - a.xp).slice(0, 8).map(p => ({ id: p.id, username: p.username, xp: p.xp, cards_count: p.cards_count, pvp_rating: p.pvp_rating })),
  }
}

function playerFull(id: string): PlayerFull {
  const p = players.find(x => x.id === id) ?? players[0]
  const cards = Array.from({ length: Math.min(p.cards_count, 24) }, (_, i) => ({ id: `card${i}`, cat_id: `cat${i}`, name: NAMES[i % NAMES.length], rarity: RAR[i % 4], card_no: i + 1, photo_path: i === 2 ? 'cats/693f0942-d125-455b-805c-c524567b83c1.webp' : undefined, evolution: ri(0, 3), power: ri(40, 99), obtained_at: iso(daysAgo(ri(0, 60))) }))
  return {
    ...p, cards,
    items: ITEM_CODES.slice(0, 6).map((code, i) => ({ code, qty: ri(1, 3), name: items[i].name, kind: 'accessory', rarity: RAR[i % 4] })),
    acceptances: policies.map(pl => ({ code: pl.code, version: pl.version, accepted_at: iso(daysAgo(5)), ip: '83.1.2.3', app_build: 68 })),
    notices: [{ id: 'n1', kind: 'gift', title: { ru: 'Подарок от команды' }, body: { ru: '+100 кристаллов за баг-репорт' }, created_at: iso(daysAgo(3)), read_at: iso(daysAgo(2)) }, { id: 'n2', kind: 'season', title: { ru: 'Сезон 0 завершён' }, created_at: iso(daysAgo(1)), read_at: null }],
    audit: audit.filter(a => a.target === p.id).slice(0, 10),
  }
}

export async function mockCall(action: string, params: Record<string, unknown>): Promise<unknown> {
  await delay()
  const P = params as Record<string, never>
  switch (action) {
    case 'login': {
      if (P.password !== 'CatMon-Admin-2026!') throw Object.assign(new Error('Неверный пароль'), { code: 'bad_credentials', status: 400 })
      return { token: 'mock-token', admin: admins[0] }
    }
    case 'logout': return { ok: true }
    case 'me': return { admin: admins[0] }
    case 'change_password': return { ok: true }
    case 'dashboard': return dashboard(P.from, P.to)
    case 'players': {
      const q = String(P.q ?? '').toLowerCase(); const filter = P.filter ?? 'all'
      let list = players.filter(p => !q || p.username.toLowerCase().includes(q) || (p.email ?? '').toLowerCase().includes(q))
      if (filter === 'guests') list = list.filter(p => p.is_guest)
      if (filter === 'linked') list = list.filter(p => !p.is_guest)
      if (filter === 'banned') list = list.filter(p => p.banned_until !== undefined && p.ban_reason)
      if (filter === 'plus') list = list.filter(p => p.plus_until && new Date(p.plus_until) > new Date())
      const [k, dir] = String(P.sort ?? 'created_at:desc').split(':')
      list = [...list].sort((a, b) => { const av = (a as unknown as Record<string, unknown>)[k] as string | number ?? 0; const bv = (b as unknown as Record<string, unknown>)[k] as string | number ?? 0; return (av > bv ? 1 : av < bv ? -1 : 0) * (dir === 'asc' ? 1 : -1) })
      const off = Number(P.offset ?? 0); const lim = Number(P.limit ?? 25)
      return { players: list.slice(off, off + lim), total: list.length }
    }
    case 'player': return playerFull(P.id)
    case 'player_adjust': { const p = players.find(x => x.id === P.id)!; p.gems += Number(P.gems ?? 0); p.cat_eyes += Number(P.eyes ?? 0); p.xp += Number(P.xp ?? 0); return { ok: true, player: p } }
    case 'player_give_item': case 'player_remove_item': case 'player_notice': case 'player_delete': return { ok: true }
    case 'player_add_cat': return { ok: true, card: { id: 'newcard', cat_id: 'newcat', name: 'Новый Кот', rarity: 'epic', card_no: 95, power: 88, photo_path: 'cats/693f0942-d125-455b-805c-c524567b83c1.webp' } }
    case 'player_ban': { const p = players.find(x => x.id === P.id)!; p.banned_until = P.until ?? null; p.ban_reason = P.reason; return { ok: true } }
    case 'player_unban': { const p = players.find(x => x.id === P.id)!; p.banned_until = undefined; p.ban_reason = null; return { ok: true } }
    case 'settings_get': return { settings }
    case 'settings_set': { const s = settings.find(x => x.key === P.key); if (s) { s.value = P.value; s.updated_at = new Date().toISOString() } else settings.push({ key: P.key, value: P.value }); return { ok: true } }
    case 'policies_list': return { policies }
    case 'policy_save': { const pl = policies.find(x => x.code === P.code)!; pl.title_i18n = { ...pl.title_i18n, ru: P.title_ru }; pl.body_i18n = { ...pl.body_i18n, ru: P.body_ru }; pl.required = P.required; if (P.bump_version) pl.version++; pl.updated_at = new Date().toISOString(); return { ok: true, policy: pl } }
    case 'blog_list': return { posts }
    case 'blog_get': return { post: posts.find(p => p.id === P.id) }
    case 'blog_save': {
      const now = new Date().toISOString()
      let post = posts.find(p => p.id === P.id)
      if (!post) { post = { id: `b${posts.length + 1}`, created_at: now } as BlogPost; posts.unshift(post) }
      Object.assign(post, { slug: P.slug, status: P.status, tags: P.tags, cover_path: P.cover_path, gallery: P.gallery, title_i18n: { ru: P.title_ru, en: '[en] ' + P.title_ru, pl: '[pl] ' + P.title_ru, fr: '[fr] ' + P.title_ru }, excerpt_i18n: { ru: P.excerpt_ru }, body_i18n: { ru: P.body_ru }, updated_at: now, translated_at: now, published_at: P.status === 'published' ? (post.published_at ?? now) : null })
      return { ok: true, post, id: post.id }
    }
    case 'blog_delete': { const i = posts.findIndex(p => p.id === P.id); if (i >= 0) posts.splice(i, 1); return { ok: true } }
    case 'blog_upload': { const path = `blog/${Date.now()}_${P.filename}`; return { path, url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23EFEDE7'/><text x='200' y='160' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%236F6C64'>${encodeURIComponent(String(P.filename))}</text></svg>` } }
    case 'contacts_unread': return { count: 1 }
    case 'contact_delete': return { ok: true }
    case 'contacts_list': return { contacts: P.status ? contacts.filter(c => c.status === P.status) : contacts }
    case 'contact_set_status': { const c = contacts.find(x => x.id === P.id); if (c) c.status = P.status; return { ok: true } }
    case 'seasons_list': return { seasons }
    case 'season_current': return { season: seasons.find(s => s.status === 'active') ?? null }
    case 'season_create': { const s: Season = { id: `s${seasons.length}`, no: seasons.length, name_i18n: { ru: P.name_ru }, starts_at: P.starts_at, ends_at: P.ends_at, status: 'active', rewards: P.rewards, finished_at: null }; seasons.push(s); return { ok: true, season: s } }
    case 'season_delete': { const i = seasons.findIndex(x => x.id === P.id); if (i >= 0) seasons.splice(i, 1); return { ok: true } }
    case 'policies_translate_missing': return { ok: true, translated: ['privacy'], remaining: 0 }
    case 'blog_translate_missing': return { ok: true, translated: null, remaining: 0 }
    case 'season_finish_now': { if (P.dry_run) return { dry_run: true, preview: seasonResults().slice(0, 10) }; const s = seasons.find(x => x.id === P.id); if (s) { s.status = 'finished'; s.finished_at = new Date().toISOString() }; return { ok: true, results: seasonResults() } }
    case 'season_results': return { results: seasonResults() }
    case 'season_public': return { season: { no: 1, name: 'Сезон 1 — Осенняя охота', ends_at: '2026-12-31T22:59:00Z', rewards }, top: players.slice(0, 100).map((p, i) => ({ place: i + 1, username: p.username, rating: 1900 - i * 8, frame_code: i < 3 ? 'frame_champion_belt' : undefined })) }
    case 'map_usage': { const days = Number(P.days ?? 30); return { map_usage: Array.from({ length: days }, (_, i) => ({ day: dayKey(daysAgo(days - 1 - i)), tiles: 1200 + i * 90 + ri(-200, 700) })), map_tile_limit: 100000 } }
    case 'audit': return { audit: audit.slice(Number(P.offset ?? 0), Number(P.offset ?? 0) + Number(P.limit ?? 50)) }
    case 'admins_list': return { admins }
    case 'admin_create': { const a: Admin = { id: `a${admins.length + 1}`, email: P.email, name: P.name, role: P.role, lang: 'ru' }; admins.push(a); return { ok: true, admin: a } }
    case 'admin_delete': { const i = admins.findIndex(a => a.id === P.id); if (i > 0) admins.splice(i, 1); return { ok: true } }
    case 'ai_translate': return { en: '[en] ' + P.text_ru, pl: '[pl] ' + P.text_ru, fr: '[fr] ' + P.text_ru }
    case 'items_list': return { items: items.map(i => ({ description: '', effect: itemEffects[i.code] ?? {}, plus_only: false, dungeon_only: false, exclusive: false, ...i })), total: items.length }
    case 'cats_list': {
      let list = [...mockCats]
      const s = String(P.q ?? '').toLowerCase()
      if (s) list = list.filter(c => c.name.toLowerCase().includes(s) || String(c.card_no) === s)
      if (P.rarity) list = list.filter(c => c.rarity === P.rarity)
      if (P.archetype) list = list.filter(c => c.archetype === P.archetype)
      if (P.coat_class) list = list.filter(c => c.coat_class === P.coat_class)
      const sort = String(P.sort ?? 'card_no')
      if (sort === 'owners') list.sort((a, b) => b.owners_count - a.owners_count)
      else if (sort === 'power') list.sort((a, b) => b.power - a.power)
      else list.sort((a, b) => a.card_no - b.card_no)
      const off = Number(P.offset ?? 0), lim = Number(P.limit ?? 24)
      return { cats: list.slice(off, off + lim), total: list.length }
    }
    case 'cat_get': {
      const c = mockCats.find(x => x.id === P.id) ?? mockCats[0]
      return { cat: c, owners: c.owners_count ? players.slice(0, c.owners_count).map((p, i) => ({ user_card_id: `uc-${c.id}-${i}`, user_id: p.id, username: p.username, evolution: i % 6, rarity_boost: i % 4, is_first_discovery: i === 0, accessory_code: i % 2 ? 'acc_rune_stone' : null, created_at: iso(daysAgo(i * 2)) })) : [] }
    }
    case 'cat_update': { const c = mockCats.find(x => x.id === P.id); if (c) Object.assign(c, P.patch ?? {}); return { ok: true } }
    case 'card_update': return { ok: true }
    case 'cat_delete': { const i = mockCats.findIndex(x => x.id === P.id); if (i >= 0) mockCats.splice(i, 1); return { ok: true } }
    case 'item_update': return { ok: true }
    default: throw Object.assign(new Error(`mock: unknown action ${action}`), { code: 'unknown_action', status: 400 })
  }
}

/* ---------- cats (мир котов, мок) ---------- */
const COATS = ['tabby', 'solid-black', 'calico', 'grey', 'orange', 'black-white']
const ARCH = ['hunter', 'guardian', 'shadow', 'royal', 'street', 'mystic', 'explorer', 'lazy', 'chaos', 'noble']
const mockCats = NAMES.map((name, i) => {
  const charm = 40 + ((i * 7) % 55), agility = 45 + ((i * 11) % 50), dominance = 35 + ((i * 13) % 60), mystery = 50 + ((i * 5) % 45)
  return {
    id: `cat-${i + 1}`, card_no: i + 1, name, name_i18n: { ru: name }, description: 'Очень загадочный уличный кот из мок-данных.', description_i18n: { ru: 'Очень загадочный уличный кот из мок-данных.' },
    rarity: RAR[i % 4], archetype: ARCH[i % 10], coat_class: COATS[i % 6],
    charm, agility, dominance, mystery, power: Math.round((charm + agility + dominance + mystery) / 4),
    owners_count: i % 5, photo_path: null as string | null, lat: 52.2 + i * 0.01, lng: 21.0 + i * 0.01, show_location: i % 2 === 0,
    first_found_by: players[i % players.length].id, first_found_username: players[i % players.length].username, first_found_at: iso(daysAgo(i * 3)),
  }
})
