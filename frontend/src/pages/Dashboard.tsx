// Dashboard: compact overview page.

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

const STAT_GRID_CLS = 'mb-3 grid grid-cols-3 gap-3 max-[640px]:grid-cols-1'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [info, setInfo] = useState<DashboardInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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
        subtitle={info ? info.message : loading ? 'Loading…' : 'Welcome'}
      />

      {error && <p className="error">{error}</p>}

      {user ? (
        <div className="panel flex items-center gap-3">
          <Avatar name={user.profile?.full_name ?? user.username} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <strong className="text-[0.95rem]">{user.profile?.full_name || user.username}</strong>
              <Badge role={user.role} />
            </div>
            <p className="mt-0.5 break-words text-[0.82rem] text-muted">{user.email}</p>
          </div>
        </div>
      ) : (
        <div className={STAT_GRID_CLS}>
          <Skeleton className="skeleton--card" />
          <Skeleton className="skeleton--card" />
          <Skeleton className="skeleton--card" />
        </div>
      )}

      <div className={STAT_GRID_CLS}>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-sm">
          <span className="stat-card-icon h-9 w-9" aria-hidden="true">
            <Shield size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-[0.95rem] font-bold text-ink">{info?.role ?? (user?.role ?? '—')}</div>
            <div className="text-[0.7rem] uppercase tracking-wider text-muted">Role</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-sm">
          <span className="stat-card-icon h-9 w-9" aria-hidden="true">
            <UserRound size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-[0.95rem] font-bold text-ink">{user?.username ?? '—'}</div>
            <div className="text-[0.7rem] uppercase tracking-wider text-muted">Username</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-sm">
          <span className="stat-card-icon h-9 w-9" aria-hidden="true">
            <Mail size={16} />
          </span>
          <div className="min-w-0">
            <div className="break-words text-[0.88rem] font-bold text-ink">{user?.email ?? '—'}</div>
            <div className="text-[0.7rem] uppercase tracking-wider text-muted">Email</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="mt-0">Quick actions</h2>
        <div className="row">
          <Link to="/products">
            <button type="button" className="btn-secondary">
              <Store size={14} /> Products
            </button>
          </Link>
          <Link to="/profile">
            <button type="button" className="btn-secondary">
              <UserRound size={14} /> Profile
            </button>
          </Link>
          <button type="button" className="btn-danger" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
