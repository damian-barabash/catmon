// Карта мира для дашборда: страны заливаются по числу зарегистрированных
// игроков, при наведении — всплывашка «страна · зарегистрировано · активных».
// Контуры — из Natural Earth 110m (public domain), см. worldPaths.ts.
import { useMemo, useRef, useState } from 'react'
import { MAP_VIEWBOX, WORLD } from './worldPaths'

export interface GeoCountry { code: string; registered: number; active: number }

interface Tip { x: number; y: number; code: string; name: string; registered: number; active: number; flip: boolean }

export function WorldMap({ data, lang, labels, onPick, selected }: {
  data: GeoCountry[]
  lang: string
  labels: { registered: string; active: string; none: string }
  onPick?: (code: string | null) => void
  selected?: string | null
}) {
  const [tip, setTip] = useState<Tip | null>(null)
  const box = useRef<HTMLDivElement>(null)

  const byCode = useMemo(() => {
    const m: Record<string, GeoCountry> = {}
    for (const d of data) m[d.code?.toUpperCase()] = d
    return m
  }, [data])
  const max = useMemo(() => data.reduce((a, d) => Math.max(a, d.registered), 0) || 1, [data])

  const nameOf = (c: (typeof WORLD)[number]) => c.n[lang] ?? c.n.en ?? c.c

  const move = (e: React.MouseEvent, c: (typeof WORLD)[number]) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    const g = byCode[c.c]
    const x = e.clientX - r.left
    setTip({
      x, y: e.clientY - r.top, code: c.c, name: nameOf(c),
      registered: g?.registered ?? 0, active: g?.active ?? 0,
      flip: x > r.width - 190, // у правого края разворачиваем влево
    })
  }

  return (
    <div className="wmap" ref={box} onMouseLeave={() => setTip(null)}>
      <svg viewBox={MAP_VIEWBOX} role="img" aria-label="world map">
        {WORLD.map(c => {
          const g = byCode[c.c]
          // интенсивность заливки — доля от самой населённой страны, но не бледнее 0.25
          const k = g ? 0.25 + 0.75 * (g.registered / max) : 0
          return (
            <path
              key={c.c}
              d={c.d}
              fillRule="evenodd"
              className={`${g ? 'has' : ''} ${selected === c.c ? 'sel' : ''}`}
              style={g ? { fill: `color-mix(in srgb, var(--accent) ${Math.round(k * 100)}%, var(--line))` } : undefined}
              onMouseMove={e => move(e, c)}
              onClick={() => onPick?.(g ? (selected === c.c ? null : c.c) : null)}
            />
          )
        })}
      </svg>
      {tip && (
        <div className={`wtip ${tip.flip ? 'flip' : ''}`} style={{ left: tip.x, top: tip.y }}>
          <b>{tip.name}</b>
          {tip.registered > 0 ? (
            <>
              <span>{labels.registered}: <b className="num">{tip.registered}</b></span>
              <span>{labels.active}: <b className="num">{tip.active}</b></span>
            </>
          ) : <span className="muted">{labels.none}</span>}
        </div>
      )}
    </div>
  )
}

/// Название страны по ISO-коду (для списка справа) — из тех же данных карты.
export function countryName(code: string, lang: string): string {
  const c = WORLD.find(x => x.c === code?.toUpperCase())
  return c ? (c.n[lang] ?? c.n.en ?? code) : code
}
