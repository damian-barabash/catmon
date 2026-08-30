import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ARCHETYPES, COAT_CLASSES, RARITIES, RARITY_SUM, api, catPhotoUrl, type CatFull, type CatOwner, type CatPatch, type Rarity } from '../api'
import { fmtDate, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Field, RarityChip, Skeleton, Switch, useConfirm } from '../ui'
import { IcArrowLeft, IcCat, IcCheck, IcExternal, IcStar, IcTrash, IcWarn } from '../icons'

const STATS = ['charm', 'agility', 'dominance', 'mystery'] as const
interface Form { name: string; description: string; rarity: Rarity; archetype: string; coat_class: string; charm: number; agility: number; dominance: number; mystery: number; show_location: boolean }
type CatData = { cat: CatFull; owners: CatOwner[] }

export default function CatEditor() {
  const { id = '' } = useParams()
  const { t, toast } = useStore()
  const nav = useNavigate()
  const { data, loading, error, setData } = useAsync<CatData>(() => api.catGet(id), [id])
  const cat = data?.cat
  const [f, setF] = useState<Form | null>(null)
  useEffect(() => {
    if (!cat) return
    setF({
      name: cat.name_i18n?.ru ?? cat.name, description: cat.description_i18n?.ru ?? cat.description,
      rarity: cat.rarity, archetype: cat.archetype, coat_class: cat.coat_class ?? '',
      charm: cat.charm, agility: cat.agility, dominance: cat.dominance, mystery: cat.mystery,
      show_location: cat.show_location,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat?.id])
  const { confirm, node } = useConfirm()
  const [busy, setBusy] = useState(false)

  const patch = useMemo<CatPatch>(() => {
    if (!cat || !f) return {}
    const p: CatPatch = {}
    if (f.name.trim() && f.name !== (cat.name_i18n?.ru ?? cat.name)) p.name_ru = f.name.trim()
    if (f.description !== (cat.description_i18n?.ru ?? cat.description)) p.description_ru = f.description
    if (f.rarity !== cat.rarity) p.rarity = f.rarity
    if (f.archetype !== cat.archetype) p.archetype = f.archetype
    if ((f.coat_class || null) !== (cat.coat_class ?? null)) p.coat_class = f.coat_class || null
    for (const k of STATS) if (f[k] !== cat[k]) p[k] = f[k]
    if (f.show_location !== cat.show_location) p.show_location = f.show_location
    return p
  }, [cat, f])
  const dirty = Object.keys(patch).length > 0

  const sum = f ? STATS.reduce((s, k) => s + f[k], 0) : 0
  const [lo, hi] = RARITY_SUM[f?.rarity ?? 'common']
  const inCorridor = sum >= lo && sum <= hi
  const power = f ? Math.round(sum / 4) : 0

  const save = () => {
    if (!data || !cat || !f || !dirty) return
    const prev = data
    const optimistic: CatFull = {
      ...cat, name: f.name.trim() || cat.name, description: f.description,
      name_i18n: { ...(cat.name_i18n ?? {}), ru: f.name.trim() || cat.name }, description_i18n: { ...(cat.description_i18n ?? {}), ru: f.description },
      rarity: f.rarity, archetype: f.archetype, coat_class: f.coat_class || null,
      charm: f.charm, agility: f.agility, dominance: f.dominance, mystery: f.mystery,
      power, show_location: f.show_location,
    }
    setData({ ...data, cat: optimistic })
    api.catUpdate(id, patch).then(() => toast(t('saved'))).catch(e => { setData(prev); toast((e as Error).message, 'err') })
  }

  const ownerPatch = (o: CatOwner, p: { evolution?: number; rarity_boost?: number }) => {
    if (!data) return
    const prev = data
    setData({ ...data, owners: data.owners.map(x => x.user_card_id === o.user_card_id ? { ...x, ...p } : x) })
    api.cardUpdate({ user_card_id: o.user_card_id, ...p }).then(() => toast(t('saved'))).catch(e => { setData(prev); toast((e as Error).message, 'err') })
  }

  const del = async () => {
    if (!cat) return
    if (data?.owners.length || cat.owners_count > 0) { toast(t('cat_has_owners'), 'err'); return }
    if (!(await confirm(t('delete_cat'), { text: t('delete_cat_confirm1'), danger: true }))) return
    const typed = prompt(`${t('delete_cat_confirm2')}: ${cat.card_no}`)
    if (typed !== String(cat.card_no)) { toast(t('cancel'), 'info'); return }
    setBusy(true)
    try { await api.catDelete(id); toast(t('done')); nav('/admin/cats') } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) }
  }

  if (error) return <><Link to="/admin/cats" className="btn sm" style={{ marginBottom: 12 }}><IcArrowLeft size={16} />{t('back')}</Link><ErrorBox text={error} /></>
  if (loading || !cat || !f) return <><Skeleton h={100} /><div style={{ height: 14 }} /><Skeleton h={340} /></>
  const url = catPhotoUrl(cat.photo_path)
  const osm = cat.lat != null && cat.lng != null ? `https://www.openstreetmap.org/?mlat=${cat.lat}&mlon=${cat.lng}#map=17/${cat.lat}/${cat.lng}` : null

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}><Link to="/admin/cats" className="btn sm"><IcArrowLeft size={16} />{t('back')}</Link><h1 style={{ fontSize: 22 }}>#{cat.card_no} · {cat.name_i18n?.ru ?? cat.name}</h1><RarityChip r={cat.rarity} /></div>
      <div className="grid c12">
        <Card>
          <div className="cat-photo-lg">{url ? <img src={url} alt={cat.name} /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}><IcCat size={64} /></div>}<span className="no">#{cat.card_no}</span></div>
          <div className="grid" style={{ gap: 8, marginTop: 12 }}>
            <div className="small muted">{t('found_at')}: {fmtDate(cat.first_found_at, true)}</div>
            {cat.first_found_by && <div className="small">{t('found_by')}: <Link to={`/admin/players/${cat.first_found_by}`}><b>{cat.first_found_username ?? cat.first_found_by.slice(0, 8)}</b></Link></div>}
            <div className="small muted row" style={{ gap: 6 }}>
              {t('coords')}: {osm ? <a href={osm} target="_blank" rel="noreferrer" className="row" style={{ gap: 4, textDecoration: 'underline' }}>{cat.lat!.toFixed(5)}, {cat.lng!.toFixed(5)} <IcExternal size={13} /></a> : t('no_coords')}
            </div>
            <Switch on={f.show_location} onChange={v => setF({ ...f, show_location: v })} label={t('show_location')} />
            <button className="btn danger" style={{ marginTop: 8 }} disabled={busy || (data?.owners.length ?? 0) > 0 || cat.owners_count > 0} title={(data?.owners.length ?? 0) > 0 || cat.owners_count > 0 ? t('cat_has_owners') : undefined} onClick={del}><IcTrash size={16} />{t('delete_cat')}</button>
            {((data?.owners.length ?? 0) > 0 || cat.owners_count > 0) && <div className="small muted">{t('cat_has_owners')}</div>}
          </div>
        </Card>
        <Card title={t('edit')}>
          <div className="grid" style={{ gap: 12 }}>
            <Field label={t('cat_name_ru')} hint={t('translated_by_backend')}><input className="input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
            <Field label={t('cat_desc_ru')} hint={t('translated_by_backend')}><textarea className="textarea" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
            <div className="grid c3" style={{ gap: 10 }}>
              <Field label={t('rarity')}><select className="select" value={f.rarity} onChange={e => setF({ ...f, rarity: e.target.value as Rarity })}>{RARITIES.map(r => <option key={r} value={r}>{r}</option>)}</select></Field>
              <Field label={t('archetype')}><select className="select" value={f.archetype} onChange={e => setF({ ...f, archetype: e.target.value })}>{ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}</select></Field>
              <Field label={t('coat')}><select className="select" value={f.coat_class} onChange={e => setF({ ...f, coat_class: e.target.value })}><option value="">—</option>{[...new Set([...COAT_CLASSES, ...(cat.coat_class ? [cat.coat_class] : [])])].map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
            </div>
            <div>
              <h3 style={{ marginBottom: 8 }}>{t('stats')}</h3>
              <div className="grid" style={{ gap: 8 }}>
                {STATS.map(k => (
                  <div key={k} className="stat-row">
                    <span className="small">{t(`stat_${k}` as 'stat_charm')}</span>
                    <input type="range" min={1} max={100} value={f[k]} onChange={e => setF({ ...f, [k]: Number(e.target.value) } as Form)} aria-label={k} />
                    <input className="input" type="number" min={1} max={100} value={f[k]} onChange={e => setF({ ...f, [k]: Math.max(1, Math.min(100, Math.round(Number(e.target.value) || 1))) } as Form)} />
                  </div>
                ))}
              </div>
              <div className="row" style={{ marginTop: 10, gap: 10 }}>
                <span className={`chip ${inCorridor ? 'ok' : 'warn'}`}>{inCorridor ? <IcCheck size={13} /> : <IcWarn size={13} />}{t('stat_sum')}: {sum} · {t('corridor')} {lo}–{hi}</span>
                <span className="chip outline num">{t('power_auto')}: {power}</span>
              </div>
              {!inCorridor && <div className="small muted" style={{ marginTop: 6 }}>{t('out_corridor')} ({f.rarity}: {lo}–{hi})</div>}
            </div>
            <div className="row"><button className="btn primary" disabled={!dirty} onClick={save}>{t('save')}</button>{dirty && <span className="small muted">{Object.keys(patch).length} ✎</span>}</div>
          </div>
        </Card>
      </div>

      <Card title={`${t('owners')} · ${data?.owners.length ?? 0}`} className="" soft={false}>
        {!data?.owners.length ? <Empty /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>{t('col_player')}</th><th>{t('evolution')}</th><th>{t('rarity_boost')}</th><th>{t('first_discovery')}</th><th>{t('accessory')}</th><th>{t('found_at')}</th></tr></thead>
              <tbody>
                {data.owners.map(o => (
                  <tr key={o.user_card_id}>
                    <td><Link to={`/admin/players/${o.user_id}`}><b>{o.username ?? o.user_id.slice(0, 8)}</b></Link></td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <select className="select" style={{ width: 64 }} value={o.evolution} onChange={e => ownerPatch(o, { evolution: Number(e.target.value) })} aria-label={t('evolution')}>{[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select>
                        {o.evolution > 0 && <span className="stars small">{'★'.repeat(Math.min(5, o.evolution))}</span>}
                      </div>
                    </td>
                    <td>
                      <select className="select" style={{ width: 70 }} value={o.rarity_boost} onChange={e => ownerPatch(o, { rarity_boost: Number(e.target.value) })} aria-label={t('rarity_boost')}>{[0, 1, 2, 3].map(n => <option key={n} value={n}>+{n}</option>)}</select>
                    </td>
                    <td>{o.is_first_discovery ? <span className="chip r-legendary"><IcStar size={12} />{t('first_discovery')}</span> : <span className="muted">—</span>}</td>
                    <td className="mono muted">{o.accessory_code ?? '—'}</td>
                    <td className="muted small">{fmtDate(o.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {node}
    </>
  )
}
