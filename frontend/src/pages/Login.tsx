// ============================================================
// Login page: a controlled form that signs the user in.
//
// On success it navigates back to the page the user tried to open
// (stored in location.state by ProtectedRoute), else to /dashboard.
// ============================================================

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Shared auth-card styling (the old `.auth-card` class, as utilities).
const AUTH_CARD_CLS =
  'mx-auto my-[clamp(2rem,8vh,5rem)] w-full max-w-[420px] animate-page-in rounded-lg border border-line bg-surface p-9 shadow-sm'

// Icon-inside-input wrapper (the old `.input-icon` pattern).
const INPUT_ICON_CLS =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted peer-focus:text-ink'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Controlled inputs: React state is the single source of truth for
  // the form's values.
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault() // stop the browser's default form reload
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      // Read where the user originally wanted to go (if any) and go there.
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from ?? '/dashboard', { replace: true })
    } catch (err) {
      // Show the backend's error message (e.g. "Invalid username or password").
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={AUTH_CARD_CLS}>
      <h1 className="text-center">Sign in</h1>
      <p className="mb-6 text-center text-[0.92rem] text-muted">Access your account securely</p>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <span className="relative block">
            <input
              className="peer pl-[2.4rem]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jane.doe"
              autoComplete="username"
              required
            />
            <UserRound size={16} aria-hidden="true" className={INPUT_ICON_CLS} />
          </span>
        </label>
        <label>
          Password
          <span className="relative block">
            <input
              className="peer pl-[2.4rem]"
              type="password" // hides the text with dots
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <Lock size={16} aria-hidden="true" className={INPUT_ICON_CLS} />
          </span>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-muted">
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}
