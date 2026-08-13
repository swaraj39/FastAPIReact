import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message?: string
}

export default function EmptyState({ icon: Icon, title, message }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon size={42} strokeWidth={1.5} />
      <p className="empty-title">{title}</p>
      {message && <p className="empty-message">{message}</p>}
    </div>
  )
}
