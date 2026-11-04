import { cn } from '../lib/format'
import { Loader2 } from 'lucide-react'

export function Badge({ children, className, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
    brand: 'bg-brand-50 text-brand-700 ring-brand-100',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100',
    danger: 'bg-rose-50 text-rose-700 ring-rose-100',
    dark: 'bg-ink-900 text-white ring-ink-900',
  }
  return <span className={cn('chip', tones[tone], className)}>{children}</span>
}

export function Avatar({ name = '', src, size = 'md', className, gradient = 'from-brand-500 to-violet-500' }) {
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
  }
  const label = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white',
        gradient,
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : label || '?'}
    </span>
  )
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
}

export function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} />
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, code }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-2xl">⚠️</div>
      {code && <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Error {code}</p>}
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {message && <p className="max-w-md text-sm leading-relaxed text-ink-500">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-2">
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ icon = '🔎', title, message, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 text-2xl ring-1 ring-ink-100">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {message && <p className="max-w-sm text-sm leading-relaxed text-ink-500">{message}</p>}
      {action}
    </div>
  )
}

export function SeatMeter({ registered, capacity, className }) {
  const pct = Math.min(100, Math.round((registered / Math.max(capacity, 1)) * 100))
  const tone = pct >= 95 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div className={cn('h-full rounded-full transition-all duration-700', tone)} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-ink-400">{hint}</p>
      ) : null}
    </div>
  )
}
