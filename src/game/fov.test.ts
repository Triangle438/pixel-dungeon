import { describe, expect, it } from 'vitest'
import { computeVisible, hasLineOfSight } from './fov'
import { H, W, idx, type Tile } from './types'

// A big open room with solid walls around it.
function openMap(): Tile[] {
  const tiles = Array<Tile>(W * H).fill('wall')
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) tiles[idx(x, y)] = 'floor'
  return tiles
}

describe('field of view', () => {
  it('sees open floor in a straight line', () => {
    expect(hasLineOfSight(openMap(), { x: 5, y: 5 }, { x: 10, y: 5 })).toBe(true)
  })

  it('is blocked by a wall in between', () => {
    const tiles = openMap()
    tiles[idx(7, 5)] = 'wall'
    expect(hasLineOfSight(tiles, { x: 5, y: 5 }, { x: 10, y: 5 })).toBe(false)
  })

  it('still sees the wall that blocks the view', () => {
    const tiles = openMap()
    tiles[idx(7, 5)] = 'wall'
    expect(computeVisible(tiles, { x: 5, y: 5 }, 7)[idx(7, 5)]).toBe(true)
    expect(computeVisible(tiles, { x: 5, y: 5 }, 7)[idx(9, 5)]).toBe(false)
  })

  it('respects the view radius', () => {
    const visible = computeVisible(openMap(), { x: 10, y: 10 }, 3)
    expect(visible[idx(13, 10)]).toBe(true)
    expect(visible[idx(14, 10)]).toBe(false)
    expect(visible[idx(10, 10)]).toBe(true)
  })

  it('does not look outside the map near the edge', () => {
    expect(() => computeVisible(openMap(), { x: 2, y: 2 }, 7)).not.toThrow()
  })
})
