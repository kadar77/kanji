import { useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '@/components/Icon'

const games: {
  id: string
  to: string
  label: string
  labelJp?: string
  desc: string
  icon: IconName
}[] = [
  {
    id: 'hayaoshi',
    to: '/game/hayaoshi',
    label: 'Hayaoshi',
    labelJp: '早押し',
    desc: 'Live multiplayer speed quiz — host a room, players join by code or QR.',
    icon: 'zap',
  },
  {
    id: 'memory',
    to: '/game/memory',
    label: 'Memory match',
    desc: 'Flip cards to pair each kanji with its meaning.',
    icon: 'shuffle',
  },
]

export function GamePage() {
  const navigate = useNavigate()
  return (
    <div className="screen-inner fade-in">
      <div style={{ padding: '8px 0 14px' }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Games</div>
        <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
          Pick a mode.
        </div>
      </div>

      <div className="row-list">
        {games.map((g) => (
          <button key={g.id} type="button" onClick={() => navigate(g.to)}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-2)',
                border: '1px solid var(--border)',
                flex: '0 0 auto',
              }}
            >
              <Icon name={g.icon} size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                {g.label}
                {g.labelJp && (
                  <span className="jp" style={{ color: 'var(--mute)', fontSize: 13, fontWeight: 500 }}>
                    {g.labelJp}
                  </span>
                )}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {g.desc}
              </div>
            </div>
            <Icon name="right" size={16} stroke={2} />
          </button>
        ))}
      </div>
    </div>
  )
}
