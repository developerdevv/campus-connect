function toIcsDate(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeText(s = '') {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function buildIcs(event) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusConnect//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@campusconnect.app`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.startAt)}`,
    `DTEND:${toIcsDate(event.endAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(`${event.tagline}\n\nOrganized by ${event.organizer?.name || ''}\n\n${event.description}`)}`,
    `LOCATION:${escapeText(`${event.venue}, ${event.campus}, ${event.city}`)}`,
    `URL:${typeof window !== 'undefined' ? new URL(`/events/${encodeURIComponent(event.id)}`, window.location.origin).href : ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}
