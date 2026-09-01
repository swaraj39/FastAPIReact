// ============================================================
// ConfirmDialog: a small modal that asks the user to confirm an
// action before it runs (e.g. deleting a record).
//
// Renders a fixed overlay with the message text plus a Cancel and a
// Confirm button. Pressing Escape or clicking the backdrop cancels.
// The confirm button can be styled as a destructive ("danger") action.
//
// Usage:
//   const [confirming, setConfirming] = useState<Product | null>(null)
//   ...
//   <ConfirmDialog
//     open={confirming !== null}
//     title="Delete product?"
//     message={`Delete "${confirming?.name}"?`}
//     confirmLabel="Delete"
//     confirmVariant="danger"
//     onConfirm={() => { if (confirming) doDelete(confirming.id); setConfirming(null) }}
//     onCancel={() => setConfirming(null)}
//   />
// ============================================================

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  /** Whether the dialog is visible (renders nothing when false). */
  open: boolean
  /** Optional heading shown above the message. */
  title?: string
  /** The text describing what is about to happen. */
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** 'primary' = solid black button; 'danger' = destructive outline. */
  confirmVariant?: 'primary' | 'danger'
  /** Called when the user clicks Confirm. */
  onConfirm: () => void
  /** Called when the user cancels (Cancel button, Escape, backdrop). */
  onCancel: () => void
}

// Secondary button style used for Cancel (matches `button.secondary`).
const BTN_SECONDARY_CLS =
  'border-line-strong bg-surface text-ink hover:border-line-strong hover:bg-surface-2 hover:shadow-none'

// Destructive confirm style (matches `button.danger`).
const BTN_DANGER_CLS =
  'border-line-strong bg-surface text-ink hover:border-ink hover:bg-ink hover:text-white hover:shadow-none'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // While open: close on Escape and lock the page scroll so the
  // background can't move behind the modal.
  useEffect(() => {
    // if the dialog is not open when the open is false
    if (!open) return
    // when user enter the escape the cancel is called 
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    // scrolling is not there 
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    // it will not excetue it only remembers it and excutes when the dependency changes 
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/40 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'confirm-dialog-title' : undefined}
      aria-describedby="confirm-dialog-message"
    >
      <div
        className="w-full max-w-md animate-page-in rounded-lg border border-line bg-surface p-6 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="confirm-dialog-title" className="m-0">
            {title}
          </h2>
        )}
        <p id="confirm-dialog-message" className="mt-2 break-words text-[0.95rem] text-muted">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className={BTN_SECONDARY_CLS} onClick={onCancel} autoFocus>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmVariant === 'danger' ? BTN_DANGER_CLS : ''}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
