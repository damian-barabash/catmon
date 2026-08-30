import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { fmtDate, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Skeleton } from '../ui'
import { IcAudit, IcSearch } from '../icons'

export default function Audit() {
  const { t } = useStore()
  const [limit, setLimit] = useState(100)
  const [q, setQ] = useState('')
  const { data, loading, error } = useAsync(() => api.audit(limit), [limit])
  const rows = (data?.audit ?? []).filter(r => !q || r.action.includes(q) || (r.target ?? '').includes(q) || (r.admin_email ?? '').includes(q) || JSON.stringify(r.payload ?? {}).includes(q))
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><h1>{t('audit')}</h1><div className="adm-search right" style={{ minWidth: 200 }}><IcSearch size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t('search')} /></div></div>
      {error && <ErrorBox text={error} />}
      <Card icon={<IcAudit size={18} />} title={`${rows.length}`}>
        {loading ? <Skeleton h={300} /> : !rows.length ? <Empty /> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>{t('when')}</th><th>{t('admin_who')}</th><th>{t('action')}</th><th>{t('target')}</th><th>{t('payload')}</th></tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id}>
                <td className="mono muted" style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.created_at, true)}</td>
                <td className="small">{r.admin_email ?? r.admin_id}</td>
                <td><span className={`chip ${/ban|delete/.test(r.action) ? 'accent' : ''}`}>{r.action}</span></td>
                <td className="mono small">{r.target && /^[0-9a-f-]{36}$/.test(r.target) ? <Link to={`/admin/players/${r.target}`} style={{ textDecoration: 'underline' }}>{r.target.slice(0, 8)}…</Link> : r.target ?? '—'}</td>
                <td className="mono small muted" style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(r.payload)}>{r.payload ? JSON.stringify(r.payload) : '—'}</td>
              </tr>))}</tbody>
          </table></div>
        )}
        {!loading && rows.length >= limit && <div className="pager"><button className="btn sm" onClick={() => setLimit(l => l + 100)}>{t('more')}</button></div>}
      </Card>
    </>
  )
}
