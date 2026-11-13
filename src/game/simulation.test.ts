import { describe, expect, it } from 'vitest'
import { newGame, reduce } from './engine'
import { H, W, idx, inBounds, samePos, type Action, type GameState, type Pos } from './types'

const DIRS = [
  { dx: 1, dy: 0 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
] as const

// A simple bot: walk the shortest path to the stairs, fighting whatever is in the way.
function botAction(state: GameState): Action {
  const { player, stairs, tiles } = state
  const from = new Map<number, number>()
  const queue: Pos[] = [player.pos]
  from.set(idx(player.pos.x, player.pos.y), -1)

  for (let head = 0; head < queue.length; head++) {
    const p = queue[head]
    if (samePos(p, stairs)) break
    for (const d of DIRS) {
      const nx = p.x + d.dx
      const ny = p.y + d.dy
      if (!inBounds(nx, ny) || tiles[idx(nx, ny)] !== 'floor' || from.has(idx(nx, ny))) continue
      from.set(idx(nx, ny), idx(p.x, p.y))
      queue.push({ x: nx, y: ny })
    }
  }

  // walk back from the stairs to find the first step
  let cur = idx(stairs.x, stairs.y)
  let prev = from.get(cur)
  while (prev !== undefined && prev !== -1 && prev !== idx(player.pos.x, player.pos.y)) {
    cur = prev
    prev = from.get(cur)
  }
  const step = { x: cur % W, y: Math.floor(cur / W) }
  const dx = Math.sign(step.x - player.pos.x) as -1 | 0 | 1
  const dy = Math.sign(step.y - player.pos.y) as -1 | 0 | 1
  return { type: 'move', dx, dy }
}

function assertInvariants(s: GameState, label: string) {
  expect(s.tiles[idx(s.player.pos.x, s.player.pos.y)], `${label}: player on floor`).toBe('floor')
  expect(s.player.hp, `${label}: hp`).toBeGreaterThanOrEqual(0)
  expect(s.player.hp, `${label}: hp`).toBeLessThanOrEqual(s.player.maxHp)

  const occupied = new Set<number>([idx(s.player.pos.x, s.player.pos.y)])
  for (const e of s.enemies) {
    const i = idx(e.pos.x, e.pos.y)
    expect(inBounds(e.pos.x, e.pos.y), `${label}: enemy in bounds`).toBe(true)
    expect(s.tiles[i], `${label}: enemy on floor`).toBe('floor')
    expect(occupied.has(i), `${label}: nobody shares a tile`).toBe(false)
    occupied.add(i)
  }
  for (const item of s.items) expect(s.tiles[idx(item.pos.x, item.pos.y)], `${label}: item on floor`).toBe('floor')
  expect(s.tiles).toHaveLength(W * H)
}

describe('full-game simulation', () => {
  it('a bot can play 40 random games without ever breaking the rules', () => {
    let totalDepth = 0
    for (let seed = 1; seed <= 40; seed++) {
      let state = newGame(seed)
      for (let turn = 0; turn < 3000 && state.status === 'playing' && state.depth < 8; turn++) {
        state = reduce(state, botAction(state))
        assertInvariants(state, `seed ${seed}, turn ${turn}`)
      }
      totalDepth += state.depth
    }
    // the bot should usually get past the first floors, otherwise the game is broken or far too hard
    expect(totalDepth / 40).toBeGreaterThan(2)
  })
})
