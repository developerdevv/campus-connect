import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Users, Check } from 'lucide-react'
import { formatDate, formatPrice, formatTime, categoryMeta, cn } from '../lib/format'
import { Avatar, Badge, SeatMeter } from './ui'

export default function EventCard({ event, index = 0, compact = false }) {
  const cat = categoryMeta(event.category)
  const spotsLeft = event.seatsLeft
  const urgent = spotsLeft <= 20 && spotsLeft > 0

  return (
    <article
      className={cn(
        'group card flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift',
        compact && 'flex-row items-stretch',
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <Link
        to={`/events/${event.id}`}
        className={cn('relative block shrink-0 overflow-hidden', compact ? 'w-32 sm:w-40' : 'aspect-[16/10]')}
        aria-label={`View ${event.title}`}
      >
        <img
          src={event.cover}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/55 via-ink-950/5 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
          <span className={cn('chip ring-0', cat.chip)}>{cat.label}</span>
          {event.featured && !compact && (
            <span className="chip bg-white/90 text-ink-900 ring-0 backdrop-blur">★ Featured</span>
          )}
        </div>

        {event.isRegistered && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
            <Check className="h-3 w-3" strokeWidth={3} /> Going
          </span>
        )}

        {!compact && (
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <div className="rounded-xl bg-white/95 px-2.5 py-1.5 text-center shadow-sm backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                {new Date(event.startAt).toLocaleDateString('en-IN', { month: 'short' })}
              </p>
              <p className="text-lg font-bold leading-none text-ink-900">
                {new Date(event.startAt).getDate()}
              </p>
            </div>
            <span className="rounded-full bg-ink-950/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              {formatTime(event.startAt)}
            </span>
          </div>
        )}
      </Link>

      <div className={cn('flex flex-1 flex-col p-5', compact && 'justify-center p-4')}>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          <span className={cn('h-1.5 w-1.5 rounded-full', cat.dot)} />
          {event.mode}
          {event.mode === 'Online' ? ' · Live session' : ` · ${event.city}`}
        </p>

        <h3 className={cn('mt-1.5 font-semibold leading-snug text-ink-900', compact ? 'text-sm' : 'text-[17px]')}>
          <Link to={`/events/${event.id}`} className="line-clamp-2 hover:text-brand-700">
            {event.title}
          </Link>
        </h3>

        {!compact && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{event.tagline}</p>
        )}

        <div className="mt-3 space-y-1.5 text-[12.5px] text-ink-600">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-ink-400" />
            <span className="truncate">
              {formatDate(event.startAt)} · {formatTime(event.startAt)}
            </span>
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" />
            <span className="truncate">{event.venue}</span>
          </p>
        </div>

        {!compact && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
              <span className="flex items-center gap-1.5 font-medium text-ink-500">
                <Users className="h-3.5 w-3.5" />
                {event.registeredCount} registered
              </span>
              <span className={cn('font-semibold', urgent ? 'text-rose-600' : 'text-ink-400')}>
                {spotsLeft > 0 ? `${spotsLeft} seats left` : 'Waitlist only'}
              </span>
            </div>
            <SeatMeter registered={event.registeredCount} capacity={event.capacity} />
          </div>
        )}

        <div className={cn('mt-4 flex items-center justify-between gap-2', !compact && 'border-t border-ink-100 pt-3.5')}>
          <div className="flex items-center gap-2">
            <Avatar name={event.organizer?.name} size="xs" gradient={event.organizer?.color} />
            <span className="max-w-[110px] truncate text-[11.5px] font-medium text-ink-500">
              {event.organizer?.name}
            </span>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-bold',
              event.price === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-900 text-white',
            )}
          >
            {formatPrice(event.price)}
          </span>
        </div>
      </div>
    </article>
  )
}

export function EventRow({ event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 transition hover:border-ink-200 hover:shadow-soft"
    >
      <img src={event.cover} alt="" className="h-14 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[13.5px] font-semibold text-ink-900 group-hover:text-brand-700">
          {event.title}
        </p>
        <p className="mt-0.5 text-[11.5px] text-ink-500">
          {formatDate(event.startAt)} · {event.venue}
        </p>
      </div>
      <Badge tone="neutral">{formatPrice(event.price)}</Badge>
    </Link>
  )
}
