// ============================================================
// Global loading state manager.
//
// Tracks the number of in-flight HTTP requests and exposes
// show()/hide() helpers so the axios interceptor (outside React)
// can trigger the overlay without circular imports.
// ============================================================

type Listener = (loading: boolean) => void

let activeRequests = 0
let loading = false
const listeners = new Set<Listener>()

function emit(next: boolean) {
  if (loading === next) return
  loading = next
  listeners.forEach((fn) => fn(next))
}

/** Increment the counter and notify listeners. */
export function showLoading() {
  activeRequests++
  emit(true)
}

/** Decrement the counter and notify when zero. */
export function hideLoading() {
  activeRequests = Math.max(0, activeRequests - 1)
  if (activeRequests === 0) emit(false)
}

/** Subscribe to loading-state changes. Returns an unsubscribe fn. */
export function onLoadingChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Read the current value (for initial render). */
export function isLoading(): boolean {
  return loading
}
