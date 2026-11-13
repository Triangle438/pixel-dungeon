import { H, W, idx, inBounds, type Pos, type Tile } from './types'

// Walks a straight line from `from` to `to` (Bresenham). The view is blocked
// if any tile strictly between the two points is a wall.
export function hasLineOfSight(tiles: Tile[], from: Pos, to: Pos): boolean {
  let { x, y } = from
  const dx = Math.abs(to.x - x)
  const dy = -Math.abs(to.y - y)
  const sx = x < to.x ? 1 : -1
  const sy = y < to.y ? 1 : -1
  let err = dx + dy

  while (!(x === to.x && y === to.y)) {
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x += sx
    }
    if (e2 <= dx) {
      err += dx
      y += sy
    }
    if (x === to.x && y === to.y) break
    if (tiles[idx(x, y)] === 'wall') return false
  }
  return true
}

/** Every tile within `radius` that the player can see from `origin`. Walls are visible when they are the first thing hit. */
export function computeVisible(tiles: Tile[], origin: Pos, radius: number): boolean[] {
  const visible = Array<boolean>(W * H).fill(false)

  for (let y = origin.y - radius; y <= origin.y + radius; y++) {
    for (let x = origin.x - radius; x <= origin.x + radius; x++) {
      if (!inBounds(x, y)) continue
      const dx = x - origin.x
      const dy = y - origin.y
      if (dx * dx + dy * dy > radius * radius) continue
      if (hasLineOfSight(tiles, origin, { x, y })) visible[idx(x, y)] = true
    }
  }
  return visible
}
