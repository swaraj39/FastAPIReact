import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message?: string
}

export default function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-4 py-10 text-center text-muted">
      <Icon size={32} strokeWidth={1.5} className="text-line-strong" />
      <p className="m-0 text-[0.92rem] font-medium text-ink">{title}</p>
      {message && <p className="m-0 text-[0.82rem]">{message}</p>}
    </div>
  )
}
