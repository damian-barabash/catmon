/* CatMon admin icon set — 24×24, stroke-based, currentColor. No emoji anywhere. */
import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size = 24) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true })

export const IcPaw = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><ellipse cx="12" cy="15.5" rx="4.2" ry="3.6" /><circle cx="6.2" cy="11" r="1.7" /><circle cx="17.8" cy="11" r="1.7" /><circle cx="9" cy="6.8" r="1.8" /><circle cx="15" cy="6.8" r="1.8" /></svg>
)
export const IcGem = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M7 4h10l4 5-9 11L3 9l4-5z" /><path d="M3 9h18M9 9l3 11M15 9l-3 11M7 4l2 5M17 4l-2 5" /></svg>
)
export const IcEye = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><ellipse cx="12" cy="12" rx="1.6" ry="3.2" fill="currentColor" stroke="none" /></svg>
)
export const IcChest = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 10a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9H3v-9z" /><path d="M3 11h18M12 11v4" /><rect x="10.3" y="11" width="3.4" height="3" rx="0.6" fill="currentColor" stroke="none" /></svg>
)
export const IcArena = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 20l6-6M20 4l-4 4M14 4l6 6-3 3-6-6z" /><path d="M4 10l6-6 3 3-6 6zM20 20l-6-6" /><path d="M2 18l4 4M22 18l-4 4" /></svg>
)
export const IcFish = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 12c3-4.5 7-6 11-6 3 0 5.5 2.5 7 6-1.5 3.5-4 6-7 6-4 0-8-1.5-11-6z" /><path d="M3 12l-1-4 5 4-5 4 1-4z" fill="currentColor" stroke="none" /><circle cx="17" cy="11" r="1" fill="currentColor" stroke="none" /></svg>
)
export const IcMap = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" /><path d="M9 4v14M15 6v14" /></svg>
)
export const IcDashboard = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="3" y="3" width="8" height="10" rx="2" /><rect x="13" y="3" width="8" height="6" rx="2" /><rect x="13" y="11" width="8" height="10" rx="2" /><rect x="3" y="15" width="8" height="6" rx="2" /></svg>
)
export const IcUsers = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14c3 0 5.5 2 5.5 5" /></svg>
)
export const IcBlog = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M5 3h10l4 4v14H5z" /><path d="M15 3v4h4M8 12h8M8 16h8M8 8h3" /></svg>
)
export const IcInbox = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 13l2.5-8h13L21 13v6H3z" /><path d="M3 13h5l1.5 3h5L16 13h5" /></svg>
)
export const IcTrophy = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8M9 18h6" /></svg>
)
export const IcWorld = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>
)
export const IcShield = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>
)
export const IcAudit = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 5h16v14H4z" /><path d="M8 10h8M8 14h5" /><circle cx="17" cy="16" r="3" /><path d="M19.5 18.5L22 21" /></svg>
)
export const IcKey = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="8" cy="14" r="4.5" /><path d="M11.5 11.5L20 3M16 7l3 3M13.5 9.5l3 3" /></svg>
)
export const IcUser = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
)
export const IcSearch = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></svg>
)
export const IcMenu = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M4 7h16M4 12h10M4 17h16" /></svg>
)
export const IcClose = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const IcSun = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
)
export const IcMoon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
)
export const IcCalendar = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
)
export const IcPlus = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 5v14M5 12h14" /></svg>)
export const IcMinus = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 12h14" /></svg>)
export const IcArrowLeft = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>)
export const IcArrowRight = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>)
export const IcChevron = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 9l6 6 6-6" /></svg>)
export const IcCheck = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 12l5 5L20 7" /></svg>)
export const IcWarn = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v5M12 18v.5" /></svg>)
export const IcInfo = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>)
export const IcGift = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S10 9 12 9zm0 0c2-4 6-4 6-1.5S14 9 12 9z" /></svg>)
export const IcBan = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M5.5 5.5l13 13" /></svg>)
export const IcTrash = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></svg>)
export const IcCamera = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 8h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13.5" r="3.5" /></svg>)
export const IcUpload = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg>)
export const IcImage = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-8 8" /></svg>)
export const IcMail = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 8l9 6 9-6" /></svg>)
export const IcBolt = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>)
export const IcServer = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.5M7 16.5h.5" /></svg>)
export const IcClock = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
export const IcStar = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" /></svg>)
export const IcScan = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M4 12h16" /></svg>)
export const IcChat = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 9h8M8 12h5" /></svg>)
export const IcCompass = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" fill="currentColor" stroke="none" /></svg>)
export const IcMarket = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 9l1.5-5h13L20 9M4 9h16v11H4z" /><path d="M9 13h6" /></svg>)
export const IcDungeon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M3 21V9l3-3V3h3v3h6V3h3v3l3 3v12" /><path d="M10 21v-6h4v6" /></svg>)
export const IcCoins = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><ellipse cx="12" cy="6.5" rx="7" ry="3" /><path d="M5 6.5v11c0 1.7 3.1 3 7 3s7-1.3 7-3v-11" /><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" /></svg>)
export const IcLogout = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" /></svg>)
export const IcRefresh = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></svg>)
export const IcExternal = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>)
export const IcDrag = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="9" cy="6" r="1.2" fill="currentColor" /><circle cx="15" cy="6" r="1.2" fill="currentColor" /><circle cx="9" cy="12" r="1.2" fill="currentColor" /><circle cx="15" cy="12" r="1.2" fill="currentColor" /><circle cx="9" cy="18" r="1.2" fill="currentColor" /><circle cx="15" cy="18" r="1.2" fill="currentColor" /></svg>)
export const IcBold = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M7 4h6a3.5 3.5 0 0 1 0 7H7zM7 11h7a3.5 3.5 0 0 1 0 7H7z" /><path d="M7 4v14" /></svg>)
export const IcItalic = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M10 4h8M6 20h8M14 4l-4 16" /></svg>)
export const IcHeading = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M5 4v16M15 4v16M5 12h10M19 14v6M17.5 16l1.5-2" /></svg>)
export const IcList = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="5" cy="6" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="18" r="1" fill="currentColor" /></svg>)
export const IcLink = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" /></svg>)
export const IcQuote = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 15a3 3 0 0 1 3-3V8a7 7 0 0 0-6 7v3h6v-3zM15 15a3 3 0 0 1 3-3V8a7 7 0 0 0-6 7v3h6v-3z" /></svg>)
export const IcCode = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" /></svg>)
export const IcCat = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M5 10L4 3l5 3h6l5-3-1 7a8 8 0 1 1-14 0z" /><circle cx="9.5" cy="12.5" r="1" fill="currentColor" stroke="none" /><circle cx="14.5" cy="12.5" r="1" fill="currentColor" stroke="none" /><path d="M10.5 16h3l-1.5 1.5z" fill="currentColor" stroke="none" /></svg>
)
export const IcEmpty = ({ size = 96, ...p }: P) => (
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden {...p}>
    <circle cx="48" cy="48" r="44" fill="var(--mist)" />
    <path d="M28 44l-3-18 13 8h20l13-8-3 18a20 20 0 1 1-40 0z" stroke="var(--subtle)" strokeWidth="2.5" strokeLinejoin="round" fill="var(--paper)" />
    <path d="M40 50h4M52 50h4" stroke="var(--subtle)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M45 58c1.5 2 4.5 2 6 0" stroke="var(--subtle)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 70q18 -6 36 0" stroke="var(--line)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 5" />
  </svg>
)
