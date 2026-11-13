import { H, W, idx, type EnemyKind, type GameState, type ItemKind, type Pos } from './types'

export const TILE = 20
// The camera shows a window of the map that follows the player, so tiles stay big on small screens.
export const VIEW_W = 25
export const VIEW_H = 17

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

/** Top-left map tile of the camera: centred on the player, but never showing past the map edge. */
export function cameraOrigin(player: Pos): Pos {
  return {
    x: clamp(player.x - Math.floor(VIEW_W / 2), 0, W - VIEW_W),
    y: clamp(player.y - Math.floor(VIEW_H / 2), 0, H - VIEW_H),
  }
}

const ENEMY_GLYPH: Record<EnemyKind, { char: string; color: string }> = {
  rat: { char: 'r', color: '#c9a27a' },
  goblin: { char: 'g', color: '#6fdc6f' },
  skeleton: { char: 'S', color: '#e8eaf2' },
}

const ITEM_GLYPH: Record<ItemKind, { char: string; color: string }> = {
  potion: { char: '!', color: '#ff6b9a' },
  gold: { char: '$', color: '#ffd24a' },
  sword: { char: '/', color: '#7fd0ff' },
}

// Draws the whole map. Remembered tiles are dimmed, and monsters and items
// only show while they are inside the player's field of view.
export function drawGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const cam = cameraOrigin(state.player.pos)
  ctx.fillStyle = '#0a0c12'
  ctx.fillRect(0, 0, VIEW_W * TILE, VIEW_H * TILE)

  ctx.font = `bold ${TILE - 4}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Everything below is given in map coordinates and converted to screen coordinates here.
  const glyph = (char: string, x: number, y: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillText(char, (x - cam.x) * TILE + TILE / 2, (y - cam.y) * TILE + TILE / 2 + 1)
  }

  for (let y = cam.y; y < cam.y + VIEW_H; y++) {
    for (let x = cam.x; x < cam.x + VIEW_W; x++) {
      const i = idx(x, y)
      if (!state.explored[i]) continue
      const lit = state.visible[i]
      const px = (x - cam.x) * TILE
      const py = (y - cam.y) * TILE

      if (state.tiles[i] === 'wall') {
        ctx.fillStyle = lit ? '#3b4260' : '#1f2437'
        ctx.fillRect(px, py, TILE, TILE)
        ctx.fillStyle = lit ? '#4c5578' : '#272d45'
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2)
      } else {
        ctx.fillStyle = lit ? '#1a2033' : '#111522'
        ctx.fillRect(px, py, TILE, TILE)
        glyph('·', x, y, lit ? '#3d4766' : '#232a40')
      }
    }
  }

  if (state.explored[idx(state.stairs.x, state.stairs.y)]) glyph('>', state.stairs.x, state.stairs.y, '#ffd24a')

  for (const item of state.items) {
    if (state.visible[idx(item.pos.x, item.pos.y)]) glyph(ITEM_GLYPH[item.kind].char, item.pos.x, item.pos.y, ITEM_GLYPH[item.kind].color)
  }
  for (const enemy of state.enemies) {
    if (state.visible[idx(enemy.pos.x, enemy.pos.y)]) glyph(ENEMY_GLYPH[enemy.kind].char, enemy.pos.x, enemy.pos.y, ENEMY_GLYPH[enemy.kind].color)
  }

  glyph('@', state.player.pos.x, state.player.pos.y, state.status === 'dead' ? '#ff5a5a' : '#3ddbc0')
}
