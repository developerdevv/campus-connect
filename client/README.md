# CampusConnect frontend

A responsive React + Tailwind CSS frontend for event discovery and registration. It includes search and filters, event details, a registration flow, a ticket wallet, and an organizer-only attendee list with search and CSV export.

## Run locally

Requires Node.js **20.19+** (or 22.12+).

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. The default is **demo mode**: event data is local, registration records stay in this browser's local storage, and no payment or email is sent. Use the account menu to switch between the student and CodeCraft organizer personas. The organizer can view the attendee list for **HackBLR** only. Sample attendees and events are fictional.

Build the production bundle with `npm run build`; `npm run preview` serves the resulting `dist` folder. A deployment serving the SPA needs a history fallback to `index.html` for routes such as `/events/evt-001`.

## Connect a backend

Copy `.env.example` to `.env.local` and set:

```dotenv
VITE_USE_MOCK=false
VITE_API_PROXY=http://localhost:8080
```

Restart Vite after changing environment variables. `VITE_API_PROXY` is optional: when set, Vite forwards `/api/*` to the backend during development. Without it, the API must be served at the same origin as the frontend. In production, configure your web server or reverse proxy to forward `/api/*` to your backend. The browser always makes **relative** requests; it never calls a hard-coded localhost URL. Requests include cookies (`credentials: 'include'`).

No authentication endpoint or response schemas were provided, so this frontend does not implement sign-in. In live mode the demo account switcher is hidden; the backend must identify the current user using its own session mechanism. `GET /api/events/{id}/registrations` **must enforce organizer ownership on the server**. The UI handles a 403, but client-side hiding is not authorization.

### API expectations

The five endpoint paths and methods are implemented in `src/api/client.js`. The UI currently assumes JSON envelopes with `data` and an optional `meta`. These are integration assumptions, not a claim about an existing backend contract; adjust the client and data mapping to match your actual request/response schemas.

| Request | Expected response |
| --- | --- |
| `GET /api/events` | `{ data: Event[], meta: { total, page, pageSize, totalPages, facets: { totalAll, categories, campuses } } }` |
| `GET /api/events/{id}` | `{ data: Event, meta: { related: Event[] } }` |
| `POST /api/registrations` | `{ data: Registration }` (a 409 may return `{ message, details: { registration } }`) |
| `GET /api/me/registration` | `{ data: RegistrationWithEvent \| null, meta?: { total, all: RegistrationWithEvent[] } }` |
| `GET /api/events/{id}/registrations` | `{ data: Registration[], meta: { total, confirmed, waitlisted, checkedIn, capacity, event: Event } }`; return 403 unless the user owns the event |

Event browsing sends `q`, `category`, `campus`, `mode`, `price`, `dateFrom`, `dateTo`, `sort`, `page`, and `pageSize` as optional query parameters. The attendee list sends an optional `q`.

The registration request body is currently:

```json
{
  "eventId": "evt-001",
  "fullName": "Example Student",
  "email": "student@example.edu",
  "phone": "+91 98765 43210",
  "college": "Example College",
  "year": "2nd year",
  "teamName": "optional",
  "notes": "optional"
}
```

The UI's assumed `Event` fields are illustrated by `src/api/mockData.js` and the `hydrate` function in `src/api/mock.js`: `id`, `title`, `tagline`, `description`, `category`, `cover`, `mode`, `venue`, `campus`, `city`, ISO dates `startAt`, `endAt`, `registrationDeadline`, numeric `price` **in rupees**, `capacity`, `registeredCount`, `seatsLeft`, `isFull`, `isPast`, `isRegistered`, `isOwner`, `tags`, and an `organizer` object. Optional detail fields include `highlights`, `agenda`, `speakers`, and `registration`. The optional `isOwner` flag controls whether a link to the attendee list is shown; server-side authorization remains mandatory. `Registration` contains `id`, `eventId`, `ticketCode`, `status`, `createdAt`, `checkedIn`, and an `attendee` object with contact details. The current-user registration should include its `event` object for the ticket display. Errors should be JSON with a `message` (and optionally `details`).

For a backend that uses different field names, nested objects, pagination, or authentication, adapt the mapping in `src/api/client.js` and the UI as needed. The mock adapter is a convenient executable example of the expected shapes; it is **not** a secure backend.

## Notes and scope

- The referenced Figma design could not be accessed from this environment (403), so the visual design is an original approximation rather than a pixel-perfect implementation.
- Demo registrations are stored locally. Do not use demo mode for real personal data or production permissions.
- The QR code encodes the ticket code. A backend check-in/verification scanner is not included.
- Payment processing, email notifications, cancellation, and event creation are not implemented by the supplied endpoint list. Paid events explicitly indicate that payment is not collected in the frontend.
- Event cover artwork in `public/covers` is generated sample imagery.

## Structure

- `src/pages/` — discovery, event details, ticket wallet, attendee dashboard
- `src/components/` — reusable cards, filters, header, dialog, QR code
- `src/api/client.js` — switchable API client
- `src/api/mock.js`, `src/api/mockData.js` — browser-only demo adapter and data
- `src/context/` — demo session and toast state
