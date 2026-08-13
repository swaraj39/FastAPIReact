// ============================================================
// Profile page: edit account (users table) and profile
// (profiles table, one-to-one) fields in one form.
//
// Initial values come from the AuthContext user; changes are sent as a
// single flattened body to /user/update.
// ============================================================

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  // Read the current user from context to pre-fill the form.
  const { user } = useAuth()

  // Local form state for every editable field.
  // const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [age, setAge] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Whenever `user` becomes available, copy its values into the form.
  // `?.` safely handles a null profile (e.g. legacy users).
  useEffect(() => {
    if (user) {
      // setUsername(user.username)
      setEmail(user.email)
      setFullName(user.profile?.full_name ?? '')
      setPhone(user.profile?.phone ?? '')
      setBio(user.profile?.bio ?? '')
      setLocation(user.profile?.location ?? '')
      setAge(user.profile?.age != null ? String(user.profile.age) : '')
      setDateOfBirth(user.profile?.date_of_birth ?? '')
    }
  }, [user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setSubmitting(true)
    try {
      // One flattened body; the backend splits account vs profile fields.
      await api.updateProfile({
        // username,
        email,
        full_name: fullName || undefined,
        phone: phone || undefined,
        bio: bio || undefined,
        location: location || undefined,
        age: age ? parseInt(age, 10) : undefined,
        date_of_birth: dateOfBirth || undefined,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1>Profile</h1>
      <form onSubmit={handleSubmit} className="panel">
        <div className="form-grid">
          {/* Account fields */}
          {/*<label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>*/}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          {/* Profile fields (one-to-one) */}
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
        {error && <p className="error">{error}</p>}
        {saved && <p className="success">Profile updated.</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
