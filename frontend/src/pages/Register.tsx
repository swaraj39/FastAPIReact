// Register page: compact professional form.

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, UserRound } from 'lucide-react'
import { api } from '../api/client'

export default function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [age, setAge] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const rules = [
    { id: 1, text: 'At least 8 characters', valid: password.length >= 8 },
    { id: 2, text: 'One uppercase letter', valid: /[A-Z]/.test(password) },
    { id: 3, text: 'One lowercase letter', valid: /[a-z]/.test(password) },
    { id: 4, text: 'One number', valid: /[0-9]/.test(password) },
    { id: 5, text: 'One special character', valid: /[^A-Za-z0-9]/.test(password) },
  ]

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email'
    return ''
  }

  const validateAge = (e: { target: { value: string } }) => {
    setAge(e.target.value)
    const num = Number(e.target.value)
    if (num < 18 || num > 100) setError('Age must be 18-100')
    else setError('')
  }

  const handleEmail = (e: { target: { value: string } }) => {
    setEmail(e.target.value)
    setError(validateEmail(e.target.value))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.register({
        username,
        email,
        password,
        profile: {
          full_name: fullName,
          phone: phone || undefined,
          bio: bio || undefined,
          location: location || undefined,
          age: age ? parseInt(age, 10) : undefined,
          date_of_birth: dateOfBirth || undefined,
        },
      })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto my-8 w-full max-w-[500px] animate-page-in rounded-lg border border-line bg-surface p-6 shadow-sm">
      <div className="mb-4 flex flex-col items-center gap-2">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white" style={{ background: 'var(--color-accent)' }}>
          F
        </span>
        <h1 className="m-0 text-center text-[1.2rem]">Create account</h1>
        <p className="m-0 text-center text-[0.82rem] text-muted">Register to get started</p>
      </div>
      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Account</legend>
          <label>
            Username
            <span className="relative block">
              <input className="peer pl-8" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" autoComplete="username" required />
              <UserRound size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted peer-focus:text-accent" />
            </span>
          </label>
          <label>
            Email
            <span className="relative block">
              <input className="peer pl-8" type="email" value={email} onChange={handleEmail} placeholder="name@example.com" autoComplete="email" required />
              <Mail size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted peer-focus:text-accent" />
            </span>
          </label>
          <label>
            Password
            <span className="relative block">
              <input className="peer pl-8" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" required />
              <Lock size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted peer-focus:text-accent" />
            </span>
          </label>
          <ul className="m-0 list-none p-0">
            {rules.map((rule) => (
              <li key={rule.id} className={`mb-1 flex items-center gap-1.5 text-[0.78rem] ${rule.valid ? 'text-accent' : 'text-muted'}`}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${rule.valid ? 'bg-accent' : 'bg-line-strong'}`} />
                {rule.text}
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend>Profile</legend>
          <div className="grid grid-cols-2 gap-x-4 max-[500px]:grid-cols-1">
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
              <input type="number" min="0" value={age} onChange={validateAge} />
            </label>
            <label className="col-span-full">
              Date of birth
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </label>
            <label className="col-span-full">
              Bio
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
          </div>
        </fieldset>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Registering…' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center text-[0.8rem] text-muted">
        Already have an account? <Link to="/login" className="link">Sign in</Link>
      </p>
    </div>
  )
}
