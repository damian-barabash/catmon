import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion'
import { useI18n } from '../i18n'
import { useSeo } from '../lib/seo'
import { api, type BlogPostSummary, type Shelter, type StoreLinks } from '../lib/api'
import { CatLogo, Paw } from '../components/Icons'
import { HeartMark } from '../lib/hearts'
import { Reveal } from '../components/Reveal'
import { StoreBadges } from '../components/StoreBadges'
import { PostCard } from '../components/PostCard'
import { MediaImg } from '../components/MediaImg'
import { Cubes, Isle, type CubeSpec, type Scene } from '../components/Isle'

/**
 * Hero: композиция из парящих островов игры (улица CatDex сзади, арена слева,
 * Шабаш спереди справа) + две карточки котов по краям. Глубина = z-index =
 * амплитуда параллакса (мышь и скролл). Парение — CSS (у каждого своя фаза).
 */
const heroIsles: { scene: Scene; cls: string; glow: string; mouse: number; scroll: number; phase: number; sizes: string; priority?: boolean }[] = [
  { scene: 'ban_catdex', cls: 'hi-street', glow: 'var(--rare)', mouse: 10, scroll: -24, phase: 0, sizes: '(max-width: 900px) 94vw, 560px', priority: true },
  { scene: 'ban_arena', cls: 'hi-arena', glow: 'var(--legendary)', mouse: 18, scroll: -44, phase: 2.2, sizes: '300px' },
  { scene: 'dungeon_4', cls: 'hi-dungeon', glow: 'var(--epic)', mouse: 28, scroll: -72, phase: 3.9, sizes: '(max-width: 900px) 44vw, 260px' },
]
const floating = [
  { src: '/shots/arena.webp', name: 'Obsidian', r: 'epic', cls: 'fc1', rot: -8, d: 1.2, mouse: 14, scroll: -34 },
  { src: '/shots/dungeon.webp', name: 'Archwitch', r: 'legendary', cls: 'fc3', rot: 6, d: 2.1, mouse: 34, scroll: -86 },
]
const heroCubes: CubeSpec[] = [
  { c: 'var(--legendary)', l: '6%', t: '8%', s: 16, dur: 7, delay: 0 },
  { c: 'var(--rare)', l: '88%', t: '12%', s: 12, dur: 9, delay: 2.5 },
  { c: 'var(--epic)', l: '52%', t: '52%', s: 11, dur: 8, delay: 1.2, lg: true },
  { c: 'var(--red)', l: '14%', t: '86%', s: 13, dur: 10, delay: 4, lg: true },
  { c: '#C9A27A', l: '94%', t: '70%', s: 15, dur: 8.5, delay: 3.1 },
]

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

/** Ambient floating game bits: small SVG items drifting on CSS keyframes. */
type Bit = { src: string; l: string; t: string; s: number; dur: number; delay: number; lg?: boolean }
function Bits({ items }: { items: Bit[] }) {
  return (
    <div className="bits" aria-hidden="true">
      {items.map((b, i) => (
        <img
          key={i} src={b.src} alt="" className={`bit${b.lg ? ' lg' : ''}`}
          style={{ left: b.l, top: b.t, width: b.s, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}
        />
      ))}
    </div>
  )
}
const heroBits: Bit[] = [
  { src: '/game/gem.svg', l: '44%', t: '10%', s: 22, dur: 8, delay: 0 },
  { src: '/game/cat_eye.svg', l: '37%', t: '60%', s: 24, dur: 11, delay: 2.5, lg: true },
  { src: '/game/fish_legend.svg', l: '55%', t: '88%', s: 28, dur: 9.5, delay: 4.2, lg: true },
]
const rarityBits: Bit[] = [
  { src: '/game/gem.svg', l: '5%', t: '16%', s: 20, dur: 9, delay: 1, lg: true },
  { src: '/game/cat_eye.svg', l: '91%', t: '42%', s: 24, dur: 11.5, delay: 3.4, lg: true },
]
const videoBits: Bit[] = [
  { src: '/game/fish_legend.svg', l: '9%', t: '58%', s: 26, dur: 10, delay: .5, lg: true },
  { src: '/game/gem.svg', l: '90%', t: '62%', s: 18, dur: 8.5, delay: 2.2, lg: true },
]

/**
 * Big translucent theme glyph behind a section, drifting slower than the
 * content while scrolling. The ref is mounted unconditionally, so
 * useScroll({ target }) is safe here.
 */
function GlyphLayer({ children, side = 'right' }: { children: ReactNode; side?: 'left' | 'right' }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [70, -70])
  return (
    <div ref={ref} className={`glyph g-${side}`} aria-hidden="true">
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  )
}

/** Light parallax for section headings (±dy px across the viewport pass). */
function Drift({ children, dy = 18 }: { children: ReactNode; dy?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [dy, -dy])
  return <motion.div ref={ref} style={reduce ? undefined : { y }}>{children}</motion.div>
}

/** One paw print of the trail; fades in as the divider crosses the viewport. */
function TrailPaw({ i, n, p, reduce }: { i: number; n: number; p: MotionValue<number>; reduce: boolean | null }) {
  const o = useTransform(p, [i / n, (i + .7) / n], [0, 1])
  const x = 60 + (i * 1060) / (n - 1)
  const y = 58 + Math.sin(i * 1.05) * 20 + (i % 2 ? -15 : 15)
  const rot = 96 + Math.cos(i * 1.05) * 16
  return (
    <motion.g style={{ opacity: reduce ? .5 : o }} transform={`translate(${x} ${y}) rotate(${rot}) scale(.72)`}>
      <g fill="currentColor" transform="translate(-24 -24)">
        <ellipse cx="10.6" cy="19.6" rx="3.9" ry="5.3" transform="rotate(-26 10.6 19.6)" />
        <ellipse cx="19.4" cy="13.8" rx="4.3" ry="5.9" transform="rotate(-9 19.4 13.8)" />
        <ellipse cx="29.2" cy="13.8" rx="4.3" ry="5.9" transform="rotate(9 29.2 13.8)" />
        <ellipse cx="37.8" cy="19.6" rx="3.9" ry="5.3" transform="rotate(26 37.8 19.6)" />
        <path d="M24.2 23.4c6.9 0 12.2 4.9 12.2 10.6 0 3.9-3 6.3-6.4 6.3-2.4 0-3.6-1.2-5.8-1.2s-3.4 1.2-5.8 1.2c-3.4 0-6.4-2.4-6.4-6.3 0-5.7 5.3-10.6 12.2-10.6z" />
      </g>
    </motion.g>
  )
}
/**
 * Section divider: a walking paw trail that "prints itself" while scrolled
 * through (per-paw opacity driven by scrollYProgress; ref is unconditional).
 */
function PawTrail() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 95%', 'end 40%'] })
  const n = 8
  return (
    <div className="pawtrail" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 1180 116" preserveAspectRatio="xMidYMid meet">
        {Array.from({ length: n }, (_, i) => <TrailPaw key={i} i={i} n={n} p={scrollYProgress} reduce={reduce} />)}
      </svg>
    </div>
  )
}

/** Слой hero с параллаксом: мышь (x) + скролл (y), глубина задаётся числами. */
function Depth({ mx, my, scrollY, mouse, scroll, className, children, reduce, style }: {
  mx: MotionValue<number>; my: MotionValue<number>; scrollY: MotionValue<number>; mouse: number; scroll: number
  className: string; children: ReactNode; reduce: boolean | null; style?: CSSProperties
}) {
  const x = useTransform(mx, (v) => v * mouse)
  const yM = useTransform(my, (v) => v * mouse * .45)
  const yS = useTransform(scrollY, [0, 600], [0, scroll])
  const y = useTransform(() => yM.get() + yS.get())
  return <motion.div className={className} style={reduce ? style : { ...style, x, y }}>{children}</motion.div>
}

function Hero({ links }: { links: StoreLinks | null }) {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  // mouse parallax: islands and cards live at different depths
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 50, damping: 16 })
  const smy = useSpring(my, { stiffness: 50, damping: 16 })
  return (
    <section
      className="hero"
      onMouseMove={(e) => {
        if (reduce) return
        mx.set(e.clientX / window.innerWidth - .5)
        my.set(e.clientY / window.innerHeight - .5)
      }}
    >
      <Bits items={heroBits} />
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
            <a className="pill charity" href="#donate"><HeartMark name={links?.donation?.heart} size={14} color="var(--red)" style={{ flex: 'none' }} />{charityLabel(links, t)}</a>
          </motion.div>
          <motion.div initial={{ opacity: 0, rotate: -8, scale: .9 }} animate={{ opacity: 1, rotate: -1.5, scale: 1 }} transition={{ delay: .7, type: 'spring', stiffness: 200 }}>
            <span className="nop2w">{t.hero.noP2W}</span>
          </motion.div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hv-glow" />
          <Cubes items={heroCubes} />
          {heroIsles.map((h, i) => (
            <Depth key={h.scene} className={`hv-layer ${h.cls}`} mx={smx} my={smy} scrollY={scrollY} mouse={h.mouse} scroll={h.scroll} reduce={reduce}>
              {/* opacity-only entrance: the LCP image must not start invisible for long */}
              <motion.div initial={reduce ? false : { opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .1 + i * .12, type: 'spring', stiffness: 120, damping: 18 }}>
                <Isle scene={h.scene} sizes={h.sizes} glow={h.glow} phase={h.phase} priority={h.priority} />
              </motion.div>
            </Depth>
          ))}
          {floating.map((c, i) => (
            <Depth key={c.name} className={`float-card ${c.r} ${c.cls}`} mx={smx} my={smy} scrollY={scrollY} mouse={c.mouse} scroll={c.scroll} reduce={reduce}>
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: .7, rotate: c.rot * 1.8 }}
                animate={{ opacity: 1, scale: 1, rotate: c.rot }}
                transition={{ delay: .55 + i * .14, type: 'spring', stiffness: 170, damping: 17 }}
              >
                <motion.div animate={reduce ? {} : { y: [0, -8, 0], rotate: [0, -1.1, 0, 1.1, 0] }} transition={{ repeat: Infinity, duration: 6 + c.d, ease: 'easeInOut', delay: c.d }}>
                  <Tilt max={10} className="fc-inner">
                    <img src={c.src} alt="" width="300" height="400" decoding="async" />
                    <div className="fc-name">{c.name}</div>
                    <div className="fc-r">{c.r}</div>
                  </Tilt>
                </motion.div>
              </motion.div>
            </Depth>
          ))}
        </div>
      </div>
      <div className="scroll-hint"><span>{t.hero.scroll}</span><i /></div>
    </section>
  )
}

/** Бейдж в hero: перечисляет приюты из админки, иначе — дефолтный текст. */
function charityLabel(links: StoreLinks | null, t: ReturnType<typeof useI18n>['t']): string {
  const names = (links?.donation?.shelters ?? []).map((x) => x.name).filter(Boolean)
  if (!names.length) return t.hero.charity
  return (names.length === 1 ? t.hero.charityOne : t.hero.charityMany).replace('{n}', names.join(', '))
}

/**
 * Приюты для показа: список из админки, иначе — legacy-поля, иначе один
 * дефолтный приют из словарей (тексты подставит ShelterCard).
 */
function shelterList(d: StoreLinks['donation']): Shelter[] {
  if (d?.shelters?.length) return d.shelters
  if (d?.url || d?.title_i18n) {
    return [{ id: 'legacy', name: '', url: d.url ?? '', heart: d.heart, logo_url: null, title_i18n: d.title_i18n, text_i18n: d.text_i18n }]
  }
  return [{ id: 'default', name: '', url: '', heart: d?.heart, logo_url: null }]
}

/**
 * Донат приютам. Список приютов приходит из world_settings.donation (админка);
 * пока их нет — рисуем один дефолтный «Na Paluchu» из словарей. Логотип приюта
 * лежит полупрозрачным знаком в правом верхнем углу карточки.
 */
function ShelterCard({ s, on, single }: { s: Shelter; on: boolean; single: boolean }) {
  const { t, lang } = useI18n()
  const pick = (m?: Record<string, string>) => m?.[lang] || m?.ru || m?.en || ''
  const title = pick(s.title_i18n) || t.donation.title
  const text = pick(s.text_i18n) || t.donation.text
  // город дописываем одной фразой; точка в конце текста не должна удваиваться
  const city = pick(s.city_i18n)
  const body = `${on ? text : t.donation.soon}`.replace(/\.\s*$/, '')
  return (
    <div className={`donate ${single ? '' : 'multi'}`}>
      {s.logo_url && <MediaImg className="d-logo" src={s.logo_url} alt={s.name || title} loading="lazy" />}
      <i className="dbit b1" aria-hidden="true"><HeartMini /></i>
      <i className="dbit b2" aria-hidden="true"><HeartMini /></i>
      <div className="heart hover"><HeartMark name={s.heart} size="100%" color="var(--red)" /></div>
      <div>
        {!on && <span className="tag">{t.hero.soon}</span>}
        <h3>{title}</h3>
        <p>{body}{city ? `. ${city}` : ''}.</p>
      </div>
      {on
        ? <a className="btn" href={s.url} target="_blank" rel="noopener">{t.donation.cta}</a>
        : <button className="btn" disabled>{t.donation.cta}</button>}
    </div>
  )
}

function Donation({ links }: { links: StoreLinks | null }) {
  const d = links?.donation
  const list = shelterList(d)
  const master = !!d?.enabled
  return (
    <section className="section" style={{ paddingTop: 0 }} id="donate">
      <Reveal className="wrap">
        <div className={`donates ${list.length > 1 ? 'multi' : ''}`}>
          {list.map((s) => <ShelterCard key={s.id} s={s} on={master && !!s.url} single={list.length === 1} />)}
        </div>
      </Reveal>
    </section>
  )
}

const stepGlow = ['var(--red)', 'var(--rare)', 'var(--legendary)', 'var(--epic)']
/** Step icon pops in with a small spring when its card reveals. */
const icoV = {
  hidden: { scale: .7, y: 14, opacity: 0 },
  show: { scale: 1, y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 220, damping: 16 } },
}
const tierCats = { common: '/game/a4_c_street_bowtie.svg', rare: '/game/a4_r_frost_halo.svg', epic: '/game/a4_e_lunar_horns.svg', legendary: '/game/acc_crown.svg' }
const tierPct = { common: '~70%', rare: '~22%', epic: '~7%', legendary: '<1%' }
const worldArt: Record<string, { scene: Scene; icon: string; glow: string }> = {
  arena: { scene: 'ban_arena', icon: '/game/pvp_50.svg', glow: 'var(--legendary)' },
  dungeon: { scene: 'dungeon_5', icon: '/game/weak_spot.svg', glow: '#E0562B' },
  fishing: { scene: 'fish_calm', icon: '/game/fish_legend.svg', glow: '#2FA8B5' },
  expedition: { scene: 'exp_roofs', icon: '/game/exp_start.svg', glow: '#C0691F' },
  tournament: { scene: 'ban_chests', icon: '/game/crown_champion.svg', glow: 'var(--legendary)' },
  buddy: { scene: 'ban_catdex', icon: '/game/buddy_feed.svg', glow: 'var(--rare)' },
}
/** Сцены шагов «Как играть»: рынок (найди кота), кристаллы (скан), сундуки (карта), доска заданий. */
const stepScenes: Scene[] = ['ban_market', 'ban_shop', 'ban_chests', 'ban_quests']
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

  const cards = t.worlds.items.map((w, i) => (
    <Tilt key={w.k} className="world" max={6}>
      <div className="w-scene"><Isle className="w-isle" scene={worldArt[w.k].scene} sizes="340px" glow={worldArt[w.k].glow} phase={i * 1.1} /></div>
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

/** matchMedia без мигания: значение есть уже на первом рендере. */
function useMedia(q: string) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(q); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => window.matchMedia(q).matches,
    () => false,
  )
}

/** Демо-прогресс как на карте в игре: два пройдено, третий текущий, дальше закрыто. */
const dmap = [
  { id: 1, unlock: 5, done: 11, accent: '#C0691F' },
  { id: 2, unlock: 10, done: 11, accent: '#3E7D4F' },
  { id: 3, unlock: 15, done: 4, accent: '#D98A2B' },
  { id: 4, unlock: 20, done: -1, accent: '#5AC8D9' },
  { id: 5, unlock: 30, done: -1, accent: '#E0562B' },
] as const

type Pt = { x: number; y: number }
const bez = (a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt => {
  const u = 1 - t
  return { x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x, y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y }
}

/**
 * Карта подземелий — фирменный вид игры (widgets/dungeon_islands.dart):
 * острова зигзагом, между ними пунктирная тропа с лапками, под каждым белая
 * плашка «название · N/11». Десктоп — горизонтальный зигзаг, мобила — вертикальный.
 * Координаты в единицах viewBox; острова и плашки позиционируются в процентах
 * того же прямоугольника, поэтому SVG-тропа совпадает с ними на любой ширине.
 */
function DungeonMap() {
  const { t } = useI18n()
  const reduce = useReducedMotion()
  const wide = useMedia('(min-width: 900px)')
  const n = dmap.length
  // геометрия: W×H — viewBox; s — сторона квадрата острова
  const W = wide ? 1180 : 400
  const s = wide ? 214 : 204
  const gapX = (W - 40 - s) / (n - 1)
  const rowY = wide ? 270 : s * 1.1
  const pos = (i: number): Pt => wide
    ? { x: 20 + i * gapX, y: i % 2 ? rowY : 0 }
    : { x: i % 2 ? W - s - 2 : 2, y: i * rowY }
  const H = wide ? rowY + s + 50 : (n - 1) * rowY + s + 50
  const centers = dmap.map((_, i) => { const p = pos(i); return { x: p.x + s / 2, y: p.y + s / 2 } })
  // тропа: от бока плашки острова i к краю острова i+1 (S-кривая), 3 лапки по ходу
  const trails = centers.slice(0, -1).map((c0, i) => {
    const c3 = centers[i + 1]
    const dx = Math.sign(c3.x - c0.x) || 1
    const down = c3.y > c0.y
    const a: Pt = down || !wide
      ? { x: c0.x + dx * s * .4, y: c0.y + s * .42 }
      : { x: c0.x + dx * s * .42, y: c0.y - s * .26 }
    const b: Pt = down || !wide
      ? { x: c3.x - dx * s * .4, y: c3.y - s * .3 }
      : { x: c3.x - dx * s * .4, y: c3.y + s * .42 }
    const bulge = wide ? 26 : 46
    const c1: Pt = { x: a.x + dx * bulge, y: a.y + (b.y - a.y) * .5 }
    const c2: Pt = { x: b.x - dx * bulge, y: b.y - (b.y - a.y) * .5 }
    const d = `M${a.x} ${a.y}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`
    const paws = [.22, .5, .78].map((f) => {
      const p = bez(a, c1, c2, b, f)
      const q = bez(a, c1, c2, b, f + .01)
      return { ...p, r: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI + 90 }
    })
    return { d, paws }
  })
  const pct = (v: number, of: number) => `${(v / of) * 100}%`
  return (
    <section className="section dmap-sec" id="dungeons">
      <div className="wrap">
        <Reveal className="section-head"><Drift><span className="kicker">{t.dmap.kicker}</span><h2>{t.dmap.title}</h2><p>{t.dmap.sub}</p></Drift></Reveal>
        <div className={`dmap ${wide ? 'h' : 'v'}`} style={{ aspectRatio: `${W} / ${H}` }}>
          <svg className="dmap-trail" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            {trails.map((tr, i) => (
              <g key={i}>
                <path d={tr.d} className="dash" />
                {tr.paws.map((p, k) => (
                  <motion.g
                    key={k}
                    initial={reduce ? false : { opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ delay: .25 + i * .35 + k * .12, duration: .35 }}
                  >
                    <g transform={`translate(${p.x} ${p.y}) rotate(${p.r})${wide ? '' : ' scale(.82)'}`}>
                      <ellipse cx="0" cy="3" rx="6" ry="5" />
                      <ellipse cx="-6.2" cy="-3.6" rx="2.3" ry="2.9" />
                      <ellipse cx="-2.3" cy="-6.8" rx="2.3" ry="2.9" />
                      <ellipse cx="2.3" cy="-6.8" rx="2.3" ry="2.9" />
                      <ellipse cx="6.2" cy="-3.6" rx="2.3" ry="2.9" />
                    </g>
                  </motion.g>
                ))}
              </g>
            ))}
          </svg>
          <ol className="dmap-list" aria-label={t.dmap.label}>
            {dmap.map((d, i) => {
              const p = pos(i)
              const locked = d.done < 0
              const cur = !locked && d.done < 11
              const name = t.dmap.names[i]
              const sub = locked ? t.dmap.locked.replace('{n}', String(d.unlock)) : `${d.done}/11`
              return (
                <li
                  key={d.id}
                  className={`dm-spot${locked ? ' locked' : ''}${cur ? ' current' : ''}`}
                  style={{ left: pct(p.x, W), top: pct(p.y, H), width: pct(s, W), '--acc': d.accent } as CSSProperties}
                >
                  <Isle scene={`dungeon_${d.id}` as Scene} sizes={wide ? '(max-width: 1180px) 18vw, 214px' : '51vw'} glow={cur ? d.accent : undefined} phase={i * 1.3} />
                  <span className="dm-pill">
                    <b>{name}</b>
                    <span className="dm-sub">
                      {locked && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><rect x="3" y="7" width="10" height="7.4" rx="2" fill="currentColor" /></svg>}
                      <span>{sub}</span>
                      {d.done >= 11 && <i className="dm-check" title={t.dmap.cleared}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 8.4 6.8 11 11.8 5.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></i>}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
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
  useEffect(() => { let alive = true; api.blogList(lang, 3).then((v) => { if (alive) setPosts(v) }); return () => { alive = false } }, [lang])

  return (
    <>
      <Hero links={links} />
      <Donation links={links} />

      <section className="section" id="how">
        <GlyphLayer side="right"><Paw /></GlyphLayer>
        <div className="wrap">
          <Reveal className="section-head"><Drift><span className="kicker">{t.how.kicker}</span><h2>{t.how.title}</h2></Drift></Reveal>
          <div className="steps">
            {t.how.steps.map((s, i) => (
              <Reveal key={s.t} i={i} className="step">
                <motion.div className="step-scene" variants={icoV}><Isle scene={stepScenes[i]} sizes="(max-width: 520px) 86vw, (max-width: 1000px) 42vw, 260px" glow={stepGlow[i]} phase={i * 1.4} /></motion.div>
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

      <PawTrail />

      <section className="section" style={{ background: 'var(--mist)' }} id="rarity">
        <GlyphLayer side="left"><img src="/game/gem.svg" alt="" /></GlyphLayer>
        <Bits items={rarityBits} />
        <div className="wrap">
          <Reveal className="section-head"><Drift><span className="kicker">{t.rarity.kicker}</span><h2>{t.rarity.title}</h2><p>{t.rarity.sub}</p></Drift></Reveal>
          <div className="tiers">
            {t.rarity.tiers.map((r, i) => (
              <Reveal key={r.k} i={i} className={`tier ${r.k}`}>
                {r.k !== 'legendary' && <><i className="spark s1" aria-hidden="true" /><i className="spark s2" aria-hidden="true" /></>}
                <img className="cat hover" style={{ animationDelay: `${i * .7}s` }} src={tierCats[r.k as keyof typeof tierCats]} alt="" />
                <span className="pct">{tierPct[r.k as keyof typeof tierPct]}</span>
                <h3>{r.n}</h3><p>{r.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <WorldsSection />

      <DungeonMap />

      <section className="section fair" id="fair">
        <GlyphLayer side="left"><img src="/game/luck_dice.svg" alt="" /></GlyphLayer>
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

      <PawTrail />

      <section className="section">
        <GlyphLayer side="right"><img src="/game/crown_champion.svg" alt="" /></GlyphLayer>
        <div className="wrap">
          <Reveal className="section-head"><span className="kicker">{t.numbers.kicker}</span></Reveal>
          <div className="numbers">
            {t.numbers.items.map((n, i) => <Reveal key={n.l} i={i} className="number"><b>{n.v}</b><span>{n.l}</span></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--mist)' }}>
        <GlyphLayer side="right"><img src="/game/fish_legend.svg" alt="" /></GlyphLayer>
        <Bits items={videoBits} />
        <div className="wrap">
          <Reveal className="section-head"><Drift><span className="kicker">{t.video.kicker}</span><h2>{t.video.title}</h2><p>{t.hero.kicker}</p></Drift></Reveal>
          <Reveal i={1}>
            <div className="phone-video">
              <video controls playsInline preload="none" poster="/shots/promo-poster.webp">
                <source src="/video/promo-portrait.webm" type="video/webm" />
                <source src="/video/promo-portrait.mp4" type="video/mp4" />
                {t.video.unsupported}
              </video>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <GlyphLayer side="left"><img src="/game/map_paw.svg" alt="" /></GlyphLayer>
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
            <div className="empty isle-empty"><Isle scene="fish_shoal" sizes="260px" glow="var(--rare)" /><p>{t.blogTeaser.empty}</p></div>
          )}
        </div>
      </section>

      <PawTrail />

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
