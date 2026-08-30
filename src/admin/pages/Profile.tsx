import { useState } from 'react'
import { api, type Lang } from '../api'
import { useStore } from '../store'
import { Card, Field, Seg, initials } from '../ui'
import { LANGS } from '../i18n'
import { IcKey, IcUser } from '../icons'

export default function Profile() {
  const { t, admin, lang, setLang, theme, setTheme, toast, mock } = useStore()
  const [f, setF] = useState({ old: '', nw: '', rep: '' })
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (f.nw !== f.rep) { toast(t('passwords_differ'), 'err'); return }
    setBusy(true)
    try { await api.changePassword(f.old, f.nw); toast(t('password_changed')); setF({ old: '', nw: '', rep: '' }) } catch (ex) { toast((ex as Error).message, 'err') } finally { setBusy(false) }
  }
  return (
    <>
      <h1 style={{ marginBottom: 16 }}>{t('profile')}</h1>
      <div className="grid c2">
        <Card icon={<IcUser size={18} />} title={admin?.name || admin?.email}>
          <div className="p-head" style={{ marginBottom: 16 }}><div className="avatar">{initials(admin?.name || admin?.email)}</div><div><b>{admin?.email}</b><div className="muted small">{admin?.role} · id {admin?.id}</div></div></div>
          <div className="grid" style={{ gap: 12 }}>
            <Field label={t('ui_lang')}><Seg value={lang} onChange={v => setLang(v as Lang)} options={LANGS.map(l => ({ v: l, l: l.toUpperCase() }))} /></Field>
            <Field label={t('theme_dark')}><Seg value={theme} onChange={setTheme} options={[{ v: 'light', l: t('theme_light') }, { v: 'dark', l: t('theme_dark') }]} /></Field>
            {mock && <div className="alert info">{t('mock_mode')} — <a href="?mock=0" style={{ textDecoration: 'underline' }}>off</a></div>}
          </div>
        </Card>
        <Card icon={<IcKey size={18} />} title={t('change_password')}>
          <form onSubmit={submit} className="grid" style={{ gap: 12 }}>
            <Field label={t('old_password')}><input className="input" type="password" autoComplete="current-password" required value={f.old} onChange={e => setF({ ...f, old: e.target.value })} /></Field>
            <Field label={t('new_password')}><input className="input" type="password" autoComplete="new-password" required minLength={8} value={f.nw} onChange={e => setF({ ...f, nw: e.target.value })} /></Field>
            <Field label={t('repeat_password')}><input className="input" type="password" autoComplete="new-password" required value={f.rep} onChange={e => setF({ ...f, rep: e.target.value })} /></Field>
            <div><button className="btn primary" disabled={busy} type="submit">{t('save')}</button></div>
          </form>
        </Card>
      </div>
    </>
  )
}
