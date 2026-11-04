import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_USERS, getSession, setSession } from '../lib/session'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [user, setUser] = useState(() => getSession())

  useEffect(() => {
    const sync = () => setUser(getSession())
    window.addEventListener('campusconnect:session', sync)
    return () => window.removeEventListener('campusconnect:session', sync)
  }, [])

  const switchUser = useCallback((id) => {
    setSession(id)
    setUser(getSession())
  }, [])

  const value = useMemo(
    () => ({ user, users: DEMO_USERS, switchUser, isOrganizer: user?.role === 'organizer' }),
    [user, switchUser],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
