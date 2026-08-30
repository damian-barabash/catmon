import { useState } from 'react'
import { api, type Role } from '../api'
import { useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Field, Modal, Skeleton, initials, useConfirm } from '../ui'
import { IcKey, IcPlus, IcTrash } from '../icons'

export default function Admins() {
  const { t, admin, toast } = useStore()
  const { data, loading, error, reload } = useAsync(() => api.adminsList(), [])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'admin' as Role })
  const [busy, setBusy] = useState(false)
  const { confirm, node } = useConfirm()
  const isOwner = admin?.role === 'owner'
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true)
    try { await api.adminCreate(form); toast(t('saved')); setOpen(false); setForm({ email: '', password: '', name: '', role: 'admin' }); reload() } catch (ex) { toast((ex as Error).message, 'err') } finally { setBusy(false) }
  }
  const del = async (id: string, email: string) => {
    if (!(await confirm(t('delete_admin'), { text: email, danger: true }))) return
    try { await api.adminDelete(id); toast(t('done')); reload() } catch (ex) { toast((ex as Error).message, 'err') }
  }
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><h1>{t('admins')}</h1>{isOwner && <button className="btn primary right" onClick={() => setOpen(true)}><IcPlus size={18} />{t('add_admin')}</button>}</div>
      {!isOwner && <div className="alert info" style={{ marginBottom: 14 }}>{t('owner_only')}</div>}
      {error && <ErrorBox text={error} />}
      <Card icon={<IcKey size={18} />} title={t('admins')}>
        {loading ? <Skeleton h={120} /> : !data?.admins.length ? <Empty /> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>{t('name')}</th><th>{t('email')}</th><th>{t('role')}</th><th>{t('lang')}</th><th /></tr></thead>
            <tbody>{data.admins.map(a => (
              <tr key={a.id}>
                <td><div className="row"><div className="avatar-sm">{initials(a.name || a.email)}</div><b>{a.name || '—'}</b></div></td>
                <td className="mono small">{a.email}</td>
                <td><span className={`chip ${a.role === 'owner' ? 'accent' : ''}`}>{a.role}</span></td>
                <td className="muted">{a.lang}</td>
                <td style={{ textAlign: 'right' }}>{isOwner && a.role !== 'owner' && a.id !== admin?.id && <button className="btn icon sm danger" onClick={() => del(a.id, a.email)} aria-label={t('delete')}><IcTrash size={16} /></button>}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title={t('add_admin')} footer={<><button className="btn" onClick={() => setOpen(false)}>{t('cancel')}</button><button className="btn primary" disabled={busy} form="admin-form" type="submit">{t('create')}</button></>}>
        <form id="admin-form" onSubmit={create} className="grid" style={{ gap: 12 }}>
          <Field label={t('name')}><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label={t('email')}><input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label={t('password')}><input className="input" type="password" required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label={t('role')}><select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}><option value="admin">{t('r_admin')}</option><option value="editor">{t('r_editor')}</option><option value="owner">{t('r_owner')}</option></select></Field>
        </form>
      </Modal>
      {node}
    </>
  )
}
