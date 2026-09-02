import type { Role } from '../api/types'

// Role -> Tailwind classes. Pure black & red only.
const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'badge-admin',
  REVIEWER: 'badge-reviewer',
  USER: 'badge-user',
}

export default function Badge({ role }: { role: Role }) {
  return (
    <span className={`ml-[0.4rem] ${ROLE_STYLES[role] ?? ''}`}>
      {role}
    </span>
  )
}
