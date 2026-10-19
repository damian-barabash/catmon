import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n'
import Layout from './components/Layout'
import Home from './pages/Home'
import Contact from './pages/Contact'
import Season from './pages/Season'
import NotFound from './pages/NotFound'
import { Suspense, lazy, type ReactNode } from 'react'
import type { Policy } from './lib/api'
const AdminApp = lazy(() => import('./admin/AdminApp'))
// блог и политики — ленивые: только им нужен markdown (marked + DOMPurify)
const Blog = lazy(() => import('./pages/Blog'))
const BlogPostPage = lazy(() => import('./pages/Blog').then((m) => ({ default: m.BlogPostPage })))
const PolicyPage = lazy(() => import('./pages/Policy'))

const Page = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<div className="wrap" style={{ minHeight: '70vh' }} />}>{children}</Suspense>
)
const policy = (code: Policy['code']) => <Page><PolicyPage code={code} /></Page>

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Page><Blog /></Page>} />
            <Route path="/blog/:slug" element={<Page><BlogPostPage /></Page>} />
            <Route path="/season" element={<Season />} />
            <Route path="/privacy" element={policy('privacy')} />
            <Route path="/cookies" element={policy('cookies')} />
            <Route path="/terms" element={policy('terms')} />
            <Route path="/rules" element={policy('rules')} />
            <Route path="/data-processing" element={policy('data_processing')} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
