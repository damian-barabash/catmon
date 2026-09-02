/**
 * «Донат приютам» — редактор world_settings.donation.
 *
 * Значение ключа: { enabled, heart, shelters:[{ id, name, url, logo_path,
 * heart, enabled, title_i18n, text_i18n, city_i18n }] }. Приютов может быть
 * сколько угодно; site-api отдаёт список сайту и приложению и дублирует первый
 * приют плоскими полями (url/title_i18n) для сборок ≤76.
 */
import { useRef, useState } from 'react'
import { api, fileToBase64, mediaUrl, type I18n } from '../api'
import { useStore } from '../store'
import { Card, Field, Switch, useConfirm } from '../ui'
import { IcArrowLeft, IcArrowRight, IcCoins, IcPlus, IcTrash, IcUpload, IcWorld } from '../icons'
import { HEART_KEYS, HEART_TITLES, HeartMark, heartKey } from '../../lib/hearts'

export interface Shelter {
  id: string
  name?: string
  url?: string
  logo_path?: string
  heart?: string
  enabled?: boolean
  title_i18n?: I18n
  text_i18n?: I18n
  city_i18n?: I18n
}
export interface DonationValue {
  enabled?: boolean
  heart?: string
  shelters?: Shelter[]
  url?: string
  title_i18n?: I18n
  text_i18n?: I18n
}

const uid = () => `s_${Math.random().toString(36).slice(2, 8)}`

/** Старый формат (один приют плоскими полями) → список из одного элемента. */
export function shelters(v: DonationValue): Shelter[] {
  if (Array.isArray(v.shelters)) return v.shelters
  if (v.url || v.title_i18n?.ru) {
    return [{ id: 'na-paluchu', name: '', url: v.url ?? '', heart: v.heart, enabled: true, title_i18n: v.title_i18n, text_i18n: v.text_i18n }]
  }
  return []
}

function HeartPicker({ value, onChange, fallback }: { value?: string; onChange: (k: string) => void; fallback?: string }) {
  const cur = heartKey(value || fallback)
  return (
    <div className="hearts">
      {HEART_KEYS.map(k => (
        <button
          key={k}
          type="button"
          title={HEART_TITLES[k]}
          aria-label={HEART_TITLES[k]}
          aria-pressed={k === cur}
          className={`heart-opt ${k === cur ? 'on' : ''}`}
          onClick={() => onChange(k)}
        >
          <HeartMark name={k} size={26} color={k === cur ? 'var(--accent)' : 'var(--subtle)'} />
        </button>
      ))}
    </div>
  )
}

function ShelterRow({ s, i, total, heart, onPatch, onMove, onDelete }: {
  s: Shelter
  i: number
  total: number
  heart: string
  onPatch: (patch: Partial<Shelter>) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
}) {
  const { t, toast } = useStore()
  const [busy, setBusy] = useState<'' | 'up' | 'tr'>('')
  const file = useRef<HTMLInputElement>(null)
  const i18 = (k: 'title_i18n' | 'text_i18n' | 'city_i18n') => s[k]?.ru ?? ''
  const setRu = (k: 'title_i18n' | 'text_i18n' | 'city_i18n', v: string) => onPatch({ [k]: { ...(s[k] ?? {}), ru: v } })

  const upload = async (f: File) => {
    setBusy('up')
    try {
      const b64 = await fileToBase64(f)
      const r = await api.mediaUpload(f.name, b64, 'shelters')
      onPatch({ logo_path: r.path })
      toast(t('saved'))
    } catch (e) { toast((e as Error).message, 'err') } finally { setBusy('') }
  }
  /** Заголовок/текст/город переводятся Barabash AI на en/pl/fr (как блог). */
  const translate = async () => {
    const fields: Record<string, string> = {}
    if (i18('title_i18n')) fields.title = i18('title_i18n')
    if (i18('text_i18n')) fields.text = i18('text_i18n')
    if (i18('city_i18n')) fields.city = i18('city_i18n')
    if (!Object.keys(fields).length) { toast(t('required'), 'err'); return }
    setBusy('tr')
    try {
      const r = await api.aiTranslateFields(fields)
      const patch: Partial<Shelter> = {}
      if (r.title) patch.title_i18n = r.title
      if (r.text) patch.text_i18n = r.text
      if (r.city) patch.city_i18n = r.city
      onPatch(patch)
      toast(t('translated'))
    } catch (e) { toast((e as Error).message, 'err') } finally { setBusy('') }
  }

  const langs = (['en', 'pl', 'fr'] as const).filter(l => s.title_i18n?.[l])
  return (
    <div className={`shelter ${s.enabled === false ? 'off' : ''}`}>
      <div className="shelter-h">
        <div className="shelter-mark">
          <HeartMark name={s.heart || heart} size={34} color="var(--accent)" />
          {s.logo_path && <img className="shelter-logo" src={mediaUrl(s.logo_path)} alt="" />}
        </div>
        <input className="input grow" placeholder={t('sh_name')} value={s.name ?? ''} onChange={e => onPatch({ name: e.target.value })} />
        <Switch on={s.enabled !== false} onChange={v => onPatch({ enabled: v })} />
        <button className="btn icon sm" disabled={i === 0} onClick={() => onMove(-1)} aria-label={t('sh_up')} title={t('sh_up')}><IcArrowLeft size={15} style={{ transform: 'rotate(90deg)' }} /></button>
        <button className="btn icon sm" disabled={i === total - 1} onClick={() => onMove(1)} aria-label={t('sh_down')} title={t('sh_down')}><IcArrowRight size={15} style={{ transform: 'rotate(90deg)' }} /></button>
        <button className="btn icon sm danger" onClick={onDelete} aria-label={t('delete')} title={t('delete')}><IcTrash size={15} /></button>
      </div>

      <div className="grid c2" style={{ gap: 10 }}>
        <Field label={t('donation_url')} hint={t('sh_url_hint')}>
          <input className="input" value={s.url ?? ''} onChange={e => onPatch({ url: e.target.value })} placeholder="https://" />
        </Field>
        <Field label={t('sh_city')}><input className="input" value={i18('city_i18n')} onChange={e => setRu('city_i18n', e.target.value)} placeholder="Варшава, Польша" /></Field>
      </div>
      <Field label={`${t('title')} (ru)`}><input className="input" value={i18('title_i18n')} onChange={e => setRu('title_i18n', e.target.value)} /></Field>
      <Field label={`${t('body')} (ru)`}><textarea className="textarea" style={{ minHeight: 66 }} value={i18('text_i18n')} onChange={e => setRu('text_i18n', e.target.value)} /></Field>

      <div className="row">
        <button className="btn sm" disabled={busy === 'tr'} onClick={translate}><IcWorld size={15} />{busy === 'tr' ? t('translating') : t('sh_translate')}</button>
        <span className="small muted">{langs.length ? `en/pl/fr: ${langs.join(', ')}` : t('sh_ru_only')}</span>
      </div>

      <Field label={t('sh_logo')} hint={t('sh_logo_hint')}>
        <div className="row">
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = '' }} />
          <button className="btn sm" disabled={busy === 'up'} onClick={() => file.current?.click()}><IcUpload size={15} />{busy === 'up' ? t('uploading') : t('sh_logo_pick')}</button>
          {s.logo_path && <button className="btn sm" onClick={() => onPatch({ logo_path: '' })}>{t('sh_logo_clear')}</button>}
          {s.logo_path && <span className="small muted mono">{s.logo_path.split('/').pop()}</span>}
        </div>
      </Field>

      <Field label={t('sh_heart')}><HeartPicker value={s.heart} fallback={heart} onChange={k => onPatch({ heart: k })} /></Field>
    </div>
  )
}

export default function DonationCard({ value, onChange, onSave, busy, updated }: {
  value: DonationValue
  onChange: (v: DonationValue) => void
  onSave: () => void
  busy: boolean
  updated?: string
}) {
  const { t } = useStore()
  const { confirm, node } = useConfirm()
  const list = shelters(value)
  const heart = heartKey(value.heart)
  const setList = (next: Shelter[]) => onChange({ ...value, shelters: next })
  const patch = (i: number, p: Partial<Shelter>) => setList(list.map((s, j) => (j === i ? { ...s, ...p } : s)))
  const move = (i: number, dir: -1 | 1) => {
    const next = [...list]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    setList(next)
  }
  const del = async (i: number) => {
    const ok = await confirm(t('sh_del'), { text: list[i].name || list[i].title_i18n?.ru || '', danger: true })
    if (ok) setList(list.filter((_, j) => j !== i))
  }
  const add = () => setList([...list, { id: uid(), name: '', url: '', heart, enabled: true, title_i18n: { ru: '' }, text_i18n: { ru: '' }, city_i18n: { ru: '' } }])

  return (
    <Card className="span2" icon={<IcCoins size={18} />} title={t('donation')} right={<Switch on={!!value.enabled} onChange={v => onChange({ ...value, enabled: v })} label={t('donation_on')} />}>
      <div className="setting-block">
        <p className="small muted">{t('sh_intro')}</p>
        <Field label={t('sh_heart_default')} hint={t('sh_heart_default_hint')}>
          <HeartPicker value={value.heart} onChange={k => onChange({ ...value, heart: k })} />
        </Field>
        {list.map((s, i) => (
          <ShelterRow key={s.id || i} s={s} i={i} total={list.length} heart={heart}
            onPatch={p => patch(i, p)} onMove={d => move(i, d)} onDelete={() => void del(i)} />
        ))}
        {!list.length && <p className="muted small">{t('sh_empty')}</p>}
        <div className="row">
          <button className="btn sm" onClick={add}><IcPlus size={15} />{t('sh_add')}</button>
          <button className="btn ink sm" disabled={busy} onClick={onSave}>{t('save')}</button>
          {updated && <span className="small muted">{t('updated')}: {updated}</span>}
        </div>
      </div>
      {node}
    </Card>
  )
}
