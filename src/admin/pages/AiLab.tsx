import { useEffect, useRef, useState } from 'react'
import { ApiError, api, catThumbUrl, type CatRow } from '../api'
import { useStore } from '../store'
import { Card, Empty, ErrorBox, Field, RarityChip, Seg, Tabs } from '../ui'
import { IcBolt, IcCheck, IcClose, IcInfo, IcScan, IcSearch, IcUpload, IcWarn } from '../icons'

/* Лаборатория ИИ: сухой прогон скана. Сервер (admin-api → scan-cat dry_run)
 * считает всё так же, как для игрока, но ничего не пишет в игру. */

type Photo = { b64: string; url: string }
type Pair2 = [number | '', number | '']
type Thr = { near: Pair2; colony: Pair2; far: Pair2; decisive: Pair2; rescue: number | '' }
const EMPTY_THR: Thr = { near: ['', ''], colony: ['', ''], far: ['', ''], decisive: ['', ''], rescue: '' }
const MODELS = ['qwen3.8:27b-q4_K_M', 'qwen3.5:27b', 'qwen3.5:9b']

/// Фото готовится как в приложении: длинная сторона 512 px, JPEG.
async function prepPhoto(file: File, max = 512): Promise<Photo> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  const url = c.toDataURL('image/jpeg', 0.8)
  return { b64: url.slice(url.indexOf(',') + 1), url }
}

function PhotoDrop({ value, onChange, label, small }: { value: Photo | null; onChange: (p: Photo | null) => void; label: string; small?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const take = async (f?: File | null) => { if (f && f.type.startsWith('image/')) onChange(await prepPhoto(f)) }
  return (
    <div className={`lab-drop ${small ? 'sm' : ''}`}>
      <input ref={ref} type="file" accept="image/*" hidden onChange={e => { take(e.target.files?.[0]); e.target.value = '' }} />
      {value ? (
        <div className="lab-shot">
          <img src={value.url} alt={label} />
          <button type="button" className="btn icon sm" onClick={() => onChange(null)} aria-label="remove"><IcClose size={14} /></button>
        </div>
      ) : (
        <div className={`drop ${over ? 'on' : ''}`} role="button" tabIndex={0}
          onClick={() => ref.current?.click()} onKeyDown={e => { if (e.key === 'Enter') ref.current?.click() }}
          onDragOver={e => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]) }}>
          <IcUpload size={small ? 18 : 24} /><div className="small">{label}</div>
        </div>
      )}
    </div>
  )
}

function CatPick({ value, onChange }: { value: CatRow | null; onChange: (c: CatRow | null) => void }) {
  const { t } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<CatRow[]>([])
  useEffect(() => {
    if (value || !open) return
    let dead = false
    const h = setTimeout(() => {
      api.catsList({ q, limit: 8, sort: 'card_no' }).then(r => { if (!dead) setList(r.cats) }).catch(() => { if (!dead) setList([]) })
    }, 250)
    return () => { dead = true; clearTimeout(h) }
  }, [q, value, open])
  if (value) return (
    <div className="lab-cat on">
      <img src={catThumbUrl(value.photo_path, 96) || undefined} alt="" crossOrigin="anonymous" />
      <div><b>#{value.card_no} {value.name}</b><div className="small muted">{value.coat_class ?? '—'}</div></div>
      <button type="button" className="btn icon sm ghost" onClick={() => onChange(null)} aria-label="remove"><IcClose size={14} /></button>
    </div>
  )
  return (
    <div className="lab-pick" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <div className="adm-search"><IcSearch size={16} /><input value={q} onChange={e => setQ(e.target.value)} onFocus={() => setOpen(true)} placeholder={t('search_cats')} aria-label={t('lab_pick_cat')} /></div>
      {open && list.length > 0 && (
        <div className="lab-cats">
          {list.map(c => (
            <button type="button" key={c.id} className="lab-cat" onClick={() => { onChange(c); setOpen(false) }}>
              <img src={catThumbUrl(c.photo_path, 96) || undefined} alt="" loading="lazy" crossOrigin="anonymous" />
              <div><b>#{c.card_no} {c.name}</b><div className="small muted">{c.coat_class ?? '—'}</div></div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const numOr = (v: string): number | '' => (v === '' ? '' : Number(v))
function ThrRow({ label, v, onChange, ph }: { label: string; v: Pair2; onChange: (v: Pair2) => void; ph?: [number, number] }) {
  const { t } = useStore()
  return (
    <div className="lab-thr">
      <span>{label}</span>
      <input className="input num" type="number" min={0} max={100} value={v[0]} placeholder={ph ? String(ph[0]) : ''} onChange={e => onChange([numOr(e.target.value), v[1]])} aria-label={`${label}: ${t('lab_conf')}`} />
      <input className="input num" type="number" min={0} max={5} value={v[1]} placeholder={ph ? String(ph[1]) : ''} onChange={e => onChange([v[0], numOr(e.target.value)])} aria-label={`${label}: ${t('lab_marks')}`} />
    </div>
  )
}

/// Настройки ИИ: модель, планки, политика. Пустое поле = как в игре. Свёрнуты по умолчанию.
function AiSettings({ model, setModel, thr, setThr, unsure, setUnsure, degraded, setDegraded, live, changed }: {
  model: string; setModel: (v: string) => void; thr: Thr; setThr: (t: Thr) => void
  unsure: string; setUnsure: (v: string) => void; degraded: string; setDegraded: (v: string) => void
  live?: { near: [number, number]; colony: [number, number]; far: [number, number]; decisive: [number, number]; rescue: number } | null
  changed: boolean
}) {
  const { t } = useStore()
  return (
    <details className="lab-ai">
      <summary><IcBolt size={16} />{t('lab_ai')}{changed && <span className="chip warn">{t('lab_changed')}</span>}<span className="small muted">{t('lab_thr_short')}</span></summary>
      <div className="lab-ai-grid">
        <div className="lab-ai-col">
          <Field label={t('lab_model')}>
            <select className="select" value={model} onChange={e => setModel(e.target.value)}>
              <option value="">{t('lab_model_default')}</option>{MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label={t('lab_on_unsure')}>
            <select className="select" value={unsure} onChange={e => setUnsure(e.target.value)}>
              <option value="">{t('lab_pol_default')}</option><option value="new">{t('lab_pol_new')}</option><option value="busy">{t('lab_pol_busy')}</option>
            </select>
          </Field>
          <Field label={t('lab_on_degraded')}>
            <select className="select" value={degraded} onChange={e => setDegraded(e.target.value)}>
              <option value="">{t('lab_pol_default')}</option><option value="new">{t('lab_pol_new')}</option><option value="busy">{t('lab_pol_busy')}</option>
            </select>
          </Field>
        </div>
        <div className="lab-ai-col">
          <div className="lab-thr head"><span>{t('lab_thr')}</span><span>{t('lab_conf')}</span><span>{t('lab_marks')}</span></div>
          <ThrRow label={t('lab_near')} v={thr.near} ph={live?.near} onChange={v => setThr({ ...thr, near: v })} />
          <ThrRow label={t('lab_colony')} v={thr.colony} ph={live?.colony} onChange={v => setThr({ ...thr, colony: v })} />
          <ThrRow label={t('lab_far')} v={thr.far} ph={live?.far} onChange={v => setThr({ ...thr, far: v })} />
          <ThrRow label={t('lab_decisive')} v={thr.decisive} ph={live?.decisive} onChange={v => setThr({ ...thr, decisive: v })} />
          <div className="lab-thr">
            <span>{t('lab_rescue')}</span>
            <input className="input num" type="number" min={0} max={100} value={thr.rescue} placeholder={live ? String(live.rescue) : ''} onChange={e => setThr({ ...thr, rescue: numOr(e.target.value) })} aria-label={t('lab_rescue')} />
            <span />
          </div>
        </div>
      </div>
    </details>
  )
}

const thrPayload = (thr: Thr) => {
  const out: Record<string, unknown> = {}
  for (const k of ['near', 'colony', 'far', 'decisive'] as const) if (thr[k][0] !== '' && thr[k][1] !== '') out[k] = thr[k]
  if (thr.rescue !== '') out.rescue = thr.rescue
  return Object.keys(out).length ? out : undefined
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Res = any
const sec = (ms?: number) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)} s`)
const Yes = ({ on }: { on: boolean }) => on ? <IcCheck size={15} style={{ color: 'var(--ok)' }} /> : <IcClose size={15} style={{ color: 'var(--accent)' }} />

function CatRef({ id, cats }: { id: string; cats: Record<string, any> }) {
  const c = cats?.[id]
  return (
    <span className="lab-ref">
      {c?.photo_path && <img src={catThumbUrl(c.photo_path, 96) || undefined} alt="" loading="lazy" crossOrigin="anonymous" />}
      <b>{c ? `#${c.card_no} ${c.name}` : id.slice(0, 8)}</b>
    </span>
  )
}

function ScanResult({ r }: { r: Res }) {
  const { t } = useStore()
  const tt = t as (k: string) => string
  const lab = r.lab ?? {}
  const cats = lab.cats ?? {}
  const g = lab.gate
  const vClass = r.status === 'new_cat' ? 'ok' : r.status === 'existing_cat' ? 'accent' : 'warn'
  const vText = r.status === 'new_cat' ? t('lab_v_new') : r.status === 'existing_cat' ? t('lab_v_existing') : r.status === 'rejected' ? t('lab_v_rejected') : t('lab_v_error')
  return (
    <>
      <Card className="lab-top" title={t('lab_result')} icon={<IcScan size={18} />} right={<span className="chip outline num">{sec(lab.t?.total_ms)}</span>}>
        <div className="lab-verdict">
          <span className={`chip ${vClass}`}>{vText}</span>
          {r.status === 'existing_cat' && r.cat && <span className="lab-ref"><img src={catThumbUrl(r.cat.photo_path, 96) || undefined} alt="" crossOrigin="anonymous" /><b>#{r.cat.card_no} {r.cat.name}</b><RarityChip r={r.cat.rarity} /></span>}
          {(r.status === 'rejected' || r.status === 'error') && <b>{r.reason}{r.detail ? ` — ${r.detail}` : ''}</b>}
          {r.xp_gained != null && <span className="chip outline num">{t('lab_xp')}: +{r.xp_gained}</span>}
          {r.trail_x2 && <span className="chip outline">×2</span>}{r.patrol_x15 && <span className="chip outline">×1.5</span>}
          {r.dup_risk && <span className="chip warn">{t('lab_dup_risk')}: {r.dup_risk}</span>}
        </div>
        {r.status === 'new_cat' && r.cat?.rarity && (
          <div className="lab-cardprev">
            <div className="row"><b>{r.cat.name_i18n?.ru ?? '—'}</b><RarityChip r={r.cat.rarity} /><span className="chip outline num">uniq {r.cat.uniqueness}</span><span className="chip outline num">power {r.cat.power}</span></div>
            <div className="small muted">{r.cat.description_i18n?.ru}</div>
            <div className="small num">charm {r.cat.charm} · agility {r.cat.agility} · dominance {r.cat.dominance} · mystery {r.cat.mystery}</div>
            <div className="small muted">{r.cat.canonical_text}</div>
          </div>
        )}
      </Card>

      <div className="lab-res">
      {g && (
        <Card title={t('lab_gate')} right={<span className="chip outline num">{lab.models?.gate} · {sec(lab.t?.gate_ms)}</span>}>
          <div className="lab-kv">
            <span>is_cat</span><b><Yes on={g.is_cat === true} /></b>
            <span>quality_ok</span><b><Yes on={g.quality_ok === true} /></b>
            <span>is_fake</span><b>{String(g.is_fake)}</b>
            <span>is_screen_or_print</span><b>{String(g.is_screen_or_print)}</b>
            <span>subject</span><b>{g.subject} · {g.subject_ru}</b>
            <span>coat_class</span><b>{g.coat_class} {lab.coat_class ? '' : '(unknown)'}</b>
            <span>coat_colors</span><b>{(g.coat_colors ?? []).join(', ')} → {(lab.colors ?? []).join(', ')}</b>
            <span>confidence</span><b className="num">{g.confidence}</b>
            <span>reason</span><b>{g.reason}</b>
          </div>
          {(lab.screen_evidence?.length > 0 || lab.forensic) && (
            <div className="lab-sub">
              <div className="kicker">{t('lab_screen')} · {lab.models?.forensic} · {sec(lab.t?.forensic_ms != null && lab.t?.gate_ms != null ? lab.t.forensic_ms - lab.t.gate_ms : undefined)}</div>
              {lab.screen_evidence?.length > 0 && <div className="small">{lab.screen_evidence.join('; ')}</div>}
              {lab.forensic && <div className="lab-kv">
                <span>frame_present</span><b>{String(lab.forensic.frame_present)}</b>
                <span>cat_inside_frame</span><b>{String(lab.forensic.cat_inside_frame)}</b>
                <span>is_screen_or_print</span><b>{String(lab.forensic.is_screen_or_print)}</b>
                <span>reason</span><b>{lab.forensic.reason}</b>
              </div>}
            </div>
          )}
          <div className="lab-sub small"><span className="muted">{t('lab_live')}:</span> {lab.liveness?.diff == null ? '—' : <b className="num">{Number(lab.liveness.diff).toFixed(2)}</b>} {lab.liveness?.identical && <span className="chip warn">identical</span>}</div>
        </Card>
      )}

      <div className="lab-col">
      {r.status !== 'rejected' || lab.searches?.length ? (
        <Card title={t('lab_cands')}>
          {!(lab.searches?.length) ? <Empty text={t('lab_no_cands')} /> : lab.searches.map((s: any, i: number) => (
            <div className="tbl-wrap lab-scroll" key={i}>
              <table className="tbl">
                <thead><tr><th>{t('cats')}</th><th>{t('lab_distance')}</th><th>{t('coat')}</th><th /></tr></thead>
                <tbody>
                  {s.found.length === 0 && <tr><td colSpan={4} className="muted">{t('lab_no_cands')}</td></tr>}
                  {s.found.map((f: any) => (
                    <tr key={f.id}>
                      <td><CatRef id={f.id} cats={cats} /></td>
                      <td className="num">{f.distance_km == null ? '—' : f.distance_km < 1 ? `${Math.round(f.distance_km * 1000)} m` : `${Number(f.distance_km).toFixed(1)} km`}</td>
                      <td>{f.coat_class ?? '—'}</td>
                      <td><span className={`chip ${f.state === 'compare' ? 'accent' : 'outline'}`}>{tt(`st_${f.state}`)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </Card>
      ) : null}

      {lab.cmp?.length > 0 && (
        <Card title={t('lab_cmps')} right={<span className="chip outline">{lab.models?.compare}</span>}>
          {lab.cmp.map((c: any, i: number) => (
            <div className="lab-cmp" key={i}>
              <div className="row">
                <CatRef id={c.id} cats={cats} />
                {c.err ? <span className="chip warn">{c.err}</span> : c.veto ? <span className="chip warn">veto: {c.veto}</span> : <>
                  <span className={`chip ${c.ok ? 'ok' : 'outline'}`}>{c.ok ? t('lab_same') : t('lab_not_same')}</span>
                  <span className="chip outline num">{t('lab_conf')} {c.conf} / {c.need?.[0]}</span>
                  <span className="chip outline num">{t('lab_marks')} {c.marks} / {c.need?.[1]}</span>
                  <span className="chip outline">{c.ca} · {c.cb}</span>
                </>}
                <span className="chip outline num">{sec(c.ms)}</span>
              </div>
              {!c.err && !c.veto && <div className="small">
                {c.same === false && <span className="muted">same_cat=false · </span>}
                {c.detail_ok === false && <span className="muted">detail_ok=false · </span>}
                {(c.matched_marks ?? []).length > 0 && <span>+ {(c.matched_marks ?? []).join('; ')} </span>}
                {(c.differences ?? []).length > 0 && <span style={{ color: 'var(--accent)' }}>− {(c.differences ?? []).join('; ')} </span>}
                {c.why && <span className="muted">· {c.why}</span>}
              </div>}
            </div>
          ))}
          <div className="small muted" style={{ marginTop: 8 }}>
            degraded: {String(lab.flags?.degraded)} · uncertain: {String(lab.flags?.uncertain)} · gpu_stuck: {String(lab.flags?.gpu_stuck)}
          </div>
        </Card>
      )}

      </div>
      </div>
      <details className="lab-raw"><summary>{t('lab_raw')}</summary><pre>{JSON.stringify(r, null, 1)}</pre></details>
    </>
  )
}

function PairResult({ r }: { r: Res }) {
  const { t } = useStore()
  const tt = t as (k: string) => string
  if (r.error) return <ErrorBox text={String(r.error)} />
  const a = r.answer ?? {}
  return (
    <Card title={t('lab_result')} icon={<IcScan size={18} />} right={<span className="chip outline num">{r.model} · {sec(r.ms)}</span>}>
      <div className="lab-verdict">
        <span className={`chip ${a.same_cat ? 'ok' : 'warn'}`}>same_cat={String(a.same_cat)}</span>
        <span className="chip outline num">{t('lab_conf')} {r.conf}</span>
        <span className="chip outline num">{t('lab_marks')} {r.marks}</span>
        <span className="chip outline">{a.class_a} · {a.class_b}</span>
        {a.detail_ok === false && <span className="chip warn">detail_ok=false</span>}
        {r.class_clash && <span className="chip warn">class veto</span>}
      </div>
      <div className="small" style={{ margin: '10px 0' }}>
        {(a.matched_marks ?? []).length > 0 && <div>+ {(a.matched_marks ?? []).join('; ')}</div>}
        {(a.differences ?? []).length > 0 && <div style={{ color: 'var(--accent)' }}>− {(a.differences ?? []).join('; ')}</div>}
        {a.reason && <div className="muted">{a.reason}</div>}
      </div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>{t('lab_thr')}</th><th>{t('lab_conf')}</th><th>{t('lab_marks')}</th><th /></tr></thead>
        <tbody>{Object.entries(r.bars ?? {}).map(([k, v]: [string, any]) => (
          <tr key={k}><td>{tt(`lab_${k}`)}</td><td className="num">{v[0]}</td><td className="num">{v[1]}</td>
            <td><span className={`chip ${r.verdicts?.[k] ? 'ok' : 'outline'}`}>{r.verdicts?.[k] ? t('lab_pass') : t('lab_fail')}</span></td></tr>
        ))}</tbody>
      </table></div>
      <details className="lab-raw"><summary>{t('lab_raw')}</summary><pre>{JSON.stringify(r, null, 1)}</pre></details>
    </Card>
  )
}

export default function AiLab() {
  const { t, toast } = useStore()
  const [tab, setTab] = useState<'scan' | 'pair'>('scan')
  // общее
  const [model, setModel] = useState('')
  const [thr, setThr] = useState<Thr>(EMPTY_THR)
  const [unsure, setUnsure] = useState('')
  const [degraded, setDegraded] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  // скан
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [b1, setB1] = useState<Photo | null>(null)
  const [b2, setB2] = useState<Photo | null>(null)
  const [where, setWhere] = useState<'cat' | 'xy'>('cat')
  const [nearCat, setNearCat] = useState<CatRow | null>(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [fx, setFx] = useState({ plus: false, buddy_hunter: false, xp_boost: false, trail_boost: false, trail: false, patrol: false, with_card: false })
  const [scanRes, setScanRes] = useState<Res>(null)
  // пара
  const [pa, setPa] = useState<Photo | null>(null)
  const [pb, setPb] = useState<Photo | null>(null)
  const [bMode, setBMode] = useState<'upload' | 'cat'>('upload')
  const [catB, setCatB] = useState<CatRow | null>(null)
  const [pairRes, setPairRes] = useState<Res>(null)

  const opts = () => ({
    compare_model: model || undefined, forensic_model: model || undefined,
    thresholds: thrPayload(thr), on_unsure: unsure || undefined, on_degraded: degraded || undefined,
  })
  const run = async (payload: Record<string, unknown>, done: (r: Res) => void) => {
    setBusy(true); setErr('')
    try {
      const r = await api.aiLab(payload)
      if (r.result?.dry !== true) throw new ApiError('lab', String(r.result?.error ?? r.result?.message ?? 'lab_failed'), 400)
      done(r.result)
    } catch (e) { setErr((e as Error).message); toast(t('error'), 'err') } finally { setBusy(false) }
  }
  const runScan = () => {
    if (!photo) return setErr(t('lab_need_photo'))
    const loc = where === 'cat' ? (nearCat ? { near_cat_id: nearCat.id } : null)
      : (lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? { lat: Number(lat), lng: Number(lng) } : null)
    if (!loc) return setErr(t('lab_need_loc'))
    const burst = [b1, b2].filter(Boolean).map(p => p!.b64)
    setScanRes(null)
    run({ mode: 'scan', photo_b64: photo.b64, photo_cmp_b64: photo.b64, burst_b64: burst, ...loc,
      opts: { ...opts(), ...fx, cards_count: fx.trail ? 0 : 5 } }, setScanRes)
  }
  const runPair = () => {
    if (!pa || (bMode === 'upload' ? !pb : !catB)) return setErr(t('lab_need_photo'))
    setPairRes(null)
    run({ mode: 'pair', photo_b64: pa.b64, ...(bMode === 'upload' ? { photo_b_b64: pb!.b64 } : { cat_b_id: catB!.id }), opts: opts() }, setPairRes)
  }
  const live = scanRes?.lab?.profile ?? null
  const changed = model !== '' || unsure !== '' || degraded !== '' || JSON.stringify(thr) !== JSON.stringify(EMPTY_THR)
  const chip = (k: keyof typeof fx, short: string, full: string) => (
    <button type="button" key={k} className={`lab-chip ${fx[k] ? 'on' : ''}`} aria-pressed={fx[k]} title={full} onClick={() => setFx({ ...fx, [k]: !fx[k] })}>{short}</button>
  )
  const res = tab === 'scan' ? scanRes : pairRes

  return (
    <>
      <div className="lab-head">
        <h1>{t('lab_title')}</h1>
        <span className="chip outline lab-safe" title={t('lab_note')}><IcInfo size={14} />{t('lab_safe')}</span>
        <div className="lab-tabs"><Tabs value={tab} onChange={v => { setTab(v); setErr('') }} options={[{ v: 'scan', l: t('lab_tab_scan') }, { v: 'pair', l: t('lab_tab_pair') }]} /></div>
      </div>
      <section className="card lab-bar">
        {tab === 'scan' ? (
          <div className="lab-in">
            <div className="lab-block">
              <div className="kicker">{t('lab_photo')}</div>
              <div className="lab-photos">
                <PhotoDrop value={photo} onChange={setPhoto} label={t('lab_photo_hint')} />
                <div className="lab-burst" title={t('lab_burst_hint')}>
                  <PhotoDrop small value={b1} onChange={setB1} label={t('lab_burst_short')} />
                  <PhotoDrop small value={b2} onChange={setB2} label={t('lab_burst_short')} />
                </div>
              </div>
            </div>
            <div className="lab-block">
              <div className="kicker">{t('lab_where')}</div>
              <Seg value={where} onChange={v => setWhere(v as 'cat' | 'xy')} options={[{ v: 'cat', l: t('lab_where_cat') }, { v: 'xy', l: t('lab_where_xy') }]} />
              {where === 'cat' ? <CatPick value={nearCat} onChange={setNearCat} /> : (
                <div className="lab-two">
                  <input className="input num" value={lat} onChange={e => setLat(e.target.value)} placeholder={`${t('lab_lat')} 52.2374`} aria-label={t('lab_lat')} inputMode="decimal" />
                  <input className="input num" value={lng} onChange={e => setLng(e.target.value)} placeholder={`${t('lab_lng')} 21.0657`} aria-label={t('lab_lng')} inputMode="decimal" />
                </div>
              )}
            </div>
            <div className="lab-block">
              <div className="kicker">{t('lab_player')}</div>
              <div className="lab-chips">
                {chip('with_card', t('lab_c_card'), t('lab_with_card'))}
                {chip('trail_boost', t('lab_c_trailboost'), t('lab_trail_boost'))}
                {chip('plus', t('lab_c_plus'), t('lab_plus'))}
                {chip('buddy_hunter', t('lab_c_buddy'), t('lab_buddy'))}
                {chip('xp_boost', t('lab_c_xpboost'), t('lab_xpboost'))}
                {chip('trail', t('lab_c_trail'), t('lab_trail'))}
                {chip('patrol', t('lab_c_patrol'), t('lab_patrol'))}
              </div>
            </div>
          </div>
        ) : (
          <div className="lab-in pair">
            <div className="lab-block">
              <div className="kicker">{t('lab_photo_a')}</div>
              <PhotoDrop value={pa} onChange={setPa} label={t('lab_photo_hint')} />
            </div>
            <div className="lab-block">
              <div className="kicker">{t('lab_photo_b')}</div>
              <Seg value={bMode} onChange={v => setBMode(v as 'upload' | 'cat')} options={[{ v: 'upload', l: t('lab_b_upload') }, { v: 'cat', l: t('lab_b_cat') }]} />
              {bMode === 'upload' ? <PhotoDrop value={pb} onChange={setPb} label={t('lab_photo_hint')} /> : <CatPick value={catB} onChange={setCatB} />}
            </div>
          </div>
        )}
        <div className="lab-foot">
          <AiSettings model={model} setModel={setModel} thr={thr} setThr={setThr} unsure={unsure} setUnsure={setUnsure} degraded={degraded} setDegraded={setDegraded} live={live} changed={changed} />
          <div className="lab-actions">
            {changed && <button className="btn ghost sm" disabled={busy} onClick={() => { setThr(EMPTY_THR); setModel(''); setUnsure(''); setDegraded('') }}>{t('lab_reset')}</button>}
            <button className="btn primary" disabled={busy} onClick={tab === 'scan' ? runScan : runPair}><IcScan size={16} />{busy ? t('lab_running') : t('lab_run')}</button>
          </div>
        </div>
      </section>
      {err && <div className="alert err" style={{ marginTop: 12 }}><IcWarn size={18} /><span>{err}</span></div>}
      {busy && <Card className="lab-top"><div className="sk" style={{ height: 14, width: '60%', marginBottom: 10 }} /><div className="sk" style={{ height: 14, width: '40%' }} /><div className="small muted" style={{ marginTop: 10 }}>{t('lab_running')}</div></Card>}
      {!busy && res && (tab === 'scan' ? <ScanResult r={res} /> : <div className="lab-top"><PairResult r={res} /></div>)}
    </>
  )
}
