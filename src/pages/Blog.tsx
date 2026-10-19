import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useSeo } from '../lib/seo'
import { api, type BlogPost, type BlogPostSummary } from '../lib/api'
import { Isle } from '../components/Isle'
import { PostCard, fmtDate } from '../components/PostCard'
import { Reveal } from '../components/Reveal'
import { Gallery, Markdown } from '../components/Markdown'
import { MediaImg } from '../components/MediaImg'

export default function Blog() {
  const { t, lang } = useI18n()
  useSeo('blog')
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null)
  useEffect(() => {
    let alive = true // смена языка во время запроса: старый ответ не должен затереть новый
    setPosts(null)
    api.blogList(lang, 30).then((v) => { if (alive) setPosts(v) })
    return () => { alive = false }
  }, [lang])
  return (
    <div className="wrap">
      <div className="page-head"><span className="kicker">{t.blogTeaser.kicker}</span><h1>{t.blog.title}</h1><p>{t.blog.sub}</p></div>
      <section style={{ paddingBottom: '5rem' }}>
        {posts === null ? (
          <div className="posts">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 320 }} />)}</div>
        ) : posts.length ? (
          <div className="posts">{posts.map((p, i) => <Reveal key={p.slug} i={i}><PostCard p={p} /></Reveal>)}</div>
        ) : (
          <div className="empty isle-empty"><Isle scene="fish_shoal" sizes="260px" glow="var(--rare)" /><p>{t.blog.empty}</p></div>
        )}
      </section>
    </div>
  )
}

export function BlogPostPage() {
  const { t, lang } = useI18n()
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    setPost(undefined)
    api.blogGet(slug, lang).then((v) => { if (alive) setPost(v) })
    return () => { alive = false }
  }, [slug, lang])
  useSeo(post ? { title: `${post.title} — CatMon`, desc: post.excerpt || t.meta.blog.desc, image: post.cover_url || undefined } : 'blog', { noindex: post === null })
  return (
    <div className="wrap">
      <article className="article" style={{ paddingBottom: '5rem' }}>
        <div className="page-head" style={{ paddingBottom: 0 }}>
          <Link to="/blog" className="kicker">{t.blog.back}</Link>
          {post === undefined ? <div className="skeleton" style={{ height: 60 }} /> : post === null ? <h1 style={{ fontSize: '2rem' }}>{t.blog.notFound}</h1> : (
            <>
              <h1 style={{ fontSize: 'clamp(2rem,4.5vw,3.4rem)' }}>{post.title}</h1>
              <div className="post-meta" style={{ marginTop: '1rem' }}><span>{fmtDate(post.published_at, lang)}</span>{post.tags?.map((tg) => <span className="tag" key={tg}>{tg}</span>)}</div>
            </>
          )}
        </div>
        {post && (
          <>
            {post.cover_url && <div className="cover"><MediaImg src={post.cover_url} alt="" /></div>}
            <Markdown src={post.body} />
            <Gallery urls={post.gallery_urls || []} label={t.blog.gallery} />
          </>
        )}
      </article>
    </div>
  )
}
