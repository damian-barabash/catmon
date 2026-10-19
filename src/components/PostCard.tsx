import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import type { BlogPostSummary } from '../lib/api'
import { Isle } from './Isle'
import { MediaImg } from './MediaImg'

// Карточка поста — отдельно от pages/Blog, чтобы главная (тизер блога) не тянула
// ленивый чанк блога с marked/DOMPurify.
export function fmtDate(iso: string, lang: string) {
  try { return new Date(iso).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return iso }
}

export function PostCard({ p }: { p: BlogPostSummary }) {
  const { lang } = useI18n()
  return (
    <Link to={`/blog/${p.slug}`} className="post-card">
      <div className="cover">{p.cover_url ? <MediaImg src={p.cover_url} alt="" loading="lazy" /> : <Isle scene="ban_quests" sizes="300px" glow="var(--legendary)" float={false} />}</div>
      <div className="body">
        <div className="post-meta"><span>{fmtDate(p.published_at, lang)}</span>{p.tags?.map((tg) => <span className="tag" key={tg}>{tg}</span>)}</div>
        <h3>{p.title}</h3>
        <p>{p.excerpt}</p>
      </div>
    </Link>
  )
}
