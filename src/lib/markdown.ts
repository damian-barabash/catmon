// Markdown → безопасный HTML. Один рендерер для сайта (блог, политики) и превью в админке,
// чтобы превью совпадало с сайтом. Модуль тяжёлый (marked + DOMPurify) — импортировать
// только из лениво загружаемых страниц, чтобы он не попадал в главный чанк.
import { Marked } from 'marked'
import DOMPurify from 'dompurify'

const md = new Marked({ gfm: true, breaks: false })

// Только то, что реально нужно блогу и политикам.
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'del', 's', 'u', 'sup', 'sub', 'mark', 'small',
  'blockquote', 'ul', 'ol', 'li', 'code', 'pre', 'kbd',
  'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'div', 'span', 'input',
]
const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'loading', 'crossorigin', 'align', 'start', 'type', 'checked', 'disabled', 'colspan', 'rowspan']
// http(s)/mailto/tel и относительные ссылки; javascript:, data:, vbscript: и прочее — нет.
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i

let hooked = false
function ensureHooks() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const el = node as Element
    if (el.tagName === 'A') {
      const target = el.getAttribute('target')
      if (target && target !== '_blank' && target !== '_self') el.removeAttribute('target')
      if (el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer')
    } else if (el.tagName === 'IMG') {
      // картинки из Supabase Storage грузим в CORS-режиме без кук — иначе Firefox ругается
      // на отклонённую куку `__cf_bm` (Domain=supabase.co — публичный суффикс). См. MediaImg.tsx.
      if (/^https?:/i.test(el.getAttribute('src') || '')) el.setAttribute('crossorigin', 'anonymous')
      else el.removeAttribute('crossorigin')
    } else if (el.tagName === 'INPUT') {
      // GFM task list: оставляем только неактивный чекбокс
      if (el.getAttribute('type') !== 'checkbox') el.remove()
      else el.setAttribute('disabled', '')
    }
  })
}

export function sanitizeHtml(html: string): string {
  ensureHooks()
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP, ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false })
}

/** Markdown → очищенный HTML. Таблицы оборачиваются в `.table-scroll` (горизонтальный скролл на мобиле). */
export function renderMarkdown(src: string): string {
  const html = sanitizeHtml(md.parse(src || '', { async: false }) as string)
  return html.replace(/<table>/g, '<div class="table-scroll"><table>').replace(/<\/table>/g, '</table></div>')
}
