// ============================================================
// Full-screen loading overlay.
//
// Covers the entire viewport with a semi-transparent backdrop
// and a centered spinner. pointer-events blocks every click,
// so no button, link, or shortcut can fire while a request
// is in flight.
//
// Uses the shared loadingState module so the axios interceptor
// can drive it without React context.
// ============================================================

import { useEffect, useState } from 'react'
import { onLoadingChange, isLoading } from '../api/loadingState'

export default function LoadingOverlay() {
  const [visible, setVisible] = useState(isLoading)

  useEffect(() => onLoadingChange(setVisible), [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-canvas/70 backdrop-blur-sm"
      style={{ pointerEvents: 'all' }}
    >
      {/* Large spinning circle */}
      <span
        className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-[3px] border-line border-t-ink"
        role="status"
        aria-label="Loading"
      />
      <span className="text-[0.95rem] font-medium text-muted">Please wait…</span>
    </div>
  )
}
