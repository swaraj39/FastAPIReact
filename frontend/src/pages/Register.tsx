// ============================================================
// Register page: collects ALL User + Profile fields in one form.
//
// The submitted payload is a single JSON object with a nested
// `profile` object. The backend SPLITS it across the users table and
// the profiles table (one-to-one) on save.
// ============================================================

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, UserRound } from 'lucide-react'
import { api } from '../api/client'

// Shared auth-card styling (the old `.auth-card` class, as utilities).
const AUTH_CARD_CLS =
  'mx-auto my-[clamp(2rem,8vh,5rem)] w-full max-w-[720px] animate-page-in rounded-lg border border-line bg-surface p-9 shadow-sm'

// Icon-inside-input wrapper (the old `.input-icon` pattern).
const INPUT_ICON_CLS =
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted peer-focus:text-ink'

export default function Register() {
  const navigate = useNavigate()

  // Account (users table) fields.
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Profile (profiles table) fields.
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [age, setAge] = useState('') // kept as string for the number input
  const [dateOfBirth, setDateOfBirth] = useState('') // <input type="date">

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.register({
        username,
        email,
        password,
        // The nested profile object mirrors ProfileCreate on the backend.
        profile: {
          full_name: fullName,
          // Optional fields: send `undefined` when empty so the backend
          // stores NULL instead of an empty string.
          phone: phone || undefined,
          bio: bio || undefined,
          location: location || undefined,
          age: age ? parseInt(age, 10) : undefined,
          date_of_birth: dateOfBirth || undefined,
        },
      })
      // Registration succeeded -> go sign in.
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={AUTH_CARD_CLS}>
      <h1 className="text-center">Create account</h1>
      <p className="mb-6 text-center text-[0.92rem] text-muted">Register to manage products, favorites and orders</p>
      <form onSubmit={handleSubmit}>
        {/* Account section: goes to the users table. */}
        <fieldset>
          <legend>Account</legend>
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
            Email
            <span className="relative block">
              <input
                className="peer pl-[2.4rem]"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
              <Mail size={16} aria-hidden="true" className={INPUT_ICON_CLS} />
            </span>
          </label>
          <label>
            Password
            <span className="relative block">
              <input
                className="peer pl-[2.4rem]"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <Lock size={16} aria-hidden="true" className={INPUT_ICON_CLS} />
            </span>
          </label>
        </fieldset>

        {/* Profile section: goes to the profiles table (one-to-one). */}
        <fieldset>
          <legend>Profile</legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-5">
            <label>
              Full name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label>
              Location
              <input value={location} onChange={(e) => setLocation(e.target.value)} />
            </label>
            <label>
              Age
              <input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} />
            </label>
            <label className="col-span-full">
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </label>
            <label className="col-span-full">
              Bio
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
          </div>
        </fieldset>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Registering…' : 'Register'}
        </button>
      </form>
      <p className="text-muted">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
