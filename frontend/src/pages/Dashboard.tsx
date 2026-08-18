// ============================================================
// Dashboard: a formal overview page showing the logged-in user's
// account summary and quick links into the rest of the app.
// ============================================================

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Shield, Store, UserRound } from 'lucide-react'
import { api } from '../api/client'
import type { DashboardInfo } from '../api/types'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'

// Shared stat-grid layout (the old `.stat-grid` class, as utilities).
const STAT_GRID_CLS = 'mb-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4'

// Shared secondary-button variant (the old `button.secondary`).
const BTN_SECONDARY_CLS =
  'border-line-strong bg-surface text-ink hover:border-line-strong hover:bg-surface-2 hover:shadow-none'

export default function Dashboard() {
  // `user` comes from AuthContext (set at login / session restore).
  const { user, logout } = useAuth()
  const [info, setInfo] = useState<DashboardInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Fetch /user/dashboard once on mount.
  useEffect(() => {
    api
      .getDashboard()
      .then(setInfo)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-page-in">
      <PageHeader
        title="Dashboard"
        subtitle={
          info ? info.message : loading ? 'Loading your account summary…' : 'Welcome'
        }
      />

      {error && <p className="error">{error}</p>}

      {user ? (
        <div className="panel flex items-center gap-4">
          <Avatar name={user.profile?.full_name ?? user.username} size="lg" />
          {/* min-w-0 lets this flex item shrink around long emails. */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-[1.1rem]">{user.profile?.full_name || user.username}</strong>
              <Badge role={user.role} />
            </div>
            <p className="mt-[0.2rem] break-words text-muted">{user.email}</p>
          </div>
        </div>
      ) : (
        <div className={STAT_GRID_CLS}>
          <Skeleton className="skeleton--card" />
          <Skeleton className="skeleton--card" />
          <Skeleton className="skeleton--card" />
        </div>
      )}

      {/* Account summary stat cards */}
      <div className={STAT_GRID_CLS}>
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-5 shadow-sm">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white" aria-hidden="true">
            <Shield size={20} />
          </span>
          {/* min-w-0 lets the card shrink around long values (emails) on
              narrow grids; break-words then wraps them inside the card. */}
          <div className="min-w-0">
            <div className="break-words text-[1.15rem] font-bold leading-tight text-ink">
              {info?.role ?? (user?.role ?? '—')}
            </div>
            <div className="text-[0.8rem] uppercase tracking-[0.06em] text-muted">Role</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-5 shadow-sm">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white" aria-hidden="true">
            <UserRound size={20} />
          </span>
          <div className="min-w-0">
            <div className="break-words text-[1.15rem] font-bold leading-tight text-ink">
              {user?.username ?? '—'}
            </div>
            <div className="text-[0.8rem] uppercase tracking-[0.06em] text-muted">Username</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-line bg-surface p-5 shadow-sm">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-white" aria-hidden="true">
            <Mail size={20} />
          </span>
          <div className="min-w-0">
            <div className="break-words text-[0.95rem] font-bold leading-tight text-ink">
              {user?.email ?? '—'}
            </div>
            <div className="text-[0.8rem] uppercase tracking-[0.06em] text-muted">Email</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="panel">
        <h2 className="mt-0">Quick actions</h2>
        <div className="row">
          <Link to="/products">
            <button type="button" className={BTN_SECONDARY_CLS}>
              <Store size={16} aria-hidden="true" /> Browse products
            </button>
          </Link>
          <Link to="/profile">
            <button type="button" className={BTN_SECONDARY_CLS}>
              <UserRound size={16} aria-hidden="true" /> Edit profile
            </button>
          </Link>
          <button
            type="button"
            className="border-line-strong bg-surface text-ink hover:border-ink hover:bg-ink hover:text-white hover:shadow-none"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
