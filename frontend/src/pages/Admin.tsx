// ============================================================
// Admin page (ADMIN role only).
//
//  * Lists all users.
//  * "Products" button fetches /admin/users/:id and shows that user's
//    products - demonstrating ONE-TO-MANY: a User with a products list,
//    eager-loaded server-side via selectinload(User.products).
//  * Delete button removes a user (their profile/products cascade away).
// ============================================================

import { useEffect, useState } from 'react'
import { Package, Trash2, Users } from 'lucide-react'
import { api } from '../api/client'
import type { User, UserWithProducts } from '../api/types'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import ConfirmDialog from '../components/ConfirmDialog'

// Shared stat-grid layout (the old `.stat-grid` class, as utilities).
const STAT_GRID_CLS = 'mb-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4'

// Shared button variants (the old `button.secondary` / `button.danger`).
const BTN_SECONDARY_CLS =
  'border-line-strong bg-surface text-ink hover:border-line-strong hover:bg-surface-2 hover:shadow-none'
const BTN_DANGER_CLS =
  'border-line-strong bg-surface text-ink hover:border-ink hover:bg-ink hover:text-white hover:shadow-none'

export default function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // The detail currently shown in the side panel (one-to-many result).
  const [detail, setDetail] = useState<UserWithProducts | null>(null)

  // The user awaiting a delete confirmation (null = dialog closed).
  const [confirmUser, setConfirmUser] = useState<User | null>(null)

  // Load the full user list once on mount.
  useEffect(() => {
    api
      .adminUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  // Fetch one user WITH their products (ONE-TO-MANY).
  async function showProducts(id: number) {
    setError('')
    setDetail(null)
    try {
      setDetail(await api.adminUserDetail(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
    }
  }

  async function handleDelete(id: number) {
    setError('')
    try {
      await api.adminDeleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      if (detail?.id === id) setDetail(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="animate-page-in">
      <PageHeader
        title="Administration"
        subtitle="Manage platform users and inspect their records"
      />
      {error && <p className="error">{error}</p>}

      <div className="grid grid-cols-2 items-start gap-6 max-[820px]:grid-cols-1">
        {/* Left: all users */}
        <div>
          <h2 className="mt-0">Users</h2>
          {loading ? (
            <div className={STAT_GRID_CLS}>
              <Skeleton className="skeleton--card" />
              <Skeleton className="skeleton--card" />
            </div>
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No users" message="No accounts exist yet." />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-[0.85rem] p-0">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="panel mb-0 flex items-center justify-between gap-4 max-[640px]:flex-col max-[640px]:items-start"
                >
                  <div className="row gap-3 max-[640px]:w-full">
                    <Avatar name={u.profile?.full_name ?? u.username} size="sm" />
                    {/* min-w-0 lets this flex item shrink around long emails. */}
                    <div className="min-w-0">
                      <div className="row gap-[0.35rem]">
                        <strong>{u.username}</strong>
                        <Badge role={u.role} />
                      </div>
                      <p className="mt-[0.15rem] break-words text-muted">{u.email}</p>
                    </div>
                  </div>
                  <div className="row max-[640px]:w-full">
                    <button className={`${BTN_SECONDARY_CLS} max-[640px]:flex-1`} onClick={() => showProducts(u.id)}>
                      Products
                    </button>
                    <button className={`${BTN_DANGER_CLS} max-[640px]:flex-1`} onClick={() => setConfirmUser(u)}>
                      <Trash2 size={14} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: the selected user + their products (ONE-TO-MANY) */}
        <div>
          <h2 className="mt-0">User details</h2>
          {detail ? (
            <div className="panel">
              <div className="row gap-3">
                <Avatar name={detail.profile?.full_name ?? detail.username} size="lg" />
                {/* min-w-0 lets this flex item shrink around long emails. */}
                <div className="min-w-0">
                  <div className="row gap-[0.35rem]">
                    <strong className="text-[1.05rem]">{detail.username}</strong>
                    <Badge role={detail.role} />
                  </div>
                  <p className="mt-[0.15rem] break-words text-muted">{detail.email}</p>
                  {detail.profile?.full_name && (
                    <p className="mt-[0.15rem] break-words text-muted">
                      Full name: {detail.profile.full_name}
                    </p>
                  )}
                </div>
              </div>
              <h3>Products ({detail.products.length})</h3>
              {detail.products.length === 0 ? (
                <p className="text-muted">This user has no products.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-[0.85rem] p-0">
                  {detail.products.map((p) => (
                    <li key={p.id} className="panel mb-0">
                      <strong>{p.name}</strong> — ${p.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="Select a user"
              message='Click "Products" on a user to see their items.'
            />
          )}
        </div>
      </div>

      {/* Delete confirmation replaces the old window.confirm() */}
      <ConfirmDialog
        open={confirmUser !== null}
        title="Delete user?"
        message={
          confirmUser
            ? `Delete "${confirmUser.username}"? Their profile, products, cart and orders will also be removed.`
            : ''
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmUser) handleDelete(confirmUser.id)
          setConfirmUser(null)
        }}
        onCancel={() => setConfirmUser(null)}
      />
    </div>
  )
}
