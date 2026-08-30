import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useSeo } from '../lib/seo'
import { api, type SeasonPublic } from '../lib/api'
import { Reveal } from '../components/Reveal'

function useCountdown(iso?: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id) }, [])
  if (!iso) return null
  const ms = Math.max(0, new Date(iso).getTime() - now)
  return { d: Math.floor(ms / 864e5), h: Math.floor((ms % 864e5) / 36e5) }
}

export default function Season() {
  const { t, lang } = useI18n()
  useSeo('season')
  const [data, setData] = useState<SeasonPublic | null>(null)
  useEffect(() => { api.seasonPublic().then(setData) }, [])
  const cd = useCountdown(data?.season?.ends_at)
  const s = data?.season
  // The season name already contains its localized prefix ("Sezon N — …"),
  // so never prepend our own. Prefer name_i18n[lang] from season_public.
  const name = s ? (s.name_i18n?.[lang] || s.name) : ''
  return (
    <div className="wrap">
      <div className="page-head"><span className="kicker">{t.nav.season}</span>
        <h1 style={{ fontSize: 'clamp(2.2rem,5vw,4rem)' }}>{s ? (name || `${t.season.title} ${s.no}`) : t.season.title}</h1>
        <p>{t.season.sub}</p>
        {cd && <div className="countdown"><div><b>{cd.d}</b><span>{t.season.days}</span></div><div><b>{cd.h}</b><span>{t.season.hours}</span></div></div>}
      </div>
      <section className="season-hero">
        <Reveal>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{t.season.prizes}</h2>
          <div className="prizes">
            {t.season.prizeRows.map((r) => <div className="prize" key={r.p}><b>{r.p}</b><span>{r.r}</span></div>)}
          </div>
        </Reveal>
        <Reveal i={1}>
          <img src="/game/banner_leaderboard.svg" alt="" style={{ borderRadius: 20, width: '100%' }} onError={(e) => { (e.target as HTMLImageElement).src = '/game/banner_arena.svg' }} />
        </Reveal>
      </section>
      <section style={{ paddingBottom: '5rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>{t.season.top}</h2>
        {data === null ? <div className="skeleton" style={{ height: 300 }} /> : data.top.length ? (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>{t.season.place}</th><th>{t.season.player}</th><th>{t.season.rating}</th></tr></thead>
            <tbody>
              {data.top.map((r) => (
                <tr key={r.place}><td className="place">{r.place}</td>
                  <td><div className="who">{r.avatar_url ? <img src={r.avatar_url} alt="" /> : <span className="av" />}{r.username}</div></td>
                  <td>{r.rating}</td></tr>
              ))}
            </tbody>
          </table></div>
        ) : <div className="empty"><p>{s ? t.season.noSeason : t.season.empty}</p></div>}
      </section>
    </div>
  )
}
