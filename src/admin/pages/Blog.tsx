import { Link, useNavigate } from 'react-router-dom'
import { api, mediaUrl, type BlogPost } from '../api'
import { fmtDate, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Skeleton, useConfirm } from '../ui'
import { IcBlog, IcImage, IcPlus, IcRefresh, IcTrash } from '../icons'

export function TranslatedBadge({ p }: { p: BlogPost | { title_i18n: Record<string, string | undefined>; translated_at?: string | null } }) {
  const { t } = useStore()
  const langs = (['en', 'pl', 'fr'] as const).filter(l => p.title_i18n?.[l])
  return langs.length ? <span className="chip ok">{t('translated')}: {langs.join(' ')}</span> : <span className="chip outline">{t('not_translated')}</span>
}

export default function Blog() {
  const { t, toast } = useStore()
  const nav = useNavigate()
  const { data, loading, error, reload } = useAsync(() => api.blogList(), [], 'blog')
  const { confirm, node } = useConfirm()
  const del = async (p: BlogPost) => {
    if (!(await confirm(t('delete_post'), { text: p.title_i18n.ru, danger: true }))) return
    try { await api.blogDelete(p.id); toast(t('done')); reload() } catch (e) { toast((e as Error).message, 'err') }
  }
  const translateMissing = async () => {
    try { const r = await api.blogTranslateMissing(); toast(`${t('done')}: ${(r.translated ?? []).length || 0}`); reload() } catch (e) { toast((e as Error).message, 'err') }
  }
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><h1>{t('blog')}</h1><div className="right row"><button className="btn sm" onClick={translateMissing}><IcRefresh size={16} />{t('translate_missing')}</button><Link to="/admin/blog/new" className="btn primary"><IcPlus size={18} />{t('new_post')}</Link></div></div>
      {error && <ErrorBox text={error} />}
      <Card icon={<IcBlog size={18} />} title={`${data?.posts.length ?? ''}`}>
        {loading ? <Skeleton h={200} /> : !data?.posts.length ? <Empty><Link to="/admin/blog/new" className="btn sm">{t('new_post')}</Link></Empty> : (
          <div className="grid" style={{ gap: 8 }}>
            {data.posts.map(p => (
              <div key={p.id} className="post-row">
                <div className="cv">{p.cover_path ? <img src={mediaUrl(p.cover_path)} alt="" loading="lazy" /> : <IcImage size={22} />}</div>
                <div style={{ minWidth: 0 }}>
                  <Link to={`/admin/blog/${p.id}`} className="ttl">{p.title_i18n.ru || p.slug}</Link>
                  <div className="row small muted" style={{ gap: 6, marginTop: 4 }}>
                    <span className={`chip ${p.status === 'published' ? 'ok' : 'outline'}`}>{p.status === 'published' ? t('published') : t('draft')}</span>
                    <TranslatedBadge p={p} />
                    <span className="mono">/{p.slug}</span>
                    <span>{fmtDate(p.published_at ?? p.created_at)}</span>
                    {p.tags?.map(tg => <span key={tg} className="chip" style={{ fontSize: 11 }}>{tg}</span>)}
                  </div>
                </div>
                <div className="row acts"><button className="btn sm" onClick={() => nav(`/admin/blog/${p.id}`)}>{t('edit')}</button><button className="btn icon sm danger" onClick={() => del(p)} aria-label={t('delete')}><IcTrash size={16} /></button></div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {node}
    </>
  )
}
