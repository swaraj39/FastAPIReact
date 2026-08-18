import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message?: string
}

export default function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-[0.6rem] rounded-lg border border-dashed border-line-strong bg-surface px-4 py-12 text-center text-muted">
      <Icon size={42} strokeWidth={1.5} className="text-line-strong" />
      <p className="m-0 font-serif font-semibold text-ink">{title}</p>
      {message && <p className="m-0 text-[0.92rem]">{message}</p>}
    </div>
  )
}
