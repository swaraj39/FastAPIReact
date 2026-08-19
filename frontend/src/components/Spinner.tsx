// ============================================================
// Spinner / Loading: a reusable loading indicator.
//
// <Spinner />            — just the spinning circle (inline use)
// <Loading label="..." /> — circle + text label (full-width)
//
// Both use Tailwind's `animate-spin` for the rotation and follow
// the same monochrome token palette as the rest of the app.
// ============================================================

interface SpinnerProps {
  /** Optional text shown next to the spinner. */
  label?: string
}

/** A small spinning circle. Use inline where space is tight. */
export function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink align-middle"
      role="status"
      aria-label="Loading"
    />
  )
}

/** Full-width loading indicator with an optional text label. */
export default function Loading({ label = 'Loading...' }: SpinnerProps) {
  return (
    <div className="flex items-center gap-[0.6rem] py-4 text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
