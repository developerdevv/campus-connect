export function formatDate(iso, opts = {}) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...opts,
  })
}

export function formatLongDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(iso) {
  return new Date(iso)
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(' ', ' ')
    .toLowerCase()
}

export function formatTimeRange(startIso, endIso) {
  const sameDay = new Date(startIso).toDateString() === new Date(endIso).toDateString()
  return sameDay
    ? `${formatTime(startIso)} – ${formatTime(endIso)}`
    : `${formatTime(startIso)} → ${formatDate(endIso)} · ${formatTime(endIso)}`
}

export function formatPrice(amount) {
  if (!amount) return 'Free'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

export function relativeCountdown(iso) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Started'
  const mins = Math.round(diff / 60000)
  if (mins < 60) return `in ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `in ${hours} hr${hours > 1 ? 's' : ''}`
  const days = Math.round(hours / 24)
  if (days < 30) return `in ${days} day${days > 1 ? 's' : ''}`
  const months = Math.round(days / 30)
  return `in ${months} month${months > 1 ? 's' : ''}`
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

export const CATEGORY_STYLES = {
  tech: { label: 'Technology', chip: 'bg-indigo-50 text-indigo-700 ring-indigo-100', dot: 'bg-indigo-500' },
  cultural: { label: 'Cultural', chip: 'bg-rose-50 text-rose-700 ring-rose-100', dot: 'bg-rose-500' },
  sports: { label: 'Sports', chip: 'bg-sky-50 text-sky-700 ring-sky-100', dot: 'bg-sky-500' },
  workshop: { label: 'Workshop', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100', dot: 'bg-emerald-500' },
  startup: { label: 'Startup', chip: 'bg-amber-50 text-amber-700 ring-amber-100', dot: 'bg-amber-500' },
  music: { label: 'Music', chip: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-100', dot: 'bg-fuchsia-500' },
}

export function categoryMeta(category) {
  return CATEGORY_STYLES[category] || { label: category, chip: 'bg-ink-100 text-ink-700 ring-ink-200', dot: 'bg-ink-400' }
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
