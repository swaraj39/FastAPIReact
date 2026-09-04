// ============================================================
// CartContext: global cart state shared across all pages.
//
// Any component can read the cart (badge count in navbar, cart
// panel on products page, future checkout page) and mutate it
// via addToCart / removeFromCart / updateQuantity.
//
// The provider auto-fetches the cart when a user is logged in
// and clears it on logout.
// ============================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/client'
import type { CartItem } from '../api/types'
import { useAuth } from './AuthContext'

// The shape every consumer of this context receives.
interface CartContextValue {
  cart: CartItem[]
  loading: boolean
  error: string
  cartCount: number
  cartTotal: number
  cartOpen: boolean
  openCart: () => void
  closeCart: () => void
  loadCart: () => Promise<void>
  addToCart: (productId: number) => Promise<void>
  removeFromCart: (id: number) => Promise<void>
  updateQuantity: (id: number, quantity: number) => Promise<void>
  checkout: () => Promise<{ orders: number }>
  clearError: () => void
}

// createContext with an undefined default: components must call useCart()
// INSIDE <CartProvider>, otherwise useCart throws a helpful error.
const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cartOpen, setCartOpen] = useState(false)

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  // Fetch the current user's cart from the backend.
  const loadCart = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const items = await api.listCart()
      setCart(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }, [])

  // Add a product to the cart, then refresh so the panel stays in sync.
  const addToCart = useCallback(async (productId: number) => {
    setError('')
    try {
      await api.addToCart({ product_id: productId, quantity: 1 })
      await loadCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart')
      throw err
    }
  }, [loadCart])

  // Remove a cart line by its id, then refresh.
  const removeFromCart = useCallback(async (id: number) => {
    setError('')
    try {
      await api.removeCartItem(id)
      await loadCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item')
      throw err
    }
  }, [loadCart])

  // Update the quantity of a cart line, then refresh.
  const updateQuantity = useCallback(async (id: number, quantity: number) => {
    setError('')
    try {
      await api.updateCartItem(id, quantity)
      await loadCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
      throw err
    }
  }, [loadCart])

  // Checkout: convert all cart lines into orders, then refresh (empties cart).
  const checkout = useCallback(async () => {
    setError('')
    try {
      const res = await api.checkoutCart()
      await loadCart()
      return res
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      throw err
    }
  }, [loadCart])

  const clearError = useCallback(() => setError(''), [])

  // Auto-fetch the cart when a user is logged in; clear when logged out.
  useEffect(() => {
    if (user) {
      loadCart()
    } else {
      setCart([])
      setError('')
      setCartOpen(false)
    }
  }, [user, loadCart])

  // Derived values — memoized so consumers don't re-render unnecessarily.
  const cartCount = cart.length
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const value = useMemo(
    () => ({ cart, loading, error, cartCount, cartTotal, cartOpen, openCart, closeCart, loadCart, addToCart, removeFromCart, updateQuantity, checkout, clearError }),
    [cart, loading, error, cartCount, cartTotal, cartOpen, openCart, closeCart, loadCart, addToCart, removeFromCart, updateQuantity, checkout, clearError],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Hook used by components to access the cart context.
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
