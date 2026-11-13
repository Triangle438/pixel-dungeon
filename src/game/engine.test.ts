import { describe, expect, it } from 'vitest'
import { ENEMY_STATS, computeScore, newGame, reduce } from './engine'
import { H, W, idx, type Enemy, type GameState, type Item, type Tile } from './types'

// A small hand-made level: one open room from (5,5) to (20,12), player at (6,6), stairs at (20,12).
function testState(over: Partial<GameState> = {}): GameState {
  const tiles = Array<Tile>(W * H).fill('wall')
  for (let y = 5; y <= 12; y++) for (let x = 5; x <= 20; x++) tiles[idx(x, y)] = 'floor'
  return {
    ...newGame(1),
    tiles,
    stairs: { x: 20, y: 12 },
    player: { pos: { x: 6, y: 6 }, hp: 20, maxHp: 20, attack: 3 },
    enemies: [],
    items: [],
    gold: 0,
    kills: 0,
    status: 'playing',
    ...over,
  }
}

const enemy = (kind: Enemy['kind'], x: number, y: number): Enemy => ({ id: `${kind}${x}${y}`, kind, pos: { x, y }, ...ENEMY_STATS[kind] })
const item = (kind: Item['kind'], x: number, y: number): Item => ({ id: `${kind}${x}${y}`, kind, pos: { x, y } })
const move = (dx: -1 | 0 | 1, dy: -1 | 0 | 1) => ({ type: 'move' as const, dx, dy })

describe('newGame', () => {
  it('is reproducible from the seed', () => {
    expect(newGame(5)).toEqual(newGame(5))
  })

  it('starts on a calm first floor with full health', () => {
    const g = newGame(5)
    expect(g.depth).toBe(1)
    expect(g.status).toBe('playing')
    expect(g.player.hp).toBe(g.player.maxHp)
    expect(g.enemies.length).toBeGreaterThan(0)
    // nothing starts next to the player
    for (const e of g.enemies) {
      expect(Math.abs(e.pos.x - g.player.pos.x) + Math.abs(e.pos.y - g.player.pos.y)).toBeGreaterThanOrEqual(5)
    }
  })

  it('shows the player their surroundings at the start', () => {
    const g = newGame(5)
    expect(g.visible[idx(g.player.pos.x, g.player.pos.y)]).toBe(true)
    expect(g.explored).toEqual(g.visible)
  })
})

describe('movement', () => {
  it('moves the player onto a free floor tile', () => {
    const next = reduce(testState(), move(1, 0))
    expect(next.player.pos).toEqual({ x: 7, y: 6 })
  })

  it('walking into a wall takes no turn', () => {
    const state = testState({ player: { pos: { x: 5, y: 5 }, hp: 20, maxHp: 20, attack: 3 }, enemies: [enemy('rat', 9, 5)] })
    expect(reduce(state, move(-1, 0))).toBe(state)
  })

  it('does not change the original state (pure reducer)', () => {
    const state = testState()
    reduce(state, move(1, 0))
    expect(state.player.pos).toEqual({ x: 6, y: 6 })
  })

  it('adds newly seen tiles to the explored map', () => {
    const state = testState({ explored: Array<boolean>(W * H).fill(false) })
    const next = reduce(state, move(1, 0))
    expect(next.explored[idx(7, 6)]).toBe(true)
    expect(next.explored[idx(0, 0)]).toBe(false)
  })
})

describe('combat', () => {
  it('kills a rat in one hit and stays in place', () => {
    const next = reduce(testState({ enemies: [enemy('rat', 7, 6)] }), move(1, 0))
    expect(next.enemies).toHaveLength(0)
    expect(next.kills).toBe(1)
    expect(next.player.pos).toEqual({ x: 6, y: 6 })
  })

  it('wounds a tougher enemy that then hits back', () => {
    const next = reduce(testState({ enemies: [enemy('skeleton', 7, 6)] }), move(1, 0))
    expect(next.enemies[0].hp).toBeLessThan(ENEMY_STATS.skeleton.hp)
    expect(next.player.hp).toBeLessThan(20)
  })

  it('an adjacent enemy attacks when the player waits', () => {
    const next = reduce(testState({ enemies: [enemy('goblin', 7, 6)] }), { type: 'wait' })
    expect(next.player.hp).toBeGreaterThanOrEqual(20 - 3)
    expect(next.player.hp).toBeLessThan(20)
  })

  it('a visible enemy in range steps closer', () => {
    const next = reduce(testState({ enemies: [enemy('goblin', 10, 6)] }), { type: 'wait' })
    expect(next.enemies[0].pos).toEqual({ x: 9, y: 6 })
  })

  it('an enemy out of sight stays where it is', () => {
    const tiles = testState().tiles
    tiles[idx(8, 6)] = 'wall'
    const next = reduce(testState({ tiles, enemies: [enemy('goblin', 10, 6)] }), { type: 'wait' })
    expect(next.enemies[0].pos).toEqual({ x: 10, y: 6 })
  })

  it('enemies do not walk through each other', () => {
    const state = testState({ enemies: [enemy('goblin', 9, 6), enemy('goblin', 10, 6)] })
    const next = reduce(state, { type: 'wait' })
    const positions = next.enemies.map((e) => `${e.pos.x},${e.pos.y}`)
    expect(new Set(positions).size).toBe(2)
  })

  it('the player dies at 0 HP and the game stops accepting moves', () => {
    const state = testState({
      player: { pos: { x: 6, y: 6 }, hp: 1, maxHp: 20, attack: 3 },
      enemies: [enemy('rat', 7, 6)],
    })
    const dead = reduce(state, { type: 'wait' })
    expect(dead.status).toBe('dead')
    expect(dead.player.hp).toBe(0)
    expect(reduce(dead, move(0, 1))).toBe(dead)
  })
})

describe('items', () => {
  it('a potion heals but never above max HP', () => {
    const state = testState({ player: { pos: { x: 6, y: 6 }, hp: 15, maxHp: 20, attack: 3 }, items: [item('potion', 7, 6)] })
    const next = reduce(state, move(1, 0))
    expect(next.player.hp).toBe(20)
    expect(next.items).toHaveLength(0)
  })

  it('gold adds between 5 and 15 to the purse', () => {
    const next = reduce(testState({ items: [item('gold', 7, 6)] }), move(1, 0))
    expect(next.gold).toBeGreaterThanOrEqual(5)
    expect(next.gold).toBeLessThanOrEqual(15)
  })

  it('a sword adds 1 attack', () => {
    const next = reduce(testState({ items: [item('sword', 7, 6)] }), move(1, 0))
    expect(next.player.attack).toBe(4)
  })
})

describe('stairs and score', () => {
  it('taking the stairs starts a new, deeper floor', () => {
    const state = testState({ player: { pos: { x: 19, y: 12 }, hp: 10, maxHp: 20, attack: 3 } })
    const next = reduce(state, move(1, 0))
    expect(next.depth).toBe(2)
    expect(next.tiles).not.toEqual(state.tiles)
    expect(next.player.pos).not.toEqual({ x: 20, y: 12 })
    expect(next.player.hp).toBe(13)
    expect(next.status).toBe('playing')
  })

  it('later floors are tougher', () => {
    const state = testState({ depth: 3, player: { pos: { x: 19, y: 12 }, hp: 20, maxHp: 20, attack: 3 } })
    // floor 4 plans 7 monsters, floor 1 plans 4; allow a couple to be skipped if a room is crowded
    const deeper = reduce(state, move(1, 0))
    expect(deeper.depth).toBe(4)
    expect(deeper.enemies.length).toBeGreaterThanOrEqual(5)
    expect(newGame(1).enemies.length).toBeLessThanOrEqual(4)
  })

  it('scores gold, kills and depth', () => {
    expect(computeScore({ gold: 30, kills: 4, depth: 3 })).toBe(30 + 40 + 200)
  })

  it('restart gives a fresh game from the given seed', () => {
    const dead = testState({ status: 'dead' })
    expect(reduce(dead, { type: 'restart', seed: 7 })).toEqual(newGame(7))
  })

  it('the same seed and moves always play out the same way', () => {
    const play = () => [move(1, 0), move(0, 1), { type: 'wait' as const }, move(1, 0)].reduce(reduce, newGame(11))
    expect(play()).toEqual(play())
  })
})
