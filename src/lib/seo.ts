import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LANGS, SITE_URL, type Lang } from './config'
import { useI18n } from '../i18n'
import type { Dict } from '../i18n/en'

/** URL страницы на языке: EN (и x-default) — чистый путь, остальные — `?lang=xx`.
 *  Та же схема в sitemap и в пререндеренном <head> (vite.config.ts). */
export const langUrl = (pathname: string, lang: Lang) => SITE_URL + pathname + (lang === 'en' ? '' : `?lang=${lang}`)
const OG_LOCALE: Record<Lang, string> = { en: 'en_US', ru: 'ru_RU', pl: 'pl_PL', fr: 'fr_FR' }
const DEFAULT_OG_IMAGE = `${SITE_URL}/og.png`

function setMeta(sel: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLElement>(sel)
  if (!el) {
    el = document.createElement(sel.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v))
}

type SeoInput = keyof Dict['meta'] | { title: string; desc: string; image?: string }

/** Sets title/description/canonical/hreflang/og for the current route and language. */
export function useSeo(key: SeoInput, opts: { noindex?: boolean } = {}) {
  const { t, lang } = useI18n()
  const { pathname } = useLocation()
  const m: { title: string; desc: string; image?: string } = typeof key === 'string' ? t.meta[key] : key
  const { title, desc } = m
  const image = m.image || DEFAULT_OG_IMAGE
  const noindex = !!opts.noindex
  useEffect(() => {
    document.title = title
    const url = langUrl(pathname, lang)
    setMeta('meta[name="description"]', { name: 'description', content: desc })
    setMeta('link[rel="canonical"]', { rel: 'canonical', href: url })
    setMeta('meta[name="robots"]', { name: 'robots', content: noindex ? 'noindex' : 'index, follow' })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: desc })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: url })
    setMeta('meta[property="og:image"]', { property: 'og:image', content: image })
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: OG_LOCALE[lang] })
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: desc })
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image })
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove())
    if (noindex) return
    for (const l of [...LANGS, 'x-default'] as const) {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = l
      link.href = langUrl(pathname, l === 'x-default' ? 'en' : l)
      document.head.appendChild(link)
    }
  }, [title, desc, image, noindex, lang, pathname])
}
