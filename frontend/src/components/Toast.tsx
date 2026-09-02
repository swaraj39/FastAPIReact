// Toast notifications: success/error with pure black & red theme.

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
      <div className="fixed bottom-5 right-5 z-[100] flex max-w-[min(92vw,380px)] flex-col gap-[0.6rem]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast flex items-center gap-[0.6rem] p-[0.7rem_0.9rem] text-[0.9rem] ${
              t.type === 'error' ? 'toast-error' : 'toast-success'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{t.message}</span>
            <button
              className="ml-auto inline-flex cursor-pointer border-none bg-transparent p-[0.15rem] text-current opacity-70 shadow-none hover:bg-transparent hover:opacity-100 hover:shadow-none"
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
