// ---------------------------------------------------------------------------
// Seed data for the mock API. Shape mirrors what the real backend returns so
// switching VITE_USE_MOCK=false (or proxying /api) requires no UI changes.
// ---------------------------------------------------------------------------

const NOW = new Date()

/** Build an ISO timestamp `dayOffset` days from today at `hour:minute` local. */
function at(dayOffset, hour, minute = 0) {
  const d = new Date(NOW)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const CAMPUSES = [
  'RV College of Engineering',
  'PES University',
  'BMS College of Engineering',
  'IIM Bangalore',
  'Christ University',
]

export const CATEGORIES = [
  { id: 'tech', label: 'Technology', emoji: '💻' },
  { id: 'cultural', label: 'Cultural', emoji: '🎭' },
  { id: 'sports', label: 'Sports', emoji: '🏆' },
  { id: 'workshop', label: 'Workshops', emoji: '🛠️' },
  { id: 'startup', label: 'Startup & Business', emoji: '🚀' },
  { id: 'music', label: 'Music', emoji: '🎶' },
]

export const ORGANIZERS = {
  'org-codecraft': {
    id: 'org-codecraft',
    name: 'CodeCraft Club',
    handle: '@codecraft',
    initials: 'CC',
    verified: true,
    color: 'from-indigo-500 to-violet-500',
    about:
      'The official coding club of RV College of Engineering. We run hackathons, weekly build nights and open-source sprints for 1,200+ student developers.',
    eventsHosted: 34,
    followers: 2480,
  },
  'org-rangoli': {
    id: 'org-rangoli',
    name: 'Rangoli Cultural Society',
    handle: '@rangoli',
    initials: 'RC',
    verified: true,
    color: 'from-rose-500 to-orange-400',
    about:
      'Dance, drama, design and everything in between. Rangoli has been the cultural heartbeat of the campus since 2009.',
    eventsHosted: 58,
    followers: 5120,
  },
  'org-robotics': {
    id: 'org-robotics',
    name: 'Robotics & Automation Lab',
    handle: '@roboticslab',
    initials: 'RL',
    verified: true,
    color: 'from-teal-500 to-emerald-500',
    about:
      'Hands-on robotics workshops, line-follower leagues and ROS bootcamps run by the Mechatronics department.',
    eventsHosted: 21,
    followers: 1340,
  },
  'org-eclub': {
    id: 'org-eclub',
    name: 'E-Cell Bengaluru',
    handle: '@ecellblr',
    initials: 'EC',
    verified: true,
    color: 'from-amber-500 to-orange-500',
    about:
      'Student-run entrepreneurship cell connecting founders with mentors, angels and their first 100 users.',
    eventsHosted: 46,
    followers: 3890,
  },
  'org-athletics': {
    id: 'org-athletics',
    name: 'Athletics Council',
    handle: '@athletics',
    initials: 'AC',
    verified: false,
    color: 'from-sky-500 to-blue-600',
    about: 'Inter-college leagues, marathons and fitness bootcamps across the city.',
    eventsHosted: 29,
    followers: 1760,
  },
  'org-swaraj': {
    id: 'org-swaraj',
    name: 'Swaraj Music Collective',
    handle: '@swarajmusiq',
    initials: 'SM',
    verified: false,
    color: 'from-fuchsia-500 to-purple-600',
    about: 'Open mics, acoustic evenings and jam rooms for campus musicians.',
    eventsHosted: 17,
    followers: 980,
  },
}

const EVENTS = [
  {
    id: 'evt-001',
    slug: 'hackblr-24-hour-hackathon',
    title: 'HackBLR — 24 Hour Hackathon',
    tagline: 'Ship a working prototype overnight with 300 builders, 40 mentors and free pizza.',
    description:
      'HackBLR is the flagship overnight hackathon of CodeCraft Club. Teams of 2–4 pick a problem statement from sustainability, campus life, or fintech, and get a full 24 hours with mentors from Swiggy, Zerodha and Google. Every team gets a table, power strips, unlimited coffee, and three mentor check-ins. Final demos are judged on working prototype, originality and pitch quality.',
    category: 'tech',
    cover: '/covers/hackathon.jpg',
    mode: 'In person',
    venue: 'Innovation Hub, Block C',
    campus: 'RV College of Engineering',
    city: 'Bengaluru',
    startAt: at(6, 9, 0),
    endAt: at(7, 11, 0),
    registrationDeadline: at(4, 23, 59),
    price: 0,
    capacity: 320,
    registeredCount: 268,
    featured: true,
    organizerId: 'org-codecraft',
    tags: ['Hackathon', 'Team event', 'Overnight', 'Free food'],
    highlights: [
      '₹1,00,000 prize pool across three tracks',
      '40 industry mentors on the floor all night',
      'Free swag kit + dinner and midnight snacks',
      'Certificates for every participant',
    ],
    agenda: [
      { time: 'Day 1 · 09:00', title: 'Check-in & team formation', detail: 'Bring your college ID. Solo builders can join a team at the matchmaking desk.' },
      { time: 'Day 1 · 10:30', title: 'Problem statement reveal', detail: 'Three tracks announced on the main stage.' },
      { time: 'Day 1 · 12:00', title: 'Hacking begins', detail: 'Mentor rounds every four hours.' },
      { time: 'Day 2 · 08:00', title: 'Code freeze & submissions' },
      { time: 'Day 2 · 10:00', title: 'Final demos + results', detail: 'Top 12 teams pitch to the judges panel.' },
    ],
    speakers: [
      { name: 'Ananya Rao', role: 'Staff Engineer, Zerodha', initials: 'AR' },
      { name: 'Karthik Menon', role: 'Engineering Manager, Swiggy', initials: 'KM' },
      { name: 'Priya Deshpande', role: 'DevRel, Google India', initials: 'PD' },
    ],
  },
  {
    id: 'evt-002',
    slug: 'rangoli-cultural-fest',
    title: 'Rangoli 2026 — Cultural Fest',
    tagline: 'Two evenings of dance, drama and street food across four stages.',
    description:
      'The 17th edition of Rangoli brings together 60+ performing teams from 14 colleges. Expect classical fusion, a capella battles, improv duels, a street-food bazaar and a headline set by a surprise indie act on the closing night.',
    category: 'cultural',
    cover: '/covers/cultural.jpg',
    mode: 'In person',
    venue: 'Open Air Theatre',
    campus: 'Christ University',
    city: 'Bengaluru',
    startAt: at(12, 16, 0),
    endAt: at(13, 22, 30),
    registrationDeadline: at(10, 23, 59),
    price: 199,
    capacity: 1500,
    registeredCount: 1214,
    featured: true,
    organizerId: 'org-rangoli',
    tags: ['Festival', 'Dance', 'Food stalls', 'Day pass'],
    highlights: ['60+ competing teams', 'Street-food bazaar with 25 stalls', 'Surprise headline act on day two'],
    agenda: [
      { time: 'Day 1 · 16:00', title: 'Gates open + bazaar' },
      { time: 'Day 1 · 17:30', title: 'Classical fusion finals' },
      { time: 'Day 1 · 20:00', title: 'Improv & stand-up showcase' },
      { time: 'Day 2 · 18:00', title: 'Battle of the bands' },
      { time: 'Day 2 · 21:00', title: 'Headline act + closing ceremony' },
    ],
    speakers: [{ name: 'Meera Nair', role: 'Festival Director', initials: 'MN' }],
  },
  {
    id: 'evt-003',
    slug: 'robotics-automation-workshop',
    title: 'Build a Line-Follower in a Day',
    tagline: 'Hands-on robotics workshop — hardware kits included, take yours home.',
    description:
      'A beginner-friendly, fully hands-on workshop where you assemble, wire and program a line-following robot. Kits, soldering stations and Arduino IDE setups are provided. No prior robotics experience needed; basic C helps. The afternoon includes a timed track challenge with leaderboard prizes.',
    category: 'workshop',
    cover: '/covers/robotics.jpg',
    mode: 'In person',
    venue: 'Mechatronics Lab, 2nd floor',
    campus: 'BMS College of Engineering',
    city: 'Bengaluru',
    startAt: at(9, 10, 0),
    endAt: at(9, 17, 0),
    registrationDeadline: at(8, 18, 0),
    price: 750,
    capacity: 40,
    registeredCount: 33,
    featured: false,
    organizerId: 'org-robotics',
    tags: ['Beginner friendly', 'Kit included', 'Certificate'],
    highlights: ['Take home the robot kit', 'Track challenge with prizes', 'Limited to 40 seats'],
    agenda: [
      { time: '10:00', title: 'Electronics refresher' },
      { time: '11:30', title: 'Chassis assembly + wiring' },
      { time: '14:00', title: 'Programming the sensor array' },
      { time: '16:00', title: 'Timed track challenge' },
    ],
    speakers: [{ name: 'Dr. Suresh Iyer', role: 'Lab Head, Mechatronics', initials: 'SI' }],
  },
  {
    id: 'evt-004',
    slug: 'campus-pitch-day',
    title: 'Campus Pitch Day — Meet the Angels',
    tagline: 'Pitch your student venture to 12 angel investors and 200 peers.',
    description:
      'Ten shortlisted student teams get five minutes each on stage in front of a panel of angels, followed by a 15-minute breakout with mentors. Non-pitching attendees can sit in the audience, join the founder networking lounge, and book 1:1 mentor slots through the app.',
    category: 'startup',
    cover: '/covers/startup.jpg',
    mode: 'In person',
    venue: 'Auditorium, Main Block',
    campus: 'IIM Bangalore',
    city: 'Bengaluru',
    startAt: at(18, 14, 0),
    endAt: at(18, 19, 30),
    registrationDeadline: at(16, 23, 59),
    price: 0,
    capacity: 250,
    registeredCount: 96,
    featured: true,
    organizerId: 'org-eclub',
    tags: ['Pitching', 'Networking', 'Mentors'],
    highlights: ['12 angel investors on the panel', '1:1 mentor slots', 'Founder networking lounge'],
    agenda: [
      { time: '14:00', title: 'Registration & coffee' },
      { time: '14:45', title: 'Keynote: from dorm room to Series A' },
      { time: '15:30', title: 'Ten pitches, five minutes each' },
      { time: '18:00', title: 'Feedback panel + networking' },
    ],
    speakers: [
      { name: 'Rohit Bansal', role: 'Angel, ex-Flipkart', initials: 'RB' },
      { name: 'Divya Kamath', role: 'Partner, Blume Ventures', initials: 'DK' },
    ],
  },
  {
    id: 'evt-005',
    slug: 'inter-college-basketball',
    title: 'Inter-College Basketball League',
    tagline: 'Sixteen teams. Three days. One trophy.',
    description:
      'The annual 5v5 knockout league returns with 16 college teams. Register as a squad of up to 10 players with one captain contact. Fixtures are published 48 hours before tip-off; referees and medical support are on site.',
    category: 'sports',
    cover: '/covers/sports.jpg',
    mode: 'In person',
    venue: 'Outdoor Courts, North Campus',
    campus: 'PES University',
    city: 'Bengaluru',
    startAt: at(21, 8, 30),
    endAt: at(23, 18, 0),
    registrationDeadline: at(19, 20, 0),
    price: 500,
    capacity: 160,
    registeredCount: 144,
    featured: false,
    organizerId: 'org-athletics',
    requiresTeam: true,
    tags: ['Team event', 'Knockout', 'Trophy'],
    highlights: ['16 teams, knockout format', 'Certified referees', 'Player-of-the-tournament award'],
    agenda: [
      { time: 'Day 1', title: 'Group stage' },
      { time: 'Day 2', title: 'Quarter finals' },
      { time: 'Day 3', title: 'Semis, final & presentation' },
    ],
    speakers: [],
  },
  {
    id: 'evt-006',
    slug: 'acoustic-evening-lawn',
    title: 'Acoustic Evening on the Lawn',
    tagline: 'Bring a blanket, we bring the string lights and the music.',
    description:
      'An unplugged open mic under the stars: three student bands, an open call for solo performers, and a chai-and-maggi counter. Bring your own instrument to sign up for the five-minute open mic slots at the gate.',
    category: 'music',
    cover: '/covers/music.jpg',
    mode: 'In person',
    venue: 'Central Lawn',
    campus: 'Christ University',
    city: 'Bengaluru',
    startAt: at(3, 18, 30),
    endAt: at(3, 21, 30),
    registrationDeadline: at(2, 20, 0),
    price: 0,
    capacity: 220,
    registeredCount: 187,
    featured: false,
    organizerId: 'org-swaraj',
    tags: ['Open mic', 'Free entry', 'Chill'],
    highlights: ['Five-minute open mic slots', 'Three student bands', 'Chai & maggi counter'],
    agenda: [
      { time: '18:30', title: 'Doors open' },
      { time: '19:00', title: 'Open mic round 1' },
      { time: '20:00', title: 'Featuring: The 9AM Lecture' },
      { time: '21:00', title: 'Closing jam' },
    ],
    speakers: [],
  },
  {
    id: 'evt-007',
    slug: 'ai-agents-workshop-online',
    title: 'Building AI Agents — Live Online',
    tagline: 'From prompt loops to tool-use: build a working agent in 3 hours.',
    description:
      'A live, online, build-along workshop. You will write a tool-using agent that books campus lab slots, add memory, and evaluate it. Recording and starter repo are shared with every registered attendee.',
    category: 'tech',
    cover: '/covers/hackathon.jpg',
    mode: 'Online',
    venue: 'Zoom (link on registration)',
    campus: 'Open to all campuses',
    city: 'Online',
    startAt: at(14, 19, 0),
    endAt: at(14, 22, 0),
    registrationDeadline: at(14, 17, 0),
    price: 149,
    capacity: 500,
    registeredCount: 402,
    featured: false,
    organizerId: 'org-codecraft',
    tags: ['Online', 'Recording included', 'Intermediate'],
    highlights: ['Live build-along with Q&A', 'Starter repo + recording', 'Take-home evaluation harness'],
    agenda: [
      { time: '19:00', title: 'Agent mental models' },
      { time: '19:45', title: 'Tool use & retrieval' },
      { time: '20:45', title: 'Memory and evaluation' },
      { time: '21:30', title: 'Q&A and next steps' },
    ],
    speakers: [{ name: 'Nikhil Jain', role: 'AI Engineer, Sarvam', initials: 'NJ' }],
  },
  {
    id: 'evt-008',
    slug: 'design-systems-bootcamp',
    title: 'Design Systems Bootcamp',
    tagline: 'Tokens, components and docs — ship a mini design system in a day.',
    description:
      'A hands-on bootcamp for student designers and front-end devs. We build a token layer, three accessible components and a documentation page, then wire it into a sample product. Bring a laptop with Figma and VS Code.',
    category: 'workshop',
    cover: '/covers/cultural.jpg',
    mode: 'In person',
    venue: 'Design Studio, 4th floor',
    campus: 'PES University',
    city: 'Bengaluru',
    startAt: at(27, 10, 0),
    endAt: at(27, 16, 30),
    registrationDeadline: at(25, 23, 59),
    price: 350,
    capacity: 60,
    registeredCount: 24,
    featured: false,
    organizerId: 'org-rangoli',
    tags: ['Design', 'Hands-on', 'Lunch included'],
    highlights: ['Build 3 accessible components', 'Figma → code workflow', 'Lunch + kit included'],
    agenda: [
      { time: '10:00', title: 'Tokens & foundations' },
      { time: '11:30', title: 'Component anatomy' },
      { time: '14:00', title: 'Docs & handoff' },
      { time: '15:30', title: 'Critique circle' },
    ],
    speakers: [{ name: 'Tara Shetty', role: 'Design Lead, Razorpay', initials: 'TS' }],
  },
]

// --- attendees -------------------------------------------------------------

const FIRST = ['Aarav', 'Diya', 'Ishan', 'Sneha', 'Kabir', 'Ananya', 'Rhea', 'Vivaan', 'Nikhil', 'Tara', 'Aditi', 'Arjun']
const LAST = ['Sharma', 'Iyer', 'Patel', 'Nair', 'Reddy', 'Bose', 'Kulkarni', 'Menon', 'Gupta', 'Rao']
const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'Postgraduate']

function seedAttendees(eventId, count) {
  const out = []
  for (let i = 0; i < count; i++) {
    const name = `${FIRST[(i * 5 + eventId.length) % FIRST.length]} ${LAST[(i * 3 + 1) % LAST.length]}`
    out.push({
      id: `reg-${eventId}-${1000 + i}`,
      eventId,
      attendee: {
        name,
        email: `${name.split(' ')[0].toLowerCase()}.${i}@college.edu`,
        college: CAMPUSES[i % CAMPUSES.length],
        year: YEARS[i % YEARS.length],
        phone: `+91 9${(800000000 + i * 1234567) % 1000000000}`,
      },
      ticketCode: `CC-${eventId.slice(-3).toUpperCase()}-${(4820 + i * 7).toString(36).toUpperCase()}`,
      status: 'confirmed',
      checkedIn: false,
      createdAt: at(-1 - (i % 9), 10 + (i % 8), 15),
    })
  }
  return out
}

export const EVENT_ATTENDEES = Object.fromEntries(
  EVENTS.map((e) => [e.id, seedAttendees(e.id, e.registeredCount)]),
)

export const TICKET_EXTRA = (i) => ({
  ticketCode: `CC-HB-${(9420 + i).toString(36).toUpperCase()}`,
})

export const MOCK_EVENTS = EVENTS
