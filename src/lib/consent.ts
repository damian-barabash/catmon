const KEY = 'catmon.cookie'
export type Consent = 'all' | 'necessary' | null
export function getConsent(): Consent {
  try { return (localStorage.getItem(KEY) as Consent) || null } catch { return null }
}
export function setConsent(c: Exclude<Consent, null>) {
  try { localStorage.setItem(KEY, c) } catch { /* ignore */ }
  window.dispatchEvent(new Event('catmon-consent'))
}
