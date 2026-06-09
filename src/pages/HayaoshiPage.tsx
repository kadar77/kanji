import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { Fireworks } from '@/components/Fireworks'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import { LevelSystemPicker, LevelPills } from '@/components/LevelPicker'
import { loadKanji } from '@/lib/kanji'
import {
  filterByCurriculum,
  getAvailableLevels,
  getLevelShortLabel,
  LEVEL_SYSTEMS,
} from '@/lib/levels'
import { useEffectiveDark, useProgressStore } from '@/lib/progress'
import { buildQuestions, HAYAOSHI_AVATARS } from '@/lib/hayaoshi'
import { TILE_COLORS } from '@/lib/hayaoshi'
import type { AvatarName } from '@/lib/hayaoshi'
import { createRoom, getRoomSummary } from '@/lib/hayaoshi-api'
import { useHayaoshiRoom, type HayaoshiConn, type RoundView } from '@/lib/useHayaoshiRoom'
import type { Profile, PublicPlayer, RoomState } from '@/lib/hayaoshi-protocol'
import type { Kanji, LevelSystemId } from '@/types'

type Step =
  | 'role'
  | 'host-setup'
  | 'host-profile'
  | 'creating'
  | 'join-code'
  | 'join-profile'

const COUNTS = [10, 15, 20, 25]
// Neutral avatar tint used while picking a profile (no player color yet —
// the server assigns one on join).
const NEUTRAL_AVATAR = '#6e7681'

// Rank by score; break ties by name so ordering is deterministic and never
// just falls back to join order (which always put the host first).
const byScore = (a: PublicPlayer, b: PublicPlayer) =>
  b.score - a.score || a.name.localeCompare(b.name)

// Remember the player's last nickname + avatar so the profile prefills them.
const NAME_KEY = 'hayaoshi:nickname'
const AVATAR_KEY = 'hayaoshi:avatar'
function loadLastName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}
function loadLastAvatar(): AvatarName {
  try {
    const a = localStorage.getItem(AVATAR_KEY) as AvatarName | null
    return a && HAYAOSHI_AVATARS.includes(a) ? a : HAYAOSHI_AVATARS[0]
  } catch {
    return HAYAOSHI_AVATARS[0]
  }
}
function saveLastProfile(name: string, avatar: AvatarName): void {
  try {
    localStorage.setItem(NAME_KEY, name)
    localStorage.setItem(AVATAR_KEY, avatar)
  } catch {
    /* storage unavailable */
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Root — pre-connection menu, then hands off to a live <HRoom>.
// ═══════════════════════════════════════════════════════════════════════
export function HayaoshiPage() {
  const navigate = useNavigate()
  const { settings, setSettings } = useProgressStore()
  const [kanji, setKanji] = useState<Kanji[]>([])

  const [step, setStep] = useState<Step>('role')
  const [count, setCount] = useState(10)
  const [showBoard, setShowBoard] = useState(true)
  const [showMn, setShowMn] = useState(settings.showMongolian)
  const [showFurigana, setShowFurigana] = useState(settings.showFurigana)
  const [hostPlays, setHostPlays] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [conn, setConn] = useState<HayaoshiConn | null>(null)

  const system = settings.levelSystem
  const level = settings.activeLevel
  const effectiveDark = useEffectiveDark()

  // This route renders outside <Layout>, so apply the theme/font here too,
  // keeping the immersive game in sync with the user's light/dark preference.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', effectiveDark ? 'dark' : 'light')
    root.setAttribute('data-jpfont', settings.jpFont)
  }, [effectiveDark, settings.jpFont])

  useEffect(() => {
    loadKanji().then(setKanji)
  }, [])

  // Deep link: /game/hayaoshi?join=CODE jumps straight into the join flow.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('join')
    if (code) {
      setJoinCode(code.toUpperCase())
      setStep('join-code')
    }
  }, [])

  const pool = useMemo(
    () => filterByCurriculum(kanji, { system, level }),
    [kanji, system, level],
  )
  const available = useMemo(
    () => new Set(getAvailableLevels(kanji, system)),
    [kanji, system],
  )

  const onSystem = (s: LevelSystemId) => {
    const first = LEVEL_SYSTEMS[s].levels.find((l) =>
      kanji.some((k) => k.levels.includes(`${s}:${l.id}` as Kanji['levels'][number])),
    )
    setSettings({ levelSystem: s, activeLevel: first?.id ?? LEVEL_SYSTEMS[s].levels[0].id })
  }

  const exit = () => navigate('/game')

  // ── Host: create the room (uploads the deck), then connect as host ──
  const doCreateRoom = async (host: Profile | null) => {
    setError(null)
    setStep('creating')
    try {
      const questions = buildQuestions(pool, count)
      const result = await createRoom({
        config: { system, level, count, showBoard, hostPlays, showMn, showFurigana },
        questions,
        ...(host ? { host } : {}),
      })
      setConn({ code: result.code, role: 'host', token: result.hostToken })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the room')
      setStep('host-setup')
    }
  }

  const beginCreate = () => {
    if (hostPlays) setStep('host-profile')
    else doCreateRoom(null)
  }

  // ── Join: validate the code, then collect a profile ──
  const validateAndJoin = async (code: string): Promise<string | null> => {
    try {
      const summary = await getRoomSummary(code)
      if (!summary.exists) return 'No game with that code.'
      if (summary.status !== 'lobby') return 'That game has already started.'
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Could not reach the server.'
    }
  }

  const joinAs = (profile: Profile) => {
    setConn({ code: joinCode, role: 'player', joinProfile: profile })
  }

  if (conn) {
    return <HRoom conn={conn} system={system} level={level} onExit={exit} />
  }

  return (
    <div className="vs-root">
      {step === 'role' && (
        <HRole
          onExit={exit}
          onHost={() => setStep('host-setup')}
          onJoin={() => setStep('join-code')}
        />
      )}

      {step === 'host-setup' && (
        <HHostSetup
          system={system}
          level={level}
          onSystem={onSystem}
          onLevel={(lvl) => setSettings({ activeLevel: lvl })}
          available={available}
          poolSize={pool.length}
          count={count}
          setCount={setCount}
          showBoard={showBoard}
          setShowBoard={setShowBoard}
          showMn={showMn}
          setShowMn={setShowMn}
          showFurigana={showFurigana}
          setShowFurigana={setShowFurigana}
          hostPlays={hostPlays}
          setHostPlays={setHostPlays}
          error={error}
          onBack={() => setStep('role')}
          onCreate={beginCreate}
        />
      )}

      {step === 'host-profile' && (
        <HProfile
          title="Your player"
          cta="Create room"
          onBack={() => setStep('host-setup')}
          onSubmit={doCreateRoom}
        />
      )}

      {step === 'creating' && <HStatus text="Creating room…" />}

      {step === 'join-code' && (
        <HJoinCode
          initialCode={joinCode}
          onBack={() => setStep('role')}
          onNext={async (code) => {
            const err = await validateAndJoin(code)
            if (err) return err
            setJoinCode(code)
            setStep('join-profile')
            return null
          }}
        />
      )}

      {step === 'join-profile' && (
        <HProfile
          title="Your player"
          cta="Join room"
          onBack={() => setStep('join-code')}
          onSubmit={joinAs}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Live room — subscribes to the backend and renders by status.
// ═══════════════════════════════════════════════════════════════════════
function HRoom({
  conn,
  system,
  level,
  onExit,
}: {
  conn: HayaoshiConn
  system: LevelSystemId
  level: string
  onExit: () => void
}) {
  const { connected, you, room, round, error, start, answer, close } = useHayaoshiRoom(conn)
  const updateKahootBest = useProgressStore((s) => s.updateKahootBest)
  const recordedRef = useRef(false)

  // Record the local player's score once when the game ends.
  useEffect(() => {
    if (room?.status === 'final' && you?.id && !recordedRef.current) {
      const me = room.players.find((p) => p.id === you.id)
      if (me) updateKahootBest({ system, level }, me.score)
      recordedRef.current = true
    }
  }, [room?.status, you?.id, room, system, level, updateKahootBest])

  if (error && !room) {
    return (
      <div className="vs-root">
        <div className="vs-screen vs-center fade-in">
          <button type="button" className="vs-close" onClick={onExit} aria-label="Exit">
            <Icon name="x" size={18} />
          </button>
          <div className="vs-loading-text" style={{ marginBottom: 18 }}>
            {error}
          </div>
          <button type="button" className="vs-btn primary" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>
    )
  }

  if (!room || !connected) {
    return (
      <div className="vs-root">
        <HStatus text="Connecting…" />
      </div>
    )
  }

  const isHost = you?.isHost ?? conn.role === 'host'
  const spectator = isHost && !room.config.hostPlays

  return (
    <div className="vs-root">
      {room.status === 'final' ? (
        <HFinal players={room.players} youId={you?.id} isHost={isHost} onExit={onExit} />
      ) : room.status === 'playing' ? (
        <HPlay
          round={round}
          players={room.players}
          youId={you?.id}
          showMongolian={room.config.showMn}
          showFurigana={room.config.showFurigana}
          spectator={spectator}
          onAnswer={answer}
        />
      ) : isHost ? (
        <HLobby
          room={room}
          onClose={() => {
            close() // delete the room server-side now, then leave
            onExit()
          }}
          onStart={start}
        />
      ) : (
        <HWaiting room={room} youId={you?.id} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Shared bits
// ═══════════════════════════════════════════════════════════════════════
function HHeader({
  title,
  onBack,
  backLabel = 'Back',
}: {
  title: string
  onBack: () => void
  backLabel?: string
}) {
  return (
    <div className="vs-topbar">
      <button type="button" className="vs-back" onClick={onBack}>
        <Icon name="left" size={16} /> {backLabel}
      </button>
      <div className="vs-title">{title}</div>
      <div style={{ width: 64 }} />
    </div>
  )
}

function HStatus({ text }: { text: string }) {
  return (
    <div className="vs-screen vs-center fade-in">
      <div className="vs-spinner" />
      <div className="vs-loading-text">{text}</div>
    </div>
  )
}

function QR({ text, size = 168 }: { text: string; size?: number }) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&qzone=1&data=${encodeURIComponent(
    text,
  )}`
  return (
    <img className="vs-qr" src={src} width={size} height={size} alt="Scan to join" draggable={false} />
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Phase: role pick
// ═══════════════════════════════════════════════════════════════════════
function HRole({
  onHost,
  onJoin,
  onExit,
}: {
  onHost: () => void
  onJoin: () => void
  onExit: () => void
}) {
  return (
    <div className="vs-screen vs-center fade-in">
      <button type="button" className="vs-close" onClick={onExit} aria-label="Exit">
        <Icon name="x" size={18} />
      </button>
      <div className="vs-brand">
        <div className="vs-brand-jp jp">早押し</div>
        <div className="vs-brand-en">Hayaoshi</div>
        <div className="vs-brand-sub">Live multiplayer speed quiz</div>
      </div>
      <div className="vs-role-cards">
        <button type="button" className="vs-role-card" onClick={onHost}>
          <Icon name="zap" size={26} />
          <div className="t">Host a game</div>
          <div className="s">Create a room, share the code</div>
        </button>
        <button type="button" className="vs-role-card alt" onClick={onJoin}>
          <Icon name="users" size={26} />
          <div className="t">Join a game</div>
          <div className="s">Enter a code or scan a QR</div>
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Phase: host setup
// ═══════════════════════════════════════════════════════════════════════
function HHostSetup({
  system,
  level,
  onSystem,
  onLevel,
  available,
  poolSize,
  count,
  setCount,
  showBoard,
  setShowBoard,
  showMn,
  setShowMn,
  showFurigana,
  setShowFurigana,
  hostPlays,
  setHostPlays,
  error,
  onBack,
  onCreate,
}: {
  system: LevelSystemId
  level: string
  onSystem: (s: LevelSystemId) => void
  onLevel: (lvl: string) => void
  available: Set<string>
  poolSize: number
  count: number
  setCount: (n: number) => void
  showBoard: boolean
  setShowBoard: (fn: (v: boolean) => boolean) => void
  showMn: boolean
  setShowMn: (fn: (v: boolean) => boolean) => void
  showFurigana: boolean
  setShowFurigana: (fn: (v: boolean) => boolean) => void
  hostPlays: boolean
  setHostPlays: (fn: (v: boolean) => boolean) => void
  error: string | null
  onBack: () => void
  onCreate: () => void
}) {
  return (
    <div className="vs-screen fade-in">
      <HHeader title="Host a game" onBack={onBack} />
      <div className="vs-body">
        <div className="vs-label">Level</div>
        <LevelSystemPicker system={system} onChange={onSystem} />
        <div style={{ height: 10 }} />
        <LevelPills system={system} level={level} onChange={onLevel} available={available} />

        <div className="vs-label" style={{ marginTop: 22 }}>
          Questions
        </div>
        <div className="vs-chip-row">
          {COUNTS.map((n) => (
            <button
              key={n}
              type="button"
              className={`vs-chip ${count === n ? 'active' : ''}`}
              disabled={poolSize < 4}
              onClick={() => setCount(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="vs-label" style={{ marginTop: 22 }}>
          Options
        </div>
        <div className="vs-toggle-group">
          <button type="button" className="vs-toggle-row" onClick={() => setHostPlays((v) => !v)}>
            <div>
              <div className="tt">Host plays</div>
              <div className="ss">
                {hostPlays
                  ? 'Pick a nickname & avatar; you join in'
                  : 'Screen mode — display only, you don’t answer'}
              </div>
            </div>
            <span className={`vs-switch ${hostPlays ? 'on' : ''}`}>
              <span className="knob" />
            </span>
          </button>
          <button type="button" className="vs-toggle-row" onClick={() => setShowBoard((v) => !v)}>
            <div>
              <div className="tt">Leaderboard between questions</div>
              <div className="ss">Reveal standings after each question</div>
            </div>
            <span className={`vs-switch ${showBoard ? 'on' : ''}`}>
              <span className="knob" />
            </span>
          </button>
          <button type="button" className="vs-toggle-row" onClick={() => setShowMn((v) => !v)}>
            <div>
              <div className="tt">Mongolian translations</div>
              <div className="ss">Show Монгол under each answer</div>
            </div>
            <span className={`vs-switch ${showMn ? 'on' : ''}`}>
              <span className="knob" />
            </span>
          </button>
          <button type="button" className="vs-toggle-row" onClick={() => setShowFurigana((v) => !v)}>
            <div>
              <div className="tt">Furigana</div>
              <div className="ss">Show the kanji&apos;s reading above the prompt</div>
            </div>
            <span className={`vs-switch ${showFurigana ? 'on' : ''}`}>
              <span className="knob" />
            </span>
          </button>
        </div>
      </div>
      <div className="vs-foot">
        <button
          type="button"
          className="vs-btn primary lg"
          disabled={poolSize < 4}
          onClick={onCreate}
        >
          {hostPlays ? 'Next' : 'Create room'}
        </button>
        {poolSize < 4 && <div className="vs-hint">Need at least 4 kanji in this level.</div>}
        {error && <div className="vs-hint" style={{ color: '#ff8a98' }}>{error}</div>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Phase: nickname + avatar
// ═══════════════════════════════════════════════════════════════════════
function HProfile({
  title = 'Your player',
  cta = 'Join room',
  onBack,
  onSubmit,
}: {
  title?: string
  cta?: string
  onBack: () => void
  onSubmit: (p: Profile) => void
}) {
  // Prefill from the player's last game so they don't retype each time.
  const [name, setName] = useState(() => loadLastName())
  const [avatar, setAvatar] = useState<AvatarName>(() => loadLastAvatar())
  const ok = name.trim().length >= 1
  const submit = () => {
    const profile = { name: name.trim(), avatar }
    saveLastProfile(profile.name, avatar)
    onSubmit(profile)
  }
  return (
    <div className="vs-screen fade-in">
      <HHeader title={title} onBack={onBack} />
      <div className="vs-body">
        <div className="vs-center" style={{ marginBottom: 6 }}>
          {/* Neutral while choosing — the server assigns a color on join. */}
          <PlayerAvatar avatar={avatar} color={NEUTRAL_AVATAR} size={84} ring="rgba(255,255,255,0.25)" />
        </div>
        <div className="vs-label">Nickname</div>
        <input
          className="vs-name-input"
          value={name}
          maxLength={14}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tomo"
        />
        <div className="vs-label" style={{ marginTop: 20 }}>
          Avatar{' '}
          <span
            style={{
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'none',
              letterSpacing: 0,
              fontWeight: 400,
            }}
          >
            · your colour is assigned when you join
          </span>
        </div>
        <div className="vs-avatar-grid">
          {HAYAOSHI_AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              className={`vs-avatar-pick ${avatar === a ? 'sel' : ''}`}
              onClick={() => setAvatar(a)}
            >
              <PlayerAvatar avatar={a} color={NEUTRAL_AVATAR} size={46} />
            </button>
          ))}
        </div>
      </div>
      <div className="vs-foot">
        <button
          type="button"
          className="vs-btn primary lg"
          disabled={!ok}
          onClick={submit}
        >
          {cta}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Phase: join — enter code
// ═══════════════════════════════════════════════════════════════════════
function HJoinCode({
  initialCode,
  onBack,
  onNext,
}: {
  initialCode: string
  onBack: () => void
  onNext: (code: string) => Promise<string | null>
}) {
  const [code, setCode] = useState(initialCode)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const ok = code.trim().length >= 4
  const submit = async () => {
    setBusy(true)
    setErr(null)
    const e = await onNext(code.trim())
    if (e) {
      setErr(e)
      setBusy(false)
    }
  }
  return (
    <div className="vs-screen fade-in">
      <HHeader title="Join a game" onBack={onBack} />
      <div className="vs-body vs-center" style={{ flex: 1 }}>
        <div className="vs-scan">
          <div className="vs-scan-box">
            <Icon name="maximize" size={30} />
            <span>Scan the host&apos;s QR</span>
          </div>
          <div className="vs-or">or enter code</div>
          <input
            className="vs-code-input"
            value={code}
            maxLength={6}
            autoFocus
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="ABCDE"
          />
          {err && <div className="vs-hint" style={{ color: '#ff8a98' }}>{err}</div>}
        </div>
      </div>
      <div className="vs-foot">
        <button type="button" className="vs-btn primary lg" disabled={!ok || busy} onClick={submit}>
          {busy ? 'Checking…' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Phase: lobby (host)
// ═══════════════════════════════════════════════════════════════════════
function HLobby({
  room,
  onClose,
  onStart,
}: {
  room: RoomState
  onClose: () => void
  onStart: () => void
}) {
  const [copied, setCopied] = useState(false)
  const guests = room.players.filter((p) => !p.isHost)
  const host = room.players.find((p) => p.isHost)
  const total = room.players.length
  const joinUrl = `${window.location.origin}/game/hayaoshi?join=${room.code}`
  const copy = () => {
    try {
      navigator.clipboard?.writeText(room.code)
    } catch {
      /* ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <div className="vs-screen fade-in">
      <HHeader title="Lobby" onBack={onClose} backLabel="Close" />
      <div className="vs-body">
        <div className="vs-code-card">
          <div className="vs-code-label">
            Join at <strong>{window.location.host}</strong>
          </div>
          <button type="button" className="vs-code" onClick={copy} title="Copy code">
            {room.code.split('').map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </button>
          <div className="vs-code-copy">{copied ? 'Copied!' : 'Tap code to copy'}</div>
          <div className="vs-qr-wrap">
            <QR text={joinUrl} />
          </div>
          <div className="vs-code-meta">
            {LEVEL_SYSTEMS[room.config.system as LevelSystemId].label}{' '}
            {getLevelShortLabel(room.config.system as LevelSystemId, room.config.level)} ·{' '}
            {room.config.count} questions ·{' '}
            {room.config.showBoard ? 'live leaderboard' : 'no mid-game board'}
            {room.config.hostPlays ? '' : ' · screen mode'}
          </div>
        </div>

        <div className="vs-players-head">
          <span>Players</span>
          <span className="vs-count-pill">
            {total} / {room.maxPlayers}
          </span>
        </div>
        <div className="vs-players">
          {host && (
            <div className="vs-player-chip is-host">
              <PlayerAvatar avatar={host.avatar} color={host.color} size={34} />
              <span className="nm">{host.name} · you · host</span>
            </div>
          )}
          {guests.map((p) => (
            <div key={p.id} className="vs-player-chip pop-in">
              <PlayerAvatar avatar={p.avatar} color={p.color} size={34} dim={!p.connected} />
              <span className="nm">{p.name}</span>
            </div>
          ))}
          {guests.length === 0 && <div className="vs-empty">Waiting for players to join…</div>}
        </div>
      </div>
      <div className="vs-foot">
        <button
          type="button"
          className="vs-btn primary lg"
          disabled={guests.length === 0}
          onClick={onStart}
        >
          {guests.length === 0
            ? 'Start game'
            : `Start game · ${total} ${total === 1 ? 'player' : 'players'}`}
        </button>
        <div className="vs-hint">
          {guests.length === 0
            ? 'At least one player must join before you can start.'
            : room.config.hostPlays
              ? 'Everyone’s in — start when ready.'
              : 'Screen mode — players answer on their phones.'}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Phase: waiting (player)
// ═══════════════════════════════════════════════════════════════════════
function HWaiting({ room, youId }: { room: RoomState; youId?: string }) {
  const me = room.players.find((p) => p.id === youId)
  const others = room.players.filter((p) => p.id !== youId)
  if (!me) return <HStatus text="Joining…" />
  return (
    <div className="vs-screen vs-center fade-in">
      <PlayerAvatar avatar={me.avatar} color={me.color} size={88} ring="rgba(255,255,255,0.25)" />
      <div className="vs-waiting-name">{me.name}</div>
      <div className="vs-waiting-status">
        <span className="vs-dot-pulse" /> You&apos;re in! Waiting for host…
      </div>
      <div className="vs-waiting-players">
        {others.map((p) => (
          <div key={p.id} className="vs-wp">
            <PlayerAvatar avatar={p.avatar} color={p.color} size={30} />
            <span>
              {p.name}
              {p.isHost ? ' · host' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Leaderboard list
// ═══════════════════════════════════════════════════════════════════════
function HLeaderboard({
  players,
  youId,
  max = 6,
  animate,
}: {
  players: PublicPlayer[]
  youId?: string
  max?: number
  animate?: boolean
}) {
  const sorted = [...players].sort(byScore).slice(0, max)
  const top = Math.max(1, sorted[0] ? sorted[0].score : 1)
  return (
    <div className="vs-board">
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className={`vs-board-row ${p.id === youId ? 'you' : ''} ${animate ? 'slide-in' : ''}`}
          style={animate ? { animationDelay: `${i * 70}ms` } : undefined}
        >
          <span className="rk">{i + 1}</span>
          <PlayerAvatar avatar={p.avatar} color={p.color} size={30} />
          <span className="nm">
            {p.name}
            {p.id === youId ? ' (you)' : ''}
            {p.isHost ? ' · host' : ''}
          </span>
          <span className="bar">
            <span style={{ width: (p.score / top) * 100 + '%' }} />
          </span>
          <span className="sc">{p.score}</span>
          {p.lastGain != null && p.lastGain > 0 && <span className="gain">+{p.lastGain}</span>}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Gameplay — renders purely from the server-driven `round` view.
// ═══════════════════════════════════════════════════════════════════════
function HPlay({
  round,
  players,
  youId,
  showMongolian,
  showFurigana,
  spectator,
  onAnswer,
}: {
  round: RoundView | null
  players: PublicPlayer[]
  youId?: string
  showMongolian: boolean
  showFurigana: boolean
  spectator: boolean
  onAnswer: (qi: number, idx: number) => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const [, force] = useState(0)
  // Local timing for the question bar / board "next in" — derived from the
  // server's deadline so we never trust the client clock for scoring.
  const recvRef = useRef<{ qi: number; recvAt: number; duration: number } | null>(null)
  const boardRef = useRef<{ recvAt: number; nextInMs: number } | null>(null)

  const phase = round?.phase
  const qi = round?.qi ?? 0

  useEffect(() => {
    setPicked(null)
  }, [qi])

  useEffect(() => {
    if (phase === 'q' && round?.question) {
      recvRef.current = {
        qi,
        recvAt: Date.now(),
        duration: Math.max(1, round.question.deadline - round.question.serverNow),
      }
    }
  }, [phase, qi, round?.question])

  useEffect(() => {
    if (phase === 'board' && round?.nextInMs != null) {
      boardRef.current = { recvAt: Date.now(), nextInMs: round.nextInMs }
    }
  }, [phase, round?.nextInMs])

  useEffect(() => {
    if (phase !== 'q' && phase !== 'board') return
    const id = window.setInterval(() => force((x) => x + 1), 90)
    return () => clearInterval(id)
  }, [phase])

  if (!round) return <HStatus text=" " />

  const me = players.find((p) => p.id === youId)
  const myRank = [...players].sort(byScore).findIndex((p) => p.id === youId) + 1
  const total = round.total

  const rc = recvRef.current
  const remaining = rc && rc.qi === qi ? Math.max(0, rc.duration - (Date.now() - rc.recvAt)) : 0
  const timePct = rc ? (remaining / rc.duration) * 100 : 100

  const bc = boardRef.current
  const nextIn = bc ? Math.max(0, Math.ceil((bc.nextInMs - (Date.now() - bc.recvAt)) / 1000)) : 0

  const pick = (idx: number) => {
    if (spectator || picked !== null || phase !== 'q') return
    setPicked(idx)
    onAnswer(qi, idx)
  }

  return (
    <div className="vs-play">
      <div className="vs-play-top">
        <span className="qn">
          Q{qi + 1}
          <span className="muted2"> / {total}</span>
        </span>
        <span className="rank-pill">
          {spectator ? `${players.length} playing` : `#${myRank} · ${me ? me.score : 0}`}
        </span>
      </div>

      {phase === 'count' ? (
        <div className="vs-inq-count vs-center">
          <div className="vs-cd-label">
            Question {qi + 1} of {total}
          </div>
          <div key={round.countN} className="vs-cd-num">
            {round.countN}
          </div>
        </div>
      ) : phase === 'board' ? (
        <div className="vs-board-stage fade-in">
          <div className="vs-board-title">
            Leaderboard
            <span className="vs-next-pill">Next in {nextIn}</span>
          </div>
          <HLeaderboard players={players} youId={youId} max={5} animate />
        </div>
      ) : round.question ? (
        <>
          <div className="vs-timebar">
            <div
              className="fill"
              style={{ width: timePct + '%', background: timePct < 25 ? '#e0596b' : undefined }}
            />
          </div>
          <div className="vs-answered">
            {phase === 'q' ? `${round.answeredCount ?? 0} answered` : ' '}
          </div>
          <div className="vs-prompt-wrap">
            <div className="vs-prompt jp">{round.question.prompt}</div>
            {phase === 'reveal' && !spectator && (
              <div className={`vs-reveal-tag ${me && me.lastCorrect ? 'good' : 'bad'}`}>
                {me && me.lastCorrect
                  ? `+${me.lastGain ?? 0}`
                  : picked == null
                    ? 'Time!'
                    : 'Missed'}
              </div>
            )}
            {phase === 'reveal' && spectator && <div className="vs-reveal-tag screen">Answer</div>}
          </div>
          <div className="vs-tiles">
            {round.question.opts.map((opt, idx) => {
              const correct = phase === 'reveal' && idx === round.reveal?.correctIdx
              const wrong =
                phase === 'reveal' && picked === idx && idx !== round.reveal?.correctIdx
              const dim = phase === 'reveal' && !correct && !wrong
              return (
                <button
                  key={idx}
                  type="button"
                  className={`vs-tile ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''} ${
                    dim ? 'dim' : ''
                  } ${picked === idx ? 'picked' : ''} ${spectator ? 'screen' : ''}`}
                  style={{ ['--tc' as string]: TILE_COLORS[idx] }}
                  disabled={spectator || phase !== 'q' || picked !== null}
                  onClick={() => pick(idx)}
                >
                  <span className="sym" />
                  {showFurigana && opt.r && <span className="lbl-furi jp">{opt.r}</span>}
                  <span className="lbl">{opt.m}</span>
                  {showMongolian && opt.mn && <span className="lbl-mn">{opt.mn}</span>}
                  {correct && (
                    <span className="mk">
                      <Icon name="check" size={15} stroke={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <HStatus text=" " />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Podium + fireworks finale (Exit only)
// ═══════════════════════════════════════════════════════════════════════
function HFinal({
  players,
  youId,
  isHost,
  onExit,
}: {
  players: PublicPlayer[]
  youId?: string
  isHost: boolean
  onExit: () => void
}) {
  const dark = useEffectiveDark()
  const sorted = useMemo(() => [...players].sort(byScore), [players])
  const you = sorted.find((p) => p.id === youId)
  const youRank = sorted.findIndex((p) => p.id === youId) + 1
  // Conventional podium: 2nd · 1st · 3rd, so the winner sits center and tallest.
  // `place` is the true rank (index in `sorted`); ordering is correct because
  // `byScore` already broke any ties deterministically.
  const top3 = sorted.slice(0, 3)
  const order = [top3[1], top3[0], top3[2]].filter(Boolean) as PublicPlayer[]
  const placeOf = (p: PublicPlayer) => sorted.findIndex((x) => x.id === p.id)
  const heights: Record<number, number> = { 0: 124, 1: 96, 2: 72 }

  const won = youRank === 1
  // Fireworks celebrate only the top-3 finishers. A pure spectator host (no
  // player id) shows them too, as the shared results display.
  const isPlayer = !!youId && youRank > 0
  const showFireworks = isPlayer ? youRank <= 3 : true
  return (
    <div className="vs-final">
      {showFireworks && <Fireworks dark={dark} />}
      <div className="vs-final-inner fade-in">
        <div className="vs-final-kicker">
          {isHost ? 'Final results' : won ? '勝利' : 'Final results'}
        </div>
        <div className="vs-final-title jp">
          {won ? 'You win!' : sorted[0] ? sorted[0].name + ' wins' : 'Game over'}
        </div>

        <div className="vs-podium">
          {order.map((p) => {
            const place = placeOf(p)
            return (
              <div key={p.id} className={`vs-podium-col p${place}`}>
                <PlayerAvatar
                  avatar={p.avatar}
                  color={p.color}
                  size={place === 0 ? 56 : 46}
                  ring={place === 0 ? '#ffd166' : 'rgba(255,255,255,0.2)'}
                />
                <div className="pname">
                  {p.name}
                  {p.id === youId ? ' (you)' : ''}
                </div>
                <div className="pscore">{p.score}</div>
                <div className="pblock" style={{ height: heights[place] }}>
                  <span className="pn">{place + 1}</span>
                </div>
              </div>
            )
          })}
        </div>

        {sorted.length > 3 && (
          <div className="vs-final-rest">
            <HLeaderboard players={sorted.slice(3)} youId={youId} max={4} />
          </div>
        )}

        {you && (
          <div className="vs-your-line">
            You finished <strong>#{youRank}</strong> of {sorted.length} · {you.score} pts
          </div>
        )}

        <div className="vs-final-actions">
          <button type="button" className="vs-btn primary" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>
    </div>
  )
}
