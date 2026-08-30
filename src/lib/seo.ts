import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LANGS, SITE_URL } from './config'
import { useI18n } from '../i18n'
import type { Dict } from '../i18n/en'

function setMeta(sel: string, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLElement>(sel)
  if (!el) {
    el = document.createElement(sel.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v))
}

/** Sets title/description/canonical/hreflang for the current route. */
export function useSeo(key: keyof Dict['meta'] | { title: string; desc: string; image?: string }) {
  const { t, lang } = useI18n()
  const { pathname } = useLocation()
  useEffect(() => {
    const m: { title: string; desc: string; image?: string } = typeof key === 'string' ? t.meta[key] : key
    document.title = m.title
    const url = SITE_URL + pathname
    setMeta('meta[name="description"]', { name: 'description', content: m.desc })
    setMeta('link[rel="canonical"]', { rel: 'canonical', href: url })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: m.title })
    setMeta('meta[property="og:description"]', { property: 'og:description', content: m.desc })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: url })
    if (m.image) setMeta('meta[property="og:image"]', { property: 'og:image', content: m.image })
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: m.title })
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: m.desc })
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove())
    for (const l of [...LANGS, 'x-default']) {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = l
      link.href = url + (l === 'x-default' ? '' : `?lang=${l}`)
      document.head.appendChild(link)
    }
  }, [key, t, lang, pathname])
}
