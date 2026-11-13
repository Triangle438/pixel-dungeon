import type { Action } from '../game/types'

interface Props {
  onAction: (action: Action) => void
}

// On-screen buttons for phones and tablets, which have no keyboard.
export function Controls({ onAction }: Props) {
  const move = (dx: -1 | 0 | 1, dy: -1 | 0 | 1): Action => ({ type: 'move', dx, dy })

  return (
    <div className="dpad" role="group" aria-label="Touch controls">
      <button className="dpad__up" onClick={() => onAction(move(0, -1))} aria-label="Move up">▲</button>
      <button className="dpad__left" onClick={() => onAction(move(-1, 0))} aria-label="Move left">◀</button>
      <button className="dpad__wait" onClick={() => onAction({ type: 'wait' })} aria-label="Wait a turn">•</button>
      <button className="dpad__right" onClick={() => onAction(move(1, 0))} aria-label="Move right">▶</button>
      <button className="dpad__down" onClick={() => onAction(move(0, 1))} aria-label="Move down">▼</button>
    </div>
  )
}
