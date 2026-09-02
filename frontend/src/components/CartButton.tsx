// CartButton: floating circular button at bottom-right, visible on every page.
// Shows cart item count as a badge. Click opens the Products page with cart open.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function CartButton() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!user) return
    api.listCart().then((cart) => setCount(cart.length)).catch(() => {})
  }, [user])

  if (!user) return null

  return (
    <button
      type="button"
      onClick={() => navigate('/products', { state: { openCart: true } })}
      className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
      style={{ background: 'var(--color-accent)' }}
      aria-label="Open cart"
    >
      <ShoppingCart size={20} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[0.65rem] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
