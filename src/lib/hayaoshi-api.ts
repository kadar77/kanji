// REST client for hayaoshi-server. The base URL is configured via
// VITE_HAYAOSHI_API (falls back to the local `wrangler dev` default).
import type {
  CreateRoomBody,
  CreateRoomResult,
  RoomSummary,
} from '@/lib/hayaoshi-protocol'

const BASE = (import.meta.env.VITE_HAYAOSHI_API ?? 'http://localhost:8787').replace(/\/+$/, '')

export function hayaoshiApiBase(): string {
  return BASE
}

/** WebSocket URL for a room. Pass a token to authenticate as host / reconnect. */
export function hayaoshiWsUrl(code: string, token?: string): string {
  const ws = BASE.replace(/^http/, 'ws')
  const q = token ? `?token=${encodeURIComponent(token)}` : ''
  return `${ws}/rooms/${encodeURIComponent(code)}/ws${q}`
}

async function asError(res: Response, fallback: string): Promise<Error> {
  try {
    const body = (await res.json()) as { error?: string }
    return new Error(body.error ?? fallback)
  } catch {
    return new Error(fallback)
  }
}

/** POST /rooms — create a room and upload the question deck. */
export async function createRoom(body: CreateRoomBody): Promise<CreateRoomResult> {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await asError(res, 'Could not create the room')
  return res.json()
}

/** GET /rooms/:code — lightweight summary for the join screen. */
export async function getRoomSummary(code: string): Promise<RoomSummary> {
  const res = await fetch(`${BASE}/rooms/${encodeURIComponent(code)}`)
  if (!res.ok) throw await asError(res, 'Could not reach the server')
  return res.json()
}
