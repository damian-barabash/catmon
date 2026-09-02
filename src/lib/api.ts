// Client for the public `site-api` edge function. Strictly follows contract.md.
// Every call degrades gracefully: on network / 404 / 5xx we return empty data
// so the site renders even before the function is deployed.
import { SITE_API_URL, SUPABASE_ANON_KEY, type Lang } from './config'

export type ContactKind = 'partnership' | 'bug' | 'support'
export interface BlogPostSummary {
  slug: string
  title: string
  excerpt: string
  cover_url: string | null
  published_at: string
  tags: string[]
}
export interface BlogPost extends BlogPostSummary {
  body: string
  gallery_urls: string[]
}
export interface Policy {
  code: 'privacy' | 'cookies' | 'terms' | 'rules' | 'data_processing'
  version: number
  title: string
  body: string
  required: boolean
}
export interface SeasonPublic {
  season: { no: number; name: string; name_i18n?: Record<string, string> | null; ends_at: string; rewards: unknown } | null
  top: { place: number; username: string; rating: number; avatar_url: string | null; frame_code: string | null }[]
}
/** Приют из world_settings.donation.shelters (нормализован site-api). */
export interface Shelter {
  id: string
  name: string
  url: string
  heart?: string
  logo_url?: string | null
  title_i18n?: Record<string, string>
  text_i18n?: Record<string, string>
  city_i18n?: Record<string, string>
}
export interface StoreLinks {
  appstore: string
  googleplay: string
  /** enabled — общий тумблер; shelters — список карточек; плоские поля — legacy. */
  donation: {
    enabled: boolean
    url: string
    heart?: string
    shelters?: Shelter[]
    title_i18n?: Record<string, string>
    text_i18n?: Record<string, string>
    title?: string
    text?: string
  } | null
}

export class ApiError extends Error {
  code: string
  constructor(code: string, message?: string) {
    super(message || code)
    this.code = code
  }
}

async function call<T>(action: string, payload: Record<string, unknown> = {}, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(SITE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action, ...payload }),
      signal: ctrl.signal,
    })
    const text = await res.text()
    let json: Record<string, unknown> = {}
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      throw new ApiError('bad_response')
    }
    if (!res.ok || json.error) throw new ApiError(String(json.error || `http_${res.status}`), json.message as string | undefined)
    return json as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError('network', (e as Error).message)
  } finally {
    clearTimeout(t)
  }
}

/** Safe wrapper: never throws, returns fallback on any failure. */
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p
  } catch {
    return fallback
  }
}

export const api = {
  contact(input: { kind: ContactKind; name: string; email: string; message: string; consent: true; website?: string; meta?: Record<string, unknown> }) {
    return call<{ ok: true }>('contact', input)
  },
  blogList(lang: Lang, limit = 12, offset = 0) {
    return safe(call<{ posts: BlogPostSummary[] }>('blog_list', { lang, limit, offset }).then((r) => r.posts ?? []), [] as BlogPostSummary[])
  },
  blogGet(slug: string, lang: Lang) {
    return safe(call<{ post: BlogPost }>('blog_get', { slug, lang }).then((r) => r.post ?? null), null as BlogPost | null)
  },
  policies(lang: Lang) {
    return safe(call<{ policies: Policy[] }>('policies', { lang }).then((r) => r.policies ?? []), [] as Policy[])
  },
  policy(code: Policy['code'], lang: Lang) {
    return safe(call<{ policy: Policy } & Policy>('policy', { code, lang }).then((r) => (r.policy ?? (r.body ? r : null)) as Policy | null), null as Policy | null)
  },
  seasonPublic() {
    return safe(call<SeasonPublic>('season_public'), { season: null, top: [] } as SeasonPublic)
  },
  storeLinks() {
    return safe(call<StoreLinks>('store_links'), { appstore: '', googleplay: '', donation: null } as StoreLinks)
  },
  track(kind: string, path: string, lang: Lang, ref = document.referrer) {
    // fire-and-forget, ignore result
    void safe(call<{ ok: true }>('track', { kind, path, ref, lang }, 5000), { ok: true })
  },
}
