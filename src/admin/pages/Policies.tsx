import { useEffect, useState } from 'react'
import { api, type Policy } from '../api'
import { fmtDate, useAsync, useStore } from '../store'
import { Card, Empty, ErrorBox, Field, Skeleton } from '../ui'
import { IcRefresh, IcShield, IcWarn } from '../icons'
import { MdEditor } from './BlogEditor'
import { TranslatedBadge } from './Blog'

export default function Policies() {
  const { t, toast } = useStore()
  const { data, loading, error, reload } = useAsync(() => api.policiesList(), [], 'policies')
  const [code, setCode] = useState<string | null>(null)
  const cur: Policy | undefined = data?.policies.find(p => p.code === code) ?? data?.policies[0]
  const [f, setF] = useState({ title: '', body: '', required: true, bump: false })
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (cur) { setCode(cur.code); setF({ title: cur.title_i18n.ru ?? '', body: cur.body_i18n.ru ?? '', required: cur.required, bump: false }) } }, [cur?.code, cur?.version]) // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    if (!cur) return
    setBusy(true)
    try { await api.policySave({ code: cur.code, title_ru: f.title, body_ru: f.body, required: f.required, bump_version: f.bump }); toast(t('saved')); reload() } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) }
  }
  const translateMissing = async () => {
    setBusy(true)
    try { const r = await api.policiesTranslateMissing(); toast(`${t('done')}: ${(r.translated ?? []).length || 0}`); reload() } catch (e) { toast((e as Error).message, 'err') } finally { setBusy(false) }
  }
  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}><h1>{t('policies')}</h1><button className="btn sm right" disabled={busy} onClick={translateMissing}><IcRefresh size={16} />{t('translate_missing')}</button></div>
      {error && <ErrorBox text={error} />}
      <div className="alert info small" style={{ marginBottom: 14 }}>{t('policy_hint')}</div>
      <div className="grid c12">
        <Card icon={<IcShield size={18} />} title={`${data?.policies.length ?? ''}`}>
          {loading ? <Skeleton h={200} /> : !data?.policies.length ? <Empty /> : (
            <div style={{ display: 'grid', gap: 4 }}>
              {data.policies.map(p => (
                <button key={p.code} className={`msg ${cur?.code === p.code ? 'on' : ''}`} style={{ textAlign: 'left', border: '1px solid transparent', background: cur?.code === p.code ? 'var(--mist)' : 'transparent' }} onClick={() => setCode(p.code)}>
                  <div className="nm">{p.title_i18n.ru}</div>
                  <div className="top"><span className="chip">v{p.version}</span>{p.required && <span className="chip accent">{t('required')}</span>}<span>{fmtDate(p.updated_at)}</span></div>
                  <div className="mono small muted">{p.code}</div>
                </button>
              ))}
            </div>
          )}
        </Card>
        <Card title={cur ? `${cur.title_i18n.ru} · v${cur.version}` : ''} right={cur && <><TranslatedBadge p={cur} /><button className="btn primary sm" disabled={busy} onClick={save}>{t('save_translate')}</button></>}>
          {!cur ? <Empty /> : (
            <div className="grid" style={{ gap: 12 }}>
              <Field label={`${t('title')} (ru)`}><input className="input" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
              <MdEditor value={f.body} onChange={v => setF({ ...f, body: v })} />
              <div className="row" style={{ gap: 20 }}>
                <label className="check"><input type="checkbox" checked={f.required} onChange={e => setF({ ...f, required: e.target.checked })} />{t('required_doc')}</label>
                <label className="check"><input type="checkbox" checked={f.bump} onChange={e => setF({ ...f, bump: e.target.checked })} />{t('bump_version')}</label>
              </div>
              {f.bump && <div className="alert warn small"><IcWarn size={14} />v{cur.version} → v{cur.version + 1}</div>}
            </div>
          )}
        </Card>
      </div>
    </>
  )
}
