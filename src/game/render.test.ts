import { describe, expect, it } from 'vitest'
import { VIEW_H, VIEW_W, cameraOrigin } from './render'
import { H, W } from './types'

describe('cameraOrigin', () => {
  it('centres on the player in the middle of the map', () => {
    const cam = cameraOrigin({ x: 20, y: 13 })
    expect(cam.x + Math.floor(VIEW_W / 2)).toBe(20)
    expect(cam.y + Math.floor(VIEW_H / 2)).toBe(13)
  })

  it('stops at the top-left corner of the map', () => {
    expect(cameraOrigin({ x: 1, y: 1 })).toEqual({ x: 0, y: 0 })
  })

  it('stops at the bottom-right corner of the map', () => {
    expect(cameraOrigin({ x: W - 2, y: H - 2 })).toEqual({ x: W - VIEW_W, y: H - VIEW_H })
  })

  it('always keeps the player inside the view', () => {
    for (let x = 1; x < W - 1; x++) {
      for (let y = 1; y < H - 1; y++) {
        const cam = cameraOrigin({ x, y })
        expect(x).toBeGreaterThanOrEqual(cam.x)
        expect(x).toBeLessThan(cam.x + VIEW_W)
        expect(y).toBeGreaterThanOrEqual(cam.y)
        expect(y).toBeLessThan(cam.y + VIEW_H)
      }
    }
  })
})
