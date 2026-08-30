import { useMemo, useState } from 'react'
import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: false })

/** Minimal sanitiser: strip script/iframe/on* attributes. Content comes from our own admin, so this is belt-and-braces. */
function sanitize(html: string) {
  return html
    .replace(/<(script|iframe|object|embed|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<table>/g, '<div class="table-scroll"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

export function Markdown({ src, className = 'prose' }: { src: string; className?: string }) {
  const html = useMemo(() => sanitize(marked.parse(src || '') as string), [src])
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export function Gallery({ urls, label }: { urls: string[]; label: string }) {
  const [i, setI] = useState<number | null>(null)
  if (!urls?.length) return null
  const go = (d: number) => setI((v) => (v === null ? null : (v + d + urls.length) % urls.length))
  return (
    <>
      <h3>{label}</h3>
      <div className="gallery">
        {urls.map((u, k) => (
          <button key={u} onClick={() => setI(k)} aria-label={`${label} ${k + 1}`}><img src={u} alt="" loading="lazy" /></button>
        ))}
      </div>
      {i !== null && (
        <div className="lightbox" onClick={() => setI(null)} role="dialog">
          <img src={urls[i]} alt="" onClick={(e) => e.stopPropagation()} />
          <button className="x" aria-label="Close">×</button>
          {urls.length > 1 && <>
            <button className="prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); go(-1) }}>‹</button>
            <button className="next" aria-label="Next" onClick={(e) => { e.stopPropagation(); go(1) }}>›</button>
          </>}
        </div>
      )}
    </>
  )
}
