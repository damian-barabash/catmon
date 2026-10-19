import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { AcceptedPlugin, Rule } from 'postcss'
import { staticPages } from './scripts/static-pages.ts'

// Классовые правила сайта (src/index.css) скоупятся под корень сайта `.site` (Layout):
// `.btn` → `:where(.site) .btn`. :where() не меняет специфичность, поэтому каскад сайта прежний,
// а в админку (.adm, вне .site) общие имена (.btn, .step, .hero, .kicker, .progress…) больше не протекают.
// Глобальными остаются только :root/html/body/* и правила по тегам (h1, a, button, img…).
const scopeSite: AcceptedPlugin = {
  postcssPlugin: 'scope-site',
  Rule(rule: Rule) {
    const file = rule.source?.input.file?.replace(/\\/g, '/') ?? ''
    if (!file.endsWith('/src/index.css')) return
    const parent = rule.parent
    if (parent?.type === 'atrule' && /keyframes$/i.test((parent as unknown as { name: string }).name)) return
    if (rule.selector.includes(':where(.site)')) return
    rule.selectors = rule.selectors.map((s) => (s.includes('.') ? `:where(.site) ${s}` : s))
  },
}

const manualChunks = (id: string) => {
  if (!id.includes('node_modules')) return
  if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'vendor'
  if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
  if (/node_modules\/(marked|dompurify)\//.test(id)) return 'md'
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react(), staticPages()],
  css: { postcss: { plugins: [scopeSite] } },
  build: {
    rollupOptions: {
      output: { manualChunks },
    },
  },
})
