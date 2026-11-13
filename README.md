# Pixel Dungeon

A tiny roguelike that runs in the browser. Every dungeon is randomly generated, you only see what is near you, and the monsters get tougher the deeper you go.

Built with **React 18**, **TypeScript**, the **Canvas API** and plain **CSS**, bundled with **Vite**, with unit tests in **Vitest**. No game engine and no runtime dependencies besides React.

## How to play

| Key | Action |
| --- | --- |
| Arrow keys / `WASD` | Move. Walk into a monster to attack it |
| `Space` or `.` | Wait a turn |
| `R` | New dungeon |

On phones and tablets there are on-screen buttons instead.

Find the stairs (`>`) to descend. Pick up potions (`!`) to heal, gold (`$`) for score and swords (`/`) for +1 attack. Rats (`r`), goblins (`g`) and skeletons (`S`) chase you when they see you. Score is gold + 10 per kill + 100 per floor reached, and your best score is saved in the browser.

Every dungeon has a seed shown under the controls. Open the page with `?seed=123` to play the same dungeon again or to share it.

## How it works

- **Procedural dungeons** (`src/game/dungeon.ts`): random rooms that do not overlap, each joined to the previous one by an L-shaped corridor. Linking every room to the one before guarantees the whole map is connected.
- **Fog of war** (`src/game/fov.ts`): a tile is visible if it is within radius 7 and a Bresenham line to it crosses no wall. Seen tiles are remembered and drawn dimmed.
- **Turn-based engine as a pure function** (`src/game/engine.ts`): `reduce(state, action) => newState`, used with React's `useReducer`. All randomness comes from a seeded generator (mulberry32) whose state lives inside the game state, so the same seed and the same moves always give the same game, in Node and in the browser.
- **Enemy AI**: attack when adjacent, otherwise step towards the player if the player is in sight and close.
- **Rendering** (`src/game/render.ts`): one canvas, drawn at the screen's pixel density. A camera follows the player so tiles stay large on small screens.
- **Accessibility**: the message log is an `aria-live` region, health is a `progressbar`, and the game is fully playable by keyboard.

## Tests

`npm test` runs 47 tests, including:

- generated maps are fully connected, the stairs are reachable and the border is solid wall (200 seeds)
- walls block the view but are still seen, and the view radius is respected
- combat, item pickup, death, stairs and restart
- **a simulation test**: a bot plays 40 whole games, and after every single move the test checks that nobody stands inside a wall or on the same tile as someone else and that health stays in range

The same simulation shows the difficulty: a simple bot that only walks to the stairs and never heals or flees reaches floor 6 on median.

## Structure

```
src/
  game/         types, rng, dungeon, fov, engine, input, render, seed (all with tests, no React)
  components/   GameCanvas, Hud, MessageLog, Controls
  hooks/        useGame (reducer + keyboard), useLocalStorage
```

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev      # start dev server
npm test         # run unit tests
npm run build    # type-check and build to dist/
npm run preview  # preview the production build
```

## Possible next steps

- Ranged enemies and a bow for the player
- Pixel-art sprites instead of text glyphs
- Persist and resume a run
- Daily dungeon with a seed based on the date
