import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RARITIES, api, type ItemFull, type ItemPatch, type Rarity } from '../api'
import { fmtN, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Field, ItemToken, Modal, Pager, RarityChip, Skeleton, Switch } from '../ui'
import { IcSearch, IcWarn } from '../icons'

const LIMIT = 50
const KINDS = ['accessory', 'battle_chest', 'boost', 'chest_key', 'fish', 'frame', 'special', 'title']
const FLAGS = ['plus_only', 'dungeon_only', 'exclusive'] as const
type Flag = typeof FLAGS[number]

/* Effect vocabulary (values that actually exist in the live `items` table) */
const STAT_KEYS = ['charm', 'agility', 'dominance', 'mystery'] as const
const BOOST_TYPES = ['power_all', 'power_first', 'power_duel', 'power_last', 'jitter_pos_x2', 'jitter_shield', 'block_hex', 'xp_scans', 'rename'] as const
const NUM_KEY: Record<string, 'value' | 'scans'> = { power_all: 'value', power_first: 'value', power_duel: 'value', power_last: 'value', xp_scans: 'scans' }
const SPECIALS = ['fear', 'wish', 'oracle', 'vampire', 'aura', 'rebirth', 'tailwind', 'mirror', 'closer', 'guardian_angel', 'smoke', 'focus', 'echo', 'taunt', 'opener'] as const
const ACTIVE_SPECIALS = new Set<string>(['fear', 'wish', 'oracle', 'vampire', 'smoke', 'focus', 'echo', 'taunt', 'opener'])
const STD_KEYS = new Set(['stats', 'type', 'value', 'scans', 'special', 'active'])

type Eff = Record<string, unknown>
type TT = (k: string) => string

const extraKeys = (e: Eff) => Object.keys(e).filter(k => !STD_KEYS.has(k))
const lbl = (tt: TT, key: string, fallback: string) => { const v = tt(key); return v === key ? fallback : v }

/** Human-readable one-liner for an effect object («+5 Шарм · Скилл: Страх (активный)») */
function effectLabel(e: Eff | null | undefined, tt: TT): string {
  if (!e || !Object.keys(e).length) return '—'
  const parts: string[] = []
  const stats = (e.stats && typeof e.stats === 'object' ? e.stats : null) as Record<string, number> | null
  if (stats) {
    const s = STAT_KEYS.filter(k => Number(stats[k])).map(k => `+${stats[k]} ${tt('ist_' + k)}`).join(', ')
    if (s) parts.push(s)
  }
  if (typeof e.type === 'string') {
    const nk = NUM_KEY[e.type]
    const n = nk ? e[nk] : undefined
    const l = lbl(tt, 'eft_' + e.type, e.type).replace('{n}', String(n ?? '?'))
    parts.push(`${tt('eff_boost_pfx')}: ${l}`)
  }
  if (typeof e.special === 'string') {
    parts.push(`${tt('eff_skill_pfx')}: ${lbl(tt, 'sp_' + e.special, e.special)}${e.active ? ` (${tt('eff_active')})` : ''}`)
  }
  const ex = extraKeys(e)
  if (ex.length) parts.push(`+${ex.length} ${tt('eff_extra_n')}`)
  return parts.join(' · ') || JSON.stringify(e)
}

export default function Items() {
  const { t, lang, toast } = useStore()
  const tt = t as unknown as TT
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
              <thead><tr><th /><th>{t('code')}</th><th>{t('name')}</th><th>{t('item_kind')}</th><th>{t('rarity')}</th><th>{t('flags')}</th><th>{t('eff_col')}</th></tr></thead>
              <tbody>
                {data.items.map(it => (
                  <tr key={it.code} className="clickable" onClick={() => setEdit(it)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setEdit(it) }}>
                    <td style={{ width: 48 }}><ItemToken code={it.code} kind={it.kind} rarity={it.rarity} /></td>
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
                    <td className="muted small" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={it.effect && Object.keys(it.effect).length ? JSON.stringify(it.effect) : undefined}>{effectLabel(it.effect, tt)}</td>
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

/** Structured effect editor: stats / boost / special selects; non-standard keys are preserved via merge. */
function EffectEditor({ eff, onChange }: { eff: Eff; onChange: (e: Eff) => void }) {
  const { t } = useStore()
  const tt = t as unknown as TT
  const stats = (eff.stats && typeof eff.stats === 'object' ? eff.stats : {}) as Record<string, number>
  const type = typeof eff.type === 'string' ? eff.type : ''
  const special = typeof eff.special === 'string' ? eff.special : ''
  const nk = NUM_KEY[type]
  const numVal = nk ? eff[nk] : undefined

  const setStat = (k: string, raw: string) => {
    const v = raw.trim() === '' ? 0 : Number(raw)
    const s = { ...stats }
    if (!v || Number.isNaN(v)) delete s[k]; else s[k] = v
    const next = { ...eff }
    if (Object.keys(s).length) next.stats = s; else delete next.stats
    onChange(next)
  }
  const setType = (ty: string) => {
    const next = { ...eff }
    delete next.value; delete next.scans
    if (!ty) delete next.type
    else { next.type = ty; const k2 = NUM_KEY[ty]; if (k2 && typeof numVal === 'number') next[k2] = numVal }
    onChange(next)
  }
  const setNum = (raw: string) => {
    if (!nk) return
    const next = { ...eff }
    const v = Number(raw)
    if (raw.trim() === '' || Number.isNaN(v)) delete next[nk]; else next[nk] = v
    onChange(next)
  }
  const setSpecial = (s: string) => {
    if (s === special) return
    const next = { ...eff }
    if (!s) { delete next.special; delete next.active }
    else { next.special = s; if (ACTIVE_SPECIALS.has(s)) next.active = true; else delete next.active }
    onChange(next)
  }

  return (
    <div className="grid" style={{ gap: 12 }}>
      <Field label={tt('eff_stats')}>
        <div className="grid eff-stats" style={{ gap: 8 }}>
          {STAT_KEYS.map(k => (
            <div className="field" key={k}>
              <label>{tt('ist_' + k)}</label>
              <input className="input" type="number" value={stats[k] ?? ''} onChange={e => setStat(k, e.target.value)} placeholder="0" />
            </div>
          ))}
        </div>
      </Field>
      <div className="grid c2" style={{ gap: 10 }}>
        <Field label={tt('eff_boost')}>
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            <option value="">{tt('eff_none')}</option>
            {BOOST_TYPES.map(b => <option key={b} value={b}>{lbl(tt, 'eft_' + b, b).replace('{n}', 'N')}</option>)}
          </select>
        </Field>
        {nk ? (
          <Field label={nk === 'scans' ? tt('eff_scans') : tt('eff_value')}>
            <input className="input" type="number" value={typeof numVal === 'number' ? numVal : ''} onChange={e => setNum(e.target.value)} placeholder="N" />
          </Field>
        ) : <div />}
      </div>
      <Field label={tt('eff_special')} hint={special ? [lbl(tt, 'spd_' + special, ''), ACTIVE_SPECIALS.has(special) ? tt('eff_active_hint') : ''].filter(Boolean).join(' · ') : undefined}>
        <select className="select" value={special} onChange={e => setSpecial(e.target.value)}>
          <option value="">{tt('eff_none')}</option>
          {SPECIALS.map(s => <option key={s} value={s} title={lbl(tt, 'spd_' + s, '')}>{lbl(tt, 'sp_' + s, s)}{ACTIVE_SPECIALS.has(s) ? ` — ${tt('eff_active')}` : ''}</option>)}
        </select>
      </Field>
    </div>
  )
}

function ItemEditor({ item, onClose, onSave }: { item: ItemFull | null; onClose: () => void; onSave: (code: string, applied: Partial<ItemFull>, patch: ItemPatch) => void }) {
  const { t } = useStore()
  const tt = t as unknown as TT
  const [f, setF] = useState({ name: '', description: '', rarity: 'common' as Rarity, plus_only: false, dungeon_only: false, exclusive: false, effect: '{}' })
  const [adv, setAdv] = useState(false)
  useEffect(() => {
    if (!item) return
    setAdv(false)
    setF({
      name: item.name_i18n?.ru ?? item.name, description: item.description_i18n?.ru ?? item.description,
      rarity: item.rarity, plus_only: item.plus_only, dungeon_only: item.dungeon_only, exclusive: item.exclusive,
      effect: JSON.stringify(item.effect ?? {}, null, 2),
    })
  }, [item])
  const effectParsed = useMemo(() => {
    try { const v = JSON.parse(f.effect); return (typeof v === 'object' && v !== null && !Array.isArray(v)) ? v as Eff : null } catch { return null }
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
  const nExtra = effectParsed ? extraKeys(effectParsed).length : 0
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
    <Modal open={!!item} onClose={onClose} title={<span className="row" style={{ gap: 8 }}><ItemToken code={item.code} kind={item.kind} rarity={item.rarity} size={30} /><span className="mono">{item.code}</span></span>} wide
      footer={<><button className="btn" onClick={onClose}>{t('cancel')}</button><button className="btn primary" disabled={!dirty || effectParsed == null} onClick={save}>{t('save')}</button></>}>
      <div className="grid" style={{ gap: 12 }}>
        {renamed && <div className="alert warn small"><IcWarn size={16} />{t('rename_warn')}</div>}
        <Field label={t('title_ru')} hint={t('translated_by_backend')}><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t('body_ru')}><textarea className="textarea" style={{ minHeight: 70 }} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid c2" style={{ gap: 10 }}>
          <Field label={t('rarity')}><select className="select" value={f.rarity} onChange={e => setF({ ...f, rarity: e.target.value as Rarity })}>{RARITIES.map(r => <option key={r} value={r}>{r}</option>)}</select></Field>
          <Field label={t('item_kind')}><select className="select" value={item.kind} disabled><option value={item.kind}>{item.kind}</option></select></Field>
        </div>
        <Field label={t('flags')}>
          <div className="row" style={{ gap: 16 }}>
            <Switch on={f.plus_only} onChange={v => setF({ ...f, plus_only: v })} label={t('f_plus_only')} />
            <Switch on={f.dungeon_only} onChange={v => setF({ ...f, dungeon_only: v })} label={t('f_dungeon_only')} />
            <Switch on={f.exclusive} onChange={v => setF({ ...f, exclusive: v })} label={t('f_exclusive')} />
          </div>
        </Field>
        {effectParsed != null && <EffectEditor eff={effectParsed} onChange={e2 => setF({ ...f, effect: JSON.stringify(e2, null, 2) })} />}
        {effectParsed != null && (
          <div className="grid" style={{ gap: 6 }}>
            <div className="row small muted">
              <span>{tt('eff_preview')}: {effectLabel(effectParsed, tt)}</span>
              {nExtra > 0 && <span className="chip warn">+{nExtra} {tt('eff_extra_n')}</span>}
            </div>
            <div className="eff-prev">{JSON.stringify(effectParsed)}</div>
          </div>
        )}
        <button type="button" className="linklike" onClick={() => setAdv(a => !a)}>{tt('eff_advanced')}</button>
        {(adv || effectParsed == null) && (
          <Field label={t('effect_json')} hint={t('effect_hint')}>
            <textarea className={`textarea json-area ${effectParsed == null ? 'err' : ''}`} value={f.effect} onChange={e => setF({ ...f, effect: e.target.value })} spellCheck={false} />
          </Field>
        )}
        {effectParsed == null && <div className="alert err small"><IcWarn size={14} />{t('invalid_json')}</div>}
      </div>
    </Modal>
  )
}
