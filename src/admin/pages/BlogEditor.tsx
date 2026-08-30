import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, fileToBase64, mediaUrl, type BlogPost } from '../api'
import { useStore } from '../store'
import { Card, Field, Seg, Skeleton, ErrorBox } from '../ui'
import { IcArrowLeft, IcBold, IcClose, IcCode, IcHeading, IcImage, IcItalic, IcLink, IcList, IcQuote, IcUpload } from '../icons'
import { TranslatedBadge } from './Blog'
import { renderMd } from '../md'

const TR: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' }
export const slugify = (s: string) => s.toLowerCase().split('').map(ch => TR[ch] ?? ch).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

export function MdEditor({ value, onChange, onUpload }: { value: string; onChange: (v: string) => void; onUpload?: (f: File) => Promise<string> }) {
  const { t } = useStore()
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const ref = useRef<HTMLTextAreaElement>(null)
  const wrap = (before: string, after = before, placeholder = 'text') => {
    const el = ref.current; if (!el) return
    const s = el.selectionStart, e = el.selectionEnd
    const sel = value.slice(s, e) || placeholder
    const nv = value.slice(0, s) + before + sel + after + value.slice(e)
    onChange(nv)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length) })
  }
  const linePrefix = (p: string) => {
    const el = ref.current; if (!el) return
    const s = el.selectionStart; const ls = value.lastIndexOf('\n', s - 1) + 1
    onChange(value.slice(0, ls) + p + value.slice(ls))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + p.length, s + p.length) })
  }
  const insertImage = async (f: File) => { if (!onUpload) return; const url = await onUpload(f); wrap(`![${f.name}](${url})`, '', '') }
  const B = ({ I, on, title }: { I: React.ComponentType<{ size?: number }>; on: () => void; title: string }) => <button type="button" className="btn icon sm ghost" onClick={on} title={title} aria-label={title}><I size={16} /></button>
  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}><Seg value={mode} onChange={v => setMode(v as typeof mode)} options={[{ v: 'write', l: t('write') }, { v: 'preview', l: t('preview') }]} /></div>
      {mode === 'write' ? (
        <>
          <div className="md-bar">
            <B I={IcHeading} on={() => linePrefix('## ')} title="H2" /><B I={IcBold} on={() => wrap('**')} title="Bold" /><B I={IcItalic} on={() => wrap('_')} title="Italic" />
            <B I={IcList} on={() => linePrefix('- ')} title="List" /><B I={IcQuote} on={() => linePrefix('> ')} title="Quote" /><B I={IcCode} on={() => wrap('`')} title="Code" />
            <B I={IcLink} on={() => wrap('[', '](https://)', 'link')} title="Link" />
            {onUpload && <label className="btn icon sm ghost" title="Image"><IcImage size={16} /><input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) insertImage(f) }} /></label>}
          </div>
          <textarea ref={ref} className="textarea md-area" value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); wrap('**') } if ((e.metaKey || e.ctrlKey) && e.key === 'i') { e.preventDefault(); wrap('_') } }} />
        </>
      ) : <div className="md-prev" dangerouslySetInnerHTML={{ __html: renderMd(value) }} />}
    </div>
  )
}

export default function BlogEditor() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  const { t, toast } = useStore()
  const nav = useNavigate()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [err, setErr] = useState('')
  const [f, setF] = useState({ slug: '', title: '', excerpt: '', body: '', tags: '', cover: '' as string | null, gallery: [] as string[], status: 'draft' as 'draft' | 'published' })
  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [uploading, setUploading] = useState(0)
  const [urlCache, setUrlCache] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    api.blogGet(id).then(r => { const p = r.post; setPost(p); setSlugTouched(true); setF({ slug: p.slug, title: p.title_i18n.ru ?? '', excerpt: p.excerpt_i18n?.ru ?? '', body: p.body_i18n?.ru ?? '', tags: (p.tags ?? []).join(', '), cover: p.cover_path ?? null, gallery: p.gallery ?? [], status: p.status }) }).catch(e => setErr((e as Error).message)).finally(() => setLoading(false))
  }, [id, isNew])

  const setTitle = (v: string) => setF(x => ({ ...x, title: v, slug: slugTouched ? x.slug : slugify(v) }))
  const upload = async (file: File): Promise<string> => {
    setUploading(u => u + 1)
    try { const b64 = await fileToBase64(file); const r = await api.blogUpload(file.name, b64); setUrlCache(c => ({ ...c, [r.path]: r.url })); return r.path } finally { setUploading(u => u - 1) }
  }
  const urlOf = (p: string) => urlCache[p] ?? mediaUrl(p)
  const addFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) { try { const path = await upload(file); setF(x => ({ ...x, gallery: [...x.gallery, path], cover: x.cover ?? path })) } catch (e) { toast((e as Error).message, 'err') } }
  }
  const move = (from: number, to: number) => setF(x => { const g = [...x.gallery]; const [it] = g.splice(from, 1); g.splice(to, 0, it); return { ...x, gallery: g } })
  const save = async (status = f.status) => {
    if (!f.title.trim() || !f.slug.trim()) { toast(t('required'), 'err'); return }
    setBusy(true)
    try {
      const r = await api.blogSave({ id: isNew ? undefined : id, slug: f.slug, title_ru: f.title, excerpt_ru: f.excerpt, body_ru: f.body, tags: f.tags.split(',').map(s => s.trim()).filter(Boolean), cover_path: f.cover, gallery: f.gallery, status })
      toast(t('saved'))
      const newId = r.post?.id ?? r.id
      if (isNew && newId) nav(`/admin/blog/${newId}`, { replace: true })
      else if (r.post) setPost(r.post)
      setF(x => ({ ...x, status }))
    } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) }
  }

  if (loading) return <Skeleton h={400} />
  if (err) return <ErrorBox text={err} />
  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <Link to="/admin/blog" className="btn sm"><IcArrowLeft size={16} />{t('back')}</Link>
        <h1 style={{ fontSize: 20 }}>{isNew ? t('new_post') : f.title || f.slug}</h1>
        <div className="right row">
          {post && <TranslatedBadge p={post} />}
          <Seg value={f.status} onChange={v => setF({ ...f, status: v })} options={[{ v: 'draft', l: t('draft') }, { v: 'published', l: t('published') }]} />
          <button className="btn primary" disabled={busy || uploading > 0} onClick={() => save()}>{t('save_translate')}</button>
        </div>
      </div>
      <div className="alert info small" style={{ marginBottom: 14 }}>{t('ru_only')}</div>
      <div className="grid c21">
        <div className="grid" style={{ gap: 14 }}>
          <Card>
            <div className="grid" style={{ gap: 12 }}>
              <Field label={t('title')}><input className="input" value={f.title} onChange={e => setTitle(e.target.value)} style={{ fontFamily: 'var(--font-h)', fontSize: 18 }} /></Field>
              <Field label={t('slug')}><input className="input mono" value={f.slug} onChange={e => { setSlugTouched(true); setF({ ...f, slug: slugify(e.target.value) || e.target.value }) }} /></Field>
              <Field label={t('excerpt')}><textarea className="textarea" style={{ minHeight: 70 }} value={f.excerpt} onChange={e => setF({ ...f, excerpt: e.target.value })} /></Field>
              <Field label={t('body')}><MdEditor value={f.body} onChange={v => setF({ ...f, body: v })} onUpload={async file => { const p = await upload(file); return urlOf(p) }} /></Field>
            </div>
          </Card>
        </div>
        <div className="grid" style={{ gap: 14, alignContent: 'start' }}>
          <Card title={t('cover')}>
            <div className="cover-prev">{f.cover ? <img src={urlOf(f.cover)} alt="" /> : <IcImage size={28} />}</div>
            <p className="small muted" style={{ marginTop: 6 }}>{f.cover ? f.cover : '—'}</p>
          </Card>
          <Card title={t('gallery')} right={uploading > 0 && <span className="chip">{t('loading')} {uploading}</span>}>
            <div className={`drop ${drag ? 'on' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }} onClick={() => document.getElementById('gal-input')?.click()} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('gal-input')?.click() }}>
              <IcUpload size={24} /><div className="small">{t('drop_files')}</div>
              <input id="gal-input" type="file" multiple accept="image/*" hidden onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
            </div>
            {f.gallery.length > 0 && (
              <div className="gal" style={{ marginTop: 10 }}>
                {f.gallery.map((p, i) => (
                  <div key={p} className={`g ${f.cover === p ? 'cover' : ''} ${dragIdx === i ? 'over' : ''}`} draggable onDragStart={() => setDragIdx(i)} onDragOver={e => e.preventDefault()} onDrop={() => { if (dragIdx != null && dragIdx !== i) move(dragIdx, i); setDragIdx(null) }} onClick={() => setF({ ...f, cover: p })} title={p}>
                    <img src={urlOf(p)} alt="" />
                    <button type="button" className="rm" onClick={e => { e.stopPropagation(); setF(x => ({ ...x, gallery: x.gallery.filter(g => g !== p), cover: x.cover === p ? (x.gallery.find(g => g !== p) ?? null) : x.cover })) }} aria-label={t('delete')}><IcClose size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card title={t('tags')}>
            <input className="input" value={f.tags} onChange={e => setF({ ...f, tags: e.target.value })} placeholder={t('tags_hint')} />
            <div className="row" style={{ marginTop: 8 }}>{f.tags.split(',').map(s => s.trim()).filter(Boolean).map(tg => <span key={tg} className="chip">{tg}</span>)}</div>
          </Card>
        </div>
      </div>
    </>
  )
}
