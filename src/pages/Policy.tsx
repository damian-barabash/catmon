import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useSeo } from '../lib/seo'
import { api, type Policy } from '../lib/api'
import { Markdown } from '../components/Markdown'
import { FALLBACK } from '../lib/policyFallback'

const routes: { code: Policy['code']; path: string; metaKey: 'privacy' | 'cookies' | 'terms' | 'rules' | 'data_processing'; label: 'privacy' | 'cookies' | 'terms' | 'rules' | 'data' }[] = [
  { code: 'privacy', path: '/privacy', metaKey: 'privacy', label: 'privacy' },
  { code: 'cookies', path: '/cookies', metaKey: 'cookies', label: 'cookies' },
  { code: 'terms', path: '/terms', metaKey: 'terms', label: 'terms' },
  { code: 'rules', path: '/rules', metaKey: 'rules', label: 'rules' },
  { code: 'data_processing', path: '/data-processing', metaKey: 'data_processing', label: 'data' },
]

export default function PolicyPage({ code }: { code: Policy['code'] }) {
  const { t, lang } = useI18n()
  const r = routes.find((x) => x.code === code)!
  useSeo(r.metaKey)
  const [p, setP] = useState<Policy | null | undefined>(undefined)
  useEffect(() => { setP(undefined); api.policy(code, lang).then(setP) }, [code, lang])
  const fb = FALLBACK[code]
  return (
    <div className="wrap">
      <div className="doc">
        <div className="page-head"><span className="kicker">{t.footer.legal}</span><h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>{p?.title || fb.title}</h1>
          {p && <p style={{ fontSize: '.9rem' }}>{t.policy.updated} {p.version}</p>}
        </div>
        <nav className="policy-nav">{routes.map((x) => <NavLink key={x.code} to={x.path}>{t.footer[x.label]}</NavLink>)}</nav>
        <section className="article" style={{ paddingBottom: '5rem' }}>
          {p === undefined ? <div className="skeleton" style={{ height: 400 }} /> : (
            <>
              {p === null && <div className="note">{t.policy.fallbackNote}</div>}
              <Markdown src={p?.body || fb.body} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
