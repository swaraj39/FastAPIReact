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
import { api } from '../api/client'
import type { User, UserWithProducts } from '../api/types'

export default function Admin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // The detail currently shown in the side panel (one-to-many result).
  const [detail, setDetail] = useState<UserWithProducts | null>(null)

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
    if (!window.confirm('Delete this user?')) return
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
    <div>
      <h1>Admin</h1>
      {error && <p className="error">{error}</p>}

      <div className="two-col">
        {/* Left: all users */}
        <div>
          <h2>Users</h2>
          {loading ? (
            <p className="muted">Loading...</p>
          ) : users.length === 0 ? (
            <p className="muted">No users.</p>
          ) : (
            <ul className="list">
              {users.map((u) => (
                <li key={u.id} className="panel">
                  <div>
                    <strong>{u.username}</strong> <span className="badge">{u.role}</span>
                    <p className="muted">{u.email}</p>
                  </div>
                  <div className="row">
                    <button className="secondary" onClick={() => showProducts(u.id)}>
                      Products
                    </button>
                    <button className="danger" onClick={() => handleDelete(u.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: the selected user + their products (ONE-TO-MANY) */}
        <div>
          <h2>User details</h2>
          {detail ? (
            <div className="panel">
              <p>
                <strong>{detail.username}</strong> <span className="badge">{detail.role}</span>
              </p>
              <p className="muted">{detail.email}</p>
              {detail.profile && <p className="muted">Full name: {detail.profile.full_name}</p>}
              <h3>Products ({detail.products.length})</h3>
              {detail.products.length === 0 ? (
                <p className="muted">This user has no products.</p>
              ) : (
                <ul className="list">
                  {detail.products.map((p) => (
                    <li key={p.id} className="panel">
                      <strong>{p.name}</strong> — ${p.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="muted">Click "Products" on a user to see their items.</p>
          )}
        </div>
      </div>
    </div>
  )
}
