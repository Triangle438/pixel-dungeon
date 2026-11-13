import { useEffect, useReducer } from 'react'
import { newGame, reduce } from '../game/engine'
import { keyToAction } from '../game/input'
import { parseSeed } from '../game/seed'
import type { Action } from '../game/types'

export const randomSeed = () => Math.floor(Math.random() * 2 ** 32)

export function useGame() {
  const [state, dispatch] = useReducer(reduce, undefined, () => newGame(parseSeed(window.location.search) ?? randomSeed()))

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const action = keyToAction(e.key, randomSeed)
      if (!action) return
      // stop arrows and space from scrolling the page
      e.preventDefault()
      dispatch(action)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const act = (action: Action) => dispatch(action)
  const restart = () => dispatch({ type: 'restart', seed: randomSeed() })

  return { state, act, restart }
}
