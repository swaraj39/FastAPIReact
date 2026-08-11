// ============================================================
// Dashboard: a small welcome page showing the logged-in user's info
// and a sign-out button.
// ============================================================

import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { DashboardInfo } from '../api/types'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  // `user` comes from AuthContext (set at login / session restore).
  const { user, logout } = useAuth()
  const [info, setInfo] = useState<DashboardInfo | null>(null)
  const [error, setError] = useState('')

  // Fetch /user/dashboard once on mount.
  useEffect(() => {
    api
      .getDashboard()
      .then(setInfo)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <p className="error">{error}</p>}
      {info && (
        <div className="panel">
          {/* The backend message, e.g. "Welcome alice" */}
          <p>{info.message}</p>
          <p>
            Role: <strong>{info.role}</strong>
          </p>
        </div>
      )}
      {user && (
        <div className="panel">
          <p>
            Signed in as <strong>{user.username}</strong> ({user.email})
          </p>
          {/* logout clears the token + user state and redirects to /login
              via the ProtectedRoute guard (user becomes null). */}
          <button className="secondary" onClick={logout}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
