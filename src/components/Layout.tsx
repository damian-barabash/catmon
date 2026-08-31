import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { LANG_NAMES, useI18n } from '../i18n'
import { LANGS, SUPPORT_EMAIL, type Lang } from '../lib/config'
import { CatLogo, CookieIcon, Paw, Social } from './Icons'
import { getConsent, setConsent } from '../lib/consent'
import { api } from '../lib/api'

function Header() {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])
  // while the overlay is open: lock body scroll, close on Escape
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open])
  const links = (
    <>
      <NavLink to="/" end>{t.nav.home}</NavLink>
      <NavLink to="/season">{t.nav.season}</NavLink>
      <NavLink to="/blog">{t.nav.blog}</NavLink>
      <NavLink to="/contact">{t.nav.contact}</NavLink>
    </>
  )
  const langSelect = (
    <div className="lang">
      <select aria-label={t.common.langLabel} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
        {LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
      </select>
    </div>
  )
  return (
    <>
    <header className="header">
      <div className="wrap">
        <Link to="/" className="brand" aria-label="CatMon"><CatLogo />CatMon</Link>
        <nav className="nav">{links}</nav>
        {langSelect}
        <button className="burger" aria-label="Menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}><span /></button>
      </div>
    </header>
      {/* overlay lives OUTSIDE .header: its backdrop-filter would turn the
          header into the containing block for position:fixed and trap the
          overlay inside the 68px strip */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu" className="menu-overlay" role="dialog" aria-modal="true"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .22 }}
          >
            <div className="wrap menu-top">
              <Link to="/" className="brand" onClick={() => setOpen(false)}><CatLogo />CatMon</Link>
              <button className="menu-close" aria-label={t.common.close} onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
              </button>
            </div>
            <motion.nav
              className="wrap menu-nav" onClick={() => setOpen(false)}
              initial={{ y: 26, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .3, delay: .06, ease: [0.22, 1, 0.36, 1] }}
            >
              {links}
            </motion.nav>
            <div className="wrap menu-lang">{langSelect}</div>
            <Paw className="menu-paw" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand"><CatLogo animated={false} />CatMon</Link>
            <p className="tagline">{t.footer.tagline}</p>
          </div>
          <div>
            <h4>{t.footer.game}</h4>
            <ul>
              <li><Link to="/#how">{t.nav.how}</Link></li>
              <li><Link to="/#worlds">{t.nav.worlds}</Link></li>
              <li><Link to="/season">{t.nav.season}</Link></li>
              <li><Link to="/blog">{t.nav.blog}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.legal}</h4>
            <ul>
              <li><Link to="/privacy">{t.footer.privacy}</Link></li>
              <li><Link to="/cookies">{t.footer.cookies}</Link></li>
              <li><Link to="/terms">{t.footer.terms}</Link></li>
              <li><Link to="/rules">{t.footer.rules}</Link></li>
              <li><Link to="/data-processing">{t.footer.data}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t.footer.company}</h4>
            <ul>
              <li><Link to="/contact">{t.nav.contact}</Link></li>
              <li><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
            </ul>
            <h4 style={{ marginTop: '1.5rem' }}>{t.footer.social}</h4>
            <div className="socials">
              <a href="#" aria-label="X"><Social.x /></a>
              <a href="#" aria-label="Instagram"><Social.ig /></a>
              <a href="#" aria-label="TikTok"><Social.tt /></a>
              <a href="#" aria-label="YouTube"><Social.yt /></a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {t.footer.rights}</span>
          <span>catmongame.app</span>
        </div>
      </div>
    </footer>
  )
}

function CookieBanner() {
  const { t } = useI18n()
  const [shown, setShown] = useState(() => getConsent() === null)
  if (!shown) return null
  const pick = (c: 'all' | 'necessary') => { setConsent(c); setShown(false) }
  return (
    <div className="cookie" role="dialog" aria-live="polite">
      <CookieIcon />
      <p>{t.cookie.text} <Link to="/cookies">{t.cookie.more}</Link></p>
      <div className="acts">
        <button className="btn ghost" onClick={() => pick('necessary')}>{t.cookie.decline}</button>
        <button className="btn" onClick={() => pick('all')}>{t.cookie.accept}</button>
      </div>
    </div>
  )
}

/** Sends a page-view to site-api only after full consent. */
function Tracker() {
  const { lang } = useI18n()
  const { pathname } = useLocation()
  useEffect(() => {
    const send = () => { if (getConsent() === 'all') api.track('pageview', pathname, lang) }
    send()
    window.addEventListener('catmon-consent', send)
    return () => window.removeEventListener('catmon-consent', send)
  }, [pathname, lang])
  return null
}

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) { el.scrollIntoView({ behavior: 'smooth' }); return }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

/** Thin scroll-progress bar under the top edge (transform-only). */
function ScrollProgress() {
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: .3 })
  return <motion.div className="progress" style={{ scaleX: reduce ? scrollYProgress : smooth }} aria-hidden="true" />
}

export default function Layout() {
  return (
    <>
      <ScrollProgress />
      <ScrollTop />
      <Tracker />
      <Header />
      <main><Outlet /></main>
      <Footer />
      <CookieBanner />
    </>
  )
}
