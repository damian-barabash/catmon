import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useI18n } from '../i18n'
import { useSeo } from '../lib/seo'
import { api, type BlogPostSummary, type StoreLinks } from '../lib/api'
import { CatLogo, HeartCat, Paw } from '../components/Icons'
import { Reveal } from '../components/Reveal'
import { StoreBadges } from '../components/StoreBadges'
import { PostCard } from './Blog'

const floating = [
  { src: '/shots/catdex.webp', name: 'White Spot', r: 'rare', style: { left: '2%', top: '6%' }, d: 0 },
  { src: '/shots/arena.webp', name: 'Obsidian', r: 'epic', style: { right: '0%', top: '14%' }, d: 1.2 },
  { src: '/shots/dungeon.webp', name: 'Archwitch', r: 'legendary', style: { right: '8%', bottom: '4%' }, d: 2.1 },
  { src: '/shots/fishing.webp', name: 'Ember Paws', r: 'common', style: { left: '6%', bottom: '10%' }, d: .6 },
]
/** Mouse-parallax depth per floating card (higher = moves more). */
const cardDepth = [14, 30, 22, 38]

const HeartMini = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21C6.5 17 2 13.5 2 8.8 2 6 4.2 4 6.9 4c2 0 3.6 1.2 5.1 3 1.5-1.8 3.1-3 5.1-3C19.8 4 22 6 22 8.8c0 4.7-4.5 8.2-10 12.2z" fill="var(--red)" /></svg>
)

/** Hover tilt (transform/opacity only, disabled with prefers-reduced-motion). */
function Tilt({ children, className, max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion()
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const srx = useSpring(rx, { stiffness: 260, damping: 22 })
  const sry = useSpring(ry, { stiffness: 260, damping: 22 })
  return (
    <motion.div
      className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 700 }}
      onMouseMove={(e) => {
        if (reduce) return
        const r = e.currentTarget.getBoundingClientRect()
        ry.set(((e.clientX - r.left) / r.width - .5) * max)
        rx.set(-((e.clientY - r.top) / r.height - .5) * max)
      }}
      onMouseLeave={() => { rx.set(0); ry.set(0) }}
    >
      {children}
    </motion.div>
  )
}

function Hero({ links }: { links: StoreLinks | null }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 600], [0, -80])
  const y2 = useTransform(scrollY, [0, 600], [0, 60])
  // mouse parallax: cat and cards live at different depths
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 50, damping: 16 })
  const smy = useSpring(my, { stiffness: 50, damping: 16 })
  const catX = useTransform(smx, (v) => v * -22)
  const catY = useTransform(smy, (v) => v * -14)
  const card0 = useTransform(smx, (v) => v * cardDepth[0])
  const card1 = useTransform(smx, (v) => v * cardDepth[1])
  const card2 = useTransform(smx, (v) => v * cardDepth[2])
  const card3 = useTransform(smx, (v) => v * cardDepth[3])
  const cardXs = [card0, card1, card2, card3]
  return (
    <section
      className="hero"
      onMouseMove={(e) => {
        if (reduce) return
        mx.set(e.clientX / window.innerWidth - .5)
        my.set(e.clientY / window.innerHeight - .5)
      }}
    >
      <div className="wrap hero-grid">
        <div>
          <motion.span className="kicker" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5 }}>{t.hero.kicker}</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .1 }}>{t.hero.title}</motion.h1>
          <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .25 }}>{t.hero.sub}</motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .4 }}>
            <StoreBadges links={links} />
          </motion.div>
          <motion.div className="hero-badges" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .5 }}>
            <span className="pill">{t.hero.free}</span>
            <a className="pill charity" href="#donate"><HeartMini />{t.hero.charity}</a>
          </motion.div>
          <motion.div initial={{ opacity: 0, rotate: -8, scale: .9 }} animate={{ opacity: 1, rotate: -1.5, scale: 1 }} transition={{ delay: .7, type: 'spring', stiffness: 200 }}>
            <span className="nop2w">{t.hero.noP2W}</span>
          </motion.div>
        </div>
        <div className="hero-visual">
          {[...Array(5)].map((_, i) => (
            <Paw key={i} className="paw" style={{ left: `${10 + i * 18}%`, top: `${(i * 37) % 85}%`, transform: `rotate(${i * 30 - 45}deg)`, animationDelay: `${i * .8}s` }} />
          ))}
          <motion.div style={{ y: reduce ? 0 : y1 }} className="cat-big hover">
            <motion.div style={reduce ? undefined : { x: catX, y: catY }}>
              <CatLogo color="var(--ink)" />
            </motion.div>
          </motion.div>
          {floating.map((c, i) => (
            <motion.div
              key={c.name}
              className={`float-card ${c.r}`}
              style={{ ...c.style, y: reduce ? 0 : i % 2 ? y2 : y1, x: reduce ? 0 : cardXs[i] }}
              initial={{ opacity: 0, scale: .7, rotate: i % 2 ? 8 : -8 }}
              animate={{ opacity: 1, scale: 1, rotate: i % 2 ? 6 : -6 }}
              transition={{ delay: .5 + i * .15, type: 'spring', stiffness: 160 }}
            >
              <motion.div animate={reduce ? {} : { y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4 + c.d, ease: 'easeInOut', delay: c.d }}>
                <Tilt max={10}>
                  <img src={c.src} alt="" loading="eager" />
                  <div className="fc-name">{c.name}</div>
                  <div className="fc-r">{c.r}</div>
                </Tilt>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="scroll-hint"><span>{t.hero.scroll}</span><i /></div>
    </section>
  )
}

function Donation({ links }: { links: StoreLinks | null }) {
  const { t, lang } = useI18n()
  const d = links?.donation
  const on = !!(d?.enabled && d.url)
  const title = d?.title_i18n?.[lang] || d?.title || t.donation.title
  const text = d?.text_i18n?.[lang] || d?.text || t.donation.text
  return (
    <section className="section" style={{ paddingTop: 0 }} id="donate">
      <Reveal className="wrap">
        <div className="donate">
          <div className="heart hover"><HeartCat /></div>
          <div>
            {!on && <span className="tag">{t.hero.soon}</span>}
            <h3>{title}</h3>
            <p>{on ? text : t.donation.soon}. {t.donation.city}.</p>
          </div>
          {on ? <a className="btn" href={d!.url} target="_blank" rel="noopener">{t.donation.cta}</a> : <button className="btn" disabled>{t.donation.cta}</button>}
        </div>
      </Reveal>
    </section>
  )
}

const stepIcons = ['/game/map_cat.svg', '/game/trail_radar.svg', '/game/first_card.svg', '/game/cats_100.svg']
const tierCats = { common: '/game/a4_c_street_bowtie.svg', rare: '/game/a4_e_glacial_halo.svg', epic: '/game/a4_e_storm_crown.svg', legendary: '/game/a4_l_dragon_beanie.svg' }
const tierPct = { common: '~70%', rare: '~22%', epic: '~7%', legendary: '<1%' }
const worldArt: Record<string, { banner: string; icon: string }> = {
  arena: { banner: '/game/banner_arena.svg', icon: '/game/pvp_50.svg' },
  dungeon: { banner: '/game/banner_dungeon.svg', icon: '/game/weak_spot.svg' },
  fishing: { banner: '/game/fish_map.svg', icon: '/game/fish_legend.svg' },
  expedition: { banner: '/game/scene_roofs.svg', icon: '/game/exp_start.svg' },
  tournament: { banner: '/game/banner_tournament.svg', icon: '/game/crown_champion.svg' },
  buddy: { banner: '/game/banner_catdex.svg', icon: '/game/buddy_feed.svg' },
}
const fairIcons = ['/game/pigeon_panic.svg', '/game/seal_paw.svg', '/game/luck_dice.svg']
// battle.webp — RU-кадр интерфейса, в EN-полосе не показываем
const shots = ['catdex', 'arena', 'dungeon', 'chests', 'quests', 'fishing', 'expeditions']

/**
 * Worlds: on desktop the cards ride a horizontal rail driven by vertical
 * scroll (sticky viewport + translateX from scrollYProgress). On mobile and
 * with prefers-reduced-motion it degrades to a native horizontal scroller.
 */
function WorldsSection() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const [wide, setWide] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const upd = () => setWide(mq.matches)
    upd()
    mq.addEventListener('change', upd)
    return () => mq.removeEventListener('change', upd)
  }, [])
  const secRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const rail = wide && !reduce
  // Прогресс считаем вручную по rect секции: useScroll({target}) инициализируется
  // до того, как rail-ветка смонтирует ref (wide выставляется эффектом), и
  // прогресс навсегда оставался 0 — рейл «не скроллил» (полевой скрин 30.08).
  const x = useMotionValue(0)
  useEffect(() => {
    if (!rail) return
    const measure = () =>
      setDist(Math.max(0, (trackRef.current?.scrollWidth || 0) - window.innerWidth))
    measure()
    // ширина трека зависит от картинок-баннеров — перемеряем после их загрузки
    const t1 = setTimeout(measure, 500)
    const t2 = setTimeout(measure, 2000)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(t1); clearTimeout(t2)
      window.removeEventListener('resize', measure)
    }
  }, [rail])
  useEffect(() => {
    if (!rail) return
    const onScroll = () => {
      const el = secRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight - window.innerHeight
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
      x.set(-dist * p)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [rail, dist, x])

  const cards = t.worlds.items.map((w) => (
    <Tilt key={w.k} className="world" max={6}>
      <div className="banner"><img src={worldArt[w.k].banner} alt="" loading="lazy" /></div>
      <div className="body"><img src={worldArt[w.k].icon} alt="" /><div><h3>{w.t}</h3><p>{w.d}</p></div></div>
    </Tilt>
  ))

  if (!rail) {
    return (
      <section className="section" id="worlds">
        <div className="wrap">
          <Reveal className="section-head"><span className="kicker">{t.worlds.kicker}</span><h2>{t.worlds.title}</h2></Reveal>
          <div className="worlds-rail">{cards}</div>
        </div>
      </section>
    )
  }
  return (
    <section className="hscroll" id="worlds" ref={secRef} style={{ height: `calc(100vh + ${Math.max(dist, 1)}px)` }}>
      <div className="hscroll-sticky">
        <div className="hscroll-head"><span className="kicker">{t.worlds.kicker}</span><h2>{t.worlds.title}</h2></div>
        <motion.div className="hscroll-track" ref={trackRef} style={{ x }}>{cards}</motion.div>
      </div>
    </section>
  )
}

export default function Home() {
  const { t, lang } = useI18n()
  useSeo('home')
  const [links, setLinks] = useState<StoreLinks | null>(null)
  const [posts, setPosts] = useState<BlogPostSummary[]>([])
  useEffect(() => { api.storeLinks().then(setLinks) }, [])
  useEffect(() => { api.blogList(lang, 3).then(setPosts) }, [lang])

  return (
    <>
      <Hero links={links} />
      <Donation links={links} />

      <section className="section" id="how">
        <div className="wrap">
          <Reveal className="section-head"><span className="kicker">{t.how.kicker}</span><h2>{t.how.title}</h2></Reveal>
          <div className="steps">
            {t.how.steps.map((s, i) => (
              <Reveal key={s.t} i={i} className="step">
                <img className="ico" src={stepIcons[i]} alt="" />
                <span className="num">0{i + 1}</span>
                <h3>{s.t}</h3><p>{s.d}</p>
              </Reveal>
            ))}
          </div>
          <div className="shots" style={{ marginTop: '3rem' }}>
            {shots.map((s) => <div className="shot" key={s}><img src={`/shots/${s}.webp`} alt={`CatMon — ${s}`} loading="lazy" width="640" height="1387" /></div>)}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--mist)' }} id="rarity">
        <div className="wrap">
          <Reveal className="section-head"><span className="kicker">{t.rarity.kicker}</span><h2>{t.rarity.title}</h2><p>{t.rarity.sub}</p></Reveal>
          <div className="tiers">
            {t.rarity.tiers.map((r, i) => (
              <Reveal key={r.k} i={i} className={`tier ${r.k}`}>
                <img className="cat hover" style={{ animationDelay: `${i * .7}s` }} src={tierCats[r.k as keyof typeof tierCats]} alt="" />
                <span className="pct">{tierPct[r.k as keyof typeof tierPct]}</span>
                <h3>{r.n}</h3><p>{r.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <WorldsSection />

      <section className="section fair" id="fair">
        <div className="wrap fair-grid">
          <Reveal>
            <span className="kicker">{t.fair.kicker}</span>
            <h2>{t.fair.title}</h2>
            <p className="lead" style={{ marginTop: '1rem' }}>{t.fair.p1}</p>
            <div className="fair-points">
              {t.fair.points.map((p, i) => (
                <div className="fair-point" key={p.t}><img src={fairIcons[i]} alt="" /><div><h3>{p.t}</h3><p>{p.d}</p></div></div>
              ))}
            </div>
          </Reveal>
          <Reveal i={2}>
            <div className="gag">
              <div className="phone"><div className="screen">
                <img src="/game/pigeon_panic.svg" alt="" className="hover" />
                <div className="verdict">{t.fair.gag.label}<b>{t.fair.gag.value}</b></div>
                <div className="hint">{t.fair.gag.hint}</div>
                <motion.div className="stamp" initial={{ scale: 3, opacity: 0 }} whileInView={{ scale: 1, opacity: .9 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: .5 }}>NOPE</motion.div>
              </div></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="section-head"><span className="kicker">{t.numbers.kicker}</span></Reveal>
          <div className="numbers">
            {t.numbers.items.map((n, i) => <Reveal key={n.l} i={i} className="number"><b>{n.v}</b><span>{n.l}</span></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--mist)' }}>
        <div className="wrap">
          <Reveal className="section-head"><span className="kicker">{t.video.kicker}</span><h2>{t.video.title}</h2><p>{t.hero.kicker}</p></Reveal>
          <Reveal i={1}>
            <div className="phone-video">
              <video controls playsInline preload="none" poster="/shots/promo-poster.webp" src="/video/promo-portrait.mp4">{t.video.unsupported}</video>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Reveal className="section-head" >
            <span className="kicker">{t.blogTeaser.kicker}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap' }}>
              <h2>{t.blogTeaser.title}</h2>
              <Link className="btn ghost" to="/blog">{t.blogTeaser.all}</Link>
            </div>
          </Reveal>
          {posts.length ? (
            <div className="posts">{posts.map((p, i) => <Reveal key={p.slug} i={i}><PostCard p={p} /></Reveal>)}</div>
          ) : (
            <div className="empty"><CatLogo animated={false} /><p>{t.blogTeaser.empty}</p></div>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <Reveal className="wrap">
          <div className="cta">
            <div className="bg-cat"><CatLogo animated={false} color="var(--paper)" /></div>
            <h2>{t.cta.title}</h2>
            <p>{t.cta.sub}</p>
            <div className="hero-cta"><StoreBadges links={links} /></div>
            {!(links?.appstore || links?.googleplay) && <p style={{ marginTop: '1.2rem', fontSize: '.9rem' }}>{t.cta.soon}</p>}
          </div>
        </Reveal>
      </section>
    </>
  )
}
