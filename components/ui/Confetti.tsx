'use client'

import { useEffect, useRef, useCallback } from 'react'

interface ConfettiProps {
  active: boolean
  duration?: number
}

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; color: string; rotation: number; rotationSpeed: number
  opacity: number; shape: 'rect' | 'circle'
}

const COLORS = ['#635BFF', '#00D4AA', '#F5A623', '#E5484D', '#818CF8', '#38BDF8', '#4ADE80']

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const particles = useRef<Particle[]>([])
  const startTime = useRef<number>(0)

  const createParticles = useCallback(() => {
    const count = 80
    const arr: Particle[] = []
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      })
    }
    return arr
  }, [])

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    particles.current = createParticles()
    startTime.current = Date.now()

    function animate() {
      if (!ctx || !canvas) return
      const elapsed = Date.now() - startTime.current

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.vx *= 0.99
        p.rotation += p.rotationSpeed

        if (elapsed > duration * 0.6) {
          p.opacity = Math.max(0, 1 - (elapsed - duration * 0.6) / (duration * 0.4))
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      })

      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [active, duration, createParticles])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
