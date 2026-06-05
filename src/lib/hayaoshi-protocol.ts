// Wire protocol shared with the hayaoshi-server backend. Keep in sync with
// hayaoshi-server/src/protocol.ts.
import type { AvatarName, HayaoshiQuestion } from '@/lib/hayaoshi'

export interface RoomConfig {
  system: string
  level: string
  count: number
  showBoard: boolean
  hostPlays: boolean
  showMn: boolean
  showFurigana: boolean
}

export interface Profile {
  name: string
  avatar: AvatarName
  // Color isn't chosen by the client — the server assigns it on join.
}

export interface PublicOption {
  m: string
  mn: string
  /** Reading of the option's kanji (furigana hint); '' if none. */
  r: string
}

export type RoomStatus = 'lobby' | 'playing' | 'final'
export type RoundPhase = 'count' | 'q' | 'reveal' | 'board'

export interface PublicPlayer {
  id: string
  name: string
  avatar: AvatarName
  color: string
  score: number
  isHost: boolean
  connected: boolean
  lastGain?: number
  lastCorrect?: boolean
}

export interface RoomState {
  code: string
  status: RoomStatus
  config: RoomConfig
  players: PublicPlayer[]
  total: number
  /** Server-enforced room capacity (read-only). */
  maxPlayers: number
  round?: { qi: number; phase: RoundPhase; deadline?: number }
}

export interface RoomSummary {
  exists: boolean
  status: RoomStatus
  playerCount: number
}

// ─── Client → Server ──────────────────────────────────────────────────
export type ClientMessage =
  | { t: 'join'; name: string; avatar: string }
  | { t: 'start' }
  | { t: 'answer'; qi: number; idx: number }
  | { t: 'leave' }
  | { t: 'close' }

// ─── Server → Client ──────────────────────────────────────────────────
export type ServerMessage =
  | { t: 'welcome'; you: { id: string; token: string; isHost: boolean }; room: RoomState }
  | { t: 'snapshot'; room: RoomState }
  | { t: 'players'; players: PublicPlayer[] }
  | { t: 'countdown'; qi: number; total: number; n: number }
  | {
      t: 'question'
      qi: number
      total: number
      prompt: string
      opts: PublicOption[]
      deadline: number
      serverNow: number
    }
  | { t: 'answered'; qi: number; count: number }
  | {
      t: 'reveal'
      qi: number
      correctIdx: number
      gains: Record<string, number>
      players: PublicPlayer[]
    }
  | { t: 'leaderboard'; players: PublicPlayer[]; nextInMs: number }
  | { t: 'final'; players: PublicPlayer[] }
  | { t: 'closed' }
  | { t: 'error'; code: string; message: string }

export interface CreateRoomBody {
  config: RoomConfig
  questions: HayaoshiQuestion[]
  host?: Profile
}

export interface CreateRoomResult {
  code: string
  roomId: string
  hostToken: string
  joinUrl: string
  wsUrl: string
}
