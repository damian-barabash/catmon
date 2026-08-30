import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './admin.css'
import { StoreProvider, useRefreshing, useStore } from './store'
import { Toasts, initials } from './ui'
import { IcAudit, IcBlog, IcCat, IcChest, IcDashboard, IcInbox, IcLogout, IcMap, IcMenu, IcMoon, IcSearch, IcShield, IcSun, IcTrophy, IcUser, IcUsers, IcWorld, IcKey } from './icons'
import { LANGS } from './i18n'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Players from './pages/Players'
import PlayerProfile from './pages/PlayerProfile'
import Cats from './pages/Cats'
import CatEditor from './pages/CatEditor'
import Items from './pages/Items'
import Blog from './pages/Blog'
import BlogEditor from './pages/BlogEditor'
import Contacts from './pages/Contacts'
import Seasons from './pages/Seasons'
import Settings from './pages/Settings'
import Policies from './pages/Policies'
import MapPage from './pages/MapPage'
import Audit from './pages/Audit'
import Admins from './pages/Admins'
import Profile from './pages/Profile'

const NAV = [
  { to: '/admin', k: 'nav_dashboard', I: IcDashboard, end: true },
  { to: '/admin/players', k: 'nav_players', I: IcUsers },
  { to: '/admin/cats', k: 'nav_cats', I: IcCat },
  { to: '/admin/items', k: 'nav_items', I: IcChest },
  { to: '/admin/blog', k: 'nav_blog', I: IcBlog },
  { to: '/admin/contacts', k: 'nav_contacts', I: IcInbox },
  { to: '/admin/seasons', k: 'nav_seasons', I: IcTrophy },
  { to: '/admin/settings', k: 'nav_settings', I: IcWorld },
  { to: '/admin/policies', k: 'nav_policies', I: IcShield },
  { to: '/admin/map', k: 'nav_map', I: IcMap },
  { to: '/admin/audit', k: 'nav_audit', I: IcAudit },
  { to: '/admin/admins', k: 'nav_admins', I: IcKey },
  { to: '/admin/profile', k: 'nav_profile', I: IcUser },
] as const

function Shell({ children }: { children: ReactNode }) {
  const { t, theme, setTheme, lang, setLang, admin, logout, mock } = useStore()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(() => { try { return localStorage.getItem('admin.side') === '1' } catch { return false } })
  const refreshing = useRefreshing()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const loc = useLocation()
  useEffect(() => { setOpen(false) }, [loc.pathname])
  const now = new Date()
  const dateTxt = now.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'pl' ? 'pl-PL' : 'en-GB', { weekday: 'short', month: 'long' })
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) { nav(`/admin/players?q=${encodeURIComponent(q.trim())}`); setQ('') } }
  return (
    <div className={`adm-shell ${expanded ? 'side-x' : ''}`}>
      <div className={`side-bg ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`adm-side ${open ? 'open' : ''}`}>
        <div className="adm-logo"><img src="/admin/cat_logo.png" alt="CatMon" /></div>
        <nav className="adm-nav" aria-label="main">
          {NAV.filter(n => n.to !== '/admin/admins' || admin?.role === 'owner').map(n => (
            <NavLink key={n.to} to={n.to} end={'end' in n && n.end} className={({ isActive }) => (isActive ? 'active' : '')} aria-label={t(n.k)}>
              <n.I size={22} /><span className="lbl">{t(n.k)}</span><span className="tip">{t(n.k)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="bottom">
          <button className="btn icon ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? t('theme_light') : t('theme_dark')} title={theme === 'dark' ? t('theme_light') : t('theme_dark')}>{theme === 'dark' ? <IcSun size={20} /> : <IcMoon size={20} />}</button>
          <select className="select" style={{ width: 62, padding: '6px 22px 6px 8px', fontSize: 12, borderRadius: 999 }} value={lang} onChange={e => setLang(e.target.value as typeof lang)} aria-label={t('lang')}>{LANGS.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>
          <button className="btn icon ghost" onClick={() => { logout(); nav('/admin/login') }} aria-label={t('logout')} title={t('logout')}><IcLogout size={20} /></button>
        </div>
      </aside>
      <main className="adm-main">
        <header className="adm-top">
          <button className="btn icon adm-burger" onClick={() => { if (window.innerWidth <= 800) setOpen(o => !o); else setExpanded(x => { try { localStorage.setItem('admin.side', x ? '0' : '1') } catch { /* */ } return !x }) }} aria-label="menu" aria-expanded={expanded}><IcMenu size={20} /></button>
          <div className="date-pill"><div className="dnum">{now.getDate()}</div><div className="dtxt"><b>{dateTxt}</b>{t('brand')} · {t('admin')}{mock && <span className="chip warn" style={{ marginLeft: 6 }}>mock</span>}</div></div>
          {refreshing && <span className="refresh-pill" role="status"><i />{t('updating')}</span>}
          <form className="adm-search right" onSubmit={submitSearch} role="search"><IcSearch size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={t('search_players')} aria-label={t('search')} /></form>
          <NavLink to="/admin/profile" className="row" style={{ gap: 10 }}><div className="adm-avatar">{initials(admin?.name || admin?.email)}</div><div className="adm-who"><b>{admin?.name || admin?.email}</b><span>{admin?.role}</span></div></NavLink>
        </header>
        {children}
      </main>
    </div>
  )
}

function Guard({ children }: { children: ReactNode }) {
  const { admin, ready } = useStore()
  const loc = useLocation()
  if (!ready) return <div className="adm" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}><div className="sk" style={{ width: 120, height: 12 }} /></div>
  if (!admin) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />
  return <Shell>{children}</Shell>
}

function Inner() {
  const { theme } = useStore()
  return (
    <div className={`adm ${theme === 'dark' ? 'dark' : ''}`}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route index element={<Guard><Dashboard /></Guard>} />
        <Route path="players" element={<Guard><Players /></Guard>} />
        <Route path="players/:id" element={<Guard><PlayerProfile /></Guard>} />
        <Route path="cats" element={<Guard><Cats /></Guard>} />
        <Route path="cats/:id" element={<Guard><CatEditor /></Guard>} />
        <Route path="items" element={<Guard><Items /></Guard>} />
        <Route path="blog" element={<Guard><Blog /></Guard>} />
        <Route path="blog/:id" element={<Guard><BlogEditor /></Guard>} />
        <Route path="contacts" element={<Guard><Contacts /></Guard>} />
        <Route path="seasons" element={<Guard><Seasons /></Guard>} />
        <Route path="settings" element={<Guard><Settings /></Guard>} />
        <Route path="policies" element={<Guard><Policies /></Guard>} />
        <Route path="map" element={<Guard><MapPage /></Guard>} />
        <Route path="audit" element={<Guard><Audit /></Guard>} />
        <Route path="admins" element={<Guard><Admins /></Guard>} />
        <Route path="profile" element={<Guard><Profile /></Guard>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      <Toasts />
    </div>
  )
}

/** Mounted by the site router at `/admin/*`. Self-contained: own routes, layout, styles, providers. */
export default function AdminApp() {
  return <StoreProvider><Inner /></StoreProvider>
}
