// app/puzzle/mastermind/page.tsx

'use client'

import { useReducer, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw, Sparkles } from 'lucide-react'

const COLORS = [
  { id: 'red', hex: '#c1121f', name: 'Ruby' },
  { id: 'blue', hex: '#0466c8', name: 'Sapphire' },
  { id: 'green', hex: '#2d6a4f', name: 'Emerald' },
  { id: 'yellow', hex: '#ffd60a', name: 'Topaz' },
  { id: 'purple', hex: '#7209b7', name: 'Amethyst' },
  { id: 'orange', hex: '#f77f00', name: 'Amber' },
]

const MAX_GUESSES = 10
const CODE_LENGTH = 4

type GameState = {
  secret: string[]
  guesses: string[][]
  feedback: { exact: number; partial: number }[]
  currentGuess: string[]
  gameOver: boolean
  won: boolean
  attempts: number
}

type Action =
  | { type: 'SELECT_COLOR'; color: string }
  | { type: 'REMOVE_LAST' }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'NEW_GAME' }

function generateSecret(): string[] {
  const secret: string[] = []
  for (let i = 0; i < CODE_LENGTH; i++) {
    secret.push(COLORS[Math.floor(Math.random() * COLORS.length)].id)
  }
  return secret
}

function calculateFeedback(guess: string[], secret: string[]): { exact: number; partial: number } {
  const exact = guess.filter((c, i) => c === secret[i]).length
  const guessCounts = guess.reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {} as Record<string, number>)
  const secretCounts = secret.reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {} as Record<string, number>)
  const total = Object.keys(guessCounts).reduce((sum, c) => sum + Math.min(guessCounts[c] || 0, secretCounts[c] || 0), 0)
  return { exact, partial: total - exact }
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SELECT_COLOR':
      if (state.gameOver || state.currentGuess.length >= CODE_LENGTH) return state
      return { ...state, currentGuess: [...state.currentGuess, action.color] }

    case 'REMOVE_LAST':
      if (state.gameOver || state.currentGuess.length === 0) return state
      return { ...state, currentGuess: state.currentGuess.slice(0, -1) }

    case 'SUBMIT_GUESS':
      if (state.gameOver || state.currentGuess.length !== CODE_LENGTH) return state
      const feedback = calculateFeedback(state.currentGuess, state.secret)
      const won = feedback.exact === CODE_LENGTH
      const attempts = state.attempts + 1
      const gameOver = won || attempts >= MAX_GUESSES
      return {
        ...state,
        guesses: [...state.guesses, state.currentGuess],
        feedback: [...state.feedback, feedback],
        currentGuess: [],
        won,
        gameOver,
        attempts,
      }

    case 'NEW_GAME':
      return {
        secret: generateSecret(),
        guesses: [],
        feedback: [],
        currentGuess: [],
        gameOver: false,
        won: false,
        attempts: 0,
      }

    default:
      return state
  }
}

export default function MastermindPage() {
  const [state, dispatch] = useReducer(reducer, null, () => ({
    secret: generateSecret(),
    guesses: [],
    feedback: [],
    currentGuess: [],
    gameOver: false,
    won: false,
    attempts: 0,
  }))

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') dispatch({ type: 'REMOVE_LAST' })
      if (e.key === 'Enter') dispatch({ type: 'SUBMIT_GUESS' })
      const colorKey = ['1', '2', '3', '4', '5', '6'].indexOf(e.key)
      if (colorKey >= 0) dispatch({ type: 'SELECT_COLOR', color: COLORS[colorKey].id })
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
      
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #7209b7, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', background: 'linear-gradient(135deg, #d4af37, #c0c0c0, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.2em' }}>
            MASTERMIND
          </h1>
          <p className="text-sm tracking-widest uppercase opacity-70" style={{ color: '#d4af37' }}>Code Breaker</p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex justify-around mb-8 p-4 rounded-xl" style={{ background: 'rgba(26,20,35,0.6)', border: '2px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(10px)' }}>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#d4af37' }}>{state.attempts}</div>
            <div className="text-xs opacity-70">Attempts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#d4af37' }}>{MAX_GUESSES - state.attempts}</div>
            <div className="text-xs opacity-70">Remaining</div>
          </div>
        </motion.div>

        {/* Game board */}
        <div className="space-y-3 mb-8">
          {/* Previous guesses */}
          <AnimatePresence>
            {state.guesses.map((guess, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(26,20,35,0.4)', border: '1px solid rgba(212,175,55,0.2)' }}>
                <div className="flex gap-2 flex-1">
                  {guess.map((color, j) => (
                    <motion.div key={j} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: j * 0.05, type: 'spring', stiffness: 200 }} className="w-12 h-12 rounded-full border-2 shadow-lg" style={{ background: COLORS.find(c => c.id === color)?.hex, borderColor: 'rgba(212,175,55,0.5)' }} />
                  ))}
                </div>
                <div className="flex gap-1">
                  {[...Array(state.feedback[i].exact)].map((_, k) => (
                    <motion.div key={`e${k}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + k * 0.05 }} className="w-3 h-3 rounded-full" style={{ background: '#d4af37' }} />
                  ))}
                  {[...Array(state.feedback[i].partial)].map((_, k) => (
                    <motion.div key={`p${k}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + state.feedback[i].exact * 0.05 + k * 0.05 }} className="w-3 h-3 rounded-full" style={{ background: '#c0c0c0' }} />
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Current guess */}
          {!state.gameOver && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.4)' }}>
              <div className="flex gap-2 flex-1">
                {[...Array(CODE_LENGTH)].map((_, i) => (
                  <motion.div key={i} className="w-12 h-12 rounded-full border-2 flex items-center justify-center" style={{ background: state.currentGuess[i] ? COLORS.find(c => c.id === state.currentGuess[i])?.hex : 'rgba(255,255,255,0.05)', borderColor: state.currentGuess[i] ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.2)' }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    {!state.currentGuess[i] && <div className="w-2 h-2 rounded-full bg-white opacity-20" />}
                  </motion.div>
                ))}
              </div>
              <button onClick={() => dispatch({ type: 'SUBMIT_GUESS' })} disabled={state.currentGuess.length !== CODE_LENGTH} className="px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-30" style={{ background: state.currentGuess.length === CODE_LENGTH ? 'linear-gradient(135deg, #d4af37, #a08428)' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                Submit
              </button>
            </motion.div>
          )}
        </div>

        {/* Color palette */}
        {!state.gameOver && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-center gap-3 mb-8">
            {COLORS.map((color, i) => (
              <motion.button key={color.id} onClick={() => dispatch({ type: 'SELECT_COLOR', color: color.id })} whileHover={{ scale: 1.2, y: -5 }} whileTap={{ scale: 0.9 }} className="w-14 h-14 rounded-full border-2 shadow-xl transition-all relative group" style={{ background: color.hex, borderColor: 'rgba(212,175,55,0.5)' }} title={`${i + 1}. ${color.name}`}>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap" style={{ color: '#d4af37' }}>
                  {color.name}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!state.gameOver && (
            <motion.button onClick={() => dispatch({ type: 'REMOVE_LAST' })} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 rounded-lg font-semibold transition-all" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
              ← Remove
            </motion.button>
          )}
          <motion.button onClick={() => dispatch({ type: 'NEW_GAME' })} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
            <RotateCcw size={18} /> New Game
          </motion.button>
        </div>

        {/* Win/Loss Modal */}
        <AnimatePresence>
          {state.gameOver && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
              <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} className="max-w-md w-full p-8 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(26,20,35,0.95), rgba(45,27,61,0.95))', border: '2px solid rgba(212,175,55,0.5)' }}>
                {state.won ? (
                  <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: 'spring', stiffness: 200 }}>
                      <Trophy size={64} className="mx-auto mb-4" style={{ color: '#d4af37' }} />
                    </motion.div>
                    <h2 className="text-4xl font-bold mb-2" style={{ color: '#d4af37', fontFamily: 'Cinzel, serif' }}>Victory!</h2>
                    <p className="text-lg mb-6">Code cracked in {state.attempts} attempts</p>
                  </>
                ) : (
                  <>
                    <Sparkles size={64} className="mx-auto mb-4 opacity-50" style={{ color: '#c0c0c0' }} />
                    <h2 className="text-4xl font-bold mb-2 text-white" style={{ fontFamily: 'Cinzel, serif' }}>Code Remains Hidden</h2>
                    <p className="text-lg mb-4">The secret was:</p>
                    <div className="flex justify-center gap-2 mb-6">
                      {state.secret.map((color, i) => (
                        <div key={i} className="w-12 h-12 rounded-full border-2" style={{ background: COLORS.find(c => c.id === color)?.hex, borderColor: 'rgba(212,175,55,0.5)' }} />
                      ))}
                    </div>
                  </>
                )}
                <button onClick={() => dispatch({ type: 'NEW_GAME' })} className="px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #d4af37, #a08428)', color: 'white' }}>
                  Play Again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 p-4 rounded-xl text-sm" style={{ background: 'rgba(26,20,35,0.4)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <p className="mb-2"><span style={{ color: '#d4af37' }}>●</span> Gold pegs = correct color & position</p>
          <p className="mb-2"><span style={{ color: '#c0c0c0' }}>●</span> Silver pegs = correct color, wrong position</p>
          <p className="opacity-60">Keyboard: 1-6 to select colors • Enter to submit • Backspace to remove</p>
        </motion.div>
      </div>
    </div>
  )
}
