import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-100 bg-white">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ink-900 text-[11px] text-white">
              CC
            </span>
            CampusConnect
          </p>
          <p className="mt-2 max-w-sm text-[12.5px] leading-relaxed text-ink-500">
            One place for every campus event — discover what's on, register in seconds, and carry your
            ticket in your pocket.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-ink-500">
          <Link to="/" className="hover:text-ink-900">Browse events</Link>
          <Link to="/me/registration" className="hover:text-ink-900">My ticket</Link>
          <span>Made for campus communities</span>
          <span className="text-ink-300">© {new Date().getFullYear()} CampusConnect</span>
        </div>
      </div>
    </footer>
  )
}
