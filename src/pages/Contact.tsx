import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useSeo } from '../lib/seo'
import { api, ApiError, type ContactKind } from '../lib/api'
import { Bug, Check, Cross, Handshake, Life } from '../components/Icons'
import { SUPPORT_EMAIL } from '../lib/config'

const icons: Record<ContactKind, React.ReactNode> = { partnership: <Handshake />, bug: <Bug />, support: <Life /> }

export default function Contact() {
  const { t, lang } = useI18n()
  useSeo('contact')
  const [kind, setKind] = useState<ContactKind>('support')
  const [f, setF] = useState({ name: '', email: '', message: '', consent: false, website: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err' | 'rate' | 'invalid' | 'short'>('idle')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email) || !f.message.trim() || !f.consent) { setState('invalid'); return }
    // сервер требует ≥5 символов (bad_message) — скажем об этом человеком
    if (f.message.trim().length < 5) { setState('short'); return }
    setState('sending')
    try {
      await api.contact({ kind, name: f.name.trim(), email: f.email.trim(), message: f.message.trim(), consent: true, website: f.website, meta: { lang, ua: navigator.userAgent, path: location.pathname } })
      setState('ok')
      setF({ name: '', email: '', message: '', consent: false, website: '' })
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ''
      setState(/rate/.test(code) ? 'rate' : code === 'bad_message' ? 'short' : code === 'bad_email' || code === 'consent_required' ? 'invalid' : 'err')
    }
  }

  return (
    <div className="wrap">
      <div className="page-head"><span className="kicker">{t.nav.contact}</span><h1>{t.contact.title}</h1><p>{t.contact.sub}</p></div>
      <section className="contact-grid" style={{ paddingBottom: '5rem' }}>
        <div className="kinds">
          {(Object.keys(t.contact.kinds) as ContactKind[]).map((k) => (
            <button key={k} type="button" className={`kind ${k === kind ? 'on' : ''}`} onClick={() => setKind(k)} aria-pressed={k === kind}>
              {icons[k]}
              <div><b>{t.contact.kinds[k]}</b><span>{t.contact.kindHints[k]}</span></div>
            </button>
          ))}
        </div>
        {state === 'ok' ? (
          <div className="notice ok"><Check /><div><b>{t.contact.okTitle}</b><span>{t.contact.okText}</span></div></div>
        ) : (
          <form className="form" onSubmit={submit} noValidate>
            <div className="row">
              <label>{t.contact.name}<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" required /></label>
              <label>{t.contact.email}<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></label>
            </div>
            <label>{t.contact.message}<textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required /></label>
            <label className="hp" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></label>
            <label className="check">
              <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} />
              <span>{t.contact.consent} <Link to="/privacy">{t.contact.consentLink}</Link>.</span>
            </label>
            {state === 'invalid' && <div className="notice err"><Cross /><div><b>{t.contact.required}</b></div></div>}
            {state === 'short' && <div className="notice err"><Cross /><div><b>{t.contact.tooShort}</b></div></div>}
            {(state === 'err' || state === 'rate') && (
              <div className="notice err"><Cross /><div><b>{t.contact.errTitle}</b><span>{state === 'rate' ? t.contact.errRate : <>{t.contact.errText} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></>}</span></div></div>
            )}
            <div><button className="btn red" disabled={state === 'sending'}>{state === 'sending' ? t.contact.sending : t.contact.send}</button></div>
          </form>
        )}
      </section>
    </div>
  )
}
