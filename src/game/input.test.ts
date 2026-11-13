import { describe, expect, it } from 'vitest'
import { keyToAction } from './input'

const seed = () => 99

describe('keyToAction', () => {
  it('maps arrows and WASD to moves, in either case', () => {
    expect(keyToAction('ArrowUp', seed)).toEqual({ type: 'move', dx: 0, dy: -1 })
    expect(keyToAction('a', seed)).toEqual({ type: 'move', dx: -1, dy: 0 })
    expect(keyToAction('D', seed)).toEqual({ type: 'move', dx: 1, dy: 0 })
  })

  it('maps space and dot to waiting', () => {
    expect(keyToAction(' ', seed)).toEqual({ type: 'wait' })
    expect(keyToAction('.', seed)).toEqual({ type: 'wait' })
  })

  it('maps R to a restart with a fresh seed', () => {
    expect(keyToAction('r', seed)).toEqual({ type: 'restart', seed: 99 })
  })

  it('ignores other keys', () => {
    expect(keyToAction('x', seed)).toBeNull()
    expect(keyToAction('Tab', seed)).toBeNull()
  })
})
