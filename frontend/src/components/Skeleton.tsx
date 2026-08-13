interface SkeletonProps {
  /** Extra classes: e.g. "skeleton--card" for a block shape. */
  className?: string
}

export default function Skeleton({ className = 'skeleton--text' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}
