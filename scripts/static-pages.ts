// Vite-плагин (только build): HTML-файл на каждый публичный маршрут + sitemap.xml.
//
// Зачем: GitHub Pages отдаёт SPA-фолбэк 404.html с HTTP 404 — такие страницы не индексируются.
// Для `/contact` Pages отдаёт `contact.html` с кодом 200 (без 301 на слэш), поэтому кладём
// `<route>.html` с собственным <head> (title/description/canonical/hreflang/og) для EN (x-default).
// Язык ru/pl/fr выбирается на клиенте по `?lang=xx` (src/i18n), там же обновляется <head>.
// Посты блога берём из site-api на момент сборки: новый пост получит свой HTML после следующего деплоя
// (до этого он открывается через 404.html и работает, но отдаётся с кодом 404).
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'
import en from '../src/i18n/en.ts'
import { LANGS, SITE_API_URL, SITE_URL, SUPABASE_ANON_KEY } from '../src/lib/config.ts'

type MetaKey = keyof typeof en.meta
interface Page { path: string; title: string; desc: string; image?: string; noindex?: boolean; home?: boolean; lastmod?: string; priority?: string }

const STATIC: { path: string; key: MetaKey; priority: string }[] = [
  { path: '/', key: 'home', priority: '1.0' },
  { path: '/contact', key: 'contact', priority: '0.6' },
  { path: '/blog', key: 'blog', priority: '0.7' },
  { path: '/season', key: 'season', priority: '0.6' },
  { path: '/privacy', key: 'privacy', priority: '0.3' },
  { path: '/cookies', key: 'cookies', priority: '0.3' },
  { path: '/terms', key: 'terms', priority: '0.3' },
  { path: '/rules', key: 'rules', priority: '0.4' },
  { path: '/data-processing', key: 'data_processing', priority: '0.3' },
]
// статические экраны админки: чтобы прямой заход / F5 отдавал 200, а не 404 (noindex, Disallow в robots)
const ADMIN = ['login', 'players', 'cats', 'items', 'ai-lab', 'blog', 'contacts', 'seasons', 'settings', 'policies', 'map', 'audit', 'admins', 'profile']

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// схема та же, что в src/lib/seo.ts (langUrl): EN — чистый путь, остальные — ?lang=xx
const langUrl = (path: string, lang: string) => SITE_URL + path + (lang === 'en' ? '' : `?lang=${lang}`)

function setTag(html: string, re: RegExp, tag: string): string {
  if (!re.test(html)) throw new Error(`static-pages: tag not found ${re}`)
  return html.replace(re, tag)
}

function renderHead(base: string, p: Page): string {
  const url = SITE_URL + p.path
  let h = base
  h = setTag(h, /<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)}</title>`)
  h = setTag(h, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(p.desc)}" />`)
  h = setTag(h, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(p.title)}" />`)
  h = setTag(h, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(p.desc)}" />`)
  h = setTag(h, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(p.title)}" />`)
  h = setTag(h, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(p.desc)}" />`)
  if (p.image) {
    h = setTag(h, /<meta property="og:image" [^>]*>/, `<meta property="og:image" content="${esc(p.image)}" />`)
    h = setTag(h, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(p.image)}" />`)
  }
  if (p.noindex) {
    h = h.replace(/\s*<link rel="canonical"[^>]*>/, '').replace(/\s*<meta property="og:url"[^>]*>/, '')
    return h.replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>')
  }
  h = setTag(h, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`)
  h = setTag(h, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(url)}" />`)
  // FAQ-разметка относится только к главной
  if (!p.home) {
    h = h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_m, a: string, json: string, b: string) => {
      const data = JSON.parse(json) as { '@graph': { '@type': string }[] }
      data['@graph'] = data['@graph'].filter((x) => x['@type'] !== 'FAQPage')
      return a + JSON.stringify(data) + b
    })
  }
  const alt = [...LANGS, 'x-default'].map((l) => `    <link rel="alternate" hreflang="${l}" href="${esc(langUrl(p.path, l === 'x-default' ? 'en' : l))}" />`).join('\n')
  return h.replace('</head>', `  <meta name="robots" content="index, follow" />\n${alt}\n  </head>`)
}

async function fetchPosts(): Promise<{ slug: string; title: string; excerpt: string; cover_url: string | null; published_at: string }[]> {
  try {
    const res = await fetch(SITE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ action: 'blog_list', lang: 'en', limit: 500, offset: 0 }),
      signal: AbortSignal.timeout(15000),
    })
    const j = (await res.json()) as { posts?: [] }
    return res.ok && Array.isArray(j.posts) ? j.posts : []
  } catch (e) {
    console.warn('[static-pages] blog_list недоступен, посты без своих HTML:', (e as Error).message)
    return []
  }
}

function sitemap(pages: Page[]): string {
  const urls = pages.map((p) => {
    const alt = [...LANGS, 'x-default'].map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(langUrl(p.path, l === 'x-default' ? 'en' : l))}"/>`).join('\n')
    return `  <url>\n    <loc>${esc(SITE_URL + p.path)}</loc>\n${alt}\n${p.lastmod ? `    <lastmod>${p.lastmod}</lastmod>\n` : ''}    <priority>${p.priority ?? '0.5'}</priority>\n  </url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}

export function staticPages(): Plugin {
  let outDir = 'dist'
  return {
    name: 'static-pages',
    apply: 'build',
    configResolved(c) { outDir = c.build.outDir },
    async closeBundle() {
      const base = readFileSync(join(outDir, 'index.html'), 'utf8')
      const write = (rel: string, html: string) => { const f = join(outDir, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, html) }
      const routes: [string, string][] = [] // [путь без слэша, html]
      const route = (rel: string, html: string) => { write(`${rel}.html`, html); routes.push([rel, html]) }

      const pages: Page[] = STATIC.map((s) => ({ path: s.path, title: en.meta[s.key].title, desc: en.meta[s.key].desc, home: s.path === '/', priority: s.priority }))
      const posts = await fetchPosts()
      for (const p of posts) {
        if (!/^[a-z0-9][a-z0-9-]*$/i.test(p.slug)) continue
        pages.push({ path: `/blog/${p.slug}`, title: `${p.title} — CatMon`, desc: p.excerpt || en.meta.blog.desc, image: p.cover_url || undefined, lastmod: p.published_at?.slice(0, 10), priority: '0.6' })
      }
      for (const p of pages) {
        const html = renderHead(base, p)
        if (p.path === '/') { write('index.html', html); continue }
        route(p.path.slice(1), html)
      }
      const adminHtml = renderHead(base, { path: '/admin', title: 'CatMon Admin', desc: 'CatMon admin panel', noindex: true })
      write('admin/index.html', adminHtml) // public/admin/ — папка, Pages отвечает 301 /admin → /admin/
      for (const a of ADMIN) route(`admin/${a}`, adminHtml)
      // если рядом с `x.html` есть папка `x/` (blog/ с постами, admin/items/ с иконками), Pages отвечает
      // 301 /x → /x/ — тогда и там должна быть страница, а не 404
      for (const [rel, html] of routes) {
        const dir = join(outDir, rel)
        if (existsSync(dir) && statSync(dir).isDirectory() && !existsSync(join(dir, 'index.html'))) write(`${rel}/index.html`, html)
      }
      // неизвестные маршруты: SPA-фолбэк Pages (HTTP 404), не индексировать
      write('404.html', renderHead(base, { path: '/404', title: en.meta.notfound.title, desc: en.meta.notfound.desc, noindex: true }))
      write('sitemap.xml', sitemap(pages))
      console.log(`[static-pages] ${pages.length} pages (${posts.length} posts), admin ${ADMIN.length + 1}, 404.html, sitemap.xml`)
    },
  }
}
