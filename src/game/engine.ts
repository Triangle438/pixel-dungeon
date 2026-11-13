import { generateDungeon, type Room } from './dungeon'
import { computeVisible } from './fov'
import { createRng, type Rng } from './rng'
import {
  idx,
  inBounds,
  manhattan,
  samePos,
  type Action,
  type Enemy,
  type EnemyKind,
  type GameState,
  type Item,
  type ItemKind,
  type Pos,
  type Tile,
} from './types'

export const FOV_RADIUS = 7
const CHASE_RANGE = 8
const POTION_HEAL = 8
const LOG_SIZE = 6

export const ENEMY_STATS: Record<EnemyKind, { hp: number; attack: number }> = {
  rat: { hp: 3, attack: 1 },
  goblin: { hp: 6, attack: 2 },
  skeleton: { hp: 10, attack: 3 },
}

// Tougher monsters show up deeper in the dungeon.
const enemyPool = (depth: number): EnemyKind[] =>
  depth >= 4 ? ['rat', 'goblin', 'skeleton'] : depth >= 2 ? ['rat', 'goblin'] : ['rat']

export const computeScore = (s: Pick<GameState, 'gold' | 'kills' | 'depth'>) =>
  s.gold + s.kills * 10 + (s.depth - 1) * 100

// Picks a free floor tile inside a random room, or null if it can't find one.
function randomFreePos(rng: Rng, rooms: Room[], taken: Pos[], start: Pos, minDistFromStart: number): Pos | null {
  for (let attempt = 0; attempt < 60; attempt++) {
    const room = rng.pick(rooms)
    const pos = { x: rng.int(room.x, room.x + room.w - 1), y: rng.int(room.y, room.y + room.h - 1) }
    if (taken.some((t) => samePos(t, pos))) continue
    if (manhattan(pos, start) < minDistFromStart) continue
    return pos
  }
  return null
}

interface Floor {
  tiles: Tile[]
  start: Pos
  stairs: Pos
  enemies: Enemy[]
  items: Item[]
}

function buildFloor(rng: Rng, depth: number): Floor {
  const dungeon = generateDungeon(rng)
  const taken: Pos[] = [dungeon.start, dungeon.stairs]
  const enemies: Enemy[] = []
  const items: Item[] = []

  // No monster starts right next to the player; the first room stays calm.
  const enemyRooms = dungeon.rooms.slice(1)
  const enemyCount = Math.min(3 + depth, 12)
  for (let i = 0; i < enemyCount; i++) {
    const pos = randomFreePos(rng, enemyRooms, taken, dungeon.start, 5)
    if (!pos) continue
    taken.push(pos)
    const kind = rng.pick(enemyPool(depth))
    enemies.push({ id: `e${depth}-${i}`, kind, pos, ...ENEMY_STATS[kind] })
  }

  const itemKinds: ItemKind[] = ['potion', 'potion', 'gold', 'gold', 'gold']
  if (depth % 2 === 0) itemKinds.push('sword')
  itemKinds.forEach((kind, i) => {
    const pos = randomFreePos(rng, dungeon.rooms, taken, dungeon.start, 0)
    if (!pos) return
    taken.push(pos)
    items.push({ id: `i${depth}-${i}`, kind, pos })
  })

  return { tiles: dungeon.tiles, start: dungeon.start, stairs: dungeon.stairs, enemies, items }
}

export function newGame(seed: number): GameState {
  const rng = createRng(seed)
  const floor = buildFloor(rng, 1)
  const visible = computeVisible(floor.tiles, floor.start, FOV_RADIUS)

  return {
    seed,
    rngState: rng.state(),
    depth: 1,
    tiles: floor.tiles,
    stairs: floor.stairs,
    player: { pos: floor.start, hp: 20, maxHp: 20, attack: 3 },
    enemies: floor.enemies,
    items: floor.items,
    explored: [...visible],
    visible,
    gold: 0,
    kills: 0,
    log: ['You enter the dungeon. Find the stairs (>) to go deeper.'],
    status: 'playing',
  }
}

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0)

/**
 * The whole game is one pure function: (state, action) => new state.
 * All randomness comes from the seeded generator stored in the state,
 * so the same seed and the same moves always give the same game.
 */
export function reduce(state: GameState, action: Action): GameState {
  if (action.type === 'restart') return newGame(action.seed)
  if (state.status === 'dead') return state

  const rng = createRng(state.rngState)
  const player = { ...state.player, pos: { ...state.player.pos } }
  let enemies = state.enemies.map((e) => ({ ...e, pos: { ...e.pos } }))
  let items = state.items
  let gold = state.gold
  let kills = state.kills
  const log: string[] = []

  if (action.type === 'move') {
    const target = { x: player.pos.x + action.dx, y: player.pos.y + action.dy }
    // Walking into a wall takes no turn.
    if (!inBounds(target.x, target.y) || state.tiles[idx(target.x, target.y)] === 'wall') return state

    const victim = enemies.find((e) => samePos(e.pos, target))
    if (victim) {
      const damage = player.attack + rng.int(0, 1)
      victim.hp -= damage
      if (victim.hp <= 0) {
        enemies = enemies.filter((e) => e !== victim)
        kills += 1
        log.push(`You defeat the ${victim.kind}.`)
      } else {
        log.push(`You hit the ${victim.kind} for ${damage}.`)
      }
    } else {
      player.pos = target

      const found = items.find((i) => samePos(i.pos, target))
      if (found) {
        items = items.filter((i) => i !== found)
        if (found.kind === 'potion') {
          const healed = Math.min(POTION_HEAL, player.maxHp - player.hp)
          player.hp += healed
          log.push(healed > 0 ? `You drink a potion and heal ${healed} HP.` : 'You drink a potion, but you are already healthy.')
        } else if (found.kind === 'gold') {
          const amount = rng.int(5, 15)
          gold += amount
          log.push(`You pick up ${amount} gold.`)
        } else {
          player.attack += 1
          log.push('You find a sharper sword. Attack +1.')
        }
      }

      if (samePos(target, state.stairs)) {
        const depth = state.depth + 1
        const floor = buildFloor(rng, depth)
        // A short rest on the stairs, so going deeper is not pure punishment.
        player.hp = Math.min(player.maxHp, player.hp + 3)
        player.pos = floor.start
        const visible = computeVisible(floor.tiles, floor.start, FOV_RADIUS)
        return {
          ...state,
          rngState: rng.state(),
          depth,
          tiles: floor.tiles,
          stairs: floor.stairs,
          player,
          enemies: floor.enemies,
          items: floor.items,
          explored: [...visible],
          visible,
          gold,
          kills,
          log: [...state.log, ...log, `You descend to floor ${depth}.`].slice(-LOG_SIZE),
        }
      }
    }
  }

  const visible = computeVisible(state.tiles, player.pos, FOV_RADIUS)
  let status: GameState['status'] = 'playing'

  // Enemy turn: attack if adjacent, otherwise chase if the player is in sight and close.
  for (const enemy of enemies) {
    const dist = manhattan(enemy.pos, player.pos)

    if (dist === 1) {
      const damage = enemy.attack + rng.int(0, 1)
      player.hp -= damage
      log.push(`The ${enemy.kind} hits you for ${damage}.`)
      if (player.hp <= 0) {
        player.hp = 0
        status = 'dead'
        log.push(`You died on floor ${state.depth}.`)
        break
      }
    } else if (dist <= CHASE_RANGE && visible[idx(enemy.pos.x, enemy.pos.y)]) {
      const dx = sign(player.pos.x - enemy.pos.x)
      const dy = sign(player.pos.y - enemy.pos.y)
      // Try the axis with the bigger gap first, then the other one.
      const horizontalFirst = Math.abs(player.pos.x - enemy.pos.x) >= Math.abs(player.pos.y - enemy.pos.y)
      const steps = horizontalFirst ? [{ x: dx, y: 0 }, { x: 0, y: dy }] : [{ x: 0, y: dy }, { x: dx, y: 0 }]

      for (const step of steps) {
        if (step.x === 0 && step.y === 0) continue
        const next = { x: enemy.pos.x + step.x, y: enemy.pos.y + step.y }
        const blocked =
          state.tiles[idx(next.x, next.y)] === 'wall' ||
          samePos(next, player.pos) ||
          enemies.some((o) => o !== enemy && samePos(o.pos, next))
        if (!blocked) {
          enemy.pos = next
          break
        }
      }
    }
  }

  return {
    ...state,
    rngState: rng.state(),
    player,
    enemies,
    items,
    explored: state.explored.map((seen, i) => seen || visible[i]),
    visible,
    gold,
    kills,
    log: [...state.log, ...log].slice(-LOG_SIZE),
    status,
  }
}
