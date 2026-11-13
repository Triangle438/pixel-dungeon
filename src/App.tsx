import { useEffect } from 'react'
import { Controls } from './components/Controls'
import { GameCanvas } from './components/GameCanvas'
import { Hud } from './components/Hud'
import { MessageLog } from './components/MessageLog'
import { computeScore } from './game/engine'
import { useGame } from './hooks/useGame'
import { useLocalStorage } from './hooks/useLocalStorage'

export default function App() {
  const { state, act, restart } = useGame()
  const [best, setBest] = useLocalStorage<number>('pixel-dungeon-best', 0)
  const score = computeScore(state)

  // Save the best score when a run ends.
  useEffect(() => {
    if (state.status === 'dead' && score > best) setBest(score)
  }, [state.status, score, best, setBest])

  return (
    <div className="layout">
      <header className="header">
        <h1>⚔️ Pixel Dungeon</h1>
        <p className="muted">Find the stairs, grab the loot and see how deep you can go.</p>
      </header>

      <main className="game">
        <div className="stage">
          <GameCanvas state={state} />
          {state.status === 'dead' && (
            <div className="overlay" role="alertdialog" aria-labelledby="dead-title">
              <h2 id="dead-title">You died on floor {state.depth}</h2>
              <p>
                Score {score}
                {score >= best && score > 0 ? ' · new best!' : ''}
              </p>
              <button className="btn" onClick={restart} autoFocus>
                New dungeon
              </button>
            </div>
          )}
        </div>

        <aside className="side">
          <Hud state={state} best={Math.max(best, state.status === 'dead' ? score : 0)} />
          <MessageLog messages={state.log} />
          <Controls onAction={act} />

          <section className="panel help" aria-label="How to play">
            <p>
              <kbd>←↑↓→</kbd> or <kbd>WASD</kbd> move and attack, <kbd>Space</kbd> waits, <kbd>R</kbd> starts a new dungeon.
            </p>
            <p className="legend">
              <span style={{ color: '#3ddbc0' }}>@</span> you · <span style={{ color: '#ffd24a' }}>&gt;</span> stairs ·{' '}
              <span style={{ color: '#ff6b9a' }}>!</span> potion · <span style={{ color: '#ffd24a' }}>$</span> gold ·{' '}
              <span style={{ color: '#7fd0ff' }}>/</span> sword · <span style={{ color: '#c9a27a' }}>r</span>
              <span style={{ color: '#6fdc6f' }}>g</span>
              <span style={{ color: '#e8eaf2' }}>S</span> monsters
            </p>
            <p className="muted">Seed {state.seed}</p>
          </section>
          <button className="btn btn--ghost" onClick={restart}>
            New dungeon
          </button>
        </aside>
      </main>
    </div>
  )
}
