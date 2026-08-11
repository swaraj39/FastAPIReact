import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
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
        e.preventDefault();
        setError('')
        setSaved(false)
        setSubmitting(true)
        try {
            await api.forgotpassword({
                username,
                password
            })
            setSaved(true)
            setPassword('')
            window.setTimeout(() => navigate('/dashboard'), 1500)
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed')
        } finally {
            setSubmitting(false)
        }
    }
    return (
        <div className="auth-card">
            <h1>Forgot password</h1>
            <form onSubmit={forgotCalls}>
                <label>
                    New Password
                    <input value={password} type='password' onChange={(e) => setPassword(e.target.value)} required />
                </label>
                {error && <p className="error">{error}</p>}
                {saved && (
                    <p className="success">Password changed successfully</p>
                )}
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Updating...' : 'Set'}
                </button>
            </form>
            <p className="muted">
                Remembered it? <Link to="/login">Sign in</Link>
            </p>
        </div>
    )
}