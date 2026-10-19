import { renderMarkdown } from '../lib/markdown'

/** Превью markdown в админке — тот же рендерер и санитайзер (DOMPurify), что и на сайте. */
export function renderMd(src: string): string {
  return renderMarkdown(src)
}
