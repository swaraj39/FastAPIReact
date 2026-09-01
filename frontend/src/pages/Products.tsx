// ============================================================
// Products page: full CRUD against /products.
//
// The list shows each product's nested `owner` (MANY-TO-ONE): the
// backend eager-loads it with selectinload(Product.owner), so no extra
// requests happen here. Only the owner or an admin sees Edit/Delete.
// ============================================================

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Package,
  Pencil,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { api } from '../api/client'
import type { CartItem, Order, Product } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import ConfirmDialog from '../components/ConfirmDialog'

// Shared button variants (the old `button.secondary` / `button.danger`
// / `button.favorite`).
const BTN_SECONDARY_CLS =
  'border-line-strong bg-surface text-ink hover:border-line-strong hover:bg-surface-2 hover:shadow-none'
const BTN_DANGER_CLS =
  'border-line-strong bg-surface text-ink hover:border-ink hover:bg-ink hover:text-white hover:shadow-none'
const FAVORITE_CLS =
  'border-line-strong bg-surface px-3 py-[0.35rem] text-[0.85rem] text-muted shadow-none hover:border-ink hover:bg-favorite-soft hover:text-ink hover:shadow-none'

export default function Products() {
  // `user` comes from AuthContext; used to decide Edit/Delete rights.
  const { user } = useAuth()
  const toast = useToast()

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

  // Orders placed by the logged-in user (GET /orders), fetched on demand.
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')

  // Cart lines (PENDING items, GET /cart). Checkout approves them into
  // orders.
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')

  // Form state. `editing` is null for "create" mode, or a Product while
  // editing that product.
  const [editing, setEditing] = useState<Product | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  // The product awaiting a delete confirmation (null = dialog closed).
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null)

  const [search, setSearch] = useState('')

  // `useCallback` keeps a stable reference so the useEffect below
  // doesn't refire on every render.
  const load = useCallback(
    async (targetPage: number) => {
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
    },
    [onlyFavorites],
  )

  // Fetch products whenever the page number or the favorites filter changes.
  useEffect(() => {
    load(page)
  }, [load, page])

  // Mount only: fetch the cart once so the badge shows the right count.
  useEffect(() => {
    loadCart()
  }, [])   // ← empty deps = runs once on mount
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
      if (p.is_favorited) {
        await api.unfavoriteProduct(p.id)
        toast.success('Removed from favorites')
      } else {
        await api.favoriteProduct(p.id)
        toast.success('Added to favorites')
      }
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
        quantity: parseInt(quantity)
      }
      if (editing) {
        await api.updateProduct(editing.id, data)
        toast.success('Product updated')
      } else {
        await api.createProduct(data)
        toast.success('Product created')
      }
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
    setQuantity(String(p.quantity))
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteProduct(id)
      toast.success('Product deleted')
      await load(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  // "Buy" now adds to the CART (pending); it only becomes an order after
  // the user approves via checkout.
  async function addToCart(p: Product) {
    setError('')
    try {
      await api.addToCart({ product_id: p.id, quantity: 1 })
      toast.success(`Added "${p.name}" to cart`)
      // Refresh the cart panel if it is open so the new line shows up.
      await loadCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart')
    }
  }

  async function loadCart() {
    setCartError('')
    setCartLoading(true)
    try {
      const newCart = await api.listCart()
      setCart(newCart)
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Failed to load cart')
    } finally {
      setCartLoading(false)
    }
  }

  // Toggle the "My Cart" panel: opening it fetches the cart (GET /cart),
  // closing it hides the panel.
  async function toggleCart() {
    if (cartOpen) {
      setCartOpen(false)
      return
    }
    await loadCart()
    setCartOpen(true)
  }

  async function removeFromCart(id: number) {
    try {
      await api.removeCartItem(id)
      await loadCart()
      await load(page) // refresh product stock display
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Failed to remove item')
    }
  }

  // Increment or decrement the quantity of a cart line.
  async function updateCartQuantity(cartItem: CartItem, delta: number) {
    const newQty = cartItem.quantity + delta
    if (newQty < 1) return
    setCartError('')
    try {
      await api.updateCartItem(cartItem.id, newQty)
      await loadCart()
      await load(page) // refresh product stock display
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Failed to update quantity')
    }
  }

  // Approve: convert every cart line into an order, then refresh both the
  // cart (now empty) and the orders panel.
  async function checkout() {
    setCartError('')
    try {
      const res = await api.checkoutCart()
      toast.success(`${res.orders} order${res.orders === 1 ? '' : 's'} placed`)
      await loadCart()
      setOrders(await api.listOrders())
      if (!ordersOpen) setOrdersOpen(true)
    } catch (err) {
      setCartError(err instanceof Error ? err.message : 'Checkout failed')
    }
  }

  // Permission rule mirroring the backend: owner or ADMIN may manage.
  const canManage = (p: Product) => user?.role === 'ADMIN' || user?.id === p.owner_id

  // Toggle the "My Orders" panel: opening it fetches every order the
  // logged-in user has placed (GET /orders), closing it hides them.
  async function toggleOrders() {
    if (ordersOpen) {
      setOrdersOpen(false)
      return
    }
    setOrdersError('')
    setOrdersLoading(true)
    try {
      setOrders(await api.listOrders())
      setOrdersOpen(true)
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setOrdersLoading(false)
    }
  }

  const cartSubtotal = cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0)
  const ordersTotal = orders.reduce((sum, o) => sum + o.product.price * o.quantity, 0)

  // Filter products by search term (client-side)
  const filteredProducts = search
    ? products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : products

  return (
    <div className="animate-page-in">
      <PageHeader
        title="Products"
        subtitle={
          onlyFavorites
            ? `Your favorite products — ${total} total`
            : `Catalog of ${total} product${total === 1 ? '' : 's'}`
        }
        actions={
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-line-strong bg-surface pl-9 pr-3 py-[0.4rem] text-[0.92rem] text-ink shadow-none focus:border-ink focus:outline-none"
              />
            </div>
            <button
              type="button"
              className={BTN_SECONDARY_CLS}
              onClick={toggleFilter}
              disabled={loading}
            >
              <Heart size={16} aria-hidden="true" />
              {onlyFavorites ? 'All products' : 'Favorites'}
            </button>
            <button
              type="button"
              className={BTN_SECONDARY_CLS}
              onClick={toggleCart}
              disabled={cartLoading}
            >
              <ShoppingCart size={16} aria-hidden="true" />
              {cartOpen ? 'Hide cart' : `My cart (${cart.length})`}
            </button>
            <button
              type="button"
              className={BTN_SECONDARY_CLS}
              onClick={toggleOrders}
              disabled={ordersLoading}
            >
              <Receipt size={16} aria-hidden="true" />
              {ordersLoading ? 'Loading…' : ordersOpen ? 'Hide orders' : 'My orders'}
            </button>
          </>
        }
      />

      {error && <p className="error">{error}</p>}

      {/* Form ON TOP: create/edit a product */}
      {user?.role === 'ADMIN' && (
        <>
          <div className="panel">
            <h2 className="mt-0">
              {editing ? `Edit product #${editing.id}` : 'New product'}
            </h2>
            <form onSubmit={handleSubmit}>
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
              <label>
                Quantity
                <input
                  type="number"
                  step="0"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </label>
              <div className="row">
                <button type="submit">
                  <Plus size={16} aria-hidden="true" />
                  {editing ? 'Save changes' : 'Create'}
                </button>
                {editing && (
                  <button type="button" className={BTN_SECONDARY_CLS} onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
      
      {/* My Cart panel: PENDING items. Checkout approves them -> orders. */}
      {cartError && <p className="error">{cartError}</p>}
      {cartOpen && (
        <div className="panel">
          <div className="row justify-between">
            <h2 className="m-0">
              <ShoppingCart size={18} aria-hidden="true" /> My Cart
              <span className="ml-2 text-[0.85rem] font-normal text-muted">
                ({cart.length} item{cart.length === 1 ? '' : 's'})
              </span>
            </h2>
            <button
              type="button"
              onClick={checkout}
              disabled={cart.length === 0 || cartLoading}
            >
              Checkout ({cartSubtotal.toFixed(2)})
            </button>
          </div>
          {cart.length === 0 ? (
            <p className="text-muted">Your cart is empty.</p>
          ) : (
            <>
              <ul className="m-0 flex list-none flex-col gap-[0.85rem] p-0">
                {cart.map((c) => (
                  <li
                    key={c.id}
                    className="panel mb-0 flex items-center justify-between gap-4 max-[640px]:flex-col max-[640px]:items-start"
                  >
                    <div className="min-w-0 flex-1">
                      <strong>{c.product.name}</strong>
                      <p className="text-muted">
                        ${c.product.price.toFixed(2)} each
                      </p>
                    </div>
                    {/* Quantity controls */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className={BTN_SECONDARY_CLS}
                        onClick={() => updateCartQuantity(c, -1)}
                        disabled={c.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-[0.95rem] font-semibold">
                        {c.quantity}
                      </span>
                      <button
                        type="button"
                        className={BTN_SECONDARY_CLS}
                        onClick={() => updateCartQuantity(c, 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {/* Line total */}
                    <span className="w-20 text-right font-mono text-[0.95rem] font-semibold max-[640px]:w-full max-[640px]:text-left">
                      ${(c.product.price * c.quantity).toFixed(2)}
                    </span>
                    <button
                      className={BTN_SECONDARY_CLS}
                      type="button"
                      onClick={() => removeFromCart(c.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              {/* Cart summary */}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-muted">
                  {cart.reduce((sum, c) => sum + c.quantity, 0)} item{cart.reduce((sum, c) => sum + c.quantity, 0) === 1 ? '' : 's'} in cart
                </span>
                <span className="text-[1.05rem] font-semibold">
                  Subtotal: <strong>${cartSubtotal.toFixed(2)}</strong>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* My Orders panel: every order placed by the logged-in user. */}
      {ordersError && <p className="error">{ordersError}</p>}
      {ordersOpen && (
        <div className="panel">
          <h2 className="mt-0">
            <Receipt size={18} aria-hidden="true" /> My Orders
            <span className="ml-2 text-[0.85rem] font-normal text-muted">
              ({orders.length} order{orders.length === 1 ? '' : 's'})
            </span>
          </h2>
          {orders.length === 0 ? (
            <p className="text-muted">No orders yet.</p>
          ) : (
            <>
              <ul className="m-0 flex list-none flex-col gap-[0.85rem] p-0">
                {orders.map((o) => (
                  <li key={o.id} className="panel mb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <strong>{o.product.name}</strong>
                      <span className="whitespace-nowrap font-mono text-[0.95rem] font-semibold">
                        ${(o.product.price * o.quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[0.85rem] text-muted">
                      <span>
                        ${o.product.price.toFixed(2)} x {o.quantity}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[0.8rem] text-line-strong">
                          #{o.id.slice(0, 8)}
                        </span>
                        <span>{new Date(o.created_at).toLocaleString()}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              {/* Order total */}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-muted">
                  {orders.reduce((sum, o) => sum + o.quantity, 0)} item{orders.reduce((sum, o) => sum + o.quantity, 0) === 1 ? '' : 's'} purchased
                </span>
                <span className="text-[1.05rem] font-semibold">
                  Total: <strong>${ordersTotal.toFixed(2)}</strong>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* List BELOW the form: only 5 products per page. */}
      {loading ? (
        <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          <Skeleton className="skeleton--card" />
          <Skeleton className="skeleton--card" />
          <Skeleton className="skeleton--card" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={onlyFavorites ? 'No favorites yet' : 'No products yet'}
          message={
            onlyFavorites
              ? 'Tap the heart on any product to keep it here.'
              : 'Create the first product using the form above.'
          }
        />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          message={`No products match "${search}". Try a different search.`}
        />
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col gap-[0.85rem] p-0">
              {filteredProducts.map((p) => (
            <li
              key={p.id}
              className="panel mb-0 flex items-center justify-between gap-4 max-[640px]:flex-col max-[640px]:items-start"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <span className="text-[1.02rem] font-semibold text-ink">{p.name}</span>
                  <span className="whitespace-nowrap font-mono text-[1.05rem] font-semibold text-ink">
                    ${p.price.toFixed(2)}
                  </span>
                </div>
                {p.description && <p className="text-muted">{p.description}</p>}
                {/* MANY-TO-ONE: show which user owns this product.
                        p.owner is pre-loaded server-side via selectinload. */}
                <p className="text-muted">
                  Owner: <strong>{p.owner?.username ?? `#${p.owner_id}`}</strong>
                  <span className="ml-3 inline-flex items-center gap-1">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${p.quantity > 0 ? 'bg-green-600' : 'bg-red-500'}`}
                      aria-hidden="true"
                    />
                    {p.quantity > 0 ? `${p.quantity} in stock` : 'Out of stock'}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 max-[640px]:w-full max-[640px]:items-stretch">
                <div className="row max-[640px]:w-full">
                  {/* MANY-TO-MANY: heart shows the current user's
                          favorite state; clicking calls POST/DELETE
                          /products/:id/favorite. */}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(p)}
                    className={`${FAVORITE_CLS} max-[640px]:flex-1 ${p.is_favorited ? 'border-ink bg-ink text-white hover:bg-ink' : ''
                      }`}
                    title={p.is_favorited ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={16} fill={p.is_favorited ? 'currentColor' : 'none'} />
                    Favorite
                  </button>
                  <button
                    type="button"
                    className="max-[640px]:flex-1"
                    onClick={() => addToCart(p)}
                    disabled={p.quantity <= 0}
                  >
                    <ShoppingCart size={16} aria-hidden="true" />
                    {p.quantity <= 0 ? 'Out of stock' : 'Add to cart'}
                  </button>
                </div>
                {canManage(p) && (
                  <div className="row max-[640px]:w-full">
                    <button className={`${BTN_SECONDARY_CLS} max-[640px]:flex-1`} onClick={() => startEdit(p)}>
                      <Pencil size={14} aria-hidden="true" /> Edit
                    </button>
                    <button className={`${BTN_DANGER_CLS} max-[640px]:flex-1`} onClick={() => setConfirmProduct(p)}>
                      <Trash2 size={14} aria-hidden="true" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

          {/* Page controls */}
          <div className="row justify-center">
            <button
              className={BTN_SECONDARY_CLS}
              disabled={page <= 1 || loading}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Prev
            </button>
            <p className="text-muted">
              Page {page} of {pages ?? 1}
            </p>
            <button
              className={BTN_SECONDARY_CLS}
              disabled={page >= pages || loading}
              onClick={() => goToPage(page + 1)}
            >
              Next <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation replaces the old window.confirm() */}
      <ConfirmDialog
        open={confirmProduct !== null}
        title="Delete product?"
        message={
          confirmProduct
            ? `Delete "${confirmProduct.name}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmProduct) handleDelete(confirmProduct.id)
          setConfirmProduct(null)
        }}
        onCancel={() => setConfirmProduct(null)}
      />
    </div>
  )
}
