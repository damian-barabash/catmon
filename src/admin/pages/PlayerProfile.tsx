import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, catPhotoUrl, fileToBase64, itemIconUrl, type Item, type PlayerCard, type PlayerFull } from '../api'
import { fmtAgo, fmtDate, fmtN, i18nText, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Field, ItemToken, Modal, RarityChip, Skeleton, Tabs, initials, useConfirm } from '../ui'
import { IcArrowLeft, IcBan, IcCamera, IcCat, IcCheck, IcChest, IcClose, IcCoins, IcEye, IcGem, IcGift, IcInfo, IcMinus, IcPlus, IcStar, IcTrash, IcWarn, IcBolt } from '../icons'

type Tab = 'cats' | 'inventory' | 'policies' | 'notices' | 'audit'
type ModalKind = null | 'adjust' | 'give' | 'remove' | 'addcat' | 'notice' | 'ban'
const isBanned = (p: PlayerFull) => !!p.ban_reason && (p.banned_until == null || new Date(p.banned_until) > new Date())

export default function PlayerProfile() {
  const { id = '' } = useParams()
  const { t, lang, toast } = useStore()
  const nav = useNavigate()
  const { data: p, loading, error, reload, setData } = useAsync(() => api.player(id), [id])
  const [tab, setTab] = useState<Tab>('cats')
  const [modal, setModal] = useState<ModalKind>(null)
  const { confirm, node } = useConfirm()
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<unknown>, okMsg = t('done')) => { setBusy(true); try { await fn(); toast(okMsg); setModal(null); reload() } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) } }
  /* optimistic: patch UI immediately, request in background, roll back + toast on error */
  const optimistic = (patch: (cur: PlayerFull) => PlayerFull, fn: () => Promise<unknown>, okMsg = t('done')) => {
    if (!p) return
    const prev = p
    setData(patch(p)); setModal(null)
    fn().then(() => { toast(okMsg); reload() }).catch(e => { setData(prev); toast((e as Error).message, 'err') })
  }

  // items catalogue (lazy)
  const [items, setItems] = useState<Item[] | null>(null)
  // забрать предмет с плитки инвентаря (крестик)
  const [removeIt, setRemoveIt] = useState<{ code: string; name: string; max: number; rarity?: string; kind?: string } | null>(null)
  const [removeQty, setRemoveQty] = useState(1)
  useEffect(() => { if ((modal === 'give' || modal === 'notice') && !items) api.itemsList().then(setItems).catch(e => toast((e as Error).message, 'err')) }, [modal]) // eslint-disable-line react-hooks/exhaustive-deps

  const unban = async () => { if (await confirm(t('act_unban'), { text: p?.username })) run(() => api.playerUnban(id)) }
  const del = async () => {
    if (!p) return
    if (!(await confirm(t('act_delete'), { text: t('delete_confirm1'), danger: true }))) return
    const typed = prompt(`${t('delete_confirm2')}: ${p.username}`)
    if (typed !== p.username) { toast(t('cancel'), 'info'); return }
    run(async () => { await api.playerDelete(id); nav('/admin/players') })
  }

  if (error) return <><Link to="/admin/players" className="btn sm" style={{ marginBottom: 12 }}><IcArrowLeft size={16} />{t('back')}</Link><ErrorBox text={error} /></>
  if (loading || !p) return <><Skeleton h={100} /><div style={{ height: 14 }} /><Skeleton h={300} /></>
  const banned = isBanned(p)
  const plus = p.plus_until && new Date(p.plus_until) > new Date()

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}><Link to="/admin/players" className="btn sm"><IcArrowLeft size={16} />{t('back')}</Link></div>
      <Card className="" >
        <div className="p-head">
          <div className="avatar">{p.avatar_url ? <img src={p.avatar_url} alt="" /> : initials(p.username)}</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 22 }}>{p.username}</h1>
            <div className="row small muted" style={{ gap: 6 }}>
              <span className="mono">{p.email ?? '—'}</span>
              {p.is_guest && <span className="chip outline">{t('guest')}</span>}
              {p.providers?.map(pr => <span key={pr} className="chip">{pr}</span>)}
              {plus && <span className="chip r-legendary">{t('plus')} · {fmtDate(p.plus_until)}</span>}
              {banned && <span className="chip accent"><IcBan size={12} />{t('banned')} {p.banned_until ? `${t('until')} ${fmtDate(p.banned_until)}` : t('forever')}</span>}
            </div>
            <div className="row small muted" style={{ gap: 12, marginTop: 4 }}><span>{t('registered')}: {fmtDate(p.created_at, true)}</span><span>{t('col_last_seen')}: {fmtAgo(p.last_seen)} ({fmtDate(p.last_seen, true)})</span><span className="mono">{p.id}</span></div>
            {banned && p.ban_reason && <div className="alert err small" style={{ marginTop: 8 }}><IcWarn size={14} />{p.ban_reason}</div>}
          </div>
        </div>
        <div className="grid kpi" style={{ marginTop: 16 }}>
          {[
            { l: t('xp'), v: `${fmtN(p.xp, lang)}`, s: p.level != null ? `${t('level')} ${p.level}` : undefined, I: <IcStar size={16} /> },
            { l: t('gems'), v: fmtN(p.gems, lang), img: '/admin/gem.svg', I: <IcGem size={16} /> },
            { l: t('eyes'), v: fmtN(p.cat_eyes, lang), img: '/admin/cat_eye.svg', I: <IcEye size={16} /> },
            { l: t('col_cats'), v: fmtN(p.cards_count ?? p.cards.length, lang), I: <IcCat size={16} /> },
            { l: t('col_rating'), v: String(p.pvp_rating), I: <IcBolt size={16} /> },
            { l: t('energy'), v: p.energy != null ? String(p.energy) : '—', I: <IcBolt size={16} /> },
            { l: t('plus_until'), v: plus ? fmtDate(p.plus_until) : '—', I: <IcCoins size={16} /> },
          ].map(k => <div key={k.l} className="card soft kpi-card" style={{ padding: 12 }}><div className="ic">{k.I}</div><div className="lbl">{k.l}</div><div className="val" style={{ fontSize: 18 }}>{k.img && <img src={k.img} alt="" />}{k.v}</div>{k.s && <div className="sub">{k.s}</div>}</div>)}
        </div>
      </Card>

      <div className="grid c21" style={{ marginTop: 14 }}>
        <Card>
          <Tabs value={tab} onChange={v => setTab(v as Tab)} options={[{ v: 'cats', l: t('tab_cats'), n: p.cards.length }, { v: 'inventory', l: t('tab_inventory'), n: p.items.length }, { v: 'policies', l: t('tab_policies'), n: p.acceptances.length }, { v: 'notices', l: t('tab_notices'), n: p.notices.length }, { v: 'audit', l: t('tab_audit'), n: p.audit.length }]} />
          {tab === 'cats' && (!p.cards.length ? <Empty /> : <div className="cat-grid">{p.cards.map(c => <CatCard key={c.id} c={c} link />)}</div>)}
          {tab === 'inventory' && (!p.items.length ? <Empty /> : <div className="item-grid">{p.items.map(it => (
            <div key={it.code} className="item has-x">
              <button className="item-x" aria-label={t('take_n')} title={t('take_n')} onClick={() => { setRemoveQty(1); setRemoveIt({ code: it.code, name: it.name ?? it.code, max: it.qty, rarity: it.rarity, kind: it.kind }) }}><IcClose size={13} /></button>
              <div className="ic"><ItemIcon code={it.code} /></div><div style={{ minWidth: 0 }}><div className="nm">{it.name ?? it.code}</div><div className="qt">×{it.qty} · {it.rarity ?? it.kind ?? ''}</div></div>
            </div>))}</div>)}
          {tab === 'policies' && (!p.acceptances.length ? <Empty /> : <div className="tbl-wrap"><table className="tbl"><thead><tr><th>code</th><th>{t('version')}</th><th>{t('when')}</th><th>ip</th><th>build</th></tr></thead><tbody>{p.acceptances.map(a => <tr key={a.code + a.version}><td><b>{a.code}</b></td><td>v{a.version}</td><td className="muted">{fmtDate(a.accepted_at, true)}</td><td className="mono muted">{a.ip ?? '—'}</td><td className="muted">{a.app_build ?? '—'}</td></tr>)}</tbody></table></div>)}
          {tab === 'notices' && (!p.notices.length ? <Empty /> : <div className="timeline">{p.notices.map(n => (
            <div key={n.id} className="ev"><div className={`dot ${n.kind === 'warning' || n.kind === 'ban' ? 'accent' : ''}`}>{n.kind === 'gift' ? <IcGift size={13} /> : n.kind === 'warning' || n.kind === 'ban' ? <IcWarn size={13} /> : <IcInfo size={13} />}</div>
              <div><div className="row small"><span className="chip">{n.kind}</span><span className="muted">{fmtDate(n.created_at, true)}</span>{n.read_at && <span className="muted"><IcCheck size={12} /></span>}</div><b>{i18nText(n.title, lang)}</b><div className="small muted">{i18nText(n.body, lang)}</div></div></div>))}</div>)}
          {tab === 'audit' && (!p.audit.length ? <Empty /> : <div className="timeline">{p.audit.map(a => <div key={a.id} className="ev"><div className="dot"><IcCheck size={12} /></div><div><div className="row small"><b>{a.action}</b><span className="muted">{fmtDate(a.created_at, true)}</span><span className="muted">{a.admin_email}</span></div><div className="mono small muted">{JSON.stringify(a.payload)}</div></div></div>)}</div>)}
        </Card>

        <Card title={t('actions')}>
          <div className="actions-grid">
            <button className="btn" onClick={() => setModal('adjust')}><IcCoins size={18} />{t('act_adjust')}</button>
            <button className="btn" onClick={() => setModal('give')}><IcChest size={18} />{t('act_give_item')}</button>
            <button className="btn" onClick={() => setModal('remove')}><IcMinus size={18} />{t('act_remove_item')}</button>
            <button className="btn" onClick={() => setModal('addcat')}><IcCamera size={18} />{t('act_add_cat')}</button>
            <button className="btn" onClick={() => setModal('notice')}><IcGift size={18} />{t('act_notice')}</button>
            {banned ? <button className="btn" onClick={unban}><IcCheck size={18} />{t('act_unban')}</button> : <button className="btn danger" onClick={() => setModal('ban')}><IcBan size={18} />{t('act_ban')}</button>}
            <button className="btn danger" onClick={del}><IcTrash size={18} />{t('act_delete')}</button>
          </div>
        </Card>
      </div>

      <AdjustModal open={modal === 'adjust'} onClose={() => setModal(null)} busy={busy} onSubmit={v => optimistic(cur => ({ ...cur, gems: (cur.gems ?? 0) + (v.gems ?? 0), cat_eyes: (cur.cat_eyes ?? 0) + (v.eyes ?? 0), xp: (cur.xp ?? 0) + (v.xp ?? 0), energy: cur.energy != null ? cur.energy + (v.energy ?? 0) : cur.energy }), () => api.playerAdjust({ id, ...v }))} />
      <ItemModal open={modal === 'give' || modal === 'remove'} mode={modal === 'give' ? 'give' : 'remove'} items={modal === 'give' ? items : (p.items.map(i => ({ code: i.code, name: i.name ?? i.code, kind: i.kind ?? '', rarity: i.rarity ?? 'common' })))} onClose={() => setModal(null)} busy={busy}
        onSubmit={(code, qty) => { const give = modal === 'give'; optimistic(cur => ({ ...cur, items: give
          ? (cur.items.some(i => i.code === code) ? cur.items.map(i => i.code === code ? { ...i, qty: i.qty + qty } : i) : [...cur.items, { code, qty }])
          : cur.items.map(i => i.code === code ? { ...i, qty: i.qty - qty } : i).filter(i => i.qty > 0) }),
          () => (give ? api.playerGiveItem(id, code, qty) : api.playerRemoveItem(id, code, qty))) }} />
      <AddCatModal open={modal === 'addcat'} onClose={() => { setModal(null); reload() }} playerId={id} />
      <NoticeModal open={modal === 'notice'} onClose={() => setModal(null)} busy={busy} items={items} onSubmit={v => run(() => api.playerNotice({ id, ...v }))} />
      <BanModal open={modal === 'ban'} onClose={() => setModal(null)} busy={busy} onSubmit={(until, reason) => run(() => api.playerBan(id, until, reason))} />
      <Modal open={!!removeIt} onClose={() => setRemoveIt(null)} title={t('act_remove_item')} footer={<>
        <button className="btn" onClick={() => setRemoveIt(null)}>{t('cancel')}</button>
        <button className="btn primary" onClick={() => {
          const r = removeIt; if (!r) return
          const qty = Math.max(1, Math.min(r.max, Math.round(removeQty) || 1))
          setRemoveIt(null)
          optimistic(cur => ({ ...cur, items: cur.items.map(i => i.code === r.code ? { ...i, qty: i.qty - qty } : i).filter(i => i.qty > 0) }), () => api.playerRemoveItem(id, r.code, qty))
        }}>{t('take_n')}</button>
      </>}>
        <div className="row" style={{ marginBottom: 10, flexWrap: 'nowrap' }}>{removeIt && <ItemToken code={removeIt.code} kind={removeIt.kind} rarity={removeIt.rarity} size={36} />}<p>{t('take_confirm')} <b>{removeIt?.name}</b> <span className="mono muted">({removeIt?.code})</span></p></div>
        <Field label={`${t('qty')} (max ${removeIt?.max ?? 1})`}><input className="input" type="number" min={1} max={removeIt?.max ?? 1} value={removeQty} onChange={e => setRemoveQty(Number(e.target.value))} style={{ width: 120 }} /></Field>
      </Modal>
      {node}
    </>
  )
}

export function ItemIcon({ code }: { code: string }) {
  const [err, setErr] = useState(false)
  if (err) return <IcChest size={22} />
  return <img src={itemIconUrl(code)} alt="" onError={() => setErr(true)} />
}

export function CatCard({ c, link }: { c: PlayerCard; link?: boolean }) {
  const url = catPhotoUrl(c.photo_path)
  const inner = (
    <>
      <div className="ph">{url ? <img src={url} alt={c.name} loading="lazy" /> : <IcCat size={40} />}{c.card_no != null && <span className="no">#{c.card_no}</span>}</div>
      <div className="body"><b>{c.name}</b><div className="row" style={{ gap: 4 }}><RarityChip r={c.rarity} />{c.evolution ? <span className="chip outline">{'★'.repeat(Math.min(5, c.evolution))}</span> : null}{c.power != null && <span className="chip outline num">{c.power}</span>}</div></div>
    </>
  )
  if (link && c.cat_id) return <Link to={`/admin/cats/${c.cat_id}`} className={`cat-card clickable r-${c.rarity}`} style={{ display: 'block' }}>{inner}</Link>
  return <div className={`cat-card r-${c.rarity}`}>{inner}</div>
}

/* ---------- modals ---------- */
function NumField({ label, value, onChange, img }: { label: string; value: string; onChange: (v: string) => void; img?: string }) {
  return <Field label={label}><div className="row" style={{ flexWrap: 'nowrap' }}>{img && <img src={img} alt="" style={{ width: 22, height: 22 }} />}<input className="input" type="number" value={value} onChange={e => onChange(e.target.value)} placeholder="±0" /></div></Field>
}
function AdjustModal({ open, onClose, onSubmit, busy }: { open: boolean; onClose: () => void; onSubmit: (v: { gems?: number; eyes?: number; xp?: number; energy?: number; plus_days?: number; reason: string }) => void; busy: boolean }) {
  const { t } = useStore()
  const [f, setF] = useState({ gems: '', eyes: '', xp: '', energy: '', plus_days: '', reason: '' })
  const n = (s: string) => (s.trim() === '' ? undefined : Number(s))
  const valid = f.reason.trim() && [f.gems, f.eyes, f.xp, f.energy, f.plus_days].some(x => x.trim() !== '' && Number(x) !== 0)
  return (
    <Modal open={open} onClose={onClose} title={t('act_adjust')} footer={<><button className="btn" onClick={onClose}>{t('cancel')}</button><button className="btn primary" disabled={!valid || busy} onClick={() => onSubmit({ gems: n(f.gems), eyes: n(f.eyes), xp: n(f.xp), energy: n(f.energy), plus_days: n(f.plus_days), reason: f.reason })}>{t('confirm')}</button></>}>
      <div className="grid c2" style={{ gap: 10 }}>
        <NumField label={t('gems')} value={f.gems} onChange={v => setF({ ...f, gems: v })} img="/admin/gem.svg" />
        <NumField label={t('eyes')} value={f.eyes} onChange={v => setF({ ...f, eyes: v })} img="/admin/cat_eye.svg" />
        <NumField label={t('xp')} value={f.xp} onChange={v => setF({ ...f, xp: v })} />
        <NumField label={t('energy')} value={f.energy} onChange={v => setF({ ...f, energy: v })} />
        <NumField label={t('plus_days')} value={f.plus_days} onChange={v => setF({ ...f, plus_days: v })} />
      </div>
      <div style={{ marginTop: 10 }}><Field label={t('reason')}><input className="input" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} required /></Field></div>
    </Modal>
  )
}

export function ItemPicker({ items, value, onChange }: { items: Item[] | null; value: string; onChange: (code: string) => void }) {
  const { t } = useStore()
  const [q, setQ] = useState('')
  const list = useMemo(() => { const s = q.toLowerCase(); return (items ?? []).filter(i => !s || i.code.includes(s) || i.name.toLowerCase().includes(s)).slice(0, 40) }, [items, q])
  return (
    <div>
      <input className="input" placeholder={t('item_search')} value={q} onChange={e => setQ(e.target.value)} />
      <div style={{ maxHeight: 240, overflow: 'auto', marginTop: 8, display: 'grid', gap: 4 }}>
        {!items ? <Skeleton h={80} /> : list.map(i => (
          <button key={i.code} type="button" className="item" style={{ cursor: 'pointer', textAlign: 'left', borderColor: value === i.code ? 'var(--accent)' : undefined, background: value === i.code ? 'var(--accent-soft)' : undefined }} onClick={() => onChange(i.code)}>
            <div className="ic"><ItemIcon code={i.code} /></div><div style={{ minWidth: 0 }}><div className="nm">{i.name}</div><div className="qt mono">{i.code} · <span className={`chip r-${i.rarity}`} style={{ padding: '0 6px' }}>{i.rarity}</span> {i.kind}</div></div>
          </button>))}
        {items && !list.length && <div className="muted small">{t('nothing_found')}</div>}
      </div>
    </div>
  )
}
function ItemModal({ open, onClose, onSubmit, busy, items, mode }: { open: boolean; onClose: () => void; onSubmit: (code: string, qty: number) => void; busy: boolean; items: Item[] | null; mode: 'give' | 'remove' }) {
  const { t } = useStore()
  const [code, setCode] = useState(''); const [qty, setQty] = useState(1)
  return (
    <Modal open={open} onClose={onClose} title={mode === 'give' ? t('act_give_item') : t('act_remove_item')} footer={<><button className="btn" onClick={onClose}>{t('cancel')}</button><button className="btn primary" disabled={!code || qty < 1 || busy} onClick={() => onSubmit(code, qty)}>{t('confirm')}</button></>}>
      <div className="grid" style={{ gap: 10 }}>
        <Field label={t('item')}><ItemPicker items={items} value={code} onChange={setCode} /></Field>
        <Field label={t('qty')}><input className="input" type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} style={{ width: 120 }} /></Field>
      </div>
    </Modal>
  )
}
function AddCatModal({ open, onClose, playerId }: { open: boolean; onClose: () => void; playerId: string }) {
  const { t, toast } = useStore()
  const [file, setFile] = useState<File | null>(null)
  const [prev, setPrev] = useState('')
  const [lat, setLat] = useState(''); const [lng, setLng] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<PlayerCard | null>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => { if (!open) { setFile(null); setPrev(''); setRes(null); setMsg('') } }, [open])
  const pickFile = (f: File | null) => { setFile(f); setPrev(f ? URL.createObjectURL(f) : '') }
  const go = async () => {
    if (!file) return
    setBusy(true); setMsg('')
    try {
      const b64 = await fileToBase64(file)
      const r = await api.playerAddCat(playerId, b64, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined)
      const card = r.card ?? r.cat
      if (card) { setRes(card); toast(t('done')) } else setMsg(r.message ?? r.status ?? JSON.stringify(r))
    } catch (e) { setMsg((e as Error).message); toast((e as Error).message, 'err') } finally { setBusy(false) }
  }
  return (
    <Modal open={open} onClose={onClose} title={t('act_add_cat')} footer={<><button className="btn" onClick={onClose}>{t('close')}</button>{!res && <button className="btn primary" disabled={!file || busy} onClick={go}>{busy ? t('scanning') : t('confirm')}</button>}</>}>
      {res ? (
        <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}><div style={{ width: 160 }}><CatCard c={res} /></div><div><h3>{t('result')}</h3><p>{res.name}</p><RarityChip r={res.rarity} /></div></div>
      ) : (
        <div className="grid" style={{ gap: 10 }}>
          <label className="drop" style={{ display: 'block' }}>
            <input type="file" accept="image/*" hidden onChange={e => pickFile(e.target.files?.[0] ?? null)} />
            {prev ? <img src={prev} alt="" style={{ maxHeight: 240, margin: '0 auto', borderRadius: 12 }} /> : <><IcCamera size={32} /><div>{t('upload_photo')}</div></>}
          </label>
          <div className="grid c2" style={{ gap: 10 }}>
            <Field label={t('lat')}><input className="input" value={lat} onChange={e => setLat(e.target.value)} placeholder="52.23" /></Field>
            <Field label={t('lng')}><input className="input" value={lng} onChange={e => setLng(e.target.value)} placeholder="21.01" /></Field>
          </div>
          {busy && <div className="alert info"><IcBolt size={16} />{t('scanning')}</div>}
          {msg && <div className="alert err"><IcWarn size={16} />{msg}</div>}
        </div>
      )}
    </Modal>
  )
}
function NoticeModal({ open, onClose, onSubmit, busy, items }: { open: boolean; onClose: () => void; busy: boolean; items: Item[] | null; onSubmit: (v: { kind: 'info' | 'gift' | 'warning'; title_i18n: { ru: string }; body_i18n: { ru: string }; gems?: number; eyes?: number; items?: { code: string; qty: number }[]; push: boolean }) => void }) {
  const { t } = useStore()
  const [kind, setKind] = useState<'info' | 'gift' | 'warning'>('info')
  const [title, setTitle] = useState(''); const [body, setBody] = useState('')
  const [gems, setGems] = useState(''); const [eyes, setEyes] = useState('')
  const [gift, setGift] = useState<{ code: string; qty: number }[]>([])
  const [pickCode, setPickCode] = useState('')
  const [push, setPush] = useState(true)
  return (
    <Modal open={open} onClose={onClose} title={t('act_notice')} footer={<><button className="btn" onClick={onClose}>{t('cancel')}</button><button className="btn primary" disabled={!title.trim() || busy} onClick={() => onSubmit({ kind, title_i18n: { ru: title }, body_i18n: { ru: body }, gems: kind === 'gift' && gems ? Number(gems) : undefined, eyes: kind === 'gift' && eyes ? Number(eyes) : undefined, items: kind === 'gift' && gift.length ? gift : undefined, push })}>{t('confirm')}</button></>}>
      <div className="grid" style={{ gap: 10 }}>
        <Field label={t('notice_kind')}><div className="seg">{(['info', 'gift', 'warning'] as const).map(k => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k === 'info' ? <IcInfo size={14} /> : k === 'gift' ? <IcGift size={14} /> : <IcWarn size={14} />} {t(`n_${k}` as 'n_info')}</button>)}</div></Field>
        <Field label={t('title_ru')} hint={t('translated_by_backend')}><input className="input" value={title} onChange={e => setTitle(e.target.value)} /></Field>
        <Field label={t('body_ru')}><textarea className="textarea" value={body} onChange={e => setBody(e.target.value)} /></Field>
        {kind === 'gift' && (
          <div className="card soft" style={{ padding: 12 }}>
            <h3 style={{ marginBottom: 8 }}>{t('gift')}</h3>
            <div className="grid c2" style={{ gap: 10 }}><NumField label={t('gems')} value={gems} onChange={setGems} img="/admin/gem.svg" /><NumField label={t('eyes')} value={eyes} onChange={setEyes} img="/admin/cat_eye.svg" /></div>
            <div style={{ marginTop: 10 }}><ItemPicker items={items} value={pickCode} onChange={c => { setPickCode(c); if (!gift.find(g => g.code === c)) setGift([...gift, { code: c, qty: 1 }]) }} /></div>
            {gift.length > 0 && <div className="row" style={{ marginTop: 8 }}>{gift.map(g => <span key={g.code} className="chip">{g.code} ×<input type="number" min={1} value={g.qty} style={{ width: 44, border: 0, background: 'transparent' }} onChange={e => setGift(gift.map(x => x.code === g.code ? { ...x, qty: Number(e.target.value) } : x))} /><button className="btn icon sm ghost" style={{ width: 20, height: 20 }} onClick={() => setGift(gift.filter(x => x.code !== g.code))}><IcMinus size={12} /></button></span>)}</div>}
          </div>
        )}
        <label className="check"><input type="checkbox" checked={push} onChange={e => setPush(e.target.checked)} />{t('push')}</label>
      </div>
    </Modal>
  )
}
function BanModal({ open, onClose, onSubmit, busy }: { open: boolean; onClose: () => void; busy: boolean; onSubmit: (until: string | null, reason: string) => void }) {
  const { t } = useStore()
  const [forever, setForever] = useState(false)
  const [until, setUntil] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10) })
  const [reason, setReason] = useState('')
  return (
    <Modal open={open} onClose={onClose} title={t('act_ban')} footer={<><button className="btn" onClick={onClose}>{t('cancel')}</button><button className="btn primary" disabled={!reason.trim() || busy} onClick={() => onSubmit(forever ? null : new Date(until + 'T23:59:59').toISOString(), reason)}>{t('confirm')}</button></>}>
      <div className="grid" style={{ gap: 10 }}>
        <label className="check"><input type="checkbox" checked={forever} onChange={e => setForever(e.target.checked)} />{t('ban_forever')}</label>
        {!forever && <Field label={t('ban_until')}><input className="input" type="date" value={until} onChange={e => setUntil(e.target.value)} /></Field>}
        <Field label={t('reason')}><textarea className="textarea" value={reason} onChange={e => setReason(e.target.value)} style={{ minHeight: 80 }} /></Field>
        <div className="alert info small"><IcInfo size={14} />{t('ban_hint')}</div>
      </div>
    </Modal>
  )
}
export { IcPlus }
