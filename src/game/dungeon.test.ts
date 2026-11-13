import { describe, expect, it } from 'vitest'
import { generateDungeon } from './dungeon'
import { createRng } from './rng'
import { H, W, idx, inBounds, type Pos, type Tile } from './types'

// Flood fill: which floor tiles can be reached by walking from `from`?
function reachable(tiles: Tile[], from: Pos): Set<number> {
  const seen = new Set<number>([idx(from.x, from.y)])
  const queue: Pos[] = [from]
  while (queue.length) {
    const { x, y } = queue.pop()!
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx
      const ny = y + dy
      if (!inBounds(nx, ny) || tiles[idx(nx, ny)] !== 'floor' || seen.has(idx(nx, ny))) continue
      seen.add(idx(nx, ny))
      queue.push({ x: nx, y: ny })
    }
  }
  return seen
}

describe('generateDungeon', () => {
  it('is reproducible from the seed', () => {
    expect(generateDungeon(createRng(123))).toEqual(generateDungeon(createRng(123)))
  })

  it('differs between seeds', () => {
    expect(generateDungeon(createRng(1)).tiles).not.toEqual(generateDungeon(createRng(2)).tiles)
  })

  it('always creates a fully connected map, for 200 seeds', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const d = generateDungeon(createRng(seed))
      const floorCount = d.tiles.filter((t) => t === 'floor').length
      expect(reachable(d.tiles, d.start).size, `seed ${seed}`).toBe(floorCount)
    }
  })

  it('puts the start and the stairs on different, reachable floor tiles', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const d = generateDungeon(createRng(seed))
      expect(d.tiles[idx(d.start.x, d.start.y)]).toBe('floor')
      expect(d.tiles[idx(d.stairs.x, d.stairs.y)]).toBe('floor')
      expect(d.start).not.toEqual(d.stairs)
      expect(reachable(d.tiles, d.start).has(idx(d.stairs.x, d.stairs.y))).toBe(true)
    }
  })

  it('keeps the outer border solid wall', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { tiles } = generateDungeon(createRng(seed))
      for (let x = 0; x < W; x++) {
        expect(tiles[idx(x, 0)]).toBe('wall')
        expect(tiles[idx(x, H - 1)]).toBe('wall')
      }
      for (let y = 0; y < H; y++) {
        expect(tiles[idx(0, y)]).toBe('wall')
        expect(tiles[idx(W - 1, y)]).toBe('wall')
      }
    }
  })
})
