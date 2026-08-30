import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { IcCheck, IcChevron, IcClose, IcEmpty, IcInfo, IcWarn } from './icons'
import { useStore } from './store'
import type { Rarity } from './api'

export function Card({ title, icon, right, children, className = '', soft }: { title?: ReactNode; icon?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; soft?: boolean }) {
  return (
    <section className={`card ${soft ? 'soft' : ''} ${className}`}>
      {(title || right) && <div className="card-h">{icon}{title && <h2>{title}</h2>}{right && <div className="right row">{right}</div>}</div>}
      {children}
    </section>
  )
}

export function Skeleton({ h = 16, w = '100%', style }: { h?: number; w?: number | string; style?: React.CSSProperties }) {
  return <div className="sk" style={{ height: h, width: w, ...style }} />
}
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return <div className="card"><Skeleton h={14} w="40%" /><div style={{ height: 10 }} />{Array.from({ length: lines }).map((_, i) => <Skeleton key={i} h={12} w={`${90 - i * 15}%`} style={{ marginTop: 8 }} />)}</div>
}
export function Empty({ text, children }: { text?: string; children?: ReactNode }) {
  const { t } = useStore()
  return <div className="empty"><IcEmpty /><p>{text ?? t('empty')}</p>{children}</div>
}
export function ErrorBox({ text }: { text: string }) { return <div className="alert err"><IcWarn size={18} /><span>{text}</span></div> }

export function RarityChip({ r }: { r?: Rarity | string }) { return <span className={`chip r-${r ?? 'common'}`}>{r ?? '—'}</span> }

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const first = ref.current?.querySelector<HTMLElement>('input,select,textarea,button')
    first?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
          <motion.div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" ref={ref} initial={{ y: 16, scale: .98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: .18 }}>
            <div className="modal-h"><h2>{title}</h2><button className="btn icon ghost right" onClick={onClose} aria-label="close"><IcClose size={18} /></button></div>
            <div className="modal-b">{children}</div>
            {footer && <div className="modal-f">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Toasts() {
  const { toasts, dismiss } = useStore()
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} className={`toast ${t.kind}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} onClick={() => dismiss(t.id)}>
            {t.kind === 'ok' ? <IcCheck size={16} /> : t.kind === 'err' ? <IcWarn size={16} /> : <IcInfo size={16} />}<span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function Seg<T extends string>({ value, onChange, options }: { value: NoInfer<T>; onChange: (v: T) => void; options: { v: T; l: string }[] }) {
  return <div className="seg" role="tablist">{options.map(o => <button key={o.v} role="tab" aria-selected={o.v === value} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.l}</button>)}</div>
}
export function Tabs<T extends string>({ value, onChange, options }: { value: NoInfer<T>; onChange: (v: T) => void; options: { v: T; l: string; n?: number }[] }) {
  return <div className="tabs" role="tablist">{options.map(o => <button key={o.v} role="tab" aria-selected={o.v === value} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.l}{o.n != null && <span className="muted"> · {o.n}</span>}</button>)}</div>
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="field"><label>{label}</label>{children}{hint && <span className="small muted">{hint}</span>}</div>
}
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <label className="check"><button type="button" role="switch" aria-checked={on} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />{label && <span>{label}</span>}</label>
}
export function Pager({ page, pages, onPage, total }: { page: number; pages: number; onPage: (p: number) => void; total?: number }) {
  return (
    <div className="pager">
      {total != null && <span>{total}</span>}
      <button className="btn icon sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="prev"><IcChevron size={16} style={{ transform: 'rotate(90deg)' }} /></button>
      <span className="num">{page} / {Math.max(1, pages)}</span>
      <button className="btn icon sm" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="next"><IcChevron size={16} style={{ transform: 'rotate(-90deg)' }} /></button>
    </div>
  )
}

/** Confirm dialog with optional reason input */
export function useConfirm() {
  const [st, setSt] = useState<{ title: string; text?: string; reason?: boolean; danger?: boolean; resolve: (v: string | null) => void } | null>(null)
  const [reason, setReason] = useState('')
  const { t } = useStore()
  const confirm = (title: string, opts: { text?: string; reason?: boolean; danger?: boolean } = {}) => new Promise<string | null>(resolve => { setReason(''); setSt({ title, ...opts, resolve }) })
  const node = (
    <Modal open={!!st} onClose={() => { st?.resolve(null); setSt(null) }} title={st?.title ?? ''} footer={<>
      <button className="btn" onClick={() => { st?.resolve(null); setSt(null) }}>{t('cancel')}</button>
      <button className={`btn ${st?.danger ? 'primary' : 'ink'}`} disabled={!!st?.reason && !reason.trim()} onClick={() => { st?.resolve(st.reason ? reason : 'ok'); setSt(null) }}>{t('confirm')}</button>
    </>}>
      {st?.text && <p style={{ marginBottom: 12 }}>{st.text}</p>}
      {st?.reason && <Field label={t('reason')}><input className="input" value={reason} onChange={e => setReason(e.target.value)} /></Field>}
    </Modal>
  )
  return { confirm, node }
}

export const initials = (s?: string | null) => (s ?? '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?'
