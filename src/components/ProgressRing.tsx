type Props = {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: React.ReactNode
}

export function ProgressRing({
  value,
  size = 88,
  stroke = 6,
  color = 'var(--ink)',
  track = 'var(--surface-2)',
  children,
}: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c - (clamped / 100) * c
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.6s ease',
          }}
        />
      </svg>
      {children && <div className="ring-val">{children}</div>}
    </div>
  )
}
