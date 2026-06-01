import type { SVGProps } from 'react'

export type IconName =
  | 'home'
  | 'layers'
  | 'cap'
  | 'zap'
  | 'search'
  | 'x'
  | 'left'
  | 'right'
  | 'flip'
  | 'star'
  | 'play'
  | 'check'
  | 'pencil'
  | 'brush'
  | 'volume'
  | 'shuffle'
  | 'eye'
  | 'menu-h'
  | 'flame'
  | 'calendar'
  | 'logout'
  | 'trash'
  | 'sliders'
  | 'sun'
  | 'moon'
  | 'sysdot'
  | 'maximize'
  | 'users'

type Props = Omit<SVGProps<SVGSVGElement>, 'name' | 'stroke'> & {
  name: IconName
  size?: number
  stroke?: number
}

export function Icon({ name, size = 20, stroke = 1.6, ...rest }: Props) {
  const props: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  }
  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...props}>
          <path d="M12 3l9 5-9 5-9-5 9-5z" />
          <path d="M3 13l9 5 9-5" />
          <path d="M3 17l9 5 9-5" />
        </svg>
      )
    case 'cap':
      return (
        <svg {...props}>
          <path d="M2 9l10-5 10 5-10 5-10-5z" />
          <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
        </svg>
      )
    case 'zap':
      return (
        <svg {...props}>
          <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
        </svg>
      )
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      )
    case 'x':
      return (
        <svg {...props}>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </svg>
      )
    case 'left':
      return (
        <svg {...props}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      )
    case 'right':
      return (
        <svg {...props}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      )
    case 'flip':
      return (
        <svg {...props}>
          <path d="M3 7v6h6" />
          <path d="M21 17v-6h-6" />
          <path d="M21 7a9 9 0 0 0-15-3M3 17a9 9 0 0 0 15 3" />
        </svg>
      )
    case 'star':
      return (
        <svg {...props}>
          <path d="M12 3l2.6 5.5 6 .9-4.3 4.2 1 6-5.3-2.8L6.7 19.6l1-6L3.4 9.4l6-.9L12 3z" />
        </svg>
      )
    case 'play':
      return (
        <svg {...props}>
          <path d="M6 4l14 8-14 8V4z" />
        </svg>
      )
    case 'check':
      return (
        <svg {...props}>
          <path d="M4 12l5 5 11-12" />
        </svg>
      )
    case 'pencil':
      return (
        <svg {...props}>
          <path d="M14 4l6 6-12 12H2v-6L14 4z" />
        </svg>
      )
    case 'brush':
      return (
        <svg {...props}>
          <path d="M17 3l4 4-9 9-4-4 9-9z" />
          <path d="M8 14c-1.5 0-3 1.5-3 4-2 0-4 1-4 1s3 4 7 0c1.5-1.4 1-3 1-5l-1 0z" />
        </svg>
      )
    case 'volume':
      return (
        <svg {...props}>
          <path d="M5 9v6h4l5 4V5L9 9H5z" />
          <path d="M17 8a6 6 0 0 1 0 8" />
        </svg>
      )
    case 'shuffle':
      return (
        <svg {...props}>
          <path d="M16 3h5v5" />
          <path d="M4 20l17-17" />
          <path d="M21 16v5h-5" />
          <path d="M15 15l6 6" />
          <path d="M4 4l5 5" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...props}>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'menu-h':
      return (
        <svg {...props}>
          <circle cx="5" cy="12" r="1.4" fill="currentColor" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <circle cx="19" cy="12" r="1.4" fill="currentColor" />
        </svg>
      )
    case 'flame':
      return (
        <svg {...props}>
          <path d="M9 18a4 4 0 0 1-3-7c1 1 2 1 2 1s0-4 4-7c0 4 4 4 4 9a5 5 0 0 1-7 4z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="3" x2="8" y2="7" />
          <line x1="16" y1="3" x2="16" y2="7" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...props}>
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      )
    case 'sliders':
      return (
        <svg {...props}>
          <line x1="4" y1="6" x2="20" y2="6" />
          <circle cx="10" cy="6" r="2.5" fill="var(--surface)" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <circle cx="15" cy="12" r="2.5" fill="var(--surface)" />
          <line x1="4" y1="18" x2="20" y2="18" />
          <circle cx="8" cy="18" r="2.5" fill="var(--surface)" />
        </svg>
      )
    case 'sun':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      )
    case 'moon':
      return (
        <svg {...props}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )
    case 'sysdot':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 0 0 16V4z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'maximize':
      return (
        <svg {...props}>
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M16 3h3a2 2 0 0 1 2 2v3" />
          <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      )
    case 'users':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    default:
      return null
  }
}
