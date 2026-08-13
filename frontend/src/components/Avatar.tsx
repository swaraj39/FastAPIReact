// Avatar: a colored circle with the person's initials. The background
// color is derived deterministically from the name, so the same name
// always gets the same color without needing an image or a table.

const PALETTE = ['#2563eb', '#7c3aed', '#db2777', '#b45309', '#059669', '#0d9488']

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
  const cls = size === 'lg' ? 'avatar avatar--lg' : size === 'sm' ? 'avatar avatar--sm' : 'avatar'
  return (
    <span className={cls} style={{ background: colorFrom(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}