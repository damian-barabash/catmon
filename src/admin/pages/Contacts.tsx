import { useMemo, useState } from 'react'
import { api, type ContactRequest } from '../api'
import { fmtDate, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Seg, Skeleton, initials } from '../ui'
import { IcInbox, IcMail, IcSearch } from '../icons'

type St = 'all' | 'new' | 'in_progress' | 'done'
export default function Contacts() {
  const { t, toast } = useStore()
  const [st, setSt] = useState<St>('all')
  const [kind, setKind] = useState<'all' | ContactRequest['kind']>('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const { data, loading, error, setData } = useAsync(() => api.contactsList(), [], 'contacts')
  const list = useMemo(() => (data?.contacts ?? []).filter(c => (st === 'all' || c.status === st) && (kind === 'all' || c.kind === kind) && (!q || [c.name, c.email, c.message].some(s => s?.toLowerCase().includes(q.toLowerCase())))).sort((a, b) => b.created_at.localeCompare(a.created_at)), [data, st, kind, q])
  const cur = list.find(c => c.id === sel) ?? list[0]
  const setStatus = async (c: ContactRequest, status: ContactRequest['status']) => {
    const prev = data
    setData({ contacts: (data?.contacts ?? []).map(x => x.id === c.id ? { ...x, status } : x) })
    try { await api.contactSetStatus(c.id, status); toast(t('saved')) } catch (e) { if (prev) setData(prev); toast((e as Error).message, 'err') }
  }
  const kindL = (k: ContactRequest['kind']) => t(`c_${k}` as 'c_bug')
  const stL = (s: ContactRequest['status']) => t(`st_${s}` as 'st_new')
  const counts = { all: data?.contacts.length ?? 0, new: data?.contacts.filter(c => c.status === 'new').length ?? 0 }
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <h1>{t('contacts')}</h1>{counts.new > 0 && <span className="chip accent">{counts.new} {t('st_new').toLowerCase()}</span>}
        <div className="right row">
          <Seg value={kind} onChange={v => setKind(v as typeof kind)} options={[{ v: 'all', l: t('all') }, { v: 'partnership', l: t('c_partnership') }, { v: 'bug', l: t('c_bug') }, { v: 'support', l: t('c_support') }]} />
          <Seg value={st} onChange={v => setSt(v as St)} options={[{ v: 'all', l: t('all') }, { v: 'new', l: t('st_new') }, { v: 'in_progress', l: t('st_in_progress') }, { v: 'done', l: t('st_done') }]} />
        </div>
      </div>
      {error && <ErrorBox text={error} />}
      <div className="inbox">
        <Card>
          <div className="adm-search" style={{ marginBottom: 8, minWidth: 0 }}><IcSearch size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t('search')} /></div>
          {loading ? <Skeleton h={300} /> : !list.length ? <Empty /> : (
            <div style={{ display: 'grid', gap: 2 }}>
              {list.map(c => (
                <div key={c.id} className={`msg ${cur?.id === c.id ? 'on' : ''} ${c.status === 'new' ? 'unread' : ''}`} onClick={() => setSel(c.id)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setSel(c.id) }}>
                  <div className="top"><span className={`chip ${c.kind === 'bug' ? 'accent' : c.kind === 'partnership' ? 'r-legendary' : ''}`}>{kindL(c.kind)}</span><span className="right">{fmtDate(c.created_at)}</span></div>
                  <div className="nm">{c.name}</div><div className="prev">{c.message}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          {!cur ? <Empty /> : (
            <>
              <div className="row" style={{ marginBottom: 12 }}>
                <div className="avatar-sm">{initials(cur.name)}</div>
                <div><b>{cur.name}</b><div className="small muted mono">{cur.email} · {fmtDate(cur.created_at, true)}{cur.ip ? ` · ${cur.ip}` : ''}</div></div>
                <div className="right row">
                  <Seg value={cur.status} onChange={v => setStatus(cur, v)} options={[{ v: 'new', l: stL('new') }, { v: 'in_progress', l: stL('in_progress') }, { v: 'done', l: stL('done') }]} />
                  <a className="btn ink sm" href={`mailto:${cur.email}?subject=${encodeURIComponent(`Re: CatMon — ${kindL(cur.kind)}`)}&body=${encodeURIComponent(`\n\n> ${cur.message.replace(/\n/g, '\n> ')}`)}`}><IcMail size={16} />{t('reply_mail')}</a>
                </div>
              </div>
              <div className="msg-body">{cur.message}</div>
              {cur.meta && Object.keys(cur.meta).length > 0 && <div style={{ marginTop: 12 }}><h3 className="muted" style={{ marginBottom: 4 }}>{t('meta')}</h3><pre className="mono small muted" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(cur.meta, null, 2)}</pre></div>}
            </>
          )}
        </Card>
      </div>
      <div style={{ display: 'none' }}><IcInbox /></div>
    </>
  )
}
