import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  MapPin,
  Share2,
  Ticket,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { api } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useSession } from '../context/SessionProvider'
import { useToast } from '../context/ToastProvider'
import QrCode from '../components/QrCode'
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/ui'
import { buildIcs } from '../lib/ics'
import {
  cn,
  formatDate,
  formatLongDate,
  formatPrice,
  formatTime,
  formatTimeRange,
  relativeCountdown,
} from '../lib/format'

export default function MyRegistration() {
  const { user } = useSession()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const fetchMine = useCallback(() => api.getMyRegistration(), [user.id])
  const { data, meta, loading, error, refetch } = useApi(fetchMine, [user.id])
  const registrations = meta?.all?.length ? meta.all : data ? [data] : []
  const active = registrations.find((r) => String(r.id) === searchParams.get('id')) || data
  const otherRegistrations = registrations.filter((r) => r.id !== active?.id)

  function downloadIcs(registration, event) {
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${event.slug || event.id}.ics`
    a.click()
    URL.revokeObjectURL(a.href)
    toast({ title: 'Added to your calendar file', description: `${event.title}` })
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code)
      toast({ title: 'Ticket code copied', description: code })
    } catch {
      toast({ title: 'Could not copy code', description: 'Please select the ticket code and copy it manually.', variant: 'error' })
    }
  }

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge tone="brand">Your wallet</Badge>
          <h1 className="mt-2.5 text-[26px] font-bold text-ink-900 sm:text-[32px]">My ticket</h1>
          <p className="mt-1 text-[13.5px] text-ink-500">
            Everything you've registered for, in one place. Show the code at the gate.
          </p>
        </div>
        <Link to="/" className="btn-ghost">
          <Compass className="h-4 w-4" /> Discover more events
        </Link>
      </div>

      <div className="mt-7">
        {loading && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <Skeleton className="h-[330px] rounded-3xl" />
            <Skeleton className="h-[240px] rounded-3xl" />
          </div>
        )}

        {!loading && error && (
          <ErrorState
            title="Couldn't load your registrations"
            message={error.message}
            code={error.status || undefined}
            onRetry={refetch}
          />
        )}

        {!loading && !error && !data && (
          <EmptyState
            icon="🎟️"
            title="No tickets yet"
            message={user.email ? `You haven't registered for anything with ${user.email}. Browse what's happening on campus.` : "You haven't registered for an event yet. Browse what's happening on campus."}
            action={
              <Link to="/" className="btn-brand mt-1">
                Browse events <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
        )}

        {!loading && !error && active && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <TicketCard
                registration={active}
                event={active.event}
                onDownload={() => downloadIcs(active, active.event)}
                onCopy={() => copyCode(active.ticketCode)}
              />

              {otherRegistrations.length > 0 && (
                <section>
                  <h2 className="mb-3 text-[16px] font-bold text-ink-900">
                    Other registrations
                    <span className="ml-2 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
                      {otherRegistrations.length}
                    </span>
                  </h2>
                  <div className="space-y-2.5">
                    {otherRegistrations.map((r) => (
                      <Link
                        key={r.id}
                        to={`/me/registration?id=${encodeURIComponent(r.id)}`}
                        className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 transition hover:border-ink-200 hover:shadow-soft"
                      >
                        <img src={r.event?.cover} alt="" className="h-12 w-14 shrink-0 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-ink-900">{r.event?.title}</p>
                          <p className="mt-0.5 text-[11.5px] text-ink-500">
                            {r.event && formatDate(r.event.startAt)} · {r.ticketCode}
                          </p>
                        </div>
                        <Badge tone={r.status === 'confirmed' ? 'success' : 'warning'}>{r.status}</Badge>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-4">
              <div className="card p-5">
                <h3 className="text-[14px] font-bold text-ink-900">Registration details</h3>
                <dl className="mt-3 space-y-3 text-[13px]">
                  {[
                    ['Name', active.attendee?.name],
                    ['Email', active.attendee?.email],
                    ['Phone', active.attendee?.phone],
                    ['College', active.attendee?.college],
                    ['Year', active.attendee?.year],
                    ...(active.attendee?.teamName ? [['Team', active.attendee.teamName]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-ink-400">{k}</dt>
                      <dd className="min-w-0 text-right font-medium text-ink-800">{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
                {active.event?.organizer?.contactEmail && (
                  <a href={`mailto:${active.event.organizer.contactEmail}`} className="btn-ghost mt-4 w-full !py-2 !text-[12.5px]">
                    Contact organizer
                  </a>
                )}
              </div>

              <div className="rounded-3xl border border-ink-100 bg-gradient-to-br from-brand-50 to-white p-5">
                <p className="flex items-center gap-2 text-[13px] font-bold text-ink-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Before you go
                </p>
                <ul className="mt-2.5 space-y-2 text-[12.5px] leading-relaxed text-ink-600">
                  <li>• Carry your college ID if the organizer requires it.</li>
                  <li>• Check the event page for venue and timing details.</li>
                  <li>• Screenshot the QR code in case of network issues.</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function TicketCard({ registration, event, onDownload, onCopy }) {
  if (!event) return null
  const confirmed = registration.status === 'confirmed'

  return (
    <article className="animate-scale-in overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lift">
      {/* header */}
      <div className="relative">
        <img src={event.cover} alt="" className="h-36 w-full object-cover sm:h-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/35 to-transparent" />
        <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3">
          <div className="min-w-0 text-white">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/70">
              {event.organizer?.name}
            </p>
            <h2 className="mt-1 line-clamp-2 text-[19px] font-bold leading-tight sm:text-[22px]">{event.title}</h2>
          </div>
          <span
            className={cn(
              'chip shrink-0 ring-0',
              confirmed ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-ink-900',
            )}
          >
            {confirmed ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {registration.status}
          </span>
        </div>
      </div>

      {/* body */}
      <div className="grid sm:grid-cols-[minmax(0,1fr)_168px]">
        <div className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Date</p>
              <p className="mt-1 text-[14px] font-semibold text-ink-900">{formatLongDate(event.startAt)}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                <Clock className="h-3.5 w-3.5" />
                {formatTimeRange(event.startAt, event.endAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Venue</p>
              <p className="mt-1 text-[14px] font-semibold text-ink-900">{event.venue}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                <MapPin className="h-3.5 w-3.5" />
                {event.campus}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-dashed border-ink-200 pt-4">
            {[
              ['Attendee', registration.attendee?.name],
              ['Ticket', registration.ticketCode],
              ['Entry', formatPrice(event.price)],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{k}</p>
                <p className="mt-1 truncate text-[12.5px] font-semibold text-ink-900">{v}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onDownload} className="btn-ghost !py-2 !text-[12.5px]">
              <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
            </button>
            <button onClick={onCopy} className="btn-ghost !py-2 !text-[12.5px]">
              <Download className="h-3.5 w-3.5" /> Copy code
            </button>
            <Link to={`/events/${event.id}`} className="btn-quiet !text-[12.5px]">
              <Share2 className="h-3.5 w-3.5" /> Event page
            </Link>
          </div>
        </div>

        {/* stub */}
        <div className="relative flex flex-col items-center justify-center gap-2 border-t border-dashed border-ink-200 bg-ink-50/60 p-5 sm:border-l sm:border-t-0">
          <span className="absolute -left-2 -top-2 hidden h-4 w-4 rounded-full bg-ink-50 sm:block" />
          <span className="absolute -bottom-2 -left-2 hidden h-4 w-4 rounded-full bg-ink-50 sm:block" />
          <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-ink-100">
            <QrCode value={registration.ticketCode} size={112} />
          </div>
          <p className="mt-1 font-mono text-[11.5px] font-bold tracking-widest text-ink-700">
            {registration.ticketCode}
          </p>
          <p className="text-center text-[10.5px] leading-tight text-ink-400">
            Your ticket code
            <br />
            {relativeCountdown(event.startAt)}
          </p>
        </div>
      </div>

      {!confirmed && (
        <div className="flex items-start gap-2.5 border-t border-amber-100 bg-amber-50 px-5 py-3">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12px] leading-relaxed text-amber-900">
            You're on the waitlist. Contact the organizer for updates on availability.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-ink-100 bg-white px-5 py-3 text-[11.5px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {event.registeredCount} registered
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> Registered {formatDate(registration.createdAt)} at{' '}
          {formatTime(registration.createdAt)}
        </span>
      </div>
    </article>
  )
}
