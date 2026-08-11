// ============================================================
// AuthContext: global authentication state for the whole app.
//
// It holds the currently logged-in User (or null), exposes login /
// logout helpers, and restores the session on first load if a token
// is stored in localStorage.
//
// Any component can read/write auth state via the useAuth() hook.
// ============================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, clearToken, getToken } from '../api/client'
import type { User } from '../api/types'

// The shape every consumer of this context receives.
interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

// createContext with an undefined default: components must call useAuth()
// INSIDE <AuthProvider>, otherwise useAuth throws a helpful error.
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // `loading` is true while we try to restore the session on mount, so
  // the router doesn't flash the login page for an already-logged-in user.
  const [loading, setLoading] = useState(true)

  // Runs once when the provider mounts. If a token exists, fetch the
  // profile to "log back in"; otherwise stay logged out.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api
      .getProfile() // GET /user/profile with the stored Bearer token
      .then(setUser)
      .catch(() => {
        // Token expired/invalid -> clear it and treat the user as logged out.
        clearToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // login: exchange credentials for a token, then load the user profile
  // so the whole app immediately knows who is logged in.
  const login = useCallback(async (username: string, password: string) => {
    await api.login(username, password)
    const profile = await api.getProfile()
    setUser(profile)
  }, [])

  // logout: forget the token and the in-memory user.
  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  // useMemo avoids rebuilding this object (and re-rendering every
  // consumer) unless one of its inputs actually changed.
  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook used by components to access the auth context.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
