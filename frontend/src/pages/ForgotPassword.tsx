// Change password page: compact professional form.

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, UserRound } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ForgotPassword() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) setUsername(user.username)
  }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSubmitting(true)
    try {
      await api.forgotpassword({ username, password })
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
    <div className="mx-auto my-12 w-full max-w-[360px] animate-page-in rounded-lg border border-line bg-surface p-6 shadow-sm">
      <div className="mb-4 flex flex-col items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white" style={{ background: 'var(--color-accent)' }}>
          F
        </span>
        <h1 className="m-0 text-center text-[1.2rem]">Change password</h1>
        <p className="m-0 text-center text-[0.82rem] text-muted">Set a new password</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="m-0">
          Username
          <span className="relative block">
            <input className="peer pl-8" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <UserRound size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted peer-focus:text-accent" />
          </span>
        </label>
        <label className="m-0">
          New password
          <span className="relative block">
            <input className="peer pl-8" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" required />
            <Lock size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted peer-focus:text-accent" />
          </span>
        </label>
        {error && <p className="error">{error}</p>}
        {saved && <p className="success">Password changed</p>}
        <button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
      <p className="mt-4 text-center text-[0.8rem] text-muted">
        Remembered it? <Link to="/login" className="link">Sign in</Link>
      </p>
    </div>
  )
}
