export const W = 40
export const H = 26

export type Tile = 'wall' | 'floor'

export interface Pos {
  x: number
  y: number
}

export type EnemyKind = 'rat' | 'goblin' | 'skeleton'
export type ItemKind = 'potion' | 'gold' | 'sword'

export interface Enemy {
  id: string
  kind: EnemyKind
  pos: Pos
  hp: number
  attack: number
}

export interface Item {
  id: string
  kind: ItemKind
  pos: Pos
}

export interface Player {
  pos: Pos
  hp: number
  maxHp: number
  attack: number
}

export interface GameState {
  seed: number
  /** internal state of the random number generator, so every game is reproducible */
  rngState: number
  depth: number
  tiles: Tile[]
  stairs: Pos
  player: Player
  enemies: Enemy[]
  items: Item[]
  /** tiles the player has seen at least once */
  explored: boolean[]
  /** tiles the player can see right now */
  visible: boolean[]
  gold: number
  kills: number
  log: string[]
  status: 'playing' | 'dead'
}

export type Action =
  | { type: 'move'; dx: -1 | 0 | 1; dy: -1 | 0 | 1 }
  | { type: 'wait' }
  | { type: 'restart'; seed: number }

// Maps are stored as flat arrays: index = y * W + x
export const idx = (x: number, y: number) => y * W + x
export const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H
export const samePos = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y
export const manhattan = (a: Pos, b: Pos) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
