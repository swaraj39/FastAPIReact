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
import { api } from '../api/client'

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
    <div className="auth-card wide">
      <h1>Create account</h1>
      <form onSubmit={handleSubmit}>
        {/* Account section: goes to the users table. */}
        <fieldset>
          <legend>Account</legend>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </fieldset>

        {/* Profile section: goes to the profiles table (one-to-one). */}
        <fieldset>
          <legend>Profile</legend>
          <div className="form-grid">
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
            <label className="full">
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </label>
            <label className="full">
              Bio
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
          </div>
        </fieldset>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}
