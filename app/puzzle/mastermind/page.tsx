// app/puzzle/mastermind/page.tsx

'use client'

import { useReducer, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw, Sparkles, Settings } from 'lucide-react'

const COLORS = [
  { id: 'red', hex: '#c1121f', name: 'Ruby' },
  { id: 'blue', hex: '#0466c8', name: 'Sapphire' },
  { id: 'green', hex: '#2d6a4f', name: 'Emerald' },
  { id: 'yellow', hex: '#ffd60a', name: 'Topaz' },
  { id: 'purple', hex: '#7209b7', name: 'Amethyst' },
  { id: 'orange', hex: '#f77f00', name: 'Amber' },
]

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_CONFIG = {
  easy: { colors: 4, codeLength: 4, maxGuesses: 12 },
  medium: { colors: 6, codeLength: 4, maxGuesses: 10 },
  hard: { colors: 6, codeLength: 5, maxGuesses: 10 },
}

type GameState = {
  difficulty: Difficulty
  secret: string[]
  guesses: string[][]
  feedback: { exact: number; partial: number }[]
  currentGuess: string[]
  gameOver: boolean
  won: boolean
  attempts: number
  showSettings: boolean
}

type Action =
  | { type: 'SELECT_COLOR'; color: string }
  | { type: 'REMOVE_LAST' }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'NEW_GAME'; difficulty?: Difficulty }
  | { type: 'TOGGLE_SETTINGS' }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }

function generateSecret(numColors: number, codeLength: number): string[] {
  const availableColors = COLORS.slice(0, numColors)
  const secret: string[] = []
  for (let i = 0; i < codeLength; i++) {
    secret.push(availableColors[Math.floor(Math.random() * availableColors.length)].id)
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
  const config = DIFFICULTY_CONFIG[state.difficulty]

  switch (action.type) {
    case 'SELECT_COLOR':
      if (state.gameOver || state.currentGuess.length >= config.codeLength) return state
      return { ...state, currentGuess: [...state.currentGuess, action.color] }

    case 'REMOVE_LAST':
      if (state.gameOver || state.currentGuess.length === 0) return state
      return { ...state, currentGuess: state.currentGuess.slice(0, -1) }

    case 'SUBMIT_GUESS':
      if (state.gameOver || state.currentGuess.length !== config.codeLength) return state
      const feedback = calculateFeedback(state.currentGuess, state.secret)
      const won = feedback.exact === config.codeLength
      const attempts = state.attempts + 1
      const gameOver = won || attempts >= config.maxGuesses
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
      const newDiff = action.difficulty || state.difficulty
      const newConfig = DIFFICULTY_CONFIG[newDiff]
      return {
        difficulty: newDiff,
        secret: generateSecret(newConfig.colors, newConfig.codeLength),
        guesses: [],
        feedback: [],
        currentGuess: [],
        gameOver: false,
        won: false,
        attempts: 0,
        showSettings: false,
      }

    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings }

    case 'SET_DIFFICULTY':
      const newCfg = DIFFICULTY_CONFIG[action.difficulty]
      return {
        difficulty: action.difficulty,
        secret: generateSecret(newCfg.colors, newCfg.codeLength),
        guesses: [],
        feedback: [],
        currentGuess: [],
        gameOver: false,
        won: false,
        attempts: 0,
        showSettings: false,
      }

    default:
      return state
  }
}

export default function MastermindPage() {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const config = DIFFICULTY_CONFIG.medium
    return {
      difficulty: 'medium' as Difficulty,
      secret: generateSecret(config.colors, config.codeLength),
      guesses: [],
      feedback: [],
      currentGuess: [],
      gameOver: false,
      won: false,
      attempts: 0,
      showSettings: false,
    }
  })

  const config = DIFFICULTY_CONFIG[state.difficulty]
  const availableColors = COLORS.slice(0, config.colors)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (state.showSettings) return
      if (e.key === 'Backspace') dispatch({ type: 'REMOVE_LAST' })
      if (e.key === 'Enter') dispatch({ type: 'SUBMIT_GUESS' })
      const colorKey = ['1', '2', '3', '4', '5', '6'].indexOf(e.key)
      if (colorKey >= 0 && colorKey < config.colors) {
        dispatch({ type: 'SELECT_COLOR', color: availableColors[colorKey].id })
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [state.showSettings, config.colors, availableColors])

  // Empty rows to show future guess slots
  const emptyRows = Math.max(0, config.maxGuesses - state.guesses.length - 1)

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
      
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #7209b7, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-5xl md:text-6xl font-bold" style={{ fontFamily: 'Cinzel, serif', background: 'linear-gradient(135deg, #d4af37, #c0c0c0, #d4af37)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.2em' }}>
              MASTERMIND
            </h1>
            <motion.button onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg" style={{ background: 'rgba(212,175,55,0.2)' }}>
              <Settings size={24} style={{ color: '#d4af37' }} />
            </motion.button>
          </div>
          <p className="text-sm tracking-widest uppercase opacity-70" style={{ color: '#d4af37' }}>
            {state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1)} Mode
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex justify-around mb-6 p-4 rounded-xl" style={{ background: 'rgba(26,20,35,0.6)', border: '2px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(10px)' }}>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#d4af37' }}>{state.attempts}</div>
            <div className="text-xs opacity-70">Attempts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#d4af37' }}>{config.maxGuesses - state.attempts}</div>
            <div className="text-xs opacity-70">Remaining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#d4af37' }}>{config.codeLength}</div>
            <div className="text-xs opacity-70">Code Length</div>
          </div>
        </motion.div>

        {/* Game board */}
        <div className="space-y-2 mb-6 p-6 rounded-2xl" style={{ background: 'rgba(26,20,35,0.8)', border: '2px solid rgba(212,175,55,0.3)' }}>
          
          {/* Empty future rows */}
          {[...Array(emptyRows)].map((_, i) => (
            <motion.div key={`empty-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} className="flex items-center gap-3 p-3">
              <div className="flex gap-2 flex-1">
                {[...Array(config.codeLength)].map((_, j) => (
                  <div key={j} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              <div className="w-16 h-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }} />
            </motion.div>
          ))}

          {/* Current guess row */}
          {!state.gameOver && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(212,175,55,0.15)', border: '2px solid rgba(212,175,55,0.5)', boxShadow: '0 0 20px rgba(212,175,55,0.2)' }}>
              <div className="flex gap-2 flex-1">
                {[...Array(config.codeLength)].map((_, i) => (
                  <motion.div key={i} initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center relative overflow-hidden" style={{ background: state.currentGuess[i] ? COLORS.find(c => c.id === state.currentGuess[i])?.hex : 'rgba(255,255,255,0.05)', borderColor: state.currentGuess[i] ? 'rgba(212,175,55,0.8)' : 'rgba(255,255,255,0.3)' }}>
                    {!state.currentGuess[i] && (
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }} className="w-2 h-2 rounded-full bg-white opacity-30" />
                    )}
                    {state.currentGuess[i] && (
                      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="absolute inset-0 rounded-full" style={{ background: COLORS.find(c => c.id === state.currentGuess[i])?.hex }} />
                    )}
                  </motion.div>
                ))}
              </div>
              <motion.button onClick={() => dispatch({ type: 'SUBMIT_GUESS' })} disabled={state.currentGuess.length !== config.codeLength} whileHover={state.currentGuess.length === config.codeLength ? { scale: 1.05 } : {}} whileTap={state.currentGuess.length === config.codeLength ? { scale: 0.95 } : {}} className="px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: state.currentGuess.length === config.codeLength ? 'linear-gradient(135deg, #d4af37, #a08428)' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                Submit
              </motion.button>
            </motion.div>
          )}

          {/* Previous guesses (reverse order - most recent at top) */}
          <AnimatePresence>
            {[...state.guesses].reverse().map((guess, reverseIndex) => {
              const i = state.guesses.length - 1 - reverseIndex
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -50, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ delay: reverseIndex * 0.05 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(26,20,35,0.4)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div className="flex gap-2 flex-1">
                    {guess.map((color, j) => (
                      <motion.div key={j} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: j * 0.05, type: 'spring', stiffness: 200 }} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 shadow-lg" style={{ background: COLORS.find(c => c.id === color)?.hex, borderColor: 'rgba(212,175,55,0.5)' }} />
                    ))}
                  </div>
                  <div className="flex gap-1 w-16 flex-wrap justify-center p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {[...Array(state.feedback[i].exact)].map((_, k) => (
                      <motion.div key={`e${k}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + k * 0.05, type: 'spring' }} className="w-2.5 h-2.5 rounded-full" style={{ background: '#d4af37', boxShadow: '0 0 8px rgba(212,175,55,0.8)' }} />
                    ))}
                    {[...Array(state.feedback[i].partial)].map((_, k) => (
                      <motion.div key={`p${k}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + state.feedback[i].exact * 0.05 + k * 0.05, type: 'spring' }} className="w-2.5 h-2.5 rounded-full" style={{ background: '#c0c0c0', boxShadow: '0 0 8px rgba(192,192,192,0.6)' }} />
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Color palette */}
        {!state.gameOver && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-center gap-2 md:gap-3 mb-6 p-4 rounded-xl" style={{ background: 'rgba(26,20,35,0.6)', border: '1px solid rgba(212,175,55,0.2)' }}>
            {availableColors.map((color, i) => (
              <motion.button key={color.id} onClick={() => dispatch({ type: 'SELECT_COLOR', color: color.id })} whileHover={{ scale: 1.15, y: -8 }} whileTap={{ scale: 0.9 }} className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 shadow-xl transition-all relative group" style={{ background: color.hex, borderColor: 'rgba(212,175,55,0.5)' }} title={`${i + 1}. ${color.name}`}>
                <motion.div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: 'rgba(0,0,0,0.9)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}>
                  {i + 1}. {color.name}
                </motion.div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4 flex-wrap">
          {!state.gameOver && (
            <motion.button onClick={() => dispatch({ type: 'REMOVE_LAST' })} disabled={state.currentGuess.length === 0} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-30" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
              ← Remove
            </motion.button>
          )}
          <motion.button onClick={() => dispatch({ type: 'NEW_GAME' })} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
            <RotateCcw size={18} /> New Game
          </motion.button>
        </div>

        {/* Instructions */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 p-4 rounded-xl text-sm" style={{ background: 'rgba(26,20,35,0.4)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <p className="mb-2"><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#d4af37', boxShadow: '0 0 8px rgba(212,175,55,0.8)' }} /> Gold = correct color & position</p>
          <p className="mb-2"><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: '#c0c0c0', boxShadow: '0 0 8px rgba(192,192,192,0.6)' }} /> Silver = correct color, wrong position</p>
          <p className="opacity-60 text-xs">Keyboard: 1-{config.colors} to select • Enter to submit • Backspace to remove</p>
        </motion.div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {state.showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })} className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} onClick={e => e.stopPropagation()} className="max-w-md w-full p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(26,20,35,0.95), rgba(45,27,61,0.95))', border: '2px solid rgba(212,175,55,0.5)' }}>
              <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#d4af37', fontFamily: 'Cinzel, serif' }}>Difficulty</h2>
              <div className="space-y-3">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => {
                  const cfg = DIFFICULTY_CONFIG[diff]
                  return (
                    <motion.button key={diff} onClick={() => dispatch({ type: 'SET_DIFFICULTY', difficulty: diff })} whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }} className="w-full p-4 rounded-xl text-left transition-all" style={{ background: state.difficulty === diff ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)', border: state.difficulty === diff ? '2px solid rgba(212,175,55,0.6)' : '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="font-bold text-lg mb-1" style={{ color: state.difficulty === diff ? '#d4af37' : 'white' }}>
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </div>
                      <div className="text-sm opacity-70">
                        {cfg.colors} colors • {cfg.codeLength} pegs • {cfg.maxGuesses} guesses
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win/Loss Modal */}
      <AnimatePresence>
        {state.gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <motion.div initial={{ scale: 0.8, y: 50, rotate: -5 }} animate={{ scale: 1, y: 0, rotate: 0 }} exit={{ scale: 0.8, y: 50 }} className="max-w-md w-full p-8 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(26,20,35,0.98), rgba(45,27,61,0.98))', border: '2px solid rgba(212,175,55,0.6)', boxShadow: '0 0 60px rgba(212,175,55,0.3)' }}>
              {state.won ? (
                <>
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}>
                    <Trophy size={80} className="mx-auto mb-4" style={{ color: '#d4af37', filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.8))' }} />
                  </motion.div>
                  <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-5xl font-bold mb-3" style={{ color: '#d4af37', fontFamily: 'Cinzel, serif', textShadow: '0 0 30px rgba(212,175,55,0.5)' }}>
                    Victory!
                  </motion.h2>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xl mb-6 opacity-90">
                    Code cracked in <span className="font-bold" style={{ color: '#d4af37' }}>{state.attempts}</span> attempts
                  </motion.p>
                </>
              ) : (
                <>
                  <Sparkles size={80} className="mx-auto mb-4 opacity-60" style={{ color: '#c0c0c0' }} />
                  <h2 className="text-4xl font-bold mb-3 text-white" style={{ fontFamily: 'Cinzel, serif' }}>Code Remains Hidden</h2>
                  <p className="text-lg mb-4 opacity-80">The secret was:</p>
                  <div className="flex justify-center gap-2 mb-6">
                    {state.secret.map((color, i) => (
                      <motion.div key={i} initial={{ scale: 0, rotate: 180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1 + i * 0.1, type: 'spring' }} className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 shadow-lg" style={{ background: COLORS.find(c => c.id === color)?.hex, borderColor: 'rgba(212,175,55,0.5)' }} />
                    ))}
                  </div>
                </>
              )}
              <motion.button onClick={() => dispatch({ type: 'NEW_GAME' })} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-4 rounded-xl font-bold text-lg transition-all" style={{ background: 'linear-gradient(135deg, #d4af37, #a08428)', color: 'white', boxShadow: '0 4px 20px rgba(212,175,55,0.4)' }}>
                Play Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
