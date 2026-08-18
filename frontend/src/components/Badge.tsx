import type { Role } from '../api/types'

// Role -> Tailwind classes (the badge base is shared below).
// Monochrome hierarchy: ADMIN is a solid black block, REVIEWER is an
// outlined badge, USER is a muted gray badge.
const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'border-ink bg-ink text-white',
  REVIEWER: 'border-ink bg-white text-ink',
  USER: 'border-line-strong bg-surface-2 text-[#5c5c57]',
}

export default function Badge({ role }: { role: Role }) {
  return (
    <span
      className={`ml-[0.4rem] inline-block rounded-full border border-line-strong bg-surface-2 px-[0.6rem] py-[0.16rem] align-middle text-[0.68rem] font-semibold uppercase tracking-[0.04em] text-ink ${ROLE_STYLES[role] ?? ''}`}
    >
      {role}
    </span>
  )
}
