// Spinner / Loading: compact loading indicator.

interface SpinnerProps {
  label?: string
}

export function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent align-middle"
      role="status"
      aria-label="Loading"
    />
  )
}

export default function Loading({ label = 'Loading...' }: SpinnerProps) {
  return (
    <div className="flex items-center gap-1.5 py-3 text-[0.82rem] text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
