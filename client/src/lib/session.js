// Session store supporting both live DB users and persona switching.
const KEY = 'campusconnect.session.v1'

export const LIVE_USERS = [
  {
    id: '44957b6d-6aee-464b-8e42-5fc39c7bbe95',
    name: 'Student 1',
    email: 'student1_00fd24@example.com',
    phone: '+91 98765 43210',
    college: 'RV College of Engineering',
    year: '2nd year',
    role: 'student',
    organizerId: null,
    initials: 'S1',
    label: 'Student',
  },
  {
    id: 'cd114fba-9b78-4a54-a007-2bcb897a75e8',
    name: 'Student 4',
    email: 'student4_ff4708@example.com',
    phone: '+91 98765 43214',
    college: 'RV College of Engineering',
    year: '3rd year',
    role: 'student',
    organizerId: null,
    initials: 'S4',
    label: 'Student (Active Tickets)',
  },
  {
    id: 'fa002179-3f9c-4749-bc43-5c59cca6b729',
    name: 'Hemant Sharma',
    email: 'hemant.sharma@intellipaat.com',
    phone: '+91 90000 12345',
    college: 'RV College of Engineering',
    year: 'Faculty / Staff',
    role: 'organizer',
    organizerId: 'fa002179-3f9c-4749-bc43-5c59cca6b729',
    initials: 'HS',
    label: 'Organizer',
  },
  {
    id: '77f8d63e-8d5c-47d2-943e-27385963c882',
    name: 'Organiser 4',
    email: 'organiser4_ddaab0@example.com',
    phone: '+91 90000 98765',
    college: 'Campus Tech Council',
    year: 'Faculty / Lead',
    role: 'organizer',
    organizerId: '77f8d63e-8d5c-47d2-943e-27385963c882',
    initials: 'O4',
    label: 'Lead Organizer (15 events)',
  },
]

export const DEMO_USERS = LIVE_USERS

export function getSession() {
  try {
    const id = JSON.parse(localStorage.getItem(KEY) || 'null')
    return LIVE_USERS.find((u) => u.id === id) || LIVE_USERS[0]
  } catch {
    return LIVE_USERS[0]
  }
}

export function setSession(userId) {
  localStorage.setItem(KEY, JSON.stringify(userId))
  window.dispatchEvent(new CustomEvent('campusconnect:session'))
}
