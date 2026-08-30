import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useSeo } from '../lib/seo'
import { api, type BlogPost, type BlogPostSummary } from '../lib/api'
import { CatLogo } from '../components/Icons'
import { Reveal } from '../components/Reveal'
import { Gallery, Markdown } from '../components/Markdown'

export function fmtDate(iso: string, lang: string) {
  try { return new Date(iso).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' }) } catch { return iso }
}

export function PostCard({ p }: { p: BlogPostSummary }) {
  const { lang } = useI18n()
  return (
    <Link to={`/blog/${p.slug}`} className="post-card">
      <div className="cover">{p.cover_url ? <img src={p.cover_url} alt="" loading="lazy" /> : <CatLogo animated={false} />}</div>
      <div className="body">
        <div className="post-meta"><span>{fmtDate(p.published_at, lang)}</span>{p.tags?.map((tg) => <span className="tag" key={tg}>{tg}</span>)}</div>
        <h3>{p.title}</h3>
        <p>{p.excerpt}</p>
      </div>
    </Link>
  )
}

export default function Blog() {
  const { t, lang } = useI18n()
  useSeo('blog')
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null)
  useEffect(() => { setPosts(null); api.blogList(lang, 30).then(setPosts) }, [lang])
  return (
    <div className="wrap">
      <div className="page-head"><span className="kicker">{t.blogTeaser.kicker}</span><h1>{t.blog.title}</h1><p>{t.blog.sub}</p></div>
      <section style={{ paddingBottom: '5rem' }}>
        {posts === null ? (
          <div className="posts">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 320 }} />)}</div>
        ) : posts.length ? (
          <div className="posts">{posts.map((p, i) => <Reveal key={p.slug} i={i}><PostCard p={p} /></Reveal>)}</div>
        ) : (
          <div className="empty"><CatLogo animated={false} /><p>{t.blog.empty}</p></div>
        )}
      </section>
    </div>
  )
}

export function BlogPostPage() {
  const { t, lang } = useI18n()
  const { slug = '' } = useParams()
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined)
  useEffect(() => { setPost(undefined); api.blogGet(slug, lang).then(setPost) }, [slug, lang])
  useSeo(post ? { title: `${post.title} — CatMon`, desc: post.excerpt || t.meta.blog.desc, image: post.cover_url || undefined } : 'blog')
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
            {post.cover_url && <div className="cover"><img src={post.cover_url} alt="" /></div>}
            <Markdown src={post.body} />
            <Gallery urls={post.gallery_urls || []} label={t.blog.gallery} />
          </>
        )}
      </article>
    </div>
  )
}
