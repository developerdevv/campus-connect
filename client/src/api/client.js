import * as mock from './mock'
import { getSession } from '../lib/session'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let res
  try {
    const API_BASE = import.meta.env.VITE_API_PROXY || ''
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  const text = await res.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      throw new ApiError(res.status, 'The API returned an invalid response. Check your backend URL and proxy configuration.')
    }
  }

  if (!res.ok) {
    const message =
      payload?.message || payload?.error || `Request failed with status ${res.status}`
    throw new ApiError(res.status, message, payload?.details)
  }
  return payload
}

// Map backend Supabase event model to rich frontend event model
function normalizeEvent(raw, session) {
  if (!raw) return null
  const id = raw.id
  const title = raw.title || 'Untitled Event'
  const capacity = raw.capacity || 100
  const registeredCount = raw.registered_count || raw.registeredCount || 0
  const seatsLeft = Math.max(0, capacity - registeredCount)

  // Derive sensible timestamp fallbacks
  const startAt = raw.timestamp || raw.startAt || new Date(Date.now() + 86400000 * 3).toISOString()
  const endAt = raw.endAt || new Date(new Date(startAt).getTime() + 4 * 3600000).toISOString()
  const registrationDeadline = raw.registrationDeadline || new Date(new Date(startAt).getTime() - 24 * 3600000).toISOString()
  const isPast = new Date(endAt).getTime() < Date.now()
  const registrationClosed = new Date(registrationDeadline).getTime() < Date.now()

  // Derive category and cover
  const lowerTitle = title.toLowerCase()
  let category = 'tech'
  let cover = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'

  if (lowerTitle.includes('robot') || lowerTitle.includes('line follower') || lowerTitle.includes('iot')) {
    category = 'tech'
    cover = 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80'
  } else if (lowerTitle.includes('hack') || lowerTitle.includes('coding') || lowerTitle.includes('web')) {
    category = 'tech'
    cover = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
  } else if (lowerTitle.includes('cultural') || lowerTitle.includes('fest')) {
    category = 'cultural'
    cover = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'
  } else if (lowerTitle.includes('startup') || lowerTitle.includes('pitch')) {
    category = 'startup'
    cover = 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80'
  } else if (lowerTitle.includes('ai') || lowerTitle.includes('machine learning') || lowerTitle.includes('data science') || lowerTitle.includes('cloud')) {
    category = 'workshop'
    cover = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
  }

  const organizerId = raw.organiser_id || raw.organizerId || 'org-general'
  const isOwner = Boolean(session?.id && (session.id === organizerId || session.organizerId === organizerId))

  return {
    id,
    slug: id,
    title,
    tagline: raw.tagline || `Join the ${title} at RV College of Engineering.`,
    description: raw.description || `${title} brings together students, innovators, and industry experts for an immersive and collaborative experience.`,
    category,
    cover,
    mode: raw.mode || 'In person',
    venue: raw.venue || 'Campus Auditorium, Tech Block',
    campus: raw.campus || 'RV College of Engineering',
    city: 'Bengaluru',
    startAt,
    endAt,
    registrationDeadline,
    price: raw.price || 0,
    capacity,
    registeredCount,
    seatsLeft,
    isFull: seatsLeft === 0,
    isPast,
    registrationClosed,
    closesSoon: !registrationClosed && (new Date(registrationDeadline).getTime() - Date.now() < 1000 * 60 * 60 * 48),
    isRegistered: Boolean(raw.isRegistered),
    registration: raw.registration || null,
    featured: Boolean(raw.featured || capacity >= 200),
    organizerId,
    organizer: {
      id: organizerId,
      name: 'Campus Tech & Cultural Council',
      handle: '@campuscouncil',
      initials: 'CC',
      verified: true,
      color: 'from-brand-500 to-accent-500',
      about: 'The official student activity council coordinating technical, cultural and innovation events across campus.',
      eventsHosted: 15,
      followers: 3200,
      contactEmail: 'events@campusconnect.edu',
    },
    isOwner,
    tags: [category.toUpperCase(), 'Campus Event', 'Free Entry'],
    highlights: [
      'Interactive sessions and hands-on demonstrations',
      'Certificates of participation for all registered attendees',
      'Direct networking with mentors and organizers',
    ],
    agenda: [
      { time: '10:00 AM', title: 'Opening & Keynote', detail: 'Welcome address and introduction.' },
      { time: '11:30 AM', title: 'Main Sessions / Challenges', detail: 'Hands-on participation track.' },
      { time: '03:00 PM', title: 'Presentations & Wrap-up', detail: 'Showcase and distribution of certificates.' },
    ],
    speakers: [],
  }
}

export const api = {
  /** GET /api/events — browse events */
  async listEvents(params = {}, opts) {
    if (USE_MOCK) return mock.listEvents(params)

    const session = getSession()
    const res = await request('/events', opts)
    const rawEvents = res.events || []

    // Fetch user registrations if signed in to mark isRegistered
    let registeredEventIds = new Set()
    if (session?.id) {
      try {
        const myRegsRes = await request(`/me/registrations?user_id=${encodeURIComponent(session.id)}`, opts)
        const myRegs = myRegsRes.registrations || []
        myRegs.forEach((r) => registeredEventIds.add(r.event_id))
      } catch (err) {
        console.warn('Could not check user registrations:', err)
      }
    }

    let events = rawEvents.map((e) => {
      const isRegistered = registeredEventIds.has(e.id)
      return normalizeEvent({ ...e, isRegistered }, session)
    })

    // Filter by query and category if specified
    if (params.q) {
      const q = params.q.toLowerCase()
      events = events.filter((e) => e.title.toLowerCase().includes(q) || e.tagline.toLowerCase().includes(q))
    }
    if (params.category && params.category !== 'all') {
      events = events.filter((e) => e.category === params.category)
    }

    return {
      data: events,
      meta: {
        total: events.length,
        page: 1,
        pageSize: events.length,
        totalPages: 1,
        facets: {
          totalAll: rawEvents.length,
          categories: [
            { id: 'tech', label: 'Technology', count: events.filter((e) => e.category === 'tech').length },
            { id: 'cultural', label: 'Cultural', count: events.filter((e) => e.category === 'cultural').length },
            { id: 'workshop', label: 'Workshops', count: events.filter((e) => e.category === 'workshop').length },
            { id: 'startup', label: 'Startup', count: events.filter((e) => e.category === 'startup').length },
          ],
          campuses: ['RV College of Engineering', 'PES University', 'BMS College of Engineering'],
          featured: events.filter((e) => e.featured).map((e) => e.id),
        },
      },
    }
  },

  /** GET /api/events/{id} — event details */
  async getEvent(id, opts) {
    if (USE_MOCK) return mock.getEvent(id)

    const session = getSession()
    const res = await request(`/events/${encodeURIComponent(id)}`, opts)
    const rawEvent = res.event

    let registration = null
    let isRegistered = false

    if (session?.id) {
      try {
        const myRegsRes = await request(`/me/registrations?user_id=${encodeURIComponent(session.id)}`, opts)
        const found = (myRegsRes.registrations || []).find((r) => r.event_id === id)
        if (found) {
          isRegistered = true
          registration = {
            id: found.id,
            eventId: found.event_id,
            userId: found.user_id,
            ticketCode: `CC-${found.id.slice(0, 8).toUpperCase()}`,
            status: 'confirmed',
            createdAt: found.createdAt || new Date().toISOString(),
          }
        }
      } catch (err) {
        console.warn('Could not check registration:', err)
      }
    }

    // Also get registered attendees count
    let registeredCount = 0
    try {
      const attendeesRes = await request(`/events/${encodeURIComponent(id)}/registrations`, opts)
      registeredCount = attendeesRes.total_attendees || 0
    } catch {
      // Ignore if organizer-only or no permission
    }

    const event = normalizeEvent(
      { ...rawEvent, registered_count: registeredCount, isRegistered, registration },
      session,
    )

    return {
      data: event,
      meta: { related: [] },
    }
  },

  /** POST /api/registrations — create registration */
  async createRegistration(payload, opts) {
    if (USE_MOCK) return mock.createRegistration(payload)

    const session = getSession()
    const userId = session?.id || payload.userId

    if (!userId) {
      throw new ApiError(400, 'Please select a signed-in user account from the top menu before registering.')
    }

    const res = await request('/registrations', {
      ...opts,
      method: 'POST',
      body: {
        user_id: userId,
        event_id: payload.eventId,
      },
    })

    const rawReg = res.registration || {}
    const ticketCode = `CC-${(rawReg.id || Math.random().toString(36).slice(2, 8)).slice(0, 8).toUpperCase()}`

    return {
      data: {
        id: rawReg.id || `reg-${Date.now()}`,
        eventId: rawReg.event_id || payload.eventId,
        userId: rawReg.user_id || userId,
        ticketCode,
        status: 'confirmed',
        checkedIn: false,
        createdAt: rawReg.createdAt || new Date().toISOString(),
        attendee: {
          name: payload.fullName || session?.name || 'Registered Attendee',
          email: payload.email || session?.email || '',
          phone: payload.phone || session?.phone || '',
          college: payload.college || session?.college || '',
          year: payload.year || session?.year || '',
          teamName: payload.teamName || null,
          notes: payload.notes || null,
        },
      },
    }
  },

  /** GET /api/me/registration — current user's registrations */
  async getMyRegistration(opts) {
    if (USE_MOCK) return mock.getMyRegistration()

    const session = getSession()
    if (!session?.id) return { data: null, meta: { total: 0, all: [] } }

    const res = await request(`/me/registrations?user_id=${encodeURIComponent(session.id)}`, opts)
    const registrations = res.registrations || []

    // Fetch all events to hydrate registered events
    let allEvents = []
    try {
      const eventsRes = await request('/events', opts)
      allEvents = eventsRes.events || []
    } catch {
      allEvents = []
    }

    const eventMap = new Map(allEvents.map((e) => [e.id, normalizeEvent(e, session)]))

    const enriched = registrations.map((r) => {
      const ev = eventMap.get(r.event_id)
      const ticketCode = `CC-${r.id.slice(0, 8).toUpperCase()}`
      return {
        id: r.id,
        eventId: r.event_id,
        userId: r.user_id,
        ticketCode,
        status: 'confirmed',
        checkedIn: false,
        createdAt: r.createdAt || new Date().toISOString(),
        attendee: {
          name: session.name || 'Student',
          email: session.email || '',
          phone: session.phone || '',
          college: session.college || 'RV College of Engineering',
          year: session.year || 'Student',
        },
        event: ev || {
          id: r.event_id,
          title: 'Registered Event',
          venue: 'Campus Auditorium',
          campus: 'RV College of Engineering',
          startAt: new Date().toISOString(),
          endAt: new Date(Date.now() + 3600000 * 2).toISOString(),
          price: 0,
          cover: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        },
      }
    })

    enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return {
      data: enriched[0] || null,
      meta: {
        total: enriched.length,
        all: enriched,
      },
    }
  },

  /** GET /api/events/{id}/registrations — attendee list */
  async listEventRegistrations(id, params = {}, opts) {
    if (USE_MOCK) return mock.listEventRegistrations(id, params)

    const session = getSession()
    const res = await request(`/events/${encodeURIComponent(id)}/registrations`, opts)
    const rawAttendees = res.attendees || []

    // Fetch event details to get capacity and metadata
    let eventTitle = res.event || 'Campus Event'
    let eventCapacity = 100
    try {
      const evRes = await request(`/events/${encodeURIComponent(id)}`, opts)
      if (evRes.event) {
        eventTitle = evRes.event.title || eventTitle
        eventCapacity = evRes.event.capacity || eventCapacity
      }
    } catch {
      // Fallback
    }

    const rows = rawAttendees.map((a, idx) => {
      const namePart = (a.email || `Attendee ${idx + 1}`).split('@')[0].replace(/[._-]/g, ' ')
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
      return {
        id: a.registration_id || `att-${idx}`,
        eventId: id,
        ticketCode: `CC-${(a.registration_id || '').slice(0, 8).toUpperCase()}`,
        status: 'confirmed',
        checkedIn: false,
        createdAt: new Date().toISOString(),
        attendee: {
          name: formattedName,
          email: a.email,
          phone: '+91 98765 00000',
          college: 'RV College of Engineering',
          year: 'Student',
        },
      }
    })

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
        confirmed: rows.length,
        waitlisted: 0,
        checkedIn: 0,
        capacity: eventCapacity,
        event: {
          id,
          title: eventTitle,
          capacity: eventCapacity,
          registeredCount: rows.length,
          seatsLeft: Math.max(0, eventCapacity - rows.length),
        },
      },
    }
  },
}
