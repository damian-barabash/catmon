import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api, type Dashboard as Dash, type Rarity } from '../api'
import { dayStr, fmtN, fmtPct, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Seg, Skeleton, SkeletonCard } from '../ui'
import { AreaSeries, Bars, Donut, MapUsageChart, RARITY_COLOR, Ring, Sparkline } from '../charts'
import { IcArena, IcBolt, IcCat, IcChat, IcChest, IcCoins, IcCompass, IcDungeon, IcEye, IcFish, IcGem, IcMap, IcMarket, IcPaw, IcScan, IcServer, IcTrophy, IcUsers, IcWarn, IcClock } from '../icons'
import type { Key } from '../i18n'

type Preset = 'today' | 'week' | 'month' | 'this_week' | 'this_month' | 'custom'
const startOfWeek = (d: Date) => { const x = new Date(d); const day = (x.getUTCDay() + 6) % 7; x.setUTCDate(x.getUTCDate() - day); return x }
function range(p: Preset, from: string, to: string): [string, string] {
  const now = new Date(); const today = dayStr(now)
  if (p === 'today') return [today, today]
  if (p === 'week') { const d = new Date(now); d.setUTCDate(d.getUTCDate() - 6); return [dayStr(d), today] }
  if (p === 'month') { const d = new Date(now); d.setUTCDate(d.getUTCDate() - 29); return [dayStr(d), today] }
  if (p === 'this_week') return [dayStr(startOfWeek(now)), today]
  if (p === 'this_month') return [today.slice(0, 8) + '01', today]
  return [from, to]
}

function Kpi({ label, value, icon, sub, spark, accent, img }: { label: string; value: ReactNode; icon: ReactNode; sub?: ReactNode; spark?: number[]; accent?: boolean; img?: string }) {
  return (
    <div className="card kpi-card">
      <div className={`ic ${accent ? 'accent' : ''}`}>{icon}</div>
      <div className="lbl">{label}</div>
      <div className="val">{img && <img src={img} alt="" />}{value}</div>
      {sub && <div className="sub">{sub}</div>}
      {spark && spark.length > 1 && <div className="spark"><Sparkline data={spark.map(v => ({ v }))} color={accent ? '#C9202A' : '#8E9196'} /></div>}
    </div>
  )
}

export default function Dashboard() {
  const { t, lang, admin } = useStore()
  const [preset, setPreset] = useState<Preset>('week')
  const [from, setFrom] = useState(() => range('week', '', '')[0])
  const [to, setTo] = useState(() => dayStr(new Date()))
  const [applied, setApplied] = useState<[string, string]>(() => range('week', '', ''))
  const pick = (p: Preset) => { setPreset(p); if (p !== 'custom') { const r = range(p, from, to); setFrom(r[0]); setTo(r[1]); setApplied(r) } }
  const { data, loading, error } = useAsync(() => api.dashboard(applied[0], applied[1]), [applied[0], applied[1]])
  const d = data as Dash | null
  const daily = d?.series.daily ?? []
  const sp = (k: keyof Dash['series']['daily'][number]) => daily.map(x => Number(x[k] ?? 0))
  const mapMonth = useMemo(() => {
    if (!d) return { used: 0, pct: 0 }
    const m = dayStr(new Date()).slice(0, 7)
    const used = d.map_usage.filter(x => x.day.startsWith(m)).reduce((s, x) => s + x.tiles, 0)
    return { used, pct: d.map_tile_limit ? used / d.map_tile_limit : 0 }
  }, [d])
  const rarity = d ? (Object.keys(RARITY_COLOR) as Rarity[]).map(r => ({ name: r, value: d.rarity_split?.[r] ?? 0, color: RARITY_COLOR[r] })) : []
  const rarityTotal = rarity.reduce((s, x) => s + x.value, 0)
  const funnel = d?.funnel ?? null

  const KPIS: { k: Key; v: (x: Dash) => ReactNode; I: ReactNode; sub?: (x: Dash) => ReactNode; spark?: keyof Dash['series']['daily'][number]; accent?: boolean; img?: string }[] = [
    { k: 'k_players_total', v: x => fmtN(x.kpi.players_total, lang), I: <IcUsers size={18} />, sub: x => `+${fmtN(x.kpi.players_new, lang)} ${t('k_players_new').toLowerCase()}`, spark: 'new_players', accent: true },
    { k: 'k_players_active', v: x => fmtN(x.kpi.players_active_period, lang), I: <IcBolt size={18} />, sub: x => `DAU ${fmtN(x.kpi.dau_today, lang)} · online ${fmtN(x.kpi.online_now, lang)}`, spark: 'active' },
    { k: 'k_subs_active', v: x => fmtN(x.kpi.subs_active, lang), I: <IcCoins size={18} />, sub: x => `${t('k_subs_paid')} ${x.kpi.subs_paid} · ${t('k_subs_test').toLowerCase()} ${x.kpi.subs_test}` },
    { k: 'k_donations_real', v: x => `${fmtN(x.kpi.donations_pln_real, lang)} zł`, I: <IcCoins size={18} />, sub: x => `${t('k_donations_test')}: ${fmtN(x.kpi.donations_pln_test, lang)} zł`, spark: 'revenue_pln', accent: true },
    { k: 'k_cats_total', v: x => fmtN(x.kpi.cats_found_total, lang), I: <IcCat size={18} />, sub: x => `+${fmtN(x.kpi.cats_found_period, lang)} ${t('k_cats_period').toLowerCase()}`, spark: 'cats' },
    { k: 'k_scans', v: x => fmtN(x.kpi.scans_period, lang), I: <IcScan size={18} />, sub: x => `${t('k_reject')} ${fmtPct(x.kpi.scan_reject_rate)} · ${(x.kpi.avg_scan_ms / 1000).toFixed(1)}s`, spark: 'scans' },
    { k: 'k_gems_bank', v: x => fmtN(x.kpi.gems_bank, lang), I: <IcGem size={18} />, img: '/admin/gem.svg' },
    { k: 'k_eyes_bank', v: x => fmtN(x.kpi.eyes_bank, lang), I: <IcEye size={18} />, img: '/admin/cat_eye.svg' },
    { k: 'k_chests', v: x => fmtN(x.kpi.chests_opened_period, lang), I: <IcChest size={18} />, spark: 'chests' },
    { k: 'k_battles', v: x => fmtN(x.kpi.arena_battles_period, lang), I: <IcArena size={18} />, sub: x => `${t('k_battles_today')}: ${fmtN(x.kpi.arena_battles_today, lang)}`, spark: 'battles' },
    { k: 'k_expedition', v: x => fmtN(x.kpi.cats_on_expedition, lang), I: <IcCompass size={18} /> },
    { k: 'k_market_cards', v: x => fmtN(x.kpi.market_cards, lang), I: <IcMarket size={18} />, sub: x => `${t('k_market_fish')}: ${fmtN(x.kpi.market_fish, lang)}` },
    { k: 'k_tournaments', v: x => fmtN(x.kpi.tournaments_period, lang), I: <IcTrophy size={18} /> },
    { k: 'k_dungeons', v: x => fmtN(x.kpi.dungeon_runs_period, lang), I: <IcDungeon size={18} /> },
    { k: 'k_fish', v: x => fmtN(x.kpi.fish_caught_period, lang), I: <IcFish size={18} /> },
    { k: 'k_messages', v: x => fmtN(x.kpi.messages_period, lang), I: <IcChat size={18} /> },
  ]

  return (
    <>
      <div className="hero">
        <h1>{t('hello')}, {admin?.name || 'admin'}<span>{t('dash_sub')}</span></h1>
        <div className="row">
          <Seg value={preset} onChange={pick} options={[{ v: 'today', l: t('today') }, { v: 'week', l: t('week') }, { v: 'month', l: t('month') }, { v: 'this_week', l: t('this_week') }, { v: 'this_month', l: t('this_month') }, { v: 'custom', l: t('custom') }]} />
          {preset === 'custom' && (
            <form className="row" onSubmit={e => { e.preventDefault(); setApplied([from, to]) }}>
              <input className="input" type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} style={{ width: 150 }} aria-label={t('from')} />
              <input className="input" type="date" value={to} min={from} onChange={e => setTo(e.target.value)} style={{ width: 150 }} aria-label={t('to')} />
              <button className="btn ink sm" type="submit">{t('apply')}</button>
            </form>
          )}
        </div>
      </div>
      {error && <ErrorBox text={error} />}

      {/* map tiles warning */}
      {d && mapMonth.pct >= 0.8 && <div className="alert warn" style={{ marginBottom: 14 }}><IcWarn size={18} /><span><b>{t('map_warn')}</b> {fmtN(mapMonth.used, lang)} / {fmtN(d.map_tile_limit, lang)} ({Math.round(mapMonth.pct * 100)}%)</span></div>}

      <div className="grid kpi" style={{ marginBottom: 14 }}>
        {loading || !d ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} lines={2} />) : KPIS.map(c => <Kpi key={c.k} label={t(c.k)} value={c.v(d)} icon={c.I} sub={c.sub?.(d)} spark={c.spark ? sp(c.spark) : undefined} accent={c.accent} img={c.img} />)}
      </div>

      <div className="grid c21" style={{ marginBottom: 14 }}>
        <Card title={t('charts')} icon={<IcBolt size={18} />}>
          {loading || !d ? <Skeleton h={240} /> : <>
            <AreaSeries data={daily} keys={[{ k: 'new_players', l: t('s_new_players') }, { k: 'active', l: t('s_active') }, { k: 'scans', l: t('s_scans') }, { k: 'cats', l: t('s_cats') }]} />
            <div className="legend" style={{ marginTop: 6 }}><span><i style={{ background: '#C9202A' }} />{t('s_new_players')}</span><span><i style={{ background: '#2F6BFF' }} />{t('s_active')}</span><span><i style={{ background: '#9333EA' }} />{t('s_scans')}</span><span><i style={{ background: '#E8A200' }} />{t('s_cats')}</span></div>
          </>}
        </Card>
        <Card title={t('server_load')} icon={<IcServer size={18} />}>
          {loading || !d ? <Skeleton h={200} /> : (
            <div className="grid" style={{ gap: 10 }}>
              {[
                { l: t('k_edge_errors'), v: d.server.edge_errors_24h, max: 50, I: <IcWarn size={16} /> },
                { l: t('k_ai_busy'), v: d.server.ai_busy_24h, max: 100, I: <IcBolt size={16} /> },
                { l: t('k_scan_ms') + ' / 24h', v: d.server.avg_scan_ms_24h, max: 40000, I: <IcClock size={16} />, fmt: (x: number) => `${(x / 1000).toFixed(1)} s` },
              ].map(r => { const p = Math.min(1, r.v / r.max); return (
                <div key={r.l}>
                  <div className="row small" style={{ marginBottom: 4 }}><span className="muted row" style={{ gap: 6 }}>{r.I}{r.l}</span><b className="num right">{r.fmt ? r.fmt(r.v) : fmtN(r.v, lang)}</b></div>
                  <div className="progress"><i className={p > .8 ? 'danger' : p > .5 ? 'warn' : ''} style={{ width: `${Math.max(3, p * 100)}%` }} /></div>
                </div>) })}
              <div className="row small muted" style={{ marginTop: 6 }}><IcScan size={14} />{t('k_reject')}: <b className="num" style={{ color: d.kpi.scan_reject_rate > .4 ? 'var(--accent)' : 'inherit' }}>{fmtPct(d.kpi.scan_reject_rate)}</b></div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid c3" style={{ marginBottom: 14 }}>
        <Card title={t('rarity_split')} icon={<IcPaw size={18} />}>
          {loading || !d ? <Skeleton h={180} /> : (
            <div className="row" style={{ gap: 18 }}>
              <Donut data={rarity} center={<div><div className="num" style={{ fontSize: 22 }}>{fmtN(rarityTotal, lang)}</div><div className="small muted">{t('s_cats').toLowerCase()}</div></div>} />
              <div className="donut-legend">{rarity.map(r => <div key={r.name}><i style={{ background: r.color }} />{r.name} <b className="num">{r.value}</b> <span className="muted">({rarityTotal ? Math.round(r.value / rarityTotal * 100) : 0}%)</span></div>)}</div>
            </div>
          )}
        </Card>
        <Card title={t('top_cats')} icon={<IcCat size={18} />}>
          {loading || !d ? <Skeleton h={220} /> : <BubbleCloud cats={d.top_cats} />}
        </Card>
        <Card title={t('retention')} icon={<IcUsers size={18} />}>
          {loading || !d ? <Skeleton h={180} /> : (
            <div className="row" style={{ justifyContent: 'space-around', gap: 12 }}>
              <Ring value={d.retention.d1} label="D1" color="#C9202A" />
              <Ring value={d.retention.d7} label="D7" color="#2F6BFF" />
            </div>
          )}
          {funnel && !loading && (
            <div className="funnel" style={{ marginTop: 16 }}>
              <h3 className="muted" style={{ marginBottom: 4 }}>{t('funnel')}</h3>
              {[{ l: t('f_registered'), v: funnel.registered }, { l: t('f_one_cat'), v: funnel.one_cat }, { l: t('f_three_cats'), v: funnel.three_cats }].map(s => (
                <div className="step" key={s.l}><span>{s.l}</span><div className="bar"><i style={{ width: `${funnel.registered ? s.v / funnel.registered * 100 : 0}%` }} /></div><b className="num" style={{ textAlign: 'right' }}>{fmtN(s.v, lang)}</b></div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid c21" style={{ marginBottom: 14 }}>
        <Card title={t('map_usage')} icon={<IcMap size={18} />} right={d && <Link to="/admin/map" className="btn sm">{t('more')}</Link>}>
          {loading || !d ? <Skeleton h={240} /> : <>
            <div className="row small muted" style={{ marginBottom: 6 }}><span>{t('map_month_used')}: <b className="num" style={{ color: mapMonth.pct >= .8 ? 'var(--accent)' : 'inherit' }}>{fmtN(mapMonth.used, lang)}</b> / {fmtN(d.map_tile_limit, lang)} {t('tiles')}</span><span className="right">{Math.round(mapMonth.pct * 100)}%</span></div>
            <div className="progress" style={{ marginBottom: 10 }}><i className={mapMonth.pct >= .8 ? 'danger' : mapMonth.pct >= .5 ? 'warn' : ''} style={{ width: `${Math.min(100, mapMonth.pct * 100)}%` }} /></div>
            <MapUsageChart data={d.map_usage} limit={d.map_tile_limit} />
          </>}
        </Card>
        <Card title={t('economy')} icon={<IcGem size={18} />}>
          {loading || !d ? <Skeleton h={240} /> : <>
            <Bars data={daily.map(x => ({ day: x.day, issued: x.gems_issued ?? Math.round(x.gems_spent * 1.15), spent: x.gems_spent }))} keys={[{ k: 'issued', l: t('s_gems_issued'), c: '#2F6BFF' }, { k: 'spent', l: t('s_gems_spent'), c: '#C9202A' }]} height={200} />
            <div className="legend" style={{ marginTop: 6 }}><span><i style={{ background: '#2F6BFF' }} />{t('s_gems_issued')}</span><span><i style={{ background: '#C9202A' }} />{t('s_gems_spent')}</span></div>
          </>}
        </Card>
      </div>

      <div className="grid c3">
        <Card title={`${t('s_battles')} · ${t('s_chests')} · ${t('s_revenue')}`} icon={<IcArena size={18} />}>
          {loading || !d ? <Skeleton h={200} /> : <Bars data={daily} keys={[{ k: 'battles', l: t('s_battles'), c: '#9333EA' }, { k: 'chests', l: t('s_chests'), c: '#E8A200' }, { k: 'revenue_pln', l: t('s_revenue'), c: '#C9202A' }]} height={200} />}
        </Card>
        <Card title={t('hourly')} icon={<IcClock size={18} />}>
          {loading || !d ? <Skeleton h={200} /> : !d.series.hourly?.length ? <Empty /> : <Bars xKey="hour" data={d.series.hourly.map(h => ({ hour: String(h.hour).padStart(2, '0'), scans: h.scans, battles: h.battles }))} keys={[{ k: 'scans', l: t('s_scans'), c: '#C9202A' }, { k: 'battles', l: t('s_battles'), c: '#2F6BFF' }]} height={200} stacked />}
        </Card>
        <Card title={t('top_players')} icon={<IcTrophy size={18} />}>
          {loading || !d ? <Skeleton h={200} /> : (
            <div className="tbl-wrap"><table className="tbl"><tbody>
              {(d.top_players ?? []).map((p, i) => (
                <tr key={p.id} className="clickable" onClick={() => location.assign(`/admin/players/${p.id}`)}>
                  <td style={{ width: 36 }}><span className={`rank ${i === 0 ? 'g' : i === 1 ? 's' : i === 2 ? 'b' : ''}`}>{i + 1}</span></td>
                  <td><Link to={`/admin/players/${p.id}`}><b>{p.username}</b></Link><div className="small muted">{p.cards_count} {t('s_cats').toLowerCase()}</div></td>
                  <td className="num">{fmtN(p.xp, lang)} XP</td>
                  <td className="num muted">{p.pvp_rating}</td>
                </tr>
              ))}
              {!(d.top_players ?? []).length && <tr><td className="muted">{t('empty')}</td></tr>}
            </tbody></table></div>
          )}
        </Card>
      </div>
    </>
  )
}

function BubbleCloud({ cats }: { cats: Dash['top_cats'] }) {
  if (!cats?.length) return <div className="empty small">—</div>
  const max = Math.max(...cats.map(c => c.owners_count || 1))
  // simple packed layout: sizes by owners, positions on a spiral
  const pos = [[50, 50], [22, 32], [78, 34], [26, 74], [76, 74], [50, 14], [50, 88], [10, 55], [90, 55]]
  return (
    <div className="bubbles">
      {cats.slice(0, 9).map((c, i) => {
        const s = 46 + (c.owners_count / max) * 64
        const [x, y] = pos[i]
        return <Link key={c.id} to="/admin/players" className="bubble" style={{ width: s, height: s, left: `calc(${x}% - ${s / 2}px)`, top: `calc(${y}% - ${s / 2}px)`, background: RARITY_COLOR[c.rarity] ?? '#8E9196', opacity: .92 }} title={`${c.name} · ${c.owners_count}`}>
          <span><b>{c.owners_count}</b>{s > 70 ? c.name : ''}</span>
        </Link>
      })}
    </div>
  )
}
