import type { Role } from '../api/types'

// Role -> CSS modifier (see .badge--* in index.css).
const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'badge--admin',
  REVIEWER: 'badge--reviewer',
  USER: 'badge--user',
}

export default function Badge({ role }: { role: Role }) {
  return <span className={`badge ${ROLE_STYLES[role] ?? ''}`}>{role}</span>
}
