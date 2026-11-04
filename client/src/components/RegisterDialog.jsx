import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Lock, MapPin, ShieldCheck, Ticket, TriangleAlert, X } from 'lucide-react'
import { api, USE_MOCK } from '../api/client'
import { useSession } from '../context/SessionProvider'
import { formatDate, formatPrice, formatTime, formatTimeRange } from '../lib/format'
import { Field, Spinner, Badge } from './ui'
import QrCode from './QrCode'
import { CAMPUSES } from '../api/mockData'

const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'Postgraduate', 'Faculty']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^[+\d][\d\s-]{8,15}$/

export default function RegisterDialog({ event, open, onClose, onRegistered }) {
  const { user } = useSession()
  const dialogRef = useRef(null)
  const firstFieldRef = useRef(null)

  const [form, setForm] = useState({
    fullName: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    college: user.college || '',
    year: user.year || '',
    teamName: '',
    notes: '',
    agree: false,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm({
      fullName: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      college: user.college || '',
      year: user.year || '',
      teamName: '',
      notes: '',
      agree: false,
    })
    setResult(null)
    setApiError(null)
    setErrors({})
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => firstFieldRef.current?.focus(), 120)
    return () => {
      document.body.style.overflow = ''
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !submitting) onClose()
      if (e.key === 'Tab' && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!nodes.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, submitting])

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const requiresTeam = Boolean(event?.requiresTeam)

  function validate() {
    const next = {}
    if (!form.fullName.trim()) next.fullName = 'Enter your full name'
    else if (form.fullName.trim().length < 3) next.fullName = 'Name looks too short'
    if (!form.email.trim()) next.email = 'Enter your college email'
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'That email address looks invalid'
    if (!form.phone.trim()) next.phone = 'Enter a phone number'
    else if (!PHONE_RE.test(form.phone.trim())) next.phone = 'Enter a valid 10-digit number'
    if (!form.college) next.college = 'Select your college'
    if (!form.year) next.year = 'Select your year of study'
    if (requiresTeam && !form.teamName.trim()) next.teamName = 'This is a team event — add a team name'
    if (!form.agree) next.agree = 'Please accept the event terms to continue'
    setErrors(next)
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setApiError(null)
    const validationErrors = validate()
    if (Object.keys(validationErrors).length) {
      const firstKey = Object.keys(validationErrors)[0]
      dialogRef.current?.querySelector(`[name="${firstKey}"]`)?.focus()
      return
    }
    setSubmitting(true)
    try {
      const res = await api.createRegistration({
        eventId: event.id,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        college: form.college,
        year: form.year,
        teamName: form.teamName.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      setResult(res.data)
      onRegistered?.(res.data)
    } catch (err) {
      if (err.status === 409 && err.details?.registration) {
        setResult(err.details.registration)
        onRegistered?.(err.details.registration)
      } else {
        setApiError(err.message || 'Could not complete your registration. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const seatsLine = useMemo(() => {
    if (event.isFull) return 'Event is full — you will be added to the waitlist'
    return `${event.seatsLeft} of ${event.capacity} seats remaining`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/55 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
        className="relative z-10 max-h-[94vh] w-full animate-scale-in overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl"
      >
        <button
          onClick={() => !submitting && onClose()}
          className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 text-ink-500 shadow-sm transition hover:bg-ink-100 hover:text-ink-900"
          aria-label="Close registration dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {result ? (
          <SuccessPanel event={event} registration={result} onClose={onClose} />
        ) : (
          <div className="grid sm:grid-cols-[1.35fr_1fr]">
            {/* form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7" noValidate>
              <Badge tone="brand">Registration</Badge>
              <h2 id="register-title" className="mt-2.5 text-[22px] font-bold leading-tight text-ink-900">
                Reserve your seat
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                Add your details to reserve a place. They'll be shared with the event organizer.
              </p>

              {apiError && (
                <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-100 bg-rose-50 px-3.5 py-3">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-[12.5px] font-medium leading-relaxed text-rose-800">{apiError}</p>
                </div>
              )}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" htmlFor="fullName" required error={errors.fullName} className="sm:col-span-2">
                  <input
                    ref={firstFieldRef}
                    id="fullName"
                    name="fullName"
                    autoComplete="name"
                    className={`input ${errors.fullName ? 'input-error' : ''}`}
                    placeholder="Aarav Sharma"
                    value={form.fullName}
                    onChange={set('fullName')}
                  />
                </Field>

                <Field label="College email" htmlFor="email" required error={errors.email}>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="you@college.edu"
                    value={form.email}
                    onChange={set('email')}
                  />
                </Field>

                <Field label="Phone" htmlFor="phone" required error={errors.phone}>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    className={`input ${errors.phone ? 'input-error' : ''}`}
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={set('phone')}
                  />
                </Field>

                <Field label="College" htmlFor="college" required error={errors.college}>
                  <input
                    id="college"
                    name="college"
                    list="campus-options"
                    className={`input ${errors.college ? 'input-error' : ''}`}
                    value={form.college}
                    onChange={set('college')}
                    placeholder="Your college"
                  />
                  <datalist id="campus-options">
                    {CAMPUSES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </Field>

                <Field label="Year of study" htmlFor="year" required error={errors.year}>
                  <select
                    id="year"
                    name="year"
                    className={`input ${errors.year ? 'input-error' : ''}`}
                    value={form.year}
                    onChange={set('year')}
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Team name"
                  htmlFor="teamName"
                  error={errors.teamName}
                  required={requiresTeam}
                  hint={requiresTeam ? 'Required for this team event.' : 'Optional — leave blank if going solo.'}
                  className="sm:col-span-2"
                >
                  <input
                    id="teamName"
                    name="teamName"
                    className={`input ${errors.teamName ? 'input-error' : ''}`}
                    placeholder="e.g. Null Pointer Exception"
                    value={form.teamName}
                    onChange={set('teamName')}
                  />
                </Field>

                <Field
                  label="Anything the organizer should know?"
                  htmlFor="notes"
                  hint="Dietary needs, accessibility requests, teammate names…"
                  className="sm:col-span-2"
                >
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    className="input resize-none"
                    placeholder="Optional"
                    value={form.notes}
                    onChange={set('notes')}
                  />
                </Field>
              </div>

              <div className="mt-4 flex items-start gap-2.5">
                <input
                  id="agree"
                  name="agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={set('agree')}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="agree" className="cursor-pointer text-[12px] leading-relaxed text-ink-600">
                  I agree to the event code of conduct and consent to my details being shared with the
                  organizer.
                  {errors.agree && <span className="block font-medium text-rose-600">{errors.agree}</span>}
                </label>
              </div>

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-1.5 text-[11.5px] text-ink-400">
                  <Lock className="h-3.5 w-3.5" /> Details shared with the organizer
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={onClose} className="btn-ghost flex-1 sm:flex-none" disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-brand flex-1 sm:flex-none" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Spinner /> Registering…
                      </>
                    ) : (
                      <>
                        <Ticket className="h-4 w-4" />
                        Confirm registration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* summary */}
            <aside className="border-t border-ink-100 bg-ink-50/70 p-6 sm:border-l sm:border-t-0">
              <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
                <img src={event.cover} alt="" className="h-24 w-full object-cover" />
                <div className="p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                    {event.organizer?.name}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold leading-snug text-ink-900">{event.title}</p>
                  <div className="mt-2.5 space-y-1 text-[11.5px] text-ink-600">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-ink-400" />
                      {formatDate(event.startAt)} · {formatTimeRange(event.startAt, event.endAt)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-ink-400" />
                      {event.venue}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-ink-200 px-3.5 py-2.5">
                  <span className="text-[11.5px] font-medium text-ink-500">Event price</span>
                  <span className="text-[15px] font-bold text-ink-900">{formatPrice(event.price)}</span>
                </div>
              </div>

              <div className="mt-3 space-y-2.5">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-[11.5px] leading-relaxed text-ink-600">
                    {event.price
                      ? (USE_MOCK ? 'Demo only — no payment is collected.' : 'Payment is not collected here. Check with the organizer for payment details.')
                      : 'No payment is required to register.'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <p className="text-[11.5px] leading-relaxed text-ink-600">{seatsLine}</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function SuccessPanel({ event, registration, onClose }) {
  const waitlisted = registration.status === 'waitlisted'
  return (
    <div className="animate-fade-in p-6 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" strokeWidth={2.2} />
        </div>
        <h2 id="register-title" className="mt-4 text-[22px] font-bold text-ink-900">
          {waitlisted ? "You're on the waitlist" : "You're registered!"}
        </h2>
        <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-ink-500">
          {waitlisted
            ? 'All seats are taken. Your place on the waitlist has been recorded.'
            : (USE_MOCK ? 'Your demo registration is saved in this browser. Your ticket is ready.' : 'Your registration is confirmed. Your ticket is ready to view.')}

        </p>
      </div>

      <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 p-5 sm:flex-row sm:items-center">
        <div className="rounded-xl bg-white p-2 shadow-sm">
          <QrCode value={registration.ticketCode} size={104} />
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Ticket code</p>
          <p className="font-mono text-[17px] font-bold tracking-wider text-ink-900">{registration.ticketCode}</p>
          <p className="mt-1 line-clamp-2 text-[12.5px] font-medium text-ink-600">{event.title}</p>
          <p className="mt-1 text-[11.5px] text-ink-500">
            {formatDate(event.startAt)} · {formatTime(event.startAt)}
          </p>
          <span
            className={`chip mt-2 ${
              waitlisted ? 'bg-amber-100 text-amber-800 ring-amber-200' : 'bg-emerald-100 text-emerald-800 ring-emerald-200'
            }`}
          >
            {registration.status}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        <button onClick={onClose} className="btn-ghost">Keep browsing</button>
        <Link to={`/me/registration?id=${encodeURIComponent(registration.id)}`} className="btn-brand">
          <Ticket className="h-4 w-4" /> View my ticket
        </Link>
      </div>
    </div>
  )
}
