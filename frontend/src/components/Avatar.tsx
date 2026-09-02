// Avatar: initials-based circle with pure black & red palette.

const PALETTE = ['#0a0a0a', '#1a1a1a', '#2a2a2a', '#3a3a3a', '#dc2626', '#b91c1c', '#991b1b']

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

function colorFrom(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return PALETTE[hash % PALETTE.length]
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  const sizeCls =
    size === 'lg' ? 'h-16 w-16 text-[1.4rem]' : size === 'sm' ? 'h-7 w-7 text-[0.7rem]' : 'h-9 w-9 text-[0.85rem]'
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${sizeCls}`}
      style={{ background: colorFrom(name) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}
