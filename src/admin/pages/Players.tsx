import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { fmtAgo, fmtDate, fmtN, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Pager, Seg, Skeleton, initials } from '../ui'
import { IcSearch } from '../icons'

type Filter = 'all' | 'guests' | 'linked' | 'banned' | 'plus'
const LIMIT = 25
const isBanned = (p: { banned_until?: string | null; ban_reason?: string | null }) => !!p.ban_reason && (p.banned_until == null || new Date(p.banned_until) > new Date())
const isPlus = (p: { plus_until?: string | null }) => !!p.plus_until && new Date(p.plus_until) > new Date()

export default function Players() {
  const { t, lang } = useStore()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const filter = (sp.get('f') as Filter) || 'all'
  const sort = sp.get('sort') || 'created_at:desc'
  const page = Number(sp.get('p') || 1)
  const [qi, setQi] = useState(q)
  useEffect(() => { setQi(q) }, [q])
  useEffect(() => { const h = setTimeout(() => { if (qi !== q) { sp.set('q', qi); sp.set('p', '1'); setSp(sp, { replace: true }) } }, 350); return () => clearTimeout(h) }, [qi]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: string, v: string) => { sp.set(k, v); if (k !== 'p') sp.set('p', '1'); setSp(sp) }
  const { data, loading, error } = useAsync(() => api.players({ q, filter, sort, limit: LIMIT, offset: (page - 1) * LIMIT }), [q, filter, sort, page])
  const nav = useNavigate()
  const [sk, sd] = sort.split(':')
  const th = (k: string, l: string, num = false) => <th className={`sortable ${num ? 'num' : ''}`} onClick={() => set('sort', `${k}:${sk === k && sd === 'desc' ? 'asc' : 'desc'}`)} aria-sort={sk === k ? (sd === 'asc' ? 'ascending' : 'descending') : 'none'}>{l}{sk === k ? (sd === 'asc' ? ' ↑' : ' ↓') : ''}</th>
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / LIMIT))
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <h1>{t('players')}</h1>
        <div className="adm-search" style={{ minWidth: 260 }}><IcSearch size={18} /><input value={qi} onChange={e => setQi(e.target.value)} placeholder={t('search_players')} aria-label={t('search')} /></div>
        <div className="right"><Seg value={filter} onChange={v => set('f', v)} options={[{ v: 'all', l: t('f_all') }, { v: 'guests', l: t('f_guests') }, { v: 'linked', l: t('f_linked') }, { v: 'banned', l: t('f_banned') }, { v: 'plus', l: t('f_plus') }]} /></div>
      </div>
      {error && <ErrorBox text={error} />}
      <Card>
        {loading && !data ? <Skeleton h={400} /> : !data?.players.length ? <Empty text={t('nothing_found')} /> : (
          <div className="tbl-wrap" style={{ opacity: loading ? .6 : 1 }}>
            <table className="tbl">
              <thead><tr>{th('username', t('col_player'))}<th>{t('col_status')}</th>{th('cards_count', t('col_cats'), true)}{th('xp', t('col_xp'), true)}{th('gems', t('col_gems'), true)}{th('cat_eyes', t('col_eyes'), true)}{th('pvp_rating', t('col_rating'), true)}{th('last_seen', t('col_last_seen'))}{th('created_at', t('col_created'))}</tr></thead>
              <tbody>
                {data.players.map(p => (
                  <tr key={p.id} className="clickable" onClick={() => nav(`/admin/players/${p.id}`)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') nav(`/admin/players/${p.id}`) }}>
                    <td><div className="row" style={{ flexWrap: 'nowrap' }}><div className="avatar-sm">{p.avatar_url ? <img src={p.avatar_url} alt="" /> : initials(p.username)}</div><div><Link to={`/admin/players/${p.id}`} onClick={e => e.stopPropagation()}><b>{p.username}</b></Link><div className="small muted mono">{p.email ?? p.id.slice(0, 8)}</div></div></div></td>
                    <td><div className="row" style={{ gap: 4 }}>{p.is_guest && <span className="chip outline">{t('guest')}</span>}{isPlus(p) && <span className="chip r-legendary">{t('plus')}</span>}{isBanned(p) && <span className="chip accent">{t('banned')}</span>}{p.providers?.map(pr => <span key={pr} className="chip" style={{ fontSize: 11 }}>{pr}</span>)}</div></td>
                    <td className="num">{p.cards_count}</td>
                    <td className="num">{fmtN(p.xp, lang)}</td>
                    <td className="num">{fmtN(p.gems, lang)}</td>
                    <td className="num">{fmtN(p.cat_eyes, lang)}</td>
                    <td className="num">{p.pvp_rating}</td>
                    <td className="muted small">{fmtAgo(p.last_seen)}</td>
                    <td className="muted small">{fmtDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pager page={page} pages={pages} onPage={p => set('p', String(p))} total={data.total} />}
      </Card>
    </>
  )
}
