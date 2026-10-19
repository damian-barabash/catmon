import { useMemo, useState } from 'react'
import { renderMarkdown } from '../lib/markdown'
import { MediaImg } from './MediaImg'

/** h1 на странице один (заголовок страницы), поэтому `# …` из тела рендерим как `<h2 class="h1">` — выглядит так же. */
export function Markdown({ src, className = 'prose' }: { src: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(src).replace(/<h1>/g, '<h2 class="h1">').replace(/<\/h1>/g, '</h2>'), [src])
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
          <button key={u} onClick={() => setI(k)} aria-label={`${label} ${k + 1}`}><MediaImg src={u} alt="" loading="lazy" /></button>
        ))}
      </div>
      {i !== null && (
        <div className="lightbox" onClick={() => setI(null)} role="dialog">
          <MediaImg src={urls[i]} alt="" onClick={(e) => e.stopPropagation()} />
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
