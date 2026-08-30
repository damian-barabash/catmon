import { useEffect, useState } from 'react'
import { api, type RewardTier, type Season, type SeasonResult } from '../api'
import { fmtDate, fmtN, i18nText, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Field, Modal, Skeleton, useConfirm } from '../ui'
import { IcClock, IcPlus, IcTrash, IcTrophy, IcWarn, IcCheck, IcArena } from '../icons'

const DEFAULT_REWARDS: RewardTier[] = [
  { from: 1, to: 1, gems: 2000, chest: 'legendary', key: true, frame: 'frame_season_N_1', title: 'Чемпион сезона' },
  { from: 2, to: 2, gems: 1200, chest: 'legendary', key: true, frame: 'frame_season_N_2' },
  { from: 3, to: 3, gems: 800, chest: 'legendary', key: true, frame: 'frame_season_N_3' },
  { from: 4, to: 10, gems: 500, chest: 'epic', key: true }, { from: 11, to: 30, gems: 250, chest: 'rare' }, { from: 31, to: 100, gems: 100, chest: 'street' },
]

function Countdown({ to }: { to: string }) {
  const { t } = useStore()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const h = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(h) }, [])
  const ms = Math.max(0, new Date(to).getTime() - now)
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4)
  return <div className="countdown"><div><b>{d}</b><span>{t('days')}</span></div><div><b>{h}</b><span>{t('hours')}</span></div><div><b>{m}</b><span>{t('minutes')}</span></div></div>
}

function RewardsEditor({ rewards, onChange, readOnly }: { rewards: RewardTier[]; onChange?: (r: RewardTier[]) => void; readOnly?: boolean }) {
  const { t } = useStore()
  const upd = (i: number, k: keyof RewardTier, v: unknown) => onChange?.(rewards.map((r, j) => j === i ? { ...r, [k]: v } : r))
  return (
    <div className="grid" style={{ gap: 6 }}>
      <div className="reward-row small muted hide-sm"><span>{t('from')}</span><span>{t('to')}</span><span>{t('gems')}</span><span>{t('chest')}</span><span>{t('key')}</span><span>{t('frame')}</span><span>{t('title')}</span><span /></div>
      {rewards.map((r, i) => (
        <div className="reward-row" key={i}>
          <input className="input" type="number" value={r.from} readOnly={readOnly} onChange={e => upd(i, 'from', Number(e.target.value))} aria-label={t('from')} />
          <input className="input" type="number" value={r.to} readOnly={readOnly} onChange={e => upd(i, 'to', Number(e.target.value))} aria-label={t('to')} />
          <input className="input" type="number" value={r.gems} readOnly={readOnly} onChange={e => upd(i, 'gems', Number(e.target.value))} aria-label={t('gems')} />
          {readOnly && !r.chest && r.items?.length ? (
            <span className="small mono" style={{ gridColumn: 'span 2', lineHeight: 1.3 }}>{r.items.map(it => `${it.code}${it.qty > 1 ? ` ×${it.qty}` : ''}`).join(', ')}</span>
          ) : (<>
            <select className="select" style={{ padding: '6px 26px 6px 8px', fontSize: 13 }} value={r.chest ?? ''} disabled={readOnly} onChange={e => upd(i, 'chest', e.target.value || undefined)} aria-label={t('chest')}><option value="">—</option>{['street', 'gold', 'rare', 'epic', 'legendary'].map(c => <option key={c} value={c}>{c}</option>)}</select>
            <label className="check"><input type="checkbox" checked={!!r.key} disabled={readOnly} onChange={e => upd(i, 'key', e.target.checked)} aria-label={t('key')} /></label>
          </>)}
          <input className="input mono" value={r.frame ?? ''} readOnly={readOnly} onChange={e => upd(i, 'frame', e.target.value || undefined)} placeholder="frame_code" aria-label={t('frame')} />
          <input className="input" value={r.title ?? ''} readOnly={readOnly} onChange={e => upd(i, 'title', e.target.value || undefined)} placeholder={t('title')} aria-label={t('title')} />
          {!readOnly ? <button type="button" className="btn icon sm ghost" onClick={() => onChange?.(rewards.filter((_, j) => j !== i))} aria-label={t('delete')}><IcTrash size={14} /></button> : <span />}
        </div>
      ))}
      {!readOnly && <div><button type="button" className="btn sm" onClick={() => onChange?.([...rewards, { from: (rewards.at(-1)?.to ?? 0) + 1, to: (rewards.at(-1)?.to ?? 0) + 10, gems: 50 }])}><IcPlus size={14} />{t('more')}</button></div>}
    </div>
  )
}

function ResultsTable({ rows }: { rows: SeasonResult[] }) {
  const { t, lang } = useStore()
  if (!rows.length) return <Empty />
  return (
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>{t('place')}</th><th>{t('col_player')}</th><th className="num">{t('rating')}</th><th className="num">{t('wins')}</th><th>{t('prize')}</th><th>{t('claimed')}</th></tr></thead>
      <tbody>{rows.map(r => <tr key={r.user_id}><td><span className={`rank ${r.place === 1 ? 'g' : r.place === 2 ? 's' : r.place === 3 ? 'b' : ''}`}>{r.place}</span></td><td><b>{r.username ?? r.user_id.slice(0, 8)}</b></td><td className="num">{fmtN(r.rating, lang)}</td><td className="num">{r.wins}</td><td className="mono small muted">{JSON.stringify(r.prize)}</td><td>{r.claimed ? <IcCheck size={16} /> : '—'}</td></tr>)}</tbody></table></div>
  )
}

export default function Seasons() {
  const { t, lang, toast } = useStore()
  const { data, loading, error, reload } = useAsync(() => api.seasonsList(), [])
  const pub = useAsync(() => api.seasonPublic(), [])
  const { confirm, node } = useConfirm()
  const cur = data?.seasons.find(s => s.status === 'active') ?? null
  const past = (data?.seasons ?? []).filter(s => s.status === 'finished').sort((a, b) => b.no - a.no)
  const [busy, setBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [nf, setNf] = useState({ name_ru: '', starts_at: '', ends_at: '', rewards: DEFAULT_REWARDS })
  const [preview, setPreview] = useState<SeasonResult[] | null>(null)
  const [resSeason, setResSeason] = useState<Season | null>(null)
  const [results, setResults] = useState<SeasonResult[] | null>(null)

  const delSeason = async (s: Season) => {
    if (!(await confirm(t('delete_season'), { text: `#${s.no} ${i18nText(s.name_i18n, lang)}`, danger: true }))) return
    setBusy(true)
    try { await api.seasonDelete(s.id); toast(t('done')); reload() } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) }
  }
  const create = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); try { await api.seasonCreate({ ...nf, starts_at: new Date(nf.starts_at).toISOString(), ends_at: new Date(nf.ends_at).toISOString() }); toast(t('saved')); setCreateOpen(false); reload() } catch (ex) { toast((ex as Error).message, 'err') } finally { setBusy(false) } }
  const dryRun = async () => { if (!cur) return; setBusy(true); try { const r = await api.seasonFinishNow(cur.id, true); setPreview(r.preview ?? r.results ?? []) } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) } }
  const finish = async () => {
    if (!cur) return
    if (!(await confirm(t('finish_now'), { text: t('finish_confirm'), danger: true }))) return
    if (!(await confirm(t('finish_now') + ' — ' + t('confirm') + ' #2', { text: i18nText(cur.name_i18n, lang), danger: true }))) return
    setBusy(true)
    try { await api.seasonFinishNow(cur.id, false); toast(t('done')); setPreview(null); reload() } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) }
  }
  const openResults = async (s: Season) => { setResSeason(s); setResults(null); try { const r = await api.seasonResults(s.id); setResults(r.results) } catch (e) { toast((e as Error).message, 'err') } }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><h1>{t('seasons')}</h1><button className="btn primary right" onClick={() => { const nextNo = (data?.seasons.length ?? 0) + 1; setNf({ name_ru: `Сезон ${nextNo} — `, starts_at: new Date().toISOString().slice(0, 16), ends_at: '', rewards: DEFAULT_REWARDS.map(r => ({ ...r, frame: r.frame?.replace('_N_', `_${nextNo}_`) })) }); setCreateOpen(true) }}><IcPlus size={18} />{t('new_season')}</button></div>
      {error && <ErrorBox text={error} />}
      {loading ? <Skeleton h={200} /> : !cur ? <Card><Empty text={t('no_season')} /></Card> : (
        <div className="grid c21" style={{ marginBottom: 14 }}>
          <Card icon={<IcTrophy size={18} />} title={`${t('current_season')} · #${cur.no} ${i18nText(cur.name_i18n, lang)}`} right={<span className="chip ok">{cur.status}</span>}>
            <div className="row" style={{ gap: 20, marginBottom: 16 }}>
              <div><div className="small muted">{t('time_left')}</div><Countdown to={cur.ends_at} /></div>
              <div className="small muted"><div>{t('starts')}: <b>{fmtDate(cur.starts_at, true)}</b></div><div>{t('ends')}: <b>{fmtDate(cur.ends_at, true)}</b></div></div>
              <div className="right row">
                <button className="btn sm" disabled={busy} onClick={dryRun}><IcClock size={16} />{t('dry_run')}</button>
                <button className="btn danger sm" disabled={busy} onClick={finish}><IcWarn size={16} />{t('finish_now')}</button>
              </div>
            </div>
            <h3 style={{ marginBottom: 8 }}>{t('prizes')}</h3>
            <RewardsEditor rewards={cur.rewards ?? []} readOnly />
            {preview && <div style={{ marginTop: 16 }}><h3 style={{ marginBottom: 8 }}>{t('dry_run')}</h3><ResultsTable rows={preview} /></div>}
          </Card>
          <Card icon={<IcArena size={18} />} title={t('top100')}>
            {pub.loading ? <Skeleton h={300} /> : !pub.data?.top?.length ? <Empty /> : (
              <div className="tbl-wrap" style={{ maxHeight: 480, overflowY: 'auto' }}><table className="tbl"><tbody>{pub.data.top.map(r => <tr key={r.place}><td style={{ width: 40 }}><span className={`rank ${r.place === 1 ? 'g' : r.place === 2 ? 's' : r.place === 3 ? 'b' : ''}`}>{r.place}</span></td><td><b>{r.username}</b>{r.frame_code && <span className="chip outline" style={{ marginLeft: 6, fontSize: 10 }}>{r.frame_code}</span>}</td><td className="num">{r.rating}</td></tr>)}</tbody></table></div>
            )}
          </Card>
        </div>
      )}
      <Card title={t('past_seasons')}>
        {!past.length ? <Empty /> : (
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>#</th><th>{t('name')}</th><th>{t('starts')}</th><th>{t('ends')}</th><th /></tr></thead>
            <tbody>{past.map(s => <tr key={s.id}><td className="num">{s.no}</td><td><b>{i18nText(s.name_i18n, lang)}</b></td><td className="muted">{fmtDate(s.starts_at)}</td><td className="muted">{fmtDate(s.finished_at ?? s.ends_at)}</td><td style={{ textAlign: 'right' }}><div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}><button className="btn sm" onClick={() => openResults(s)}>{t('results')}</button><button className="btn icon sm danger" disabled={busy} onClick={() => delSeason(s)} aria-label={t('delete')}><IcTrash size={14} /></button></div></td></tr>)}</tbody></table></div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('new_season')} wide footer={<><button className="btn" onClick={() => setCreateOpen(false)}>{t('cancel')}</button><button className="btn primary" form="season-form" type="submit" disabled={busy}>{t('create')}</button></>}>
        <form id="season-form" onSubmit={create} className="grid" style={{ gap: 12 }}>
          <Field label={`${t('name')} (ru)`}><input className="input" required value={nf.name_ru} onChange={e => setNf({ ...nf, name_ru: e.target.value })} /></Field>
          <div className="grid c2"><Field label={t('starts')}><input className="input" type="datetime-local" required value={nf.starts_at} onChange={e => setNf({ ...nf, starts_at: e.target.value })} /></Field><Field label={t('ends')}><input className="input" type="datetime-local" required value={nf.ends_at} onChange={e => setNf({ ...nf, ends_at: e.target.value })} /></Field></div>
          <Field label={t('prizes')}><RewardsEditor rewards={nf.rewards} onChange={r => setNf({ ...nf, rewards: r })} /></Field>
        </form>
      </Modal>
      <Modal open={!!resSeason} onClose={() => setResSeason(null)} title={`${t('results')} · #${resSeason?.no} ${i18nText(resSeason?.name_i18n, lang)}`} wide>
        {!results ? <Skeleton h={200} /> : <ResultsTable rows={results} />}
      </Modal>
      {node}
    </>
  )
}
