// ============================================================
// Change password page: lets the signed-in user set a new password.
//
// The current user's username is pre-filled from context; the new
// password is sent to POST /user/forgot. On success the user is
// redirected to the dashboard.
// ============================================================

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, UserRound } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

// Shared auth-card styling (the old `.auth-card` class, as utilities).
const AUTH_CARD_CLS =
  'mx-auto my-[clamp(2rem,8vh,5rem)] w-full max-w-[420px] animate-page-in rounded-lg border border-line bg-surface p-9 shadow-sm'

// Icon-inside-input wrapper (the old `.input-icon` pattern).
const INPUT_ICON_CLS =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted peer-focus:text-ink'

export default function ForgotPassword() {
  // Read the current user from context to pre-fill the form.
  const { user } = useAuth()
  const navigate = useNavigate()

  // Local form state.
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Whenever `user` becomes available, copy its username into the form.
  useEffect(() => {
    if (user) {
      setUsername(user.username)
    }
  }, [user])

  async function forgotCalls(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSubmitting(true)
    try {
      await api.forgotpassword({
        username,
        password,
      })
      setSaved(true)
      setPassword('')
      window.setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={AUTH_CARD_CLS}>
      <h1 className="text-center">Change password</h1>
      <p className="mb-6 text-center text-[0.92rem] text-muted">Set a new password for your account</p>
      <form onSubmit={forgotCalls}>
        <label>
          Username
          <span className="relative block">
            <input
              className="peer pl-[2.4rem]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <UserRound size={16} aria-hidden="true" className={INPUT_ICON_CLS} />
          </span>
        </label>
        <label>
          New password
          <span className="relative block">
            <input
              className="peer pl-[2.4rem]"
              value={password}
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <Lock size={16} aria-hidden="true" className={INPUT_ICON_CLS} />
          </span>
        </label>
        {error && <p className="error">{error}</p>}
        {saved && <p className="success">Password changed successfully</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <p className="text-muted">
        Remembered it? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
