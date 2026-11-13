import { computeScore } from '../game/engine'
import type { GameState } from '../game/types'

export function Hud({ state, best }: { state: GameState; best: number }) {
  const { player } = state
  const pct = (player.hp / player.maxHp) * 100

  return (
    <section className="panel" aria-label="Player stats">
      <div
        className="hp"
        role="progressbar"
        aria-label="Health"
        aria-valuemin={0}
        aria-valuemax={player.maxHp}
        aria-valuenow={player.hp}
      >
        <div className="hp__fill" style={{ width: `${pct}%` }} />
        <span className="hp__text">
          HP {player.hp} / {player.maxHp}
        </span>
      </div>

      <dl className="stats">
        <div>
          <dt>Floor</dt>
          <dd>{state.depth}</dd>
        </div>
        <div>
          <dt>Attack</dt>
          <dd>{player.attack}</dd>
        </div>
        <div>
          <dt>Gold</dt>
          <dd>{state.gold}</dd>
        </div>
        <div>
          <dt>Kills</dt>
          <dd>{state.kills}</dd>
        </div>
        <div>
          <dt>Score</dt>
          <dd>{computeScore(state)}</dd>
        </div>
        <div>
          <dt>Best</dt>
          <dd>{best}</dd>
        </div>
      </dl>
    </section>
  )
}
