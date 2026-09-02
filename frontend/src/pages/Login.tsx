// Login page: compact professional form.

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      navigate(from ?? '/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto my-12 w-full max-w-[360px] animate-page-in rounded-lg border border-line bg-surface p-6 shadow-sm">
      <div className="mb-4 flex flex-col items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white" style={{ background: 'var(--color-accent)' }}>
          F
        </span>
        <h1 className="m-0 text-center text-[1.2rem]">Sign in</h1>
        <p className="m-0 text-center text-[0.82rem] text-muted">Access your account</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="m-0">
          Username
          <span className="relative block">
            <input
              className="peer pl-8"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              required
            />
            <UserRound size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted peer-focus:text-accent" />
          </span>
        </label>
        <label className="m-0">
          Password
          <span className="relative block">
            <input
              className="peer pl-8"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <Lock size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted peer-focus:text-accent" />
          </span>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-[0.8rem] text-muted">
        No account? <Link to="/register" className="link">Register</Link>
      </p>
    </div>
  )
}
