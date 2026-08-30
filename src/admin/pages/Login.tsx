import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Field } from '../ui'
import { IcArrowRight } from '../icons'

export default function Login() {
  const { t, login, admin, ready, mock } = useStore()
  const [email, setEmail] = useState(mock ? 'dmytrii.barabash@greywolfgroup.pl' : '')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()
  const loc = useLocation()
  if (ready && admin) return <Navigate to="/admin" replace />
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await login(email.trim(), pw); nav((loc.state as { from?: string })?.from || '/admin', { replace: true }) }
    catch (ex) { setErr((ex as { code?: string }).code === 'network' ? t('network') : t('login_error')) }
    finally { setBusy(false) }
  }
  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="logo"><img src="/admin/cat_logo.png" alt="" /><div><h1 style={{ fontSize: 20 }}>{t('login_title')}</h1><p className="muted small">{t('login_hint')}</p></div></div>
        <div className="grid" style={{ gap: 12 }}>
          <Field label={t('email')}><input className="input" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <Field label={t('password')}><input className="input" type="password" autoComplete="current-password" required value={pw} onChange={e => setPw(e.target.value)} /></Field>
          {err && <div className="alert err">{err}</div>}
          <button className="btn primary" disabled={busy} type="submit">{t('login')} <IcArrowRight size={18} /></button>
          {mock && <p className="muted small" style={{ textAlign: 'center' }}>{t('mock_mode')}: CatMon-Admin-2026!</p>}
        </div>
      </form>
    </div>
  )
}
