import type { Action } from './types'

const MOVES: Record<string, Extract<Action, { type: 'move' }>> = {
  ArrowUp: { type: 'move', dx: 0, dy: -1 },
  ArrowDown: { type: 'move', dx: 0, dy: 1 },
  ArrowLeft: { type: 'move', dx: -1, dy: 0 },
  ArrowRight: { type: 'move', dx: 1, dy: 0 },
  w: { type: 'move', dx: 0, dy: -1 },
  s: { type: 'move', dx: 0, dy: 1 },
  a: { type: 'move', dx: -1, dy: 0 },
  d: { type: 'move', dx: 1, dy: 0 },
}

/** Turns a keyboard key into a game action, or null for keys the game ignores. */
export function keyToAction(key: string, newSeed: () => number): Action | null {
  const move = MOVES[key] ?? MOVES[key.toLowerCase()]
  if (move) return move
  if (key === ' ' || key === '.') return { type: 'wait' }
  if (key === 'r' || key === 'R') return { type: 'restart', seed: newSeed() }
  return null
}
