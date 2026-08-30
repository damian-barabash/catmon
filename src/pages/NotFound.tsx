import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useSeo } from '../lib/seo'
import { SadCat } from '../components/Icons'

export default function NotFound() {
  const { t } = useI18n()
  useSeo('notfound')
  return (
    <div className="wrap nf">
      <SadCat />
      <h1 style={{ fontSize: '2.4rem' }}>{t.notfound.title}</h1>
      <p className="lead" style={{ margin: '1rem 0 2rem' }}>{t.notfound.text}</p>
      <Link to="/" className="btn">{t.notfound.home}</Link>
    </div>
  )
}
