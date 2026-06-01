import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  decay: number
  color: string
  size: number
}
type Rocket = { x: number; y: number; tx: number; ty: number; vy: number; color: string }

/**
 * Lightweight canvas particle fireworks for the finale.
 * `dark` (default true) controls the look so it follows the app theme: on dark
 * it uses additive glow over a near-black fade; on light it draws solid
 * confetti-like particles over a soft light fade (additive glow is invisible on
 * light backgrounds).
 */
export function Fireworks({ palette, dark = true }: { palette?: string[]; dark?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const fadeFill = dark ? 'rgba(11,10,15,0.28)' : 'rgba(244,242,239,0.34)'
    const composite: GlobalCompositeOperation = dark ? 'lighter' : 'source-over'
    const accent = dark ? '#ffffff' : '#2b2b2b'
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const colors = palette ?? [
      '#ffd166', '#ef476f', '#06d6a0', '#4cc9f0', '#f78c6b', '#ffffff', '#c77dff',
    ]
    let particles: Particle[] = []
    let rockets: Rocket[] = []
    let raf = 0
    let running = true
    let last = performance.now()
    let spawnAcc = 0

    function launch() {
      rockets.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: h,
        tx: w * (0.18 + Math.random() * 0.64),
        ty: h * (0.16 + Math.random() * 0.32),
        vy: -(h * 0.012 + Math.random() * h * 0.004),
        color: colors[(Math.random() * colors.length) | 0],
      })
    }
    function burst(x: number, y: number, color: string) {
      const n = 46 + ((Math.random() * 26) | 0)
      for (let i = 0; i < n; i++) {
        const ang = (Math.PI * 2 * i) / n + Math.random() * 0.3
        const spd = 1.4 + Math.random() * 3.2
        particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          color: Math.random() < 0.18 ? accent : color,
          size: 1.5 + Math.random() * 1.8,
        })
      }
    }

    function frame(now: number) {
      if (!running || !ctx) return
      const dt = Math.min(40, now - last)
      last = now
      spawnAcc += dt
      if (spawnAcc > 520) {
        spawnAcc = 0
        launch()
        if (Math.random() < 0.5) launch()
      }

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = fadeFill
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = composite

      rockets = rockets.filter((r) => {
        r.x += (r.tx - r.x) * 0.04
        r.y += r.vy
        r.vy += h * 0.00018 * (dt / 16)
        ctx.beginPath()
        ctx.fillStyle = r.color
        ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2)
        ctx.fill()
        if (r.y <= r.ty || r.vy >= 0) {
          burst(r.x, r.y, r.color)
          return false
        }
        return true
      })

      particles = particles.filter((p) => {
        p.vx *= 0.985
        p.vy *= 0.985
        p.vy += 0.03 * (dt / 16)
        p.x += p.vx * (dt / 16)
        p.y += p.vy * (dt / 16)
        p.life -= p.decay * (dt / 16)
        if (p.life <= 0) return false
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.beginPath()
        ctx.fillStyle = p.color
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        return true
      })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }
    // initial volley
    launch()
    launch()
    launch()
    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [palette, dark])

  return <canvas ref={ref} className="fireworks-canvas" aria-hidden="true" />
}
