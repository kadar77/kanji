import type { AvatarName } from '@/lib/hayaoshi'

// Lucide-style avatar icons (filled where it reads better at small sizes).
function AvatarIcon({ name, size = 22 }: { name: AvatarName; size?: number }) {
  const f = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    stroke: 'none',
  } as const
  const s = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'star':
      return <svg {...f}><path d="M12 2.5l2.7 5.6 6.1.9-4.4 4.3 1.05 6.1L12 16.9l-5.45 2.5 1.05-6.1L3.2 9l6.1-.9z" /></svg>
    case 'heart':
      return <svg {...f}><path d="M12 21s-7-4.6-9.4-9A5 5 0 0 1 12 6.2 5 5 0 0 1 21.4 12c-2.4 4.4-9.4 9-9.4 9z" /></svg>
    case 'moon':
      return <svg {...f}><path d="M21 12.9A9 9 0 1 1 11.1 3 7 7 0 0 0 21 12.9z" /></svg>
    case 'droplet':
      return <svg {...f}><path d="M12 2.7c3.2 3.4 6 6.9 6 10.3a6 6 0 0 1-12 0c0-3.4 2.8-6.9 6-10.3z" /></svg>
    case 'flame':
      return <svg {...f}><path d="M12 2c.6 3-1.4 4.6-2.9 6.5C8 10 7.5 11.6 7.5 13a4.5 4.5 0 0 0 9 0c0-2.3-1.3-3.8-2.3-5.2-.7 1-1.6 1.5-2.6 1.5.6-2.5.5-5-.1-7.3z" /></svg>
    case 'cloud':
      return <svg {...f}><path d="M7 18.5a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.6a4 4 0 0 1-.5 9.9z" /></svg>
    case 'leaf':
      return <svg {...f}><path d="M4.5 19.5c-1-9 5.5-15 15-15 0 10-6 16.5-15 15z" /></svg>
    case 'flower':
      return (
        <svg {...f}>
          <circle cx="12" cy="6.4" r="3.1" />
          <circle cx="17.9" cy="10.6" r="3.1" />
          <circle cx="15.6" cy="17.4" r="3.1" />
          <circle cx="8.4" cy="17.4" r="3.1" />
          <circle cx="6.1" cy="10.6" r="3.1" />
        </svg>
      )
    case 'mountain':
      return <svg {...f}><path d="M3 20l6-11 3.4 6 2.6-4.2L21 20z" /></svg>
    case 'bolt':
      return <svg {...f}><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></svg>
    case 'sun':
      return (
        <svg {...s}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
      )
    case 'snow':
      return (
        <svg {...s}>
          <path d="M12 2v20M2 12h20M4.5 4.5l15 15M19.5 4.5l-15 15" />
        </svg>
      )
    default:
      return <svg {...f}><circle cx="12" cy="12" r="6" /></svg>
  }
}

type Props = {
  avatar: AvatarName
  color?: string
  size?: number
  ring?: string
  dim?: boolean
}

export function PlayerAvatar({ avatar, color, size = 40, ring, dim }: Props) {
  return (
    <div
      className="vs-avatar"
      style={{
        width: size,
        height: size,
        background: color || '#5d7fb0',
        boxShadow: ring ? `0 0 0 2.5px ${ring}` : undefined,
        opacity: dim ? 0.5 : 1,
      }}
    >
      <AvatarIcon name={avatar} size={Math.round(size * 0.54)} />
    </div>
  )
}
