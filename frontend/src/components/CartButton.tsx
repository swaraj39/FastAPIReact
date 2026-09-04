// CartButton: floating circular button at bottom-right, visible on every page.
// Shows cart item count as a badge. Click opens the CartPopup modal.

import { ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function CartButton() {
  const { user } = useAuth()
  const { cartCount, openCart } = useCart()

  if (!user) return null

  return (
    <button
      type="button"
      onClick={openCart}
      className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
      style={{ background: 'var(--color-accent)' }}
      aria-label="Open cart"
    >
      <ShoppingCart size={20} />
      {cartCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[0.65rem] font-bold text-white">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  )
}
