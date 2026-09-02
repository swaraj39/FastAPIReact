// LoadingOverlay: full-screen loading overlay.

import { useEffect, useState } from 'react'
import { onLoadingChange, isLoading } from '../api/loadingState'

export default function LoadingOverlay() {
  const [visible, setVisible] = useState(isLoading)

  useEffect(() => onLoadingChange(setVisible), [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-canvas/80 backdrop-blur-sm"
      style={{ pointerEvents: 'all' }}
    >
      <span
        className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent"
        role="status"
        aria-label="Loading"
      />
      <span className="text-[0.82rem] text-muted">Please wait…</span>
    </div>
  )
}
