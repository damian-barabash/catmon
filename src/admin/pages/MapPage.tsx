import { useMemo, useState } from 'react'
import { api } from '../api'
import { dayStr, fmtN, useAsync, useStore } from '../store'
import { Card, ErrorBox, Seg, Skeleton } from '../ui'
import { MapUsageChart, Bars } from '../charts'
import { IcMap, IcWarn, IcClock } from '../icons'

export default function MapPage() {
  const { t, lang } = useStore()
  const [days, setDays] = useState<'30' | '90' | '365'>('30')
  const { data, loading, error } = useAsync(() => api.mapUsage(Number(days)), [days], `map.${days}`)
  const calc = useMemo(() => {
    if (!data) return null
    const month = dayStr(new Date()).slice(0, 7)
    const now = new Date()
    const dim = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate()
    const dayOfMonth = now.getUTCDate()
    const thisMonth = data.map_usage.filter(x => x.day.startsWith(month))
    const used = data.month_tiles ?? thisMonth.reduce((s, x) => s + x.tiles, 0)
    const last7 = data.map_usage.slice(-7)
    const avg = last7.length ? last7.reduce((s, x) => s + x.tiles, 0) / last7.length : 0
    const remaining = data.map_tile_limit - used
    const daysLeft = avg > 0 ? remaining / avg : Infinity
    const projected = used + avg * (dim - dayOfMonth)
    // monthly aggregation for bars
    const byMonth: Record<string, number> = {}
    data.map_usage.forEach(x => { byMonth[x.day.slice(0, 7)] = (byMonth[x.day.slice(0, 7)] ?? 0) + x.tiles })
    const months = Object.entries(byMonth).map(([m, tiles]) => ({ day: m, tiles }))
    return { used, pct: data.map_tile_limit ? used / data.map_tile_limit : 0, avg, daysLeft, projected, dim, dayOfMonth, thisMonth, months }
  }, [data])

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><h1>{t('nav_map')}</h1><div className="right"><Seg value={days} onChange={v => setDays(v as typeof days)} options={[{ v: '30', l: '30d' }, { v: '90', l: '90d' }, { v: '365', l: '1y' }]} /></div></div>
      {error && <ErrorBox text={error} />}
      {calc && calc.pct >= .8 && <div className="alert warn" style={{ marginBottom: 14 }}><IcWarn size={18} /><span><b>{t('map_warn')}</b></span></div>}
      <div className="grid c4" style={{ marginBottom: 14 }}>
        <div className="card kpi-card"><div className="ic accent"><IcMap size={18} /></div><div className="lbl">{t('map_month_used')}</div><div className="val">{loading || !calc ? <Skeleton h={24} w={80} /> : fmtN(calc.used, lang)}</div><div className="sub">{data && `${t('map_limit')} ${fmtN(data.map_tile_limit, lang)} · ${calc ? Math.round(calc.pct * 100) : 0}%`}</div></div>
        <div className="card kpi-card"><div className="ic"><IcClock size={18} /></div><div className="lbl">{t('map_daily_avg')}</div><div className="val">{calc ? fmtN(Math.round(calc.avg), lang) : '—'}</div><div className="sub">{t('tiles')} / 7d</div></div>
        <div className="card kpi-card"><div className="ic"><IcWarn size={18} /></div><div className="lbl">{t('map_forecast')}</div><div className="val" style={{ color: calc && calc.projected > (data?.map_tile_limit ?? 0) ? 'var(--accent)' : 'inherit' }}>{calc ? fmtN(Math.round(calc.projected), lang) : '—'}</div><div className="sub">{calc ? (calc.projected > (data?.map_tile_limit ?? 0) ? `${Math.max(0, Math.round(calc.daysLeft))} ${t('map_days_left')}` : t('map_no_limit')) : ''}</div></div>
        <div className="card kpi-card"><div className="ic"><IcClock size={18} /></div><div className="lbl">{t('map_days_left')}</div><div className="val">{calc ? (isFinite(calc.daysLeft) ? Math.max(0, Math.round(calc.daysLeft)) : '∞') : '—'}</div><div className="sub">{calc ? `${calc.dayOfMonth}/${calc.dim}` : ''}</div></div>
      </div>
      <Card title={t('map_usage')} icon={<IcMap size={18} />}>
        {loading || !data ? <Skeleton h={320} /> : <>
          <div className="progress" style={{ marginBottom: 12 }}><i className={calc!.pct >= .8 ? 'danger' : calc!.pct >= .5 ? 'warn' : ''} style={{ width: `${Math.min(100, calc!.pct * 100)}%` }} /></div>
          <MapUsageChart data={days === '30' ? data.map_usage : calc!.thisMonth.length ? calc!.thisMonth : data.map_usage} limit={data.map_tile_limit} height={320} />
        </>}
      </Card>
      {calc && calc.months.length > 1 && (
        <Card title={`${t('map_usage')} / ${t('month').toLowerCase()}`} icon={<IcMap size={18} />} className="" >
          <div style={{ marginTop: 14 }}><Bars data={calc.months} keys={[{ k: 'tiles', l: t('tiles'), c: '#C9202A' }]} xKey="day" height={200} /></div>
        </Card>
      )}
    </>
  )
}
