// hayaoshi.ts — client-side helpers for the 早押し / Hayaoshi multiplayer mode.
// The room lifecycle, players, timing and scoring now live in the backend
// (hayaoshi-server); see hayaoshi-api.ts + useHayaoshiRoom.ts. This file keeps
// only what the client still owns: avatar/color choices and building the
// question deck that the host uploads at room creation.
import { mnIfDifferent } from '@/lib/mn'
import type { Kanji } from '@/types'

// ─── Avatars: icon set (Lucide-style) + color palette ─────────────────
export type AvatarName =
  | 'star'
  | 'heart'
  | 'moon'
  | 'droplet'
  | 'flame'
  | 'cloud'
  | 'leaf'
  | 'flower'
  | 'mountain'
  | 'bolt'
  | 'sun'
  | 'snow'

export const HAYAOSHI_AVATARS: AvatarName[] = [
  'star', 'heart', 'moon', 'droplet', 'flame', 'cloud',
  'leaf', 'flower', 'mountain', 'bolt', 'sun', 'snow',
]

export const HAYAOSHI_COLORS = [
  '#e0596b', '#3a8fd0', '#e0a93a', '#3aa674', '#6f63a8', '#c45d86',
  '#3aa39a', '#a07b22', '#5d7fb0', '#c2503a', '#4a90c2', '#5a8f3c',
]

/** Kahoot-style answer-tile colors (one per option position). */
export const TILE_COLORS = ['#e0596b', '#3a8fd0', '#e0a93a', '#3aa674']

export function randColor(): string {
  return HAYAOSHI_COLORS[(Math.random() * HAYAOSHI_COLORS.length) | 0]
}

// ─── Question deck (built client-side, uploaded at room creation) ─────
export interface QuestionOption {
  /** Kanji id — lets the server identify the correct option. */
  id: string
  /** English meaning shown on the tile. */
  m: string
  /** Mongolian gloss ('' when none). */
  mn: string
  /** Kana reading of this option's kanji (furigana hint); '' if none. */
  r: string
}

export interface HayaoshiQuestion {
  prompt: string
  opts: QuestionOption[]
  correctIdx: number
}

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

/** Build `count` meaning-from-kanji questions, carrying Mongolian glosses. */
export function buildQuestions(pool: Kanji[], count: number): HayaoshiQuestion[] {
  if (pool.length < 4) return []
  const ks = shuffle(pool).slice(0, Math.min(count, pool.length))
  return ks.map((k) => {
    const others = shuffle(pool.filter((x) => x.id !== k.id)).slice(0, 3)
    const opts: QuestionOption[] = shuffle([k, ...others]).map((x) => ({
      id: x.id,
      m: x.meanings[0],
      mn: mnIfDifferent(x.meanings[0], x.meaningsMn?.[0]) ?? '',
      r: x.kunYomi[0] ?? x.onYomi[0] ?? '',
    }))
    return {
      prompt: k.character,
      opts,
      correctIdx: opts.findIndex((o) => o.id === k.id),
    }
  })
}
