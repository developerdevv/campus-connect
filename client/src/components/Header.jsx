import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, LayoutDashboard, Ticket } from 'lucide-react'
import { USE_MOCK } from '../api/client'
import { useSession } from '../context/SessionProvider'
import { cn } from '../lib/format'
import { Avatar } from './ui'

function Logo() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2 sm:gap-2.5" aria-label="CampusConnect home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-accent-500 text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,0.9)] transition group-hover:-rotate-6">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10 12 5 2 10l10 5 10-5Z" />
          <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[13.5px] font-bold tracking-tight sm:text-[15px] text-ink-900">CampusConnect</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-400">{USE_MOCK ? 'Events · Demo' : 'Events'}</span>
      </span>
    </Link>
  )
}

const NAV = [
  { to: '/', label: 'Discover', end: true },
  { to: '/me/registration', label: 'My ticket' },
]

export default function Header() {
  const { user, users, switchUser } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100/80 bg-white/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => cn('rounded-full px-3.5 py-2 text-sm font-medium transition',
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900')}>
                {item.label}
              </NavLink>
            ))}
            {USE_MOCK && user.role === 'organizer' && (
              <NavLink to="/events/evt-001/attendees"
                className={({ isActive }) => cn('flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition',
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900')}>
                <LayoutDashboard className="h-4 w-4" /> Attendees
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link to="/me/registration" className="btn-ghost !px-3 !py-2 sm:hidden md:inline-flex">
            <Ticket className="h-4 w-4" /> <span className="hidden min-[440px]:inline">My ticket</span>
            <span className="sr-only min-[440px]:hidden">My ticket</span>
          </Link>

          <div className="relative" ref={ref}>
            <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={`Account: ${user.name}`}
              className="flex items-center gap-2 rounded-full border border-ink-200 bg-white py-1 pl-1 pr-1 transition min-[360px]:pr-2.5 hover:border-ink-300 hover:bg-ink-50">
              <Avatar name={user.name} size="sm" gradient="from-ink-800 to-ink-600" className="ring-0" />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[13px] font-semibold text-ink-900">{user.name.split(' ')[0]}</span>
                <span className="block text-[10px] font-medium uppercase tracking-wider text-ink-400">{user.label}</span>
              </span>
              <ChevronDown className={cn('hidden h-4 w-4 text-ink-400 transition min-[360px]:block', open && 'rotate-180')} />
            </button>

            {open && <div role="menu" className="absolute right-0 mt-2 w-72 animate-scale-in overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-lift">
              <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Select User Account</p>
              {users.map((u) => {
                const active = u.id === user.id
                return <button key={u.id} role="menuitemradio" aria-checked={active} onClick={() => { switchUser(u.id); setOpen(false) }}
                  className={cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-ink-50', active && 'bg-ink-50')}>
                  <Avatar name={u.name} size="sm" gradient={u.role === 'organizer' ? 'from-brand-500 to-accent-500' : 'from-ink-700 to-ink-500'} className="ring-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink-900">{u.name}</span>
                    <span className="block truncate text-[11px] text-ink-500">{u.email}</span>
                  </span>
                  {active && <Check className="h-4 w-4 text-brand-600" />}
                </button>
              })}
              <div className="mt-1 border-t border-ink-100 px-3 py-2">
                <p className="text-[11px] leading-relaxed text-ink-400">Switch between students and organizers to test registration and attendee permissions.</p>
              </div>
            </div>}
          </div>
        </div>
      </div>
    </header>
  )
}
