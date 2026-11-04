import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  Share2,
  Ticket,
  Users,
  Users2,
  Video,
  Wallet,
} from 'lucide-react'
import { api } from '../api/client'
import { useApi } from '../hooks/useApi'
import { useSession } from '../context/SessionProvider'
import { useToast } from '../context/ToastProvider'
import RegisterDialog from '../components/RegisterDialog'
import EventCard from '../components/EventCard'
import { Avatar, Badge, ErrorState, SeatMeter, Skeleton } from '../components/ui'
import { buildIcs } from '../lib/ics'
import {
  categoryMeta,
  cn,
  formatDate,
  formatLongDate,
  formatPrice,
  formatTime,
  formatTimeRange,
  relativeCountdown,
} from '../lib/format'

export default function EventDetails() {
  const { id } = useParams()
  const { user } = useSession()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [registrationCompleted, setRegistrationCompleted] = useState(false)

  const fetchEvent = useCallback(() => api.getEvent(id), [id])
  const { data: event, meta, loading, error, refetch } = useApi(fetchEvent, [id, user.id])

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: event.title, url }) } catch { /* sharing cancelled */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copied', description: 'Share it with your friends.' })
    } catch {
      toast({ title: 'Could not copy the link', description: 'Copy the address from your browser instead.', variant: 'error' })
    }
  }

  function closeDialog() {
    setDialogOpen(false)
    if (registrationCompleted) {
      setRegistrationCompleted(false)
      refetch()
    }
  }

  function addToCalendar() {
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${event.slug || event.id}.ics`
    a.click()
    URL.revokeObjectURL(a.href)
    toast({ title: 'Calendar file downloaded', description: 'Open it to add the event to your calendar.' })
  }

  if (loading) return <DetailsSkeleton />
  if (error)
    return (
      <div className="container-page py-16">
        <ErrorState
          title={error.status === 404 ? 'Event not found' : "We couldn't load this event"}
          message={
            error.status === 404
              ? 'This event may have been unpublished or the link is incorrect.'
              : error.message
          }
          code={error.status || undefined}
          onRetry={refetch}
        />
      </div>
    )

  const cat = categoryMeta(event.category)
  const pct = Math.round((event.registeredCount / event.capacity) * 100)
  const related = meta?.related || []
  const registrationClosed = event.registrationClosed ?? (new Date(event.registrationDeadline).getTime() < Date.now())
  const ticketPath = event.registration?.id ? `/me/registration?id=${encodeURIComponent(event.registration.id)}` : '/me/registration'

  return (
    <div className="pb-24 lg:pb-0">
      <div className="container-page pt-6">
        <Link to="/" className="btn-quiet -ml-2 !text-[13px]">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
      </div>

      <div className="container-page mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ---------------- main column ---------------- */}
        <div className="min-w-0">
          <div className="relative overflow-hidden rounded-3xl">
            <img src={event.cover} alt="" className="h-[230px] w-full object-cover sm:aspect-[16/9] sm:h-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
            <div className="absolute inset-x-4 top-4 flex flex-wrap items-center gap-2 sm:inset-x-6 sm:top-6">
              <span className={cn('chip ring-0', cat.chip)}>{cat.label}</span>
              {event.featured && (
                <span className="chip bg-white/90 text-ink-900 ring-0 backdrop-blur">★ Featured</span>
              )}
              {event.isFull && <span className="chip bg-rose-500 text-white ring-0">Waitlist only</span>}
            </div>
            <div className="absolute inset-x-4 bottom-4 text-white sm:inset-x-6 sm:bottom-6">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/70">
                {event.organizer?.name} · {event.mode}
              </p>
              <h1 className="mt-1.5 text-balance text-[26px] font-bold leading-[1.12] sm:text-[36px]">
                {event.title}
              </h1>
            </div>
          </div>

          <p className="mt-5 text-[15.5px] leading-relaxed text-ink-600">{event.tagline}</p>

          {/* quick meta strip */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { icon: CalendarDays, label: 'Date', value: formatDate(event.startAt, { year: undefined }) },
              { icon: Clock, label: 'Starts', value: formatTime(event.startAt) },
              { icon: MapPin, label: 'Venue', value: event.venue.split(',')[0] },
              { icon: Users, label: 'Going', value: `${event.registeredCount}` },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl border border-ink-100 bg-white px-3.5 py-3">
                <m.icon className="h-4 w-4 text-brand-600" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-ink-400">{m.label}</p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-ink-900">{m.value}</p>
              </div>
            ))}
          </div>

          {/* about */}
          <section className="mt-8">
            <h2 className="text-[19px] font-bold text-ink-900">About this event</h2>
            <p className="mt-2.5 whitespace-pre-line text-[14.5px] leading-[1.75] text-ink-600">
              {event.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {event.tags.map((t) => (
                <span key={t} className="rounded-full bg-ink-100 px-2.5 py-1 text-[11.5px] font-medium text-ink-600">
                  {t}
                </span>
              ))}
            </div>
          </section>

          {/* highlights */}
          {event.highlights?.length > 0 && (
            <section className="mt-7 rounded-3xl border border-brand-100 bg-brand-50/60 p-5">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-brand-800">
                What you'll get
              </h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {event.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-brand-900">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* agenda */}
          {event.agenda?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[19px] font-bold text-ink-900">Schedule</h2>
              <ol className="mt-4 space-y-0">
                {event.agenda.map((item, i) => (
                  <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                    {i !== event.agenda.length - 1 && (
                      <span className="absolute left-[7px] top-4 h-full w-px bg-ink-200" aria-hidden="true" />
                    )}
                    <span className="relative mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-white bg-brand-500 ring-1 ring-brand-200" />
                    <div className="min-w-0 pb-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">{item.time}</p>
                      <p className="mt-0.5 text-[14.5px] font-semibold text-ink-900">{item.title}</p>
                      {item.detail && (
                        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">{item.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* speakers */}
          {event.speakers?.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[19px] font-bold text-ink-900">Speakers & mentors</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {event.speakers.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3.5">
                    <Avatar name={s.name} size="md" gradient="from-ink-700 to-ink-500" className="ring-0" />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-ink-900">{s.name}</p>
                      <p className="truncate text-[12px] text-ink-500">{s.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* venue */}
          <section className="mt-8">
            <h2 className="text-[19px] font-bold text-ink-900">Venue</h2>
            <div className="mt-3 overflow-hidden rounded-3xl border border-ink-100 bg-white">
              <div className="relative h-40 bg-[radial-gradient(circle_at_30%_30%,#e0e7ff,transparent_55%),radial-gradient(circle_at_75%_70%,#fce7f3,transparent_50%)]">
                <div
                  className="absolute inset-0 opacity-[0.35]"
                  style={{
                    backgroundImage:
                      'linear-gradient(#c7d2fe 1px, transparent 1px), linear-gradient(90deg, #c7d2fe 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                  }}
                />
                <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink-900 text-white shadow-lg ring-4 ring-white/70">
                  <MapPin className="h-5 w-5" />
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 p-4">
                <div>
                  <p className="text-[14px] font-semibold text-ink-900">{event.venue}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-500">
                    {event.campus} · {event.city}
                  </p>
                </div>
                {event.mode !== 'Online' && <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.campus}, ${event.city}`)}`}
                  target="_blank" rel="noreferrer" className="btn-ghost !py-2">
                  Open in maps <ExternalLink className="h-3.5 w-3.5" />
                </a>}
              </div>
            </div>
          </section>

          {/* organizer */}
          <section className="mt-8">
            <h2 className="text-[19px] font-bold text-ink-900">Organized by</h2>
            <div className="mt-3 flex flex-col gap-4 rounded-3xl border border-ink-100 bg-white p-5 sm:flex-row sm:items-start">
              <Avatar name={event.organizer?.name} size="lg" gradient={event.organizer?.color} className="ring-0" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[15px] font-bold text-ink-900">
                  {event.organizer?.name}
                  {event.organizer?.verified && (
                    <span title="Verified club" className="text-brand-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  )}
                </p>
                <p className="text-[12px] text-ink-400">{event.organizer?.handle}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">{event.organizer?.about}</p>
                <div className="mt-3 flex gap-5 text-[12px] text-ink-500">
                  <span><b className="text-ink-900">{event.organizer?.eventsHosted}</b> events hosted</span>
                  <span><b className="text-ink-900">{event.organizer?.followers?.toLocaleString('en-IN')}</b> followers</span>
                </div>
              </div>
            </div>

            {event.isOwner && (
              <Link
                to={`/events/${event.id}/attendees`}
                className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 transition hover:bg-brand-100"
              >
                <span className="flex items-center gap-2.5 text-[13px] font-semibold text-brand-900">
                  <Users2 className="h-4 w-4" /> You're organizing this event
                </span>
                <span className="text-[12.5px] font-bold text-brand-700">View attendee list →</span>
              </Link>
            )}
          </section>

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="text-[19px] font-bold text-ink-900">Similar events</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((e, i) => (
                  <EventCard key={e.id} event={e} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ---------------- sticky registration card ---------------- */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 bg-gradient-to-br from-ink-900 to-ink-800 px-5 py-4 text-white">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                  {event.price ? 'Entry fee' : 'Entry'}
                </p>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/80">
                  {event.mode}
                </span>
              </div>
              <p className="mt-1 text-[26px] font-bold leading-none">{formatPrice(event.price)}</p>
              <p className="mt-1.5 text-[12px] text-white/60">{event.price ? 'per participant' : 'Free for students'}</p>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex gap-2.5">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900">
                    {formatLongDate(event.startAt)}
                  </p>
                  <p className="text-[12.5px] text-ink-500">
                    {formatTimeRange(event.startAt, event.endAt)} · {relativeCountdown(event.startAt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                {event.mode === 'Online' ? (
                  <Video className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                ) : (
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                )}
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900">{event.venue}</p>
                  <p className="text-[12.5px] text-ink-500">{event.campus}</p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900">
                    Registration closes {formatDate(event.registrationDeadline)}
                  </p>
                  <p className={cn('text-[12.5px]', event.closesSoon ? 'font-semibold text-rose-600' : 'text-ink-500')}>
                    {registrationClosed ? 'Closed' : relativeCountdown(event.registrationDeadline)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-ink-50 p-3.5">
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-ink-600">
                    {event.registeredCount} / {event.capacity} seats
                  </span>
                  <span className={cn('font-bold', event.seatsLeft <= 20 ? 'text-rose-600' : 'text-emerald-600')}>
                    {pct}% full
                  </span>
                </div>
                <SeatMeter registered={event.registeredCount} capacity={event.capacity} />
                <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-500">
                  <Info className="h-3.5 w-3.5" />
                  {event.isFull
                    ? 'All seats taken — join the waitlist'
                    : `Only ${event.seatsLeft} seats left at this price`}
                </p>
              </div>

              {event.isRegistered ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-[13px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
                    <Check className="h-4 w-4" strokeWidth={3} /> {event.registration?.status === 'waitlisted' ? "You're on the waitlist" : "You're registered"}
                  </div>
                  <Link to={ticketPath} className="btn-ghost w-full">
                    <Ticket className="h-4 w-4" /> View my ticket
                  </Link>
                </div>
              ) : event.isPast || registrationClosed ? (
                <button disabled className="btn-ghost w-full">{event.isPast ? 'This event has ended' : 'Registration closed'}</button>
              ) : (
                <button onClick={() => setDialogOpen(true)} className="btn-brand w-full !py-3">
                  <Ticket className="h-4 w-4" />
                  {event.isFull ? 'Join waitlist' : 'Register now'}
                </button>
              )}

              <div className="flex gap-2">
                <button onClick={share} className="btn-ghost flex-1 !py-2 !text-[12.5px]">
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
                <button onClick={addToCalendar} className="btn-ghost flex-1 !py-2 !text-[12.5px]">
                  <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
                </button>
              </div>

              <p className="text-center text-[11px] leading-relaxed text-ink-400">
                Your details are shared only with {event.organizer?.name}.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-ink-900">{formatPrice(event.price)}</p>
            <p className="truncate text-[11px] text-ink-500">
              {formatDate(event.startAt)} · {formatTime(event.startAt)}
            </p>
          </div>
          {event.isRegistered ? (
            <Link to={ticketPath} className="btn-ghost">
              My ticket
            </Link>
          ) : event.isPast || registrationClosed ? (
            <button disabled className="btn-ghost">{event.isPast ? 'Event ended' : 'Registration closed'}</button>
          ) : (
            <button onClick={() => setDialogOpen(true)} className="btn-brand">
              {event.isFull ? 'Join waitlist' : 'Register'}
            </button>
          )}
        </div>
      </div>

      <RegisterDialog
        event={event}
        open={dialogOpen}
        onClose={closeDialog}
        onRegistered={() => setRegistrationCompleted(true)}
      />
    </div>
  )
}

function DetailsSkeleton() {
  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[74px] rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-3xl" />
      </div>
    </div>
  )
}
