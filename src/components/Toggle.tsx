type Props = {
  value: boolean
  onChange: (v: boolean) => void
  label?: string
}

export function Toggle({ value, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        background: value ? 'var(--ink)' : 'var(--border-strong)',
        border: 0,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flex: '0 0 auto',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 20 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}
