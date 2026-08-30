// All icons are hand-made SVG (no emoji, per design rules).
/**
 * The real game logo (public/game/cat_logo.png — monochrome cat with alpha).
 * Rendered through a CSS mask so it can take any colour: `color` fills the
 * silhouette (currentColor by default), which inverts automatically between
 * light and dark backgrounds.
 */
export function CatLogo({ className = '', color = 'currentColor', animated = true }: { className?: string; color?: string; animated?: boolean }) {
  return <span className={`cat-mark${animated ? ' live' : ''}${className ? ` ${className}` : ''}`} style={{ backgroundColor: color }} aria-hidden="true" />
}

export const AppleIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path fill="currentColor" d="M33.2 25.6c.05 5.4 4.73 7.2 4.78 7.22-.04.13-.75 2.56-2.47 5.07-1.49 2.17-3.03 4.33-5.46 4.38-2.39.04-3.16-1.42-5.89-1.42-2.73 0-3.58 1.37-5.84 1.46-2.35.09-4.14-2.35-5.64-4.51-3.06-4.42-5.4-12.5-2.26-17.95 1.56-2.71 4.35-4.42 7.37-4.47 2.3-.04 4.48 1.55 5.89 1.55 1.41 0 4.05-1.92 6.83-1.64 1.16.05 4.43.47 6.53 3.54-.17.1-3.9 2.28-3.84 6.77zM28.7 12.4c1.25-1.51 2.09-3.61 1.86-5.7-1.8.07-3.97 1.2-5.26 2.7-1.16 1.34-2.17 3.48-1.9 5.53 2 .16 4.05-1.02 5.3-2.53z" />
  </svg>
)
export const PlayIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M10 7.5v33l18-16.5z" fill="#34A853" />
    <path d="M10 7.5l18 16.5 5.5-5L12.5 6.5c-1-.6-2-.3-2.5 1z" fill="#4285F4" />
    <path d="M10 40.5l18-16.5 5.5 5L12.5 41.5c-1 .6-2 .3-2.5-1z" fill="#EA4335" />
    <path d="M33.5 19l5.5 3.2c1.6.9 1.6 2.7 0 3.6L33.5 29 28 24z" fill="#FBBC04" />
  </svg>
)
export const Paw = ({ className = '', style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 48 48" className={className} style={style} aria-hidden="true">
    {/* Proper paw print: four toe beans in an arc above one big oval pad. */}
    <g fill="currentColor">
      <ellipse cx="10.6" cy="19.6" rx="3.9" ry="5.3" transform="rotate(-26 10.6 19.6)" />
      <ellipse cx="19.4" cy="13.8" rx="4.3" ry="5.9" transform="rotate(-9 19.4 13.8)" />
      <ellipse cx="29.2" cy="13.8" rx="4.3" ry="5.9" transform="rotate(9 29.2 13.8)" />
      <ellipse cx="37.8" cy="19.6" rx="3.9" ry="5.3" transform="rotate(26 37.8 19.6)" />
      <path d="M24.2 23.4c6.9 0 12.2 4.9 12.2 10.6 0 3.9-3 6.3-6.4 6.3-2.4 0-3.6-1.2-5.8-1.2s-3.4 1.2-5.8 1.2c-3.4 0-6.4-2.4-6.4-6.3 0-5.7 5.3-10.6 12.2-10.6z" />
    </g>
  </svg>
)
export const HeartCat = () => (
  <svg viewBox="0 0 96 96" aria-hidden="true">
    <path d="M48 86C26 70 8 56 8 36c0-11 8-19 19-19 8 0 15 5 21 12 6-7 13-12 21-12 11 0 19 8 19 19 0 20-18 34-40 50z" fill="#C9202A" />
    <g fill="#FAF9F6">
      <path d="M33 44l3-9 5 6h14l5-6 3 9v18c0 3-2 5-5 5H38c-3 0-5-2-5-5z" />
    </g>
    <g fill="#141412">
      <circle cx="42" cy="52" r="2.5" />
      <circle cx="54" cy="52" r="2.5" />
    </g>
  </svg>
)
export const CookieIcon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 5c2 6 7 9 13 8-1 6 3 11 8 12-1 11-10 19-21 19C13 44 5 36 5 24S13 5 24 5z" fill="#E8A200" stroke="#141412" strokeWidth="2" strokeLinejoin="round" />
    <g fill="#141412"><circle cx="16" cy="19" r="2.5" /><circle cx="24" cy="30" r="3" /><circle cx="33" cy="33" r="2" /><circle cx="14" cy="32" r="2" /></g>
  </svg>
)
export const SadCat = () => (
  <svg viewBox="0 0 191 174" aria-hidden="true">
    <path d="M22 44c0-6 4-10 10-10h4l10-22c1-3 5-3 6 0l7 22h40l7-22c1-3 5-3 6 0l10 22h4c6 0 10 4 10 10v110c0 4-3 7-7 7H29c-4 0-7-3-7-7z" fill="currentColor" />
    <path d="M118 131c10 24 40 26 52 6 4-7 2-15-3-13-4 2-2 9-8 11-10 4-22-2-30-14z" fill="currentColor" />
    <g stroke="var(--paper)" strokeWidth="5" strokeLinecap="round" fill="none">
      <path d="M52 82l14 8M66 82l-14 8M98 82l14 8M112 82l-14 8" />
      <path d="M70 118q13-8 26 0" />
    </g>
  </svg>
)
export const Social = {
  x: () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9L1 2h7l4.8 6.4zm-1.2 18h1.9L7.1 3.9H5.1z" /></svg>),
  ig: () => (<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" /></svg>),
  tt: () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 2h-3v13.5a2.5 2.5 0 11-2.5-2.5V10a5.5 5.5 0 105.5 5.5V8.6c1.3.9 2.8 1.4 4.5 1.4V7c-2.5 0-4.5-2.2-4.5-5z" /></svg>),
  yt: () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 8.2c-.2-1.6-1-2.6-2.6-2.8C17.2 5 12 5 12 5s-5.2 0-7.4.4C3 5.6 2.2 6.6 2 8.2 1.8 9.8 1.8 12 1.8 12s0 2.2.2 3.8c.2 1.6 1 2.6 2.6 2.8C6.8 19 12 19 12 19s5.2 0 7.4-.4c1.6-.2 2.4-1.2 2.6-2.8.2-1.6.2-3.8.2-3.8s0-2.2-.2-3.8zM10 15V9l5.2 3z" /></svg>),
}
export const Check = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#2f9e44" /><path d="M14 25l7 7 13-14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
)
export const Cross = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#C9202A" /><path d="M16 16l16 16M32 16L16 32" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>
)
export const Handshake = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 20l8-8h10l4 4 4-4h10l0 16-8 8-10 4-10-4-8-8z" fill="#FFD558" stroke="#141412" strokeWidth="2" strokeLinejoin="round" /><path d="M18 22l6 6 6-6M14 26l10 10 10-10" fill="none" stroke="#141412" strokeWidth="2" strokeLinecap="round" /></svg>
)
export const Bug = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="28" rx="11" ry="14" fill="#C9202A" stroke="#141412" strokeWidth="2" /><circle cx="24" cy="12" r="6" fill="#141412" /><path d="M13 22H5M13 30H6l-3 6M35 22h8M35 30h7l3 6M24 16v26" stroke="#141412" strokeWidth="2" strokeLinecap="round" fill="none" /><circle cx="19" cy="26" r="2" fill="#141412" /><circle cx="29" cy="32" r="2" fill="#141412" /></svg>
)
export const Life = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="18" fill="#2F6BFF" stroke="#141412" strokeWidth="2" /><circle cx="24" cy="24" r="7" fill="#FAF9F6" stroke="#141412" strokeWidth="2" /><path d="M24 6v11M24 31v11M6 24h11M31 24h11" stroke="#141412" strokeWidth="2" /></svg>
)
