import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ARCHETYPES, COAT_CLASSES, RARITIES, api, catThumbUrl } from '../api'
import { fmtN, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Pager, RarityChip, Skeleton } from '../ui'
import { IcBolt, IcCat, IcSearch, IcUsers } from '../icons'

const LIMIT = 24

export default function Cats() {
  const { t, lang } = useStore()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') ?? ''
  const rarity = sp.get('r') ?? ''
  const archetype = sp.get('a') ?? ''
  const coat = sp.get('c') ?? ''
  const sort = sp.get('s') || 'card_no'
  const page = Number(sp.get('p') || 1)
  const [qi, setQi] = useState(q)
  useEffect(() => { setQi(q) }, [q])
  useEffect(() => { const h = setTimeout(() => { if (qi !== q) { sp.set('q', qi); sp.set('p', '1'); setSp(sp, { replace: true }) } }, 350); return () => clearTimeout(h) }, [qi]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: string, v: string) => { v ? sp.set(k, v) : sp.delete(k); if (k !== 'p') sp.set('p', '1'); setSp(sp) }
  const { data, loading, error } = useAsync(
    () => api.catsList({ q, rarity: rarity || undefined, archetype: archetype || undefined, coat_class: coat || undefined, sort, limit: LIMIT, offset: (page - 1) * LIMIT }),
    [q, rarity, archetype, coat, sort, page], `cats.${q}.${rarity}.${archetype}.${coat}.${sort}.${page}`)
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / LIMIT))
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <h1>{t('cats')}</h1>
        <div className="adm-search" style={{ minWidth: 240 }}><IcSearch size={18} /><input value={qi} onChange={e => setQi(e.target.value)} placeholder={t('search_cats')} aria-label={t('search')} /></div>
        <span className="chip outline num">{fmtN(data?.total, lang)}</span>
      </div>
      <div className="cats-toolbar">
        <select className="select" value={rarity} onChange={e => set('r', e.target.value)} aria-label={t('rarity')}>
          <option value="">{t('rarity')}: {t('all')}</option>{RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select" value={archetype} onChange={e => set('a', e.target.value)} aria-label={t('archetype')}>
          <option value="">{t('archetype')}: {t('all')}</option>{ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className="select" value={coat} onChange={e => set('c', e.target.value)} aria-label={t('coat')}>
          <option value="">{t('coat')}: {t('all')}</option>{COAT_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" value={sort} onChange={e => set('s', e.target.value)} aria-label={t('sort_by')}>
          <option value="card_no">{t('sort_card_no')}</option>
          <option value="owners">{t('sort_owners')}</option>
          <option value="power">{t('sort_power')}</option>
          <option value="created">{t('sort_created')}</option>
        </select>
      </div>
      {error && <ErrorBox text={error} />}
      <Card>
        {loading && !data ? <Skeleton h={400} /> : !data?.cats.length ? <Empty text={t('nothing_found')} /> : (
          <div className="cat-grid" style={{ opacity: loading ? .6 : 1 }}>
            {data.cats.map(c => (
              <div key={c.id} className={`cat-card clickable r-${c.rarity}`} tabIndex={0} role="link"
                onClick={() => nav(`/admin/cats/${c.id}`)} onKeyDown={e => { if (e.key === 'Enter') nav(`/admin/cats/${c.id}`) }}>
                <div className="ph">{c.photo_path ? <img src={catThumbUrl(c.photo_path, 320)} alt={c.name} loading="lazy" /> : <IcCat size={40} />}<span className="no">#{c.card_no}</span></div>
                <div className="body">
                  <b>{c.name_i18n?.ru ?? c.name}</b>
                  <div className="row" style={{ gap: 4 }}><RarityChip r={c.rarity} /><span className="chip outline">{c.archetype}</span></div>
                  <div className="meta">
                    {c.coat_class && <span className="chip outline">{c.coat_class}</span>}
                    <span className="row" style={{ gap: 3 }}><IcBolt size={12} />{c.power}</span>
                    <span className="row" style={{ gap: 3 }}><IcUsers size={12} />{c.owners_count}</span>
                  </div>
                  {c.first_found_username && <div className="small muted" style={{ marginTop: 4 }}>{t('found_by')}: {c.first_found_username}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
        {data && <Pager page={page} pages={pages} onPage={p => set('p', String(p))} total={data.total} />}
      </Card>
    </>
  )
}
