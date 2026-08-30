import { useEffect, useState } from 'react'
import { api, type Setting } from '../api'
import { fmtDate, useAsync, useStore } from '../store'
import { Card, ErrorBox, Field, Skeleton, Switch } from '../ui'
import { IcBolt, IcChest, IcCoins, IcGem, IcMap, IcScan, IcServer, IcTrophy, IcWarn, IcWorld } from '../icons'

type Obj = Record<string, unknown>
const KNOWN = ['maintenance', 'scan_limits', 'energy', 'chest_prices', 'tournament', 'market_fee_pct', 'xp_event_mult', 'min_build', 'donation', 'store_links', 'map_tile_limit']

export default function Settings() {
  const { t, toast } = useStore()
  const { data, loading, error, reload } = useAsync(() => api.settingsGet(), [], 'settings')
  const [vals, setVals] = useState<Record<string, unknown>>({})
  const [meta, setMeta] = useState<Record<string, Setting>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [jsonText, setJsonText] = useState<Record<string, string>>({})
  const [jsonErr, setJsonErr] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!data) return
    const v: Record<string, unknown> = {}; const m: Record<string, Setting> = {}; const j: Record<string, string> = {}
    data.settings.forEach(s => { v[s.key] = s.value; m[s.key] = s; if (!KNOWN.includes(s.key)) j[s.key] = JSON.stringify(s.value, null, 2) })
    setVals(v); setMeta(m); setJsonText(j)
  }, [data])
  const g = <T,>(k: string, d: T): T => (vals[k] === undefined ? d : vals[k] as T)
  const obj = (k: string) => g<Obj>(k, {})
  const set = (k: string, v: unknown) => setVals(x => ({ ...x, [k]: v }))
  const setSub = (k: string, sub: string, v: unknown) => set(k, { ...obj(k), [sub]: v })
  /* optimistic: form state is the truth; request in background, on error toast + reload to revert */
  const save = (k: string, v = vals[k]) => { setBusy(k); return api.settingsSet(k, v).then(() => toast(`${t('saved')}: ${k}`)).catch(e => { toast((e as Error).message, 'err'); reload() }).finally(() => setBusy(null)) }
  const SaveBtn = ({ k }: { k: string }) => <div className="row"><button className="btn ink sm" disabled={busy === k} onClick={() => save(k)}>{t('save')}</button>{meta[k]?.updated_at && <span className="small muted">{t('updated')}: {fmtDate(meta[k].updated_at, true)}</span>}</div>
  const Num = ({ k, sub, label, step }: { k: string; sub?: string; label: string; step?: number }) => (
    <Field label={label}><input className="input" type="number" step={step ?? 1} value={sub ? String((obj(k)[sub] as number) ?? '') : String(g<number>(k, 0))} onChange={e => sub ? setSub(k, sub, Number(e.target.value)) : set(k, Number(e.target.value))} /></Field>
  )
  if (loading && !data) return <Skeleton h={500} />
  const maint = obj('maintenance'); const don = obj('donation'); const links = obj('store_links')
  const unknown = Object.keys(vals).filter(k => !KNOWN.includes(k))
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><h1>{t('world')}</h1></div>
      {error && <ErrorBox text={error} />}
      <div className="grid c2">
        <Card icon={<IcWarn size={18} />} title={t('maintenance')} right={<Switch on={!!maint.on} onChange={v => { const nv = { ...obj('maintenance'), on: v }; set('maintenance', nv); save('maintenance', nv) }} />}>
          <div className="setting-block">
            {!!maint.on && <div className="alert warn small"><IcWarn size={14} />{t('maintenance_on')}</div>}
            <Field label={t('maintenance_msg')}><textarea className="textarea" style={{ minHeight: 70 }} value={((maint.message_i18n as Obj)?.ru as string) ?? ''} onChange={e => setSub('maintenance', 'message_i18n', { ...(maint.message_i18n as Obj ?? {}), ru: e.target.value })} /></Field>
            <SaveBtn k="maintenance" />
          </div>
        </Card>
        <Card icon={<IcScan size={18} />} title={t('scan_limits')}>
          <div className="setting-block"><div className="grid c2" style={{ gap: 10 }}><Num k="scan_limits" sub="hour" label={t('per_hour')} /><Num k="scan_limits" sub="day" label={t('per_day')} /><Num k="scan_limits" sub="plus_hour" label={t('plus_per_hour')} /><Num k="scan_limits" sub="plus_day" label={t('plus_per_day')} /></div><SaveBtn k="scan_limits" /></div>
        </Card>
        <Card icon={<IcBolt size={18} />} title={t('energy')}>
          <div className="setting-block"><div className="grid c3" style={{ gap: 10 }}><Num k="energy" sub="cap" label={t('energy_cap')} /><Num k="energy" sub="plus_cap" label={t('plus_cap')} /><Num k="energy" sub="regen_min" label={t('regen_min')} /></div><SaveBtn k="energy" /></div>
        </Card>
        <Card icon={<IcChest size={18} />} title={t('chest_prices')}>
          <div className="setting-block"><div className="grid c2" style={{ gap: 10 }}><Num k="chest_prices" sub="street" label={t('street')} /><Num k="chest_prices" sub="gold" label={t('gold')} /></div><SaveBtn k="chest_prices" /></div>
        </Card>
        <Card icon={<IcTrophy size={18} />} title={t('tournament_entry')}>
          <div className="setting-block"><Num k="tournament" sub="entry_gems" label={t('gems')} /><SaveBtn k="tournament" /></div>
        </Card>
        <Card icon={<IcGem size={18} />} title={t('economy')}>
          <div className="setting-block">
            <div className="grid c3" style={{ gap: 10 }}>
              <Num k="market_fee_pct" label={t('market_fee')} />
              <Num k="xp_event_mult" label={t('xp_mult')} step={0.1} />
              <Num k="min_build" label={t('min_build')} />
            </div>
            <div className="row"><button className="btn ink sm" disabled={!!busy} onClick={async () => { await save('market_fee_pct'); await save('xp_event_mult'); await save('min_build') }}>{t('save')}</button></div>
          </div>
        </Card>
        <Card icon={<IcCoins size={18} />} title={t('donation')} right={<Switch on={!!don.enabled} onChange={v => setSub('donation', 'enabled', v)} />}>
          <div className="setting-block">
            <Field label={t('donation_url')}><input className="input" value={(don.url as string) ?? ''} onChange={e => setSub('donation', 'url', e.target.value)} placeholder="https://" /></Field>
            <Field label={`${t('title')} (ru)`}><input className="input" value={((don.title_i18n as Obj)?.ru as string) ?? ''} onChange={e => setSub('donation', 'title_i18n', { ...(don.title_i18n as Obj ?? {}), ru: e.target.value })} /></Field>
            <Field label={`${t('body')} (ru)`}><textarea className="textarea" style={{ minHeight: 70 }} value={((don.text_i18n as Obj)?.ru as string) ?? ''} onChange={e => setSub('donation', 'text_i18n', { ...(don.text_i18n as Obj ?? {}), ru: e.target.value })} /></Field>
            <SaveBtn k="donation" />
          </div>
        </Card>
        <Card icon={<IcServer size={18} />} title={t('store_links')}>
          <div className="setting-block">
            <Field label="App Store"><input className="input" value={(links.appstore as string) ?? ''} onChange={e => setSub('store_links', 'appstore', e.target.value)} placeholder="https://apps.apple.com/…" /></Field>
            <Field label="Google Play"><input className="input" value={(links.googleplay as string) ?? ''} onChange={e => setSub('store_links', 'googleplay', e.target.value)} placeholder="https://play.google.com/…" /></Field>
            <SaveBtn k="store_links" />
          </div>
        </Card>
        <Card icon={<IcMap size={18} />} title={t('tile_limit')}>
          <div className="setting-block"><Num k="map_tile_limit" label={t('tiles')} /><SaveBtn k="map_tile_limit" /></div>
        </Card>
        <Card icon={<IcWorld size={18} />} title={t('other_keys')} className="" >
          <div className="setting-block">
            {unknown.length === 0 && <p className="muted small">—</p>}
            {unknown.map(k => (
              <div key={k}>
                <Field label={k}><textarea className={`textarea json-area ${jsonErr[k] ? 'err' : ''}`} value={jsonText[k] ?? ''} onChange={e => { setJsonText(j => ({ ...j, [k]: e.target.value })); try { JSON.parse(e.target.value); setJsonErr(x => ({ ...x, [k]: '' })) } catch { setJsonErr(x => ({ ...x, [k]: t('invalid_json') })) } }} /></Field>
                {jsonErr[k] && <div className="small" style={{ color: 'var(--accent)' }}>{jsonErr[k]}</div>}
                <div className="row" style={{ marginTop: 6 }}><button className="btn ink sm" disabled={!!jsonErr[k] || busy === k} onClick={() => save(k, JSON.parse(jsonText[k]))}>{t('save')}</button></div>
              </div>
            ))}
            <NewKey onAdd={(k, v) => save(k, v)} />
          </div>
        </Card>
      </div>
    </>
  )
}

function NewKey({ onAdd }: { onAdd: (k: string, v: unknown) => void }) {
  const { t } = useStore()
  const [k, setK] = useState(''); const [v, setV] = useState('')
  let ok = false; let parsed: unknown
  try { parsed = JSON.parse(v); ok = !!k.trim() } catch { ok = false }
  return (
    <div className="card soft" style={{ padding: 12 }}>
      <div className="grid c2" style={{ gap: 8 }}><input className="input mono" placeholder="key" value={k} onChange={e => setK(e.target.value)} /><input className="input mono" placeholder='{"a":1}' value={v} onChange={e => setV(e.target.value)} /></div>
      <div className="row" style={{ marginTop: 8 }}><button className="btn sm" disabled={!ok} onClick={() => { onAdd(k.trim(), parsed); setK(''); setV('') }}>{t('create')}</button></div>
    </div>
  )
}
