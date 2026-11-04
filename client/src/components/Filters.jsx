import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { cn } from '../lib/format'

const MODES = [
  { id: 'all', label: 'Any' },
  { id: 'In person', label: 'In person' },
  { id: 'Online', label: 'Online' },
]

const PRICES = [
  { id: 'all', label: 'Any price' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
]

const DATES = [
  { id: 'all', label: 'Anytime' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'month', label: 'Next 30 days' },
]

function Segment({ options, value, onChange, label }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition',
              value === o.id
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Filters({ filters, onChange, facets, onReset, activeCount, variant = 'sidebar' }) {
  const categories = [{ id: 'all', label: 'All events', emoji: '✨', count: facets?.totalAll }, ...(facets?.categories || [])]

  return (
    <div className={cn('flex flex-col gap-6', variant === 'sheet' && 'pb-2')}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[13px] font-bold text-ink-900">
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </p>
        {activeCount > 0 && (
          <button onClick={onReset} className="flex items-center gap-1 text-[12px] font-semibold text-ink-500 hover:text-ink-900">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">Category</p>
        <div className="flex flex-col gap-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange({ category: c.id })}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium transition',
                filters.category === c.id
                  ? 'bg-brand-50 text-brand-800 ring-1 ring-brand-100'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">{c.emoji}</span>
                {c.label}
              </span>
              {typeof c.count === 'number' && (
                <span className="text-[11px] font-semibold text-ink-400">{c.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-ink-100" />

      <div>
        <label htmlFor={`${variant}-campus-filter`} className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
          Campus
        </label>
        <select
          id={`${variant}-campus-filter`}
          className="input !py-2 !text-[13px]"
          value={filters.campus || 'all'}
          onChange={(e) => onChange({ campus: e.target.value })}
        >
          <option value="all">All campuses</option>
          {(facets?.campuses || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Segment label="Format" options={MODES} value={filters.mode || 'all'} onChange={(v) => onChange({ mode: v })} />
      <Segment label="Price" options={PRICES} value={filters.price || 'all'} onChange={(v) => onChange({ price: v })} />
      <Segment label="When" options={DATES} value={filters.date || 'all'} onChange={(v) => onChange({ date: v })} />

      <div className="rounded-2xl bg-ink-50 p-3.5">
        <p className="text-[12px] font-semibold text-ink-800">Can't find your event?</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">
          Ask your club organizer about upcoming events on campus.
        </p>
      </div>
    </div>
  )
}
