import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect(Array.from({ length: 5 }, () => a.next())).toEqual(Array.from({ length: 5 }, () => b.next()))
  })

  it('gives different sequences for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next())
  })

  it('int stays inside the inclusive range', () => {
    const rng = createRng(7)
    for (let i = 0; i < 500; i++) {
      const n = rng.int(3, 6)
      expect(n).toBeGreaterThanOrEqual(3)
      expect(n).toBeLessThanOrEqual(6)
    }
  })

  it('can continue from a saved state', () => {
    const a = createRng(9)
    a.next()
    const b = createRng(a.state())
    expect(b.next()).toBe(a.next())
  })
})
