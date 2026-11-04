import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Browse from './pages/Browse'
import EventDetails from './pages/EventDetails'
import MyRegistration from './pages/MyRegistration'
import Attendees from './pages/Attendees'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="text-[64px] font-bold leading-none text-ink-200">404</p>
      <h1 className="mt-2 text-[24px] font-bold text-ink-900">Page not found</h1>
      <p className="mt-2 max-w-sm text-[13.5px] text-ink-500">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="btn-brand mt-5">
        Back to events
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Browse />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/events/:id/attendees" element={<Attendees />} />
          <Route path="/me/registration" element={<MyRegistration />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
