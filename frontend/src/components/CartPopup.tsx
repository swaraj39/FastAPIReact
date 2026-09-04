// CartPopup: modal overlay showing the current user's cart.
// Fetches products API on open to display live stock alongside each cart item.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { api } from '../api/client'
import type { Product } from '../api/types'

export default function CartPopup() {
  const {
    cart,
    loading,
    error,
    cartCount,
    cartTotal,
    cartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    checkout,
  } = useCart()

  const onCancelRef = useRef(closeCart)
  onCancelRef.current = closeCart

  // Products fetched on open so we can show live stock info.
  const [products, setProducts] = useState<Product[]>([])

  // Escape-to-close + body scroll lock + fetch products.
  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancelRef.current()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)

    // Fetch products so stock info is available for each cart item.
    api
      .listProducts(undefined, 1, 100)
      .then((res) => setProducts(res.items))
      .catch(() => {})

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [])
cartOpen
  // Lookup map: product id -> stock quantity.
  const stockMap = new Map(products.map((p) => [p.id, p.quantity]))

  if (!cartOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={closeCart}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-line bg-surface shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="m-0 flex items-center gap-2 text-[1rem]">
            <ShoppingCart size={18} aria-hidden="true" /> My Cart
            <span className="text-[0.85rem] font-normal text-muted">
              ({cartCount} item{cartCount === 1 ? '' : 's'})
            </span>
          </h2>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded border border-line bg-transparent p-0 text-muted transition-colors hover:text-ink"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && <p className="error">{error}</p>}
          {loading ? (
            <div className="flex flex-col gap-[0.75rem] py-1" role="status" aria-label="Loading cart">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="panel mb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-accent/20" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-accent/10" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-accent/10" />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-7 w-7 animate-pulse rounded bg-accent/15" />
                    <div className="h-4 w-8 animate-pulse rounded bg-accent/10" />
                    <div className="h-7 w-7 animate-pulse rounded bg-accent/15" />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-4 w-16 animate-pulse rounded bg-accent/10" />
                    <div className="h-7 w-7 animate-pulse rounded bg-accent/15" />
                  </div>
                </div>
              ))}
            </div>
          ) : cart.length === 0 ? (
            <p className="text-muted">Your cart is empty.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-[0.75rem] p-0">
              {cart.map((c) => {
                const stock = stockMap.get(c.product.id)
                const outOfStock = stock !== undefined && stock <= 0
                return (
                  <li
                    key={c.id}
                    className="panel mb-0 flex items-center justify-between gap-3 max-[480px]:flex-col max-[480px]:items-start"
                  >
                    <div className="min-w-0 flex-1">
                      <strong className="text-[0.92rem]">{c.product.name}</strong>
                      <p className="text-[0.82rem] text-muted">
                        ${c.product.price.toFixed(2)} each
                      </p>
                      {stock !== undefined && (
                        <p className={`text-[0.78rem] ${outOfStock ? 'text-danger' : 'text-muted'}`}>
                          {outOfStock
                            ? 'Out of stock'
                            : `${stock} in stock`}
                        </p>
                      )}
                    </div>
                    {/* Quantity controls */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => updateQuantity(c.id, c.quantity - 1)}
                        disabled={c.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-[0.92rem] font-semibold">
                        {c.quantity}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => updateQuantity(c.id, c.quantity + 1)}
                        disabled={stock !== undefined && c.quantity >= stock}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {/* Line total + remove */}
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="w-20 text-right font-mono text-[0.92rem] font-semibold max-[480px]:w-auto max-[480px]:text-left">
                        ${(c.product.price * c.quantity).toFixed(2)}
                      </span>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => removeFromCart(c.id)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3">
            <span className="text-[0.85rem] text-muted">
              Subtotal: <strong className="text-ink">${cartTotal.toFixed(2)}</strong>
            </span>
            <button
              type="button"
              onClick={checkout}
              disabled={loading}
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
