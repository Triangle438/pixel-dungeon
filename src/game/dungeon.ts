import type { Rng } from './rng'
import { H, W, idx, type Pos, type Tile } from './types'

export interface Room {
  x: number
  y: number
  w: number
  h: number
}

export interface Dungeon {
  tiles: Tile[]
  rooms: Room[]
  start: Pos
  stairs: Pos
}

const MAX_ROOMS = 9
const MAX_ATTEMPTS = 300

export const center = (r: Room): Pos => ({ x: Math.floor(r.x + r.w / 2), y: Math.floor(r.y + r.h / 2) })

// True when the rooms touch or come closer than `pad` tiles.
const overlaps = (a: Room, b: Room, pad: number) =>
  a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y

/**
 * Rooms-and-corridors generation: drop random rooms that don't overlap,
 * then connect each room to the previous one with an L-shaped corridor.
 * Because every room is linked to the one before it, the whole map is connected.
 */
export function generateDungeon(rng: Rng): Dungeon {
  const tiles = Array<Tile>(W * H).fill('wall')
  let rooms: Room[] = []

  for (let attempt = 0; attempt < MAX_ATTEMPTS && rooms.length < MAX_ROOMS; attempt++) {
    const w = rng.int(4, 9)
    const h = rng.int(3, 6)
    // keep a 1-tile border of wall around the whole map
    const candidate: Room = { x: rng.int(1, W - w - 1), y: rng.int(1, H - h - 1), w, h }
    if (!rooms.some((r) => overlaps(r, candidate, 1))) rooms.push(candidate)
  }

  // Practically never needed, but a map always has at least two rooms.
  if (rooms.length < 2) {
    rooms = [
      { x: 2, y: 2, w: 6, h: 4 },
      { x: 30, y: 18, w: 6, h: 4 },
    ]
  }

  const carve = (x: number, y: number) => {
    tiles[idx(x, y)] = 'floor'
  }

  for (const r of rooms) {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) carve(x, y)
  }

  const corridorH = (x1: number, x2: number, y: number) => {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) carve(x, y)
  }
  const corridorV = (y1: number, y2: number, x: number) => {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) carve(x, y)
  }

  for (let i = 1; i < rooms.length; i++) {
    const a = center(rooms[i - 1])
    const b = center(rooms[i])
    if (rng.next() < 0.5) {
      corridorH(a.x, b.x, a.y)
      corridorV(a.y, b.y, b.x)
    } else {
      corridorV(a.y, b.y, a.x)
      corridorH(a.x, b.x, b.y)
    }
  }

  return { tiles, rooms, start: center(rooms[0]), stairs: center(rooms[rooms.length - 1]) }
}
