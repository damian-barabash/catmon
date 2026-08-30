import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n'
import Layout from './components/Layout'
import Home from './pages/Home'
import Contact from './pages/Contact'
import Blog, { BlogPostPage } from './pages/Blog'
import Season from './pages/Season'
import PolicyPage from './pages/Policy'
import NotFound from './pages/NotFound'
import { Suspense, lazy } from 'react'
const AdminApp = lazy(() => import('./admin/AdminApp'))

export default function App() {
  return (
    <I18nProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<Suspense fallback={null}><AdminApp /></Suspense>} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/season" element={<Season />} />
            <Route path="/privacy" element={<PolicyPage code="privacy" />} />
            <Route path="/cookies" element={<PolicyPage code="cookies" />} />
            <Route path="/terms" element={<PolicyPage code="terms" />} />
            <Route path="/rules" element={<PolicyPage code="rules" />} />
            <Route path="/data-processing" element={<PolicyPage code="data_processing" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  )
}
