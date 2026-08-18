// Avatar: a circle with the person's initials. The background tone
// is derived deterministically from the name, so the same name always
// gets the same grayscale shade without needing an image or a table.

const PALETTE = ['#111111', '#2b2b2b', '#404040', '#555555', '#6b6b6b', '#7d7d7d']

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
  // Size variants (the shared circle styling sits on the base class).
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
