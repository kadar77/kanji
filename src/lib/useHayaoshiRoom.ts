// useHayaoshiRoom — opens the room WebSocket and exposes server-driven state.
// All game progression (lobby → countdown → question → reveal → board → final)
// is decided by the backend; this hook just mirrors what it broadcasts and
// sends the few client actions (join / start / answer / leave).
import { useEffect, useRef, useState } from 'react'
import { hayaoshiWsUrl } from '@/lib/hayaoshi-api'
import type {
  ClientMessage,
  Profile,
  PublicOption,
  RoomState,
  RoundPhase,
  ServerMessage,
} from '@/lib/hayaoshi-protocol'

export interface RoundView {
  phase: RoundPhase
  qi: number
  total: number
  countN?: number
  question?: { prompt: string; opts: PublicOption[]; deadline: number; serverNow: number }
  answeredCount?: number
  reveal?: { correctIdx: number; gains: Record<string, number> }
  nextInMs?: number
}

export interface HayaoshiConn {
  code: string
  role: 'host' | 'player'
  /** Host token (host) or a saved player token (reconnect). */
  token?: string
  /** Profile to register with on a fresh player join (no token yet). */
  joinProfile?: Profile
}

export interface HayaoshiRoom {
  connected: boolean
  you: { id: string; token: string; isHost: boolean } | null
  room: RoomState | null
  round: RoundView | null
  error: string | null
  start: () => void
  answer: (qi: number, idx: number) => void
  leave: () => void
  close: () => void
}

const tokenKey = (code: string) => `hayaoshi:token:${code}`
const MAX_RECONNECTS = 6

export function useHayaoshiRoom(conn: HayaoshiConn): HayaoshiRoom {
  const [connected, setConnected] = useState(false)
  const [you, setYou] = useState<HayaoshiRoom['you']>(null)
  const [room, setRoom] = useState<RoomState | null>(null)
  const [round, setRound] = useState<RoundView | null>(null)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const roundRef = useRef<RoundView | null>(null)
  const profileRef = useRef(conn.joinProfile)
  profileRef.current = conn.joinProfile

  useEffect(() => {
    let intentional = false
    let closedByHost = false
    let attempts = 0
    let reconnectTimer: number | undefined
    // Prefer an explicit token (host), else a previously stored player token.
    let token = conn.token ?? localStorage.getItem(tokenKey(conn.code)) ?? undefined

    const setRoundBoth = (r: RoundView | null) => {
      roundRef.current = r
      setRound(r)
    }

    // Round events only happen mid-game; flip the room to "playing" if a stray
    // status update was missed, so clients never get stuck on the lobby.
    const markPlaying = () =>
      setRoom((prev) => (prev && prev.status === 'lobby' ? { ...prev, status: 'playing' } : prev))

    const handle = (msg: ServerMessage) => {
      switch (msg.t) {
        case 'welcome':
          if (msg.you.token) {
            token = msg.you.token
            try {
              localStorage.setItem(tokenKey(conn.code), msg.you.token)
            } catch {
              /* storage unavailable */
            }
          }
          setYou({ id: msg.you.id, token: msg.you.token, isHost: msg.you.isHost })
          setRoom(msg.room)
          break
        case 'snapshot':
          setRoom(msg.room)
          break
        case 'players':
          setRoom((prev) => (prev ? { ...prev, players: msg.players } : prev))
          break
        case 'countdown':
          markPlaying()
          setRoundBoth({ phase: 'count', qi: msg.qi, total: msg.total, countN: msg.n })
          break
        case 'question':
          markPlaying()
          setRoundBoth({
            phase: 'q',
            qi: msg.qi,
            total: msg.total,
            question: {
              prompt: msg.prompt,
              opts: msg.opts,
              deadline: msg.deadline,
              serverNow: msg.serverNow,
            },
            answeredCount: 0,
          })
          break
        case 'answered': {
          const cur = roundRef.current
          if (cur && cur.qi === msg.qi) setRoundBoth({ ...cur, answeredCount: msg.count })
          break
        }
        case 'reveal': {
          const cur = roundRef.current
          setRoundBoth({
            phase: 'reveal',
            qi: msg.qi,
            total: cur?.total ?? 0,
            question: cur?.question,
            reveal: { correctIdx: msg.correctIdx, gains: msg.gains },
          })
          setRoom((prev) => (prev ? { ...prev, players: msg.players } : prev))
          break
        }
        case 'leaderboard': {
          const cur = roundRef.current
          setRoundBoth({
            phase: 'board',
            qi: cur?.qi ?? 0,
            total: cur?.total ?? 0,
            nextInMs: msg.nextInMs,
          })
          setRoom((prev) => (prev ? { ...prev, players: msg.players } : prev))
          break
        }
        case 'final':
          setRoom((prev) => (prev ? { ...prev, status: 'final', players: msg.players } : prev))
          setRoundBoth(null)
          break
        case 'closed':
          // Host tore the room down — drop state and don't try to reconnect.
          closedByHost = true
          setError('Host closed the room')
          setRoom(null)
          break
        case 'error':
          setError(msg.message)
          break
      }
    }

    const connect = () => {
      const ws = new WebSocket(hayaoshiWsUrl(conn.code, token))
      wsRef.current = ws
      ws.onopen = () => {
        setConnected(true)
        setError(null)
        attempts = 0
        // Fresh player with no token yet → register with the chosen profile.
        if (conn.role === 'player' && !token && profileRef.current) {
          const p = profileRef.current
          ws.send(JSON.stringify({ t: 'join', name: p.name, avatar: p.avatar, color: p.color }))
        }
      }
      ws.onmessage = (e) => {
        try {
          handle(JSON.parse(e.data as string) as ServerMessage)
        } catch {
          /* ignore malformed frame */
        }
      }
      ws.onclose = () => {
        setConnected(false)
        if (intentional || closedByHost) return
        if (attempts >= MAX_RECONNECTS) {
          setError('Disconnected from the game')
          return
        }
        attempts++
        reconnectTimer = window.setTimeout(connect, 1000)
      }
      ws.onerror = () => {
        try {
          ws.close()
        } catch {
          /* already closing */
        }
      }
    }

    connect()
    return () => {
      intentional = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      try {
        wsRef.current?.close(1000, 'leave')
      } catch {
        /* already closing */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conn.code, conn.role, conn.token])

  const send = (m: ClientMessage) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m))
  }

  return {
    connected,
    you,
    room,
    round,
    error,
    start: () => send({ t: 'start' }),
    answer: (qi, idx) => send({ t: 'answer', qi, idx }),
    leave: () => send({ t: 'leave' }),
    close: () => send({ t: 'close' }),
  }
}
