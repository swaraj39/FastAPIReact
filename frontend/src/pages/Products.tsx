// ============================================================
// Products page: full CRUD against /products.
//
// The list shows each product's nested `owner` (MANY-TO-ONE): the
// backend eager-loads it with selectinload(Product.owner), so no extra
// requests happen here. Only the owner or an admin sees Edit/Delete.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import type { Product } from '../api/types'
import { useAuth } from '../context/AuthContext'

export default function Products() {
  // `user` comes from AuthContext; used to decide Edit/Delete rights.
  const { user } = useAuth()

  // Server data + UI state.
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // MANY-TO-MANY: when true, load only the current user's favorites
  // (GET /products/favorites) instead of the full catalog.
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  // Form state. `editing` is null for "create" mode, or a Product while
  // editing that product.
  const [editing, setEditing] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')

  // `useCallback` keeps a stable reference so the useEffect below
  // doesn't refire on every render.
  const load = useCallback(async (targetPage: number) => {
    setLoading(true)
    setError('')
    try {
      const res = onlyFavorites
        ? await api.listFavorites(targetPage, 5)
        : await api.listProducts(undefined, targetPage, 5)
      setProducts(res.items)
      setTotal(res.total)
      setPage(res.page)
      setPages(res.pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [onlyFavorites])

  // Fetch products whenever the page number or the favorites filter changes.
  useEffect(() => {
    load(page)
  }, [load, page])

  // Flip the favorites filter: jump back to page 1 and reload.
  function toggleFilter() {
    const next = !onlyFavorites
    setOnlyFavorites(next)
    setPage(1)
    setProducts([])
    if (!next) resetForm()
  }

  // MANY-TO-MANY: add/remove the current user <-> product link, then
  // reload so the backend re-stamps is_favorited on every product.
  async function toggleFavorite(p: Product) {
    setError('')
    try {
      if (p.is_favorited) await api.unfavoriteProduct(p.id)
      else await api.favoriteProduct(p.id)
      await load(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update favorite')
    }
  }

  // Jump to a page (clamped so it never goes past the last page).
  function goToPage(target: number) {
    if (target < 1 || target > pages) return
    resetForm()
    setPage(target)
  }

  // Empty the form (used after create and when cancelling an edit).
  function resetForm() {
    setEditing(null)
    setName('')
    setDescription('')
    setPrice('')
  }

  // Submit handler shared by create + edit.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = {
        name,
        description: description || null,
        price: parseFloat(price), // convert the string input to a number
      }
      if (editing) await api.updateProduct(editing.id, data)
      else await api.createProduct(data)
      resetForm()
      await load(page) // refresh the current page after saving
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  // Pre-fill the form with the product being edited.
  function startEdit(p: Product) {
    setEditing(p)
    setName(p.name)
    setDescription(p.description ?? '')
    setPrice(String(p.price))
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this product?')) return
    try {
      await api.deleteProduct(id)
      await load(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  // Permission rule mirroring the backend: owner or ADMIN may manage.
  const canManage = (p: Product) => user?.role === 'ADMIN' || user?.id === p.owner_id

  return (
    <div>
      <h1>Products</h1>
      {error && <p className="error">{error}</p>}

      {/* Form ON TOP: create/edit a product */}
      <h2>{editing ? `Edit product #${editing.id}` : 'New product'}</h2>
      <form onSubmit={handleSubmit} className="panel">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label>
          Price
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
        <div className="row">
          <button type="submit">{editing ? 'Save changes' : 'Create'}</button>
          {editing && (
            <button type="button" className="secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List BELOW the form: only 5 products per page.
          The filter button switches between the full catalog and the
          current user's favorites (MANY-TO-MANY). */}
      <div className="row">
        <h2>{onlyFavorites ? 'My favorites' : 'All products'}</h2>
        <button
          type="button"
          className="secondary"
          onClick={toggleFilter}
          disabled={loading}
        >
          {onlyFavorites ? 'Show all products' : '♥ My favorites'}
        </button>
      </div>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : products.length === 0 ? (
        <p className="muted">{onlyFavorites ? 'No favorites yet.' : 'No products yet.'}</p>
      ) : (
        <>
          <ul className="list">
            {products.map((p) => (
              <li key={p.id} className="panel">
                <div>
                  <strong>{p.name}</strong> — ${p.price.toFixed(2)}
                  {p.description && <p className="muted">{p.description}</p>}
                  {/* MANY-TO-MANY: heart shows the current user's favorite
                      state; clicking calls POST/DELETE /products/:id/favorite. */}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(p)}
                    className={p.is_favorited ? 'favorite active' : 'favorite'}
                    title={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {p.is_favorited ? '♥' : '♡'} Favorite
                  </button>
                  {/* MANY-TO-ONE: show which user owns this product.
                      p.owner is pre-loaded server-side via selectinload. */}
                  <p className="muted">
                    owner: <strong>{p.owner?.username ?? `#${p.owner_id}`}</strong>
                  </p>
                </div>
                {canManage(p) && (
                  <div className="row">
                    <button className="secondary" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="danger" onClick={() => handleDelete(p.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <br></br>
          {/* Page controls */}
          <div className="row">
            <button
              className="secondary"
              disabled={page <= 1 || loading}
              onClick={() => goToPage(page - 1)}
            >
              Prev
            </button>
            <p className="muted">
              Page {page} of {pages ?? 1} ({total} products)
            </p>
            <button
              className="secondary"
              disabled={page >= pages || loading}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
