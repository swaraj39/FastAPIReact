interface SpinnerProps {
  /** Optional text shown next to the spinner. */
  label?: string
}

export function Spinner() {
  return <span className="spinner" role="status" aria-label="Loading" />
}

export default function Loading({ label = 'Loading...' }: SpinnerProps) {
  return (
    <div className="loading-block">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}
