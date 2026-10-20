import { useEffect, useState } from 'react'
import { api, type AiConfig } from '../api'
import { fmtDate, useAsync, useStore } from '../store'
import { Card, Field, Skeleton, useConfirm } from '../ui'
import { Bars } from '../charts'
import { IcServer, IcWarn } from '../icons'

const usd = (v: number) => `$${(v ?? 0) < 1 ? (v ?? 0).toFixed(4) : (v ?? 0).toFixed(2)}`

/** Переключатель ИИ (Claude API ↔ Mac Studio) + потолки трат + расходы. Ключ world_settings.ai. */
export default function AiProviderCard() {
  const { t, toast } = useStore()
  const { confirm, node } = useConfirm()
  const { data, loading, reload } = useAsync(() => api.aiUsage(30), [], 'ai_usage')
  const [cfg, setCfg] = useState<AiConfig | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (data) setCfg(data.config) }, [data])
  if (loading && !data) return <Card className="span2" icon={<IcServer size={18} />} title={t('ai_title')}><Skeleton h={180} /></Card>
  if (!data || !cfg) return null
  const claudeOn = cfg.provider === 'claude'
  const capHit = claudeOn && (data.spend.day >= cfg.day_cap_usd || data.spend.month >= cfg.month_cap_usd)
  const save = async (next: AiConfig) => {
    if (next.day_cap_usd > next.month_cap_usd) { toast(t('ai_bad_caps'), 'err'); return }
    setBusy(true)
    try { await api.settingsSet('ai', next); setCfg(next); toast(`${t('saved')}: ${t('ai_title')}`); reload() }
    catch (e) { toast((e as Error).message, 'err'); reload() }
    finally { setBusy(false) }
  }
  const switchTo = async (p: AiConfig['provider']) => {
    if (p === cfg.provider) return
    const ok = await confirm(p === 'claude' ? t('ai_switch_to_claude') : t('ai_switch_to_mac'),
      { text: p === 'claude' ? t('ai_switch_text_claude') : t('ai_switch_text_mac'), danger: p === 'claude' })
    if (ok) await save({ ...cfg, provider: p })
  }
  const days = data.by_day.slice(-30).map(d => ({ day: d.day, usd: Math.round(d.usd * 10000) / 10000 }))
  return (
    <Card className="span2" icon={<IcServer size={18} />} title={t('ai_title')}>
      {node}
      <div className="setting-block">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className={`btn ${claudeOn ? 'ink' : ''}`} disabled={busy} onClick={() => switchTo('claude')}>{t('ai_claude')}</button>
          <button className={`btn ${!claudeOn ? 'ink' : ''}`} disabled={busy} onClick={() => switchTo('barabash')}>{t('ai_mac')}</button>
          <span className="small muted">{t('ai_now')}: <b>{claudeOn && !capHit && data.key_set ? t('ai_claude') : t('ai_mac')}</b>{data.updated_at && <> · {t('updated')}: {fmtDate(data.updated_at, true)}</>}</span>
        </div>
        {!data.key_set && <div className="alert warn small"><IcWarn size={14} />{t('ai_no_key')}</div>}
        {capHit && <div className="alert warn small"><IcWarn size={14} />{t('ai_cap_hit')}</div>}
        <div className="grid kpi">
          <div className="card soft kpi-card"><span className="lbl">{t('ai_spent_day')}</span><span className="val">{usd(data.spend.day)}</span><span className="sub">/ {usd(cfg.day_cap_usd)}</span></div>
          <div className="card soft kpi-card"><span className="lbl">{t('ai_spent_month')}</span><span className="val">{usd(data.spend.month)}</span><span className="sub">/ {usd(cfg.month_cap_usd)}</span></div>
          <div className="card soft kpi-card"><span className="lbl">{t('ai_calls_day')}</span><span className="val">{data.spend.calls_day ?? 0}</span><span className="sub">{t('ai_cache')}: {Math.round((data.cache_share ?? 0) * 100)}%</span></div>
        </div>
        <div className="grid c2" style={{ gap: 10 }}>
          <Field label={t('ai_day_cap')}><input className="input" type="number" min={0} step={0.5} value={cfg.day_cap_usd} onChange={e => setCfg({ ...cfg, day_cap_usd: Number(e.target.value) })} /></Field>
          <Field label={t('ai_month_cap')}><input className="input" type="number" min={0} step={1} value={cfg.month_cap_usd} onChange={e => setCfg({ ...cfg, month_cap_usd: Number(e.target.value) })} /></Field>
        </div>
        <div className="row"><button className="btn ink sm" disabled={busy} onClick={() => save(cfg)}>{t('save')}</button><span className="small muted">{t('ai_auto_note')}</span></div>
        {days.length > 0 && <Bars data={days} keys={[{ k: 'usd', l: '$' }]} height={160} />}
        {data.by_role.length > 0 && (
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>{t('ai_by_role')}</div>
            <div className="tbl-wrap"><table className="tbl small"><tbody>
              {data.by_role.map(r => <tr key={r.key}><td className="mono">{r.key}</td><td>{r.calls}</td><td>{usd(r.usd)}</td><td>{(r.avg_ms / 1000).toFixed(1)} s</td></tr>)}
            </tbody></table></div>
          </div>
        )}
        {data.errors.length > 0 && (
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>{t('ai_errors')}</div>
            {data.errors.slice(0, 5).map((e, i) => <div key={i} className="small mono">{fmtDate(e.at, true)} · {e.fn}:{e.role} · {e.err}</div>)}
          </div>
        )}
      </div>
    </Card>
  )
}
