import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RARITIES, api, type ItemFull, type ItemPatch, type Rarity } from '../api'
import { fmtN, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Field, Modal, Pager, RarityChip, Skeleton, Switch } from '../ui'
import { IcSearch, IcWarn } from '../icons'

const LIMIT = 50
const KINDS = ['accessory', 'battle_chest', 'boost', 'chest_key', 'fish', 'frame', 'special', 'title']
const FLAGS = ['plus_only', 'dungeon_only', 'exclusive'] as const
type Flag = typeof FLAGS[number]

export default function Items() {
  const { t, lang, toast } = useStore()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const kind = sp.get('k') ?? ''
  const rarity = sp.get('r') ?? ''
  const flag = (sp.get('f') as Flag | null) ?? ''
  const page = Number(sp.get('p') || 1)
  const [qi, setQi] = useState(q)
  useEffect(() => { setQi(q) }, [q])
  useEffect(() => { const h = setTimeout(() => { if (qi !== q) { sp.set('q', qi); sp.set('p', '1'); setSp(sp, { replace: true }) } }, 350); return () => clearTimeout(h) }, [qi]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: string, v: string) => { v ? sp.set(k, v) : sp.delete(k); if (k !== 'p') sp.set('p', '1'); setSp(sp) }
  const { data, loading, error, setData } = useAsync(
    () => api.itemsFull({ q, kind: kind || undefined, rarity: rarity || undefined, flag: flag || undefined, limit: LIMIT, offset: (page - 1) * LIMIT }),
    [q, kind, rarity, flag, page], `items.${q}.${kind}.${rarity}.${flag}.${page}`)
  const [edit, setEdit] = useState<ItemFull | null>(null)
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / LIMIT))

  const onSaved = (code: string, applied: Partial<ItemFull>, patch: ItemPatch) => {
    if (!data) return
    const prev = data
    setData({ ...data, items: data.items.map(x => x.code === code ? { ...x, ...applied } : x) })
    setEdit(null)
    api.itemUpdate(code, patch).then(() => toast(t('saved'))).catch(e => { setData(prev); toast((e as Error).message, 'err') })
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <h1>{t('items')}</h1>
        <div className="adm-search" style={{ minWidth: 240 }}><IcSearch size={18} /><input value={qi} onChange={e => setQi(e.target.value)} placeholder={t('search_items')} aria-label={t('search')} /></div>
        <span className="chip outline num">{fmtN(data?.total, lang)}</span>
      </div>
      <div className="cats-toolbar">
        <select className="select" value={kind} onChange={e => set('k', e.target.value)} aria-label={t('item_kind')}>
          <option value="">{t('item_kind')}: {t('all')}</option>{KINDS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select className="select" value={rarity} onChange={e => set('r', e.target.value)} aria-label={t('rarity')}>
          <option value="">{t('rarity')}: {t('all')}</option>{RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select" value={flag} onChange={e => set('f', e.target.value)} aria-label={t('flags')}>
          <option value="">{t('flags')}: {t('all')}</option>
          <option value="plus_only">{t('f_plus_only')}</option>
          <option value="dungeon_only">{t('f_dungeon_only')}</option>
          <option value="exclusive">{t('f_exclusive')}</option>
        </select>
      </div>
      {error && <ErrorBox text={error} />}
      <Card>
        {loading && !data ? <Skeleton h={400} /> : !data?.items.length ? <Empty text={t('nothing_found')} /> : (
          <div className="tbl-wrap" style={{ opacity: loading ? .6 : 1 }}>
            <table className="tbl">
              <thead><tr><th /><th>{t('code')}</th><th>{t('name')}</th><th>{t('item_kind')}</th><th>{t('rarity')}</th><th>{t('flags')}</th><th>{t('effect_json')}</th></tr></thead>
              <tbody>
                {data.items.map(it => (
                  <tr key={it.code} className="clickable" onClick={() => setEdit(it)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEdit(it) }}>
                    <td style={{ width: 48 }}><div className={`token r-${it.rarity}`}>{it.kind.charAt(0)}</div></td>
                    <td className="mono">{it.code}</td>
                    <td><b>{it.name_i18n?.ru ?? it.name}</b></td>
                    <td className="muted">{it.kind}</td>
                    <td><RarityChip r={it.rarity} /></td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {it.plus_only && <span className="chip r-legendary">{t('f_plus_only')}</span>}
                        {it.dungeon_only && <span className="chip">{t('f_dungeon_only')}{it.dungeon != null ? ` ${it.dungeon}` : ''}</span>}
                        {it.exclusive && <span className="chip accent">{t('f_exclusive')}</span>}
                      </div>
                    </td>
                    <td className="mono muted small" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.effect && Object.keys(it.effect).length ? JSON.stringify(it.effect) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && <Pager page={page} pages={pages} onPage={p => set('p', String(p))} total={data.total} />}
      </Card>
      <ItemEditor item={edit} onClose={() => setEdit(null)} onSave={onSaved} />
    </>
  )
}

function ItemEditor({ item, onClose, onSave }: { item: ItemFull | null; onClose: () => void; onSave: (code: string, applied: Partial<ItemFull>, patch: ItemPatch) => void }) {
  const { t } = useStore()
  const [f, setF] = useState({ name: '', description: '', rarity: 'common' as Rarity, plus_only: false, dungeon_only: false, exclusive: false, effect: '{}' })
  useEffect(() => {
    if (!item) return
    setF({
      name: item.name_i18n?.ru ?? item.name, description: item.description_i18n?.ru ?? item.description,
      rarity: item.rarity, plus_only: item.plus_only, dungeon_only: item.dungeon_only, exclusive: item.exclusive,
      effect: JSON.stringify(item.effect ?? {}, null, 2),
    })
  }, [item])
  const effectParsed = useMemo(() => {
    try { const v = JSON.parse(f.effect); return (typeof v === 'object' && v !== null && !Array.isArray(v)) ? v as Record<string, unknown> : null } catch { return null }
  }, [f.effect])
  if (!item) return <Modal open={false} onClose={onClose} title="">{null}</Modal>
  const origName = item.name_i18n?.ru ?? item.name
  const origDesc = item.description_i18n?.ru ?? item.description
  const renamed = f.name !== origName || f.description !== origDesc
  const effectChanged = effectParsed != null && JSON.stringify(effectParsed) !== JSON.stringify(item.effect ?? {})
  const patch: ItemPatch = {}
  if (f.name.trim() && f.name !== origName) patch.name_ru = f.name.trim()
  if (f.description !== origDesc) patch.description_ru = f.description
  if (f.rarity !== item.rarity) patch.rarity = f.rarity
  if (f.plus_only !== item.plus_only) patch.plus_only = f.plus_only
  if (f.dungeon_only !== item.dungeon_only) patch.dungeon_only = f.dungeon_only
  if (f.exclusive !== item.exclusive) patch.exclusive = f.exclusive
  if (effectChanged) patch.effect = effectParsed!
  const dirty = Object.keys(patch).length > 0
  const save = () => {
    const applied: Partial<ItemFull> = {
      name: f.name.trim() || item.name, description: f.description,
      name_i18n: { ...(item.name_i18n ?? {}), ru: f.name.trim() || item.name }, description_i18n: { ...(item.description_i18n ?? {}), ru: f.description },
      rarity: f.rarity, plus_only: f.plus_only, dungeon_only: f.dungeon_only, exclusive: f.exclusive,
      effect: effectParsed ?? item.effect,
    }
    onSave(item.code, applied, patch)
  }
  return (
    <Modal open={!!item} onClose={onClose} title={<span className="row" style={{ gap: 8 }}><span className={`token r-${item.rarity}`} style={{ width: 30, height: 30, fontSize: 13 }}>{item.kind.charAt(0)}</span><span className="mono">{item.code}</span></span>} wide
      footer={<><button className="btn" onClick={onClose}>{t('cancel')}</button><button className="btn primary" disabled={!dirty || effectParsed == null} onClick={save}>{t('save')}</button></>}>
      <div className="grid" style={{ gap: 12 }}>
        {renamed && <div className="alert warn small"><IcWarn size={16} />{t('rename_warn')}</div>}
        <Field label={t('title_ru')} hint={t('translated_by_backend')}><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('body_ru')}><textarea className="textarea" style={{ minHeight: 70 }} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid c2" style={{ gap: 10 }}>
          <Field label={t('rarity')}><select className="select" value={f.rarity} onChange={e => setF({ ...f, rarity: e.target.value as Rarity })}>{RARITIES.map(r => <option key={r} value={r}>{r}</option>)}</select></Field>
          <Field label={t('item_kind')}><input className="input" value={item.kind} disabled /></Field>
        </div>
        <Field label={t('flags')}>
          <div className="row" style={{ gap: 16 }}>
            <Switch on={f.plus_only} onChange={v => setF({ ...f, plus_only: v })} label={t('f_plus_only')} />
            <Switch on={f.dungeon_only} onChange={v => setF({ ...f, dungeon_only: v })} label={t('f_dungeon_only')} />
            <Switch on={f.exclusive} onChange={v => setF({ ...f, exclusive: v })} label={t('f_exclusive')} />
          </div>
        </Field>
        <Field label={t('effect_json')} hint={t('effect_hint')}>
          <textarea className={`textarea json-area ${effectParsed == null ? 'err' : ''}`} value={f.effect} onChange={e => setF({ ...f, effect: e.target.value })} spellCheck={false} />
        </Field>
        {effectParsed == null && <div className="alert err small"><IcWarn size={14} />{t('invalid_json')}</div>}
      </div>
    </Modal>
  )
}
