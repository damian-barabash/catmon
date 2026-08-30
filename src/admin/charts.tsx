/* recharts wrappers styled for CatMon */
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Rarity } from './api'

export const RARITY_COLOR: Record<Rarity, string> = { common: '#8E9196', rare: '#2F6BFF', epic: '#9333EA', legendary: '#E8A200' }
export const SERIES = ['#C9202A', '#2F6BFF', '#9333EA', '#E8A200', '#1F8A4C', '#8E9196', '#0EA5A5']
const fmt = (n: unknown) => (typeof n === 'number' ? new Intl.NumberFormat('ru-RU').format(n) : String(n ?? ''))
const shortDay = (d: string) => (d?.length >= 10 ? d.slice(8, 10) + '.' + d.slice(5, 7) : d)

export function Tip({ active, payload, label, suffix = '' }: { active?: boolean; payload?: { name?: string; value?: unknown; color?: string; fill?: string }[]; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tip">
      <b>{label}</b>
      {payload.map((p, i) => <div className="r" key={i}><span><i style={{ background: p.color ?? p.fill }} />{p.name}</span><span className="num">{fmt(p.value)}{suffix}</span></div>)}
    </div>
  )
}

export function Sparkline({ data, color = '#C9202A', dataKey = 'v', height = 34 }: { data: Record<string, number | string>[]; color?: string; dataKey?: string; height?: number }) {
  const id = `sp-${dataKey}-${color.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={.35} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function AreaSeries({ data, keys, height = 240, xKey = 'day', stacked, suffix }: { data: object[]; keys: { k: string; l: string; c?: string }[]; height?: number; xKey?: string; stacked?: boolean; suffix?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>{keys.map((k, i) => { const c = k.c ?? SERIES[i % SERIES.length]; return <linearGradient key={k.k} id={`g-${k.k}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity={.28} /><stop offset="100%" stopColor={c} stopOpacity={0} /></linearGradient> })}</defs>
        <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
        <XAxis dataKey={xKey} tickFormatter={xKey === 'day' ? shortDay : undefined} tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
        <Tooltip content={<Tip suffix={suffix} />} cursor={{ stroke: 'var(--line)' }} />
        {keys.map((k, i) => { const c = k.c ?? SERIES[i % SERIES.length]; return <Area key={k.k} type="monotone" dataKey={k.k} name={k.l} stroke={c} strokeWidth={2.2} fill={`url(#g-${k.k})`} stackId={stacked ? 'a' : undefined} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} /> })}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function Bars({ data, keys, height = 220, xKey = 'day', suffix, stacked }: { data: object[]; keys: { k: string; l: string; c?: string }[]; height?: number; xKey?: string; suffix?: string; stacked?: boolean }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
        <XAxis dataKey={xKey} tickFormatter={xKey === 'day' ? shortDay : undefined} tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} minTickGap={20} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
        <Tooltip content={<Tip suffix={suffix} />} cursor={{ fill: 'var(--mist)' }} />
        {keys.map((k, i) => <Bar key={k.k} dataKey={k.k} name={k.l} fill={k.c ?? SERIES[i % SERIES.length]} radius={[6, 6, 2, 2]} stackId={stacked ? 'a' : undefined} maxBarSize={28} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Donut({ data, size = 170, thickness = 22, center }: { data: { name: string; value: number; color: string }[]; size?: number; thickness?: number; center?: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={size / 2 - thickness} outerRadius={size / 2} paddingAngle={3} cornerRadius={6} stroke="none" isAnimationActive>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={<Tip />} />
        </PieChart>
      </ResponsiveContainer>
      {center && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>{center}</div>}
    </div>
  )
}

export function Ring({ value, size = 110, color = '#C9202A', label }: { value: number; size?: number; color?: string; label?: string }) {
  const r = size / 2 - 9; const c = 2 * Math.PI * r
  return (
    <div className="ret-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--mist)" strokeWidth="9" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray={`${c * Math.max(0, Math.min(1, value))} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray .6s' }} />
      </svg>
      <div className="c" style={{ fontSize: size > 100 ? 20 : 16 }}>{Math.round(value * 100)}%<span className="small muted" style={{ fontFamily: 'var(--font)', fontWeight: 400 }}>{label}</span></div>
    </div>
  )
}

/** Map tiles chart: cumulative usage + limit line */
export function MapUsageChart({ data, limit, height = 240, cumulative = true }: { data: { day: string; tiles: number }[]; limit: number; height?: number; cumulative?: boolean }) {
  let acc = 0
  const rows = data.map(d => { acc += d.tiles; return { day: d.day, tiles: d.tiles, cum: acc } })
  const maxY = Math.max(limit * 1.05, ...rows.map(r => (cumulative ? r.cum : r.tiles)))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: -10 }}>
        <defs><linearGradient id="g-map" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C9202A" stopOpacity={.3} /><stop offset="100%" stopColor="#C9202A" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 4" />
        <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis domain={[0, Math.ceil(maxY)]} tick={{ fontSize: 11, fill: 'var(--subtle)' }} axisLine={false} tickLine={false} tickFormatter={v => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
        <Tooltip content={<Tip />} cursor={{ stroke: 'var(--line)' }} />
        <ReferenceLine y={limit} stroke="#C9202A" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: `limit ${fmt(limit)}`, position: 'insideTopRight', fill: '#C9202A', fontSize: 11 }} />
        <ReferenceLine y={limit * 0.8} stroke="#D97706" strokeDasharray="2 4" strokeWidth={1} label={{ value: '80%', position: 'insideTopRight', fill: '#D97706', fontSize: 10 }} />
        <Line type="monotone" dataKey="tiles" name="tiles/day" stroke="#8E9196" strokeWidth={1.5} dot={false} />
        {cumulative && <Line type="monotone" dataKey="cum" name="cumulative" stroke="#C9202A" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />}
      </LineChart>
    </ResponsiveContainer>
  )
}
