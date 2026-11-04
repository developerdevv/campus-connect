import { useCallback, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Download,
  Lock,
  Mail,
  Search,
  Ticket,
  Users,
  Users2,
  X,
} from 'lucide-react'
import { api, USE_MOCK } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useSession } from '../context/SessionProvider'
import { useToast } from '../context/ToastProvider'
import { Avatar, Badge, ErrorState, Skeleton } from '../components/ui'
import { cn, formatDate, formatTime, timeAgo } from '../lib/format'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'waitlisted', label: 'Waitlist' },
]

function toCsv(rows, eventTitle) {
  const header = ['Name', 'Email', 'Phone', 'College', 'Year', 'Team', 'Status', 'Ticket', 'Registered']
  const body = rows.map((r) =>
    [
      r.attendee.name,
      r.attendee.email,
      r.attendee.phone,
      r.attendee.college,
      r.attendee.year,
      r.attendee.teamName || '',
      r.status,
      r.ticketCode,
      new Date(r.createdAt).toISOString(),
    ]
      .map((v) => {
        let value = String(v ?? '')
        // Prevent spreadsheet applications from executing attendee data as formulas.
        if (/^[\t\r\n]/.test(value) || /^\s*[=+@\-]/.test(value)) value = `'${value}`
        return `"${value.replace(/"/g, '""')}"`
      })
      .join(','),
  )
  const blob = new Blob(['\ufeff', [header.join(','), ...body].join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `attendees-${eventTitle.toLowerCase().replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function Attendees() {
  const { id } = useParams()
  const { user, switchUser, users } = useSession()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [selected, setSelected] = useState([])

  const fetchAttendees = useCallback(() => api.listEventRegistrations(id, { q: query }), [id, query])
  const { data, meta, loading, error, refetch } = useApi(fetchAttendees, [id, query, user.id])

  const event = meta?.event
  const rows = useMemo(() => data || [], [data])
  const filtered = useMemo(() => (tab === 'all' ? rows : rows.filter((r) => r.status === tab)), [rows, tab])

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.includes(r.id))
  const toggleAll = () => setSelected(allSelected ? [] : filtered.map((r) => r.id))
  const toggleOne = (rid) =>
    setSelected((s) => (s.includes(rid) ? s.filter((x) => x !== rid) : [...s, rid]))

  if (error?.status === 403) {
    const organizer = USE_MOCK ? users.find((u) => u.role === 'organizer' && u.id !== user.id) : null
    return (
      <div className="container-page py-12">
        <div className="mx-auto max-w-lg">
          <div className="card overflow-hidden">
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-white shadow-lift">
                <Lock className="h-6 w-6" />
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">
                403 · Organizer access only
              </p>
              <h1 className="mt-1.5 text-[21px] font-bold text-ink-900">This attendee list is private</h1>
              <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-500">{error.message}</p>
              <div className="mt-6 w-full space-y-2">
                {organizer && (
                  <button onClick={() => switchUser(organizer.id)} className="btn-brand w-full">
                    <Users2 className="h-4 w-4" /> Switch to {organizer.name} (organizer)
                  </button>
                )}
                <Link to="/" className="btn-ghost w-full">
                  Back to browsing
                </Link>
              </div>
              {USE_MOCK && <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
                Demo access is limited to the organizer of this event. A real server must enforce ownership.
              </p>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <ErrorState title="Couldn't load attendees" message={error.message} code={error.status} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="container-page py-8">
      <Link to={`/events/${id}`} className="btn-quiet -ml-2 !text-[13px]">
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Badge tone="brand">Organizer dashboard</Badge>
          {loading ? (
            <Skeleton className="mt-3 h-7 w-72" />
          ) : (
            <h1 className="mt-2.5 text-[26px] font-bold leading-tight text-ink-900">{event?.title}</h1>
          )}
          <p className="mt-1 text-[13px] text-ink-500">
            {event ? `${formatDate(event.startAt)} · ${event.venue} · ${event.campus}` : 'Loading event…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toCsv(filtered, event?.title || 'event')
              toast({ title: 'CSV exported', description: `${filtered.length} attendees downloaded.` })
            }}
            className="btn-ghost"
            disabled={loading || filtered.length === 0}
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={refetch} className="btn-primary" disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[86px] rounded-2xl" />)
          : [
              { label: 'Registered', value: meta.total, sub: `of ${meta.capacity} seats`, icon: Users2, tone: 'text-brand-600 bg-brand-50' },
              { label: 'Confirmed', value: meta.confirmed, sub: `${Math.round((meta.confirmed / Math.max(meta.total, 1)) * 100)}% of list`, icon: CheckCheck, tone: 'text-emerald-600 bg-emerald-50' },
              { label: 'Waitlisted', value: meta.waitlisted, sub: 'on the waitlist', icon: Users, tone: 'text-amber-600 bg-amber-50' },
              { label: 'Checked in', value: meta.checkedIn, sub: 'gate scans so far', icon: Ticket, tone: 'text-violet-600 bg-violet-50' },
            ].map((s) => (
              <div key={s.label} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400">{s.label}</p>
                    <p className="mt-1.5 text-[24px] font-bold leading-none text-ink-900">{s.value}</p>
                  </div>
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', s.tone)}>
                    <s.icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-2 text-[11.5px] text-ink-400">{s.sub}</p>
              </div>
            ))}
      </div>

      {/* toolbar */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-full border border-ink-200 bg-white p-0.5">
          {TABS.map((t) => {
            const count = t.id === 'all' ? meta?.total : meta?.[t.id]
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id)
                  setSelected([])
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition',
                  tab === t.id ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-900',
                )}
              >
                {t.label}
                {!loading && <span className={cn('text-[11px]', tab === t.id ? 'text-white/60' : 'text-ink-400')}>{count}</span>}
              </button>
            )
          })}
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="flex w-full max-w-xs items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
            <Search className="h-4 w-4 shrink-0 text-ink-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected([]) }}
              placeholder="Search name, email, college…"
              aria-label="Search attendees"
              className="w-full bg-transparent text-[13px] placeholder:text-ink-400 focus:outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(''); setSelected([]) }} aria-label="Clear search" className="text-ink-400 hover:text-ink-900">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-ink-900 px-4 py-2.5 text-white">
          <p className="text-[12.5px] font-semibold">{selected.length} selected</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                toCsv(filtered.filter((r) => selected.includes(r.id)), event?.title || 'event')
                toast({ title: 'Selection exported', description: `${selected.length} row${selected.length === 1 ? '' : 's'}` })
              }}
              className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-white/20"
            >
              Export selection
            </button>
            <button onClick={() => setSelected([])} className="rounded-full px-2 py-1.5 text-[12px] font-semibold text-white/60 hover:text-white">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* table */}
      <div className="mt-4 card overflow-hidden">
        <div className="hidden grid-cols-[36px_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_110px_90px] items-center gap-3 border-b border-ink-100 bg-ink-50/70 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400 lg:grid">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Select all attendees"
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span>Attendee</span>
          <span>College / Year</span>
          <span>Ticket</span>
          <span>Status</span>
          <span className="text-right">Registered</span>
        </div>

        {loading && (
          <div className="divide-y divide-ink-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-64" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-[15px] font-semibold text-ink-900">No attendees match</p>
            <p className="mt-1 text-[13px] text-ink-500">
              {query ? `Nothing found for “${query}”.` : 'Nobody registered under this filter yet.'}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <ul className="divide-y divide-ink-50">
            {filtered.map((r) => (
              <li
                key={r.id}
                className={cn(
                  'grid grid-cols-[28px_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition hover:bg-ink-50/60 lg:grid-cols-[36px_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_110px_90px]',
                  selected.includes(r.id) && 'bg-brand-50/50',
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() => toggleOne(r.id)}
                  aria-label={`Select ${r.attendee.name}`}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />

                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={r.attendee.name} size="sm" gradient="from-ink-600 to-ink-400" className="ring-0" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-ink-900">
                      {r.attendee.name}
                      {r.checkedIn && (
                        <span title="Checked in" className="text-emerald-600">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11.5px] text-ink-500">{r.attendee.email}</p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-400 lg:hidden">
                      {r.attendee.college} · {r.ticketCode}
                    </p>
                  </div>
                </div>

                <div className="hidden min-w-0 lg:block">
                  <p className="truncate text-[12.5px] font-medium text-ink-700">{r.attendee.college}</p>
                  <p className="text-[11.5px] text-ink-400">
                    {r.attendee.year}
                    {r.attendee.teamName ? ` · ${r.attendee.teamName}` : ''}
                  </p>
                </div>

                <div className="hidden min-w-0 lg:block">
                  <p className="truncate font-mono text-[11.5px] font-semibold tracking-wide text-ink-700">
                    {r.ticketCode}
                  </p>
                  <p className="text-[11px] text-ink-400">{r.attendee.phone}</p>
                </div>

                <div className="col-span-2 mt-1 flex items-center gap-2 pl-7 lg:col-span-1 lg:mt-0 lg:pl-0">
                  <Badge tone={r.status === 'confirmed' ? 'success' : 'warning'}>{r.status}</Badge>
                  {r.attendee.teamName && (
                    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10.5px] font-medium text-ink-600 lg:hidden">
                      {r.attendee.teamName}
                    </span>
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-between pl-7 text-[11.5px] text-ink-400 lg:col-span-1 lg:block lg:pl-0 lg:text-right">
                  <span title={formatDate(r.createdAt)}>{timeAgo(r.createdAt)}</span>
                  <a href={`mailto:${r.attendee.email}`} aria-label={`Email ${r.attendee.name}`} className="ml-3 rounded-full p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-900 lg:hidden">
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 text-[11.5px] text-ink-400">
            <span>
              Showing {filtered.length} of {meta.total} attendees
            </span>
            <span className="flex items-center gap-1.5">
              Data via <code className="rounded bg-ink-100 px-1.5 py-0.5 text-[10.5px]">GET /api/events/{id}/registrations</code>
              <ChevronDown className="h-3 w-3" />
            </span>
          </div>
        )}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-ink-400">
        <Lock className="h-3.5 w-3.5" /> Only members of {event?.organizer?.name || 'the organizing team'} can see
        attendee contact details.
      </p>
    </div>
  )
}
