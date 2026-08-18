interface SpinnerProps {
  /** Optional text shown next to the spinner. */
  label?: string
}

export function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-line border-t-ink align-middle"
      role="status"
      aria-label="Loading"
    />
  )
}

export default function Loading({ label = 'Loading...' }: SpinnerProps) {
  return (
    <div className="flex items-center gap-[0.6rem] py-4 text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
