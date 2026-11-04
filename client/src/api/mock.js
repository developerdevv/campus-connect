// ---------------------------------------------------------------------------
// In-memory / localStorage backed implementation of the CampusConnect API.
// Used when VITE_USE_MOCK is not "false" (default in this demo build).
//
// It implements exactly the documented contract:
//   GET  /api/events
//   GET  /api/events/:id
//   POST /api/registrations
//   GET  /api/me/registration
//   GET  /api/events/:id/registrations      (organizer only -> 403 otherwise)
// ---------------------------------------------------------------------------

import { MOCK_EVENTS, ORGANIZERS, EVENT_ATTENDEES, CATEGORIES, CAMPUSES } from './mockData'
import { getSession } from '../lib/session'

const STORE_KEY = 'campusconnect.registrations.v1'
const LATENCY = 420

class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

const delay = (ms = LATENCY) => new Promise((r) => setTimeout(r, ms))

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeStore(rows) {
  localStorage.setItem(STORE_KEY, JSON.stringify(rows))
}

function allRegistrations() {
  return readStore()
}

function hydrate(event, session) {
  const organizer = ORGANIZERS[event.organizerId]
  const registrations = allRegistrations().filter((r) => r.eventId === event.id && r.status !== 'cancelled')
  const registeredCount = event.registeredCount + registrations.filter((r) => r.status === 'confirmed').length
  const seatsLeft = Math.max(0, event.capacity - registeredCount)
  const myReg = registrations.find((r) =>
    r.userId ? r.userId === session?.id : r.attendee.email?.toLowerCase() === session?.email?.toLowerCase(),
  )
  const deadline = new Date(event.registrationDeadline).getTime()
  return {
    ...event,
    organizer,
    registeredCount,
    seatsLeft,
    isFull: seatsLeft === 0,
    isPast: new Date(event.endAt).getTime() < Date.now(),
    registrationClosed: deadline < Date.now(),
    closesSoon: deadline > Date.now() && deadline - Date.now() < 1000 * 60 * 60 * 48,
    isRegistered: Boolean(myReg),
    registration: myReg || null,
    isOwner: Boolean(session?.organizerId && session.organizerId === event.organizerId),
  }
}

function matches(event, params) {
  const { q, category, campus, mode, price, dateFrom, dateTo } = params
  if (category && category !== 'all' && event.category !== category) return false
  if (campus && campus !== 'all' && event.campus !== campus) return false
  if (mode && mode !== 'all' && event.mode !== mode) return false
  if (price === 'free' && event.price !== 0) return false
  if (price === 'paid' && event.price === 0) return false
  if (dateFrom && new Date(event.startAt) < new Date(dateFrom)) return false
  if (dateTo && new Date(event.startAt) > new Date(dateTo)) return false
  if (q) {
    const hay = `${event.title} ${event.tagline} ${event.venue} ${event.campus} ${event.tags.join(' ')} ${ORGANIZERS[event.organizerId]?.name || ''}`.toLowerCase()
    if (!hay.includes(q.toLowerCase())) return false
  }
  return true
}

function sortEvents(list, sort) {
  const copy = [...list]
  switch (sort) {
    case 'trending':
      return copy.sort((a, b) => b.registeredCount / b.capacity - a.registeredCount / a.capacity)
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price)
    case 'soonest':
    default:
      return copy.sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
  }
}

// --- GET /api/events -------------------------------------------------------
export async function listEvents(params = {}) {
  await delay()
  const session = getSession()
  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 9)
  const filtered = sortEvents(
    MOCK_EVENTS.filter((e) => matches(e, params)).map((e) => hydrate(e, session)),
    params.sort,
  )
  return {
    data: filtered.slice((page - 1) * pageSize, page * pageSize),
    meta: {
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      facets: {
        totalAll: MOCK_EVENTS.length,
        categories: CATEGORIES.map((c) => ({
          ...c,
          count: MOCK_EVENTS.filter((e) => e.category === c.id).length,
        })),
        campuses: CAMPUSES,

        featured: MOCK_EVENTS.filter((e) => e.featured).map((e) => e.id),
      },
    },
  }
}

// --- GET /api/events/:id ---------------------------------------------------
export async function getEvent(id) {
  await delay(320)
  const event = MOCK_EVENTS.find((e) => e.id === id || e.slug === id)
  if (!event) throw new ApiError(404, 'Event not found')
  const session = getSession()
  const hydrated = hydrate(event, session)
  const related = MOCK_EVENTS.filter(
    (e) => e.id !== event.id && (e.category === event.category || e.organizerId === event.organizerId),
  )
    .slice(0, 3)
    .map((e) => hydrate(e, session))
  return { data: hydrated, meta: { related } }
}

// --- POST /api/registrations ----------------------------------------------
export async function createRegistration(payload) {
  await delay(760)
  const session = getSession()
  const event = MOCK_EVENTS.find((e) => e.id === payload.eventId)
  if (!event) throw new ApiError(404, 'Event not found')

  const rows = allRegistrations()
  const duplicate = rows.find(
    (r) => r.eventId === event.id && r.status !== 'cancelled' &&
      (r.userId === session?.id || r.attendee.email.toLowerCase() === String(payload.email).toLowerCase()),
  )
  if (duplicate) {
    const belongsToSession = duplicate.userId ? duplicate.userId === session?.id : duplicate.attendee.email.toLowerCase() === session?.email?.toLowerCase()
    throw new ApiError(409, 'This event already has a registration for this attendee', belongsToSession ? { registration: duplicate } : undefined)
  }
  if (new Date(event.registrationDeadline).getTime() < Date.now()) {
    throw new ApiError(422, 'Registration has closed for this event')
  }
  const confirmedLocally = rows.filter((r) => r.eventId === event.id && r.status === 'confirmed').length
  const seatsLeft = event.capacity - event.registeredCount - confirmedLocally
  const status = seatsLeft > 0 ? 'confirmed' : 'waitlisted'

  const registration = {
    id: `reg-${Date.now().toString(36)}`,
    eventId: event.id,
    userId: session?.id,
    ticketCode: `CC-${event.id.slice(-3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    status,
    checkedIn: false,
    createdAt: new Date().toISOString(),
    attendee: {
      name: payload.fullName || session?.name,
      email: payload.email,
      phone: payload.phone,
      college: payload.college,
      year: payload.year,
      teamName: payload.teamName || null,
      notes: payload.notes || null,
    },
  }
  rows.unshift(registration)
  writeStore(rows)
  return { data: registration }
}

// --- GET /api/me/registration ---------------------------------------------
export async function getMyRegistration() {
  await delay(300)
  const session = getSession()
  if (!session?.email) return { data: null }
  const rows = allRegistrations().filter((r) =>
    r.userId ? r.userId === session.id : r.attendee.email?.toLowerCase() === session.email?.toLowerCase(),
  )
  const enriched = rows.map((r) => {
    const ev = MOCK_EVENTS.find((e) => e.id === r.eventId)
    return { ...r, event: ev ? hydrate(ev, session) : null }
  })
  enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return { data: enriched[0] || null, meta: { total: enriched.length, all: enriched } }
}

// --- GET /api/events/:id/registrations ------------------------------------
export async function listEventRegistrations(id, params = {}) {
  await delay(480)
  const session = getSession()
  const event = MOCK_EVENTS.find((e) => e.id === id)
  if (!event) throw new ApiError(404, 'Event not found')
  if (!session?.organizerId || session.organizerId !== event.organizerId) {
    throw new ApiError(403, 'Only the organizing team can view the attendee list for this event.')
  }

  const seeded = EVENT_ATTENDEES[event.id] || []
  const extra = allRegistrations()
    .filter((r) => r.eventId === event.id)
    .map((r) => ({
      id: r.id,
      eventId: r.eventId,
      attendee: r.attendee,
      ticketCode: r.ticketCode,
      status: r.status,
      checkedIn: false,
      createdAt: r.createdAt,
    }))
  const rows = [...extra, ...seeded]

  const q = (params.q || '').toLowerCase()
  const filtered = q
    ? rows.filter(
        (r) =>
          r.attendee.name.toLowerCase().includes(q) ||
          r.attendee.email.toLowerCase().includes(q) ||
          r.attendee.college.toLowerCase().includes(q),
      )
    : rows

  return {
    data: filtered,
    meta: {
      total: rows.length,
      confirmed: rows.filter((r) => r.status === 'confirmed').length,
      waitlisted: rows.filter((r) => r.status === 'waitlisted').length,
      checkedIn: rows.filter((r) => r.checkedIn).length,
      capacity: event.capacity,
      event: hydrate(event, session),
    },
  }
}

export { ApiError }
