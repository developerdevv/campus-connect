import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, CalendarCheck, LayoutGrid, List, MapPin, Search, Sparkles, TrendingUp, Users, X } from 'lucide-react'
import { api, USE_MOCK } from '../api/client'
import { useSession } from '../context/SessionProvider'
import { useApi } from '../hooks/useApi'
import EventCard, { EventRow } from '../components/EventCard'
import Filters from '../components/Filters'
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/ui'
import { formatDate, formatTime, cn } from '../lib/format'

const SORTS = [
  { id: 'soonest', label: 'Soonest' },
  { id: 'trending', label: 'Trending' },
  { id: 'price-asc', label: 'Price' },
]

const QUICK = [
  { id: 'all', label: 'Everything' },
  { id: 'tech', label: 'Tech' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'sports', label: 'Sports' },
  { id: 'music', label: 'Music' },
]

function dateRange(date) {
  const now = new Date()
  if (date === 'week') {
    const to = new Date(now)
    to.setDate(to.getDate() + 7)
    return { dateFrom: now.toISOString(), dateTo: to.toISOString() }
  }
  if (date === 'month') {
    const to = new Date(now)
    to.setDate(to.getDate() + 30)
    return { dateFrom: now.toISOString(), dateTo: to.toISOString() }
  }
  if (date === 'weekend') {
    const day = now.getDay()
    const friday = new Date(now)
    friday.setDate(now.getDate() + (day === 6 ? -1 : day === 0 ? -2 : 5 - day))
    friday.setHours(0, 0, 0, 0)
    const sunday = new Date(friday)
    sunday.setDate(friday.getDate() + 2)
    sunday.setHours(23, 59, 59, 59)
    return { dateFrom: friday.toISOString(), dateTo: sunday.toISOString() }
  }
  return {}
}

export default function Browse() {
  const [params, setParams] = useSearchParams()
  const { user } = useSession()
  const [query, setQuery] = useState(params.get('q') || '')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [view, setView] = useState('grid')

  useEffect(() => {
    if (!sheetOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setSheetOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [sheetOpen])

  const filters = useMemo(
    () => ({
      q: params.get('q') || '',
      category: params.get('category') || 'all',
      campus: params.get('campus') || 'all',
      mode: params.get('mode') || 'all',
      price: params.get('price') || 'all',
      date: params.get('date') || 'all',
      sort: params.get('sort') || 'soonest',
      page: Math.max(1, Number(params.get('page')) || 1),
    }),
    [params],
  )

  const update = useCallback(
    (patch) => {
      const next = new URLSearchParams(params)
      if (Object.keys(patch).some((key) => key !== 'page')) next.delete('page')
      Object.entries(patch).forEach(([k, v]) => {
        if (!v || v === 'all') next.delete(k)
        else next.set(k, v)
      })
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  // Keep the field in sync with history and debounce writes without losing
  // a category/campus change made while the user is typing.
  const urlQuery = params.get('q') || ''
  useEffect(() => { setQuery(urlQuery) }, [urlQuery])
  useEffect(() => {
    if (query === urlQuery) return undefined
    const t = setTimeout(() => {
      setParams((current) => {
        if ((current.get('q') || '') === query) return current
        const next = new URLSearchParams(current)
        if (query) next.set('q', query)
        else next.delete('q')
        next.delete('page')
        return next
      }, { replace: true })
    }, 350)
    return () => clearTimeout(t)
  }, [query, urlQuery, setParams])

  const requested = useMemo(
    () => ({
      q: filters.q || undefined,
      category: filters.category,
      campus: filters.campus,
      mode: filters.mode,
      price: filters.price,
      sort: filters.sort,
      page: filters.page,
      pageSize: 24,
      ...dateRange(filters.date),
    }),
    [filters],
  )

  const fetchEvents = useCallback(() => api.listEvents(requested), [requested])
  const { data: events, meta, loading, error, refetch } = useApi(fetchEvents, [requested, user.id])

  const activeCount = ['category', 'campus', 'mode', 'price', 'date'].filter(
    (k) => filters[k] && filters[k] !== 'all',
  ).length

  const reset = () => {
    setQuery('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const featured = useMemo(() => (events || []).filter((e) => e.featured).slice(0, 2), [events])
  const showFeatured = !filters.q && filters.category === 'all' && featured.length > 0 && !loading

  return (
    <div>
      {/* ---------------- hero ---------------- */}
      <section className="surface-grain relative overflow-hidden border-b border-ink-100 bg-white">
        <div className="container-page relative pb-10 pt-12 sm:pb-14 sm:pt-16">
          <div className="max-w-3xl">
            <Badge tone="brand" className="animate-fade-up">
              <Sparkles className="h-3 w-3" /> {USE_MOCK ? 'Demo mode · sample campus events' : 'Explore campus events'}
            </Badge>
            <h1 className="mt-4 animate-fade-up text-balance text-[34px] font-bold leading-[1.08] text-ink-900 sm:text-[52px]">
              Find your next <span className="bg-gradient-to-r from-brand-600 via-violet-600 to-accent-500 bg-clip-text text-transparent">campus moment.</span>
            </h1>
            <p className="mt-3.5 max-w-xl animate-fade-up text-[15px] leading-relaxed text-ink-500 sm:text-base">
              Hackathons, fests, workshops and open mics — all in one feed. Register in under 30 seconds and
              keep every ticket in your pocket.
            </p>

            <div className="mt-7 animate-fade-up">
              <div className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-soft sm:flex-row sm:items-center sm:rounded-full">
                <div className="flex flex-1 items-center gap-2.5 px-3">
                  <Search className="h-[18px] w-[18px] shrink-0 text-ink-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events, clubs, venues…"
                    aria-label="Search events"
                    className="w-full bg-transparent py-2.5 text-[14.5px] text-ink-900 placeholder:text-ink-400 focus:outline-none"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} aria-label="Clear search" className="rounded-full p-1 text-ink-400 hover:bg-ink-100">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="hidden h-7 w-px bg-ink-100 sm:block" />
                <div className="flex items-center gap-2 px-3 sm:w-[190px]">
                  <MapPin className="h-4 w-4 shrink-0 text-ink-400" />
                  <select
                    aria-label="Filter by campus"
                    value={filters.campus}
                    onChange={(e) => update({ campus: e.target.value })}
                    className="w-full cursor-pointer bg-transparent py-2.5 text-[13.5px] font-medium text-ink-700 focus:outline-none"
                  >
                    <option value="all">All campuses</option>
                    {(meta?.facets?.campuses || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-brand w-full sm:w-auto"
                >
                  Explore <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => update({ category: q.id })}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition',
                      filters.category === q.id
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 bg-white/80 text-ink-600 hover:border-ink-300 hover:text-ink-900',
                    )}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4">
              {[
                { icon: CalendarCheck, value: 'Discover', label: 'Campus events' },
                { icon: Users, value: 'Connect', label: 'Student clubs' },
                { icon: TrendingUp, value: 'Save', label: 'Your tickets' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-soft ring-1 ring-ink-100">
                    <s.icon className="h-4 w-4 text-brand-600" />
                  </span>
                  <div>
                    <dt className="text-[17px] font-bold leading-none text-ink-900">{s.value}</dt>
                    <dd className="mt-1 text-[11px] font-medium uppercase tracking-wider text-ink-400">{s.label}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div id="results" className="container-page py-8 sm:py-10">
        {/* featured strip */}
        {showFeatured && (
          <section className="mb-9">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="text-[19px] font-bold text-ink-900">Don't miss out</h2>
                <p className="mt-0.5 text-[13px] text-ink-500">A few events worth exploring.</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {featured.map((e, i) => (
                <FeaturedCard key={e.id} event={e} index={i} />
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-8">
          {/* sidebar */}
          <aside className="hidden w-[248px] shrink-0 lg:block">
            <div className="sticky top-24 card p-5">
              <Filters
                filters={filters}
                onChange={update}
                facets={{ ...(meta?.facets || {}), totalAll: meta?.facets?.totalAll }}
                onReset={reset}
                activeCount={activeCount}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[19px] font-bold text-ink-900">
                  {loading ? 'Searching…' : `${meta?.total ?? 0} event${meta?.total === 1 ? '' : 's'}`}
                  {filters.q && <span className="font-normal text-ink-400"> for “{filters.q}”</span>}
                </h2>
                <p className="mt-0.5 text-[12.5px] text-ink-500">
                  {filters.category !== 'all' ? `${filters.category} · ` : ''}
                  {filters.campus !== 'all' ? `${filters.campus} · ` : ''}
                  Sorted by {SORTS.find((s) => s.id === filters.sort)?.label.toLowerCase()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSheetOpen(true)}
                  className="btn-ghost !px-3.5 !py-2 lg:hidden"
                >
                  Filters {activeCount > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">{activeCount}</span>}
                </button>
                <div className="flex items-center rounded-full border border-ink-200 bg-white p-0.5">
                  {SORTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => update({ sort: s.id })}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition',
                        filters.sort === s.id ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-900',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="hidden items-center rounded-full border border-ink-200 bg-white p-0.5 sm:flex">
                  <button
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                    className={cn('rounded-full p-1.5', view === 'grid' ? 'bg-ink-900 text-white' : 'text-ink-400 hover:text-ink-900')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    aria-label="List view"
                    className={cn('rounded-full p-1.5', view === 'list' ? 'bg-ink-900 text-white' : 'text-ink-400 hover:text-ink-900')}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card overflow-hidden p-0">
                    <Skeleton className="aspect-[16/10] w-full rounded-none" />
                    <div className="space-y-3 p-5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-1.5 w-full" />
                      <div className="flex justify-between pt-2">
                        <Skeleton className="h-6 w-28" />
                        <Skeleton className="h-6 w-14" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <ErrorState
                title="We couldn't load events"
                message={error.message}
                code={error.status || undefined}
                onRetry={refetch}
              />
            )}

            {!loading && !error && events?.length === 0 && (
              <EmptyState
                icon="🗓️"
                title="No events match those filters"
                message="Try widening the date range, clearing the campus filter, or searching for something else."
                action={
                  <button onClick={reset} className="btn-ghost mt-1">
                    Clear all filters
                  </button>
                }
              />
            )}

            {!loading && !error && events?.length > 0 && (
              <div
                className={cn(
                  'animate-stagger',
                  view === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3',
                )}
              >
                {events.map((e, i) =>
                  view === 'grid' ? (
                    <EventCard key={e.id} event={e} index={i} />
                  ) : (
                    <EventRow key={e.id} event={e} />
                  ),
                )}
              </div>
            )}

            {!loading && !error && events?.length > 0 && (
              <div className="mt-8 flex flex-col items-center gap-3 text-center text-[12.5px] text-ink-400">
                <p>Showing {events.length} of {meta?.total ?? events.length} results</p>
                {(meta?.totalPages ?? Math.ceil((meta?.total || 0) / 24)) > 1 && (
                  <div className="flex items-center gap-3">
                    <button className="btn-ghost !py-2" disabled={filters.page <= 1}
                      onClick={() => { update({ page: filters.page - 1 }); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }) }}>Previous</button>
                    <span>Page {filters.page} of {meta?.totalPages ?? Math.ceil(meta.total / 24)}</span>
                    <button className="btn-ghost !py-2" disabled={filters.page >= (meta?.totalPages ?? Math.ceil(meta.total / 24))}
                      onClick={() => { update({ page: filters.page + 1 }); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }) }}>Next</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mobile filter sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-950/50" onClick={() => setSheetOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="filter-sheet-title" className="absolute inset-x-0 bottom-0 flex max-h-[85vh] animate-scale-in flex-col overflow-hidden rounded-t-3xl bg-white">
            <div className="flex shrink-0 items-center justify-between px-5 pb-4 pt-5">
              <p id="filter-sheet-title" className="text-base font-bold text-ink-900">Refine results</p>
              <button onClick={() => setSheetOpen(false)} aria-label="Close filters" className="rounded-full p-2 text-ink-500 hover:bg-ink-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-5 pb-5">
              <Filters
                filters={filters}
                onChange={update}
                facets={{ ...(meta?.facets || {}), totalAll: meta?.facets?.totalAll }}
                onReset={reset}
                activeCount={activeCount}
                variant="sheet"
              />
            </div>
            <div className="shrink-0 border-t border-ink-100 bg-white p-4">
              <button onClick={() => setSheetOpen(false)} className="btn-brand w-full">
                Show {meta?.total ?? 0} event{meta?.total === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FeaturedCard({ event, index }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group relative block overflow-hidden rounded-3xl shadow-lift"
    >
      <img
        src={event.cover}
        alt=""
        className="h-[220px] w-full object-cover transition duration-700 group-hover:scale-105 sm:h-[250px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent" />
      <div className="absolute inset-x-5 bottom-5 text-white">
        <div className="flex items-center gap-2">
          <span className="chip bg-white/15 text-white ring-white/25 backdrop-blur">
            ★ Featured
          </span>
          <span className="chip bg-white/15 text-white ring-white/25 backdrop-blur">
            {event.seatsLeft} seats left
          </span>
        </div>
        <h3 className="mt-2.5 text-[20px] font-bold leading-tight sm:text-[22px]">{event.title}</h3>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-white/80">
          <span>{formatDate(event.startAt)} · {formatTime(event.startAt)}</span>
          <span className="opacity-50">•</span>
          <span>{event.venue}</span>
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-white">
          View details <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
