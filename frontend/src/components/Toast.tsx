// Toast notifications: a global provider + hook so any component can
// push a success/error message that appears in the bottom-right corner
// and auto-dismisses. Wrap the app in <ToastProvider> (see main.tsx).

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => remove(id), AUTO_DISMISS_MS)
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast('success', message),
      error: (message) => toast('error', message),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{t.message}</span>
            <button
              className="toast-close"
              onClick={() => remove(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
