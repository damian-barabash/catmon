import { useI18n } from '../i18n'
import { AppleIcon, PlayIcon } from './Icons'
import type { StoreLinks } from '../lib/api'

export function StoreBadges({ links }: { links?: StoreLinks | null }) {
  const { t } = useI18n()
  const ap = links?.appstore || ''
  const gp = links?.googleplay || ''
  const Badge = ({ href, icon, small, big }: { href: string; icon: React.ReactNode; small: string; big: string }) => {
    const soon = !href
    const inner = (
      <>
        {icon}
        <span><small>{small}</small><b>{big}</b></span>
        {soon && <span className="soon">{t.hero.soon}</span>}
      </>
    )
    return soon ? (
      <span className="store-badge" aria-disabled="true">{inner}</span>
    ) : (
      <a className="store-badge" href={href} target="_blank" rel="noopener">{inner}</a>
    )
  }
  return (
    <>
      <Badge href={ap} icon={<AppleIcon />} small={t.hero.appstore} big={t.hero.appstoreName} />
      <Badge href={gp} icon={<PlayIcon />} small={t.hero.googleplay} big={t.hero.googleplayName} />
    </>
  )
}
