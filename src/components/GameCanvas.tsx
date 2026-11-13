import { useEffect, useRef } from 'react'
import { TILE, VIEW_H, VIEW_W, drawGame } from '../game/render'
import type { GameState } from '../game/types'

export function GameCanvas({ state }: { state: GameState }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Render at the screen's pixel density so text stays sharp on retina displays.
    const dpr = window.devicePixelRatio || 1
    canvas.width = VIEW_W * TILE * dpr
    canvas.height = VIEW_H * TILE * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawGame(ctx, state)
  }, [state])

  return (
    <canvas
      ref={ref}
      className="canvas"
      role="img"
      aria-label={`Dungeon floor ${state.depth}. You have ${state.player.hp} of ${state.player.maxHp} health.`}
    />
  )
}
