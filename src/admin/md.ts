import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

/** Minimal sanitizer: strips scripts/handlers from rendered markdown. */
export function renderMd(src: string): string {
  const html = marked.parse(src || '', { async: false }) as string
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
}
