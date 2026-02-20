// app/puzzle/mastermind/page.tsx

'use client'

import { useReducer, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RotateCcw, Sparkles } from 'lucide-react'

const COLORS = [
  { id: 'red', hex: '#c1121f', glow: 'rgba(193,18,31,0.6)' },
  { id: 'blue', hex: '#0466c8', glow: 'rgba(4,102,200,0.6)' },
  { id: 'green', hex: '#2d6a4f', glow: 'rgba(45,106,79,0.6)' },
  { id: 'yellow', hex: '#ffd60a', glow: 'rgba(255,214,10,0.6)' },
  { id: 'purple', hex: '#7209b7', glow: 'rgba(114,9,183,0.6)' },
  { id: 'orange', hex: '#f77f00', glow: 'rgba(247,127,0,0.6)' },
]

const CODE_LENGTHS = { easy: 4, medium: 5, hard: 6 }
const MAX_ATTEMPTS = 10

type Difficulty = 'easy' | 'medium' | 'hard'
type GameState = {
  difficulty: Difficulty
  secret: string[]
  guesses: { guess: string[]; feedback: { exact: number; partial: number } }[]
  currentGuess: (string | null)[]
  selectedColor: string | null
  gameOver: boolean
  won: boolean
  wins: number
}

type Action =
  | { type: 'SELECT_COLOR'; color: string }
  | { type: 'PLACE_PEG'; index: number }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'NEW_GAME' }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }

function generateSecret(codeLength: number): string[] {
  return Array(codeLength).fill(0).map(() => COLORS[Math.floor(Math.random() * COLORS.length)].id)
}

function calculateFeedback(guess: (string | null)[], secret: string[]): { exact: number; partial: number } {
  const guessClean = guess.filter(Boolean) as string[]
  const exact = guessClean.filter((c, i) => c === secret[i]).length
  const guessCounts = guessClean.reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {} as Record<string, number>)
  const secretCounts = secret.reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {} as Record<string, number>)
  const total = Object.keys(guessCounts).reduce((sum, c) => sum + Math.min(guessCounts[c] || 0, secretCounts[c] || 0), 0)
  return { exact, partial: total - exact }
}

function reducer(state: GameState, action: Action): GameState {
  const codeLength = CODE_LENGTHS[state.difficulty]

  switch (action.type) {
    case 'SELECT_COLOR':
      return { ...state, selectedColor: action.color }

    case 'PLACE_PEG':
      if (state.gameOver || !state.selectedColor) return state
      const newGuess = [...state.currentGuess]
      newGuess[action.index] = state.selectedColor
      return { ...state, currentGuess: newGuess }

    case 'SUBMIT_GUESS':
      if (state.gameOver || state.currentGuess.some(p => !p)) return state
      const feedback = calculateFeedback(state.currentGuess, state.secret)
      const won = feedback.exact === codeLength
      const newGuesses = [...state.guesses, { guess: state.currentGuess as string[], feedback }]
      const gameOver = won || newGuesses.length >= MAX_ATTEMPTS
      return {
        ...state,
        guesses: newGuesses,
        currentGuess: Array(codeLength).fill(null),
        won,
        gameOver,
        wins: won ? state.wins + 1 : state.wins,
        selectedColor: null,
      }

    case 'NEW_GAME':
      const newCodeLength = CODE_LENGTHS[state.difficulty]
      return {
        ...state,
        secret: generateSecret(newCodeLength),
        guesses: [],
        currentGuess: Array(newCodeLength).fill(null),
        selectedColor: null,
        gameOver: false,
        won: false,
      }

    case 'SET_DIFFICULTY':
      const newLen = CODE_LENGTHS[action.difficulty]
      return {
        ...state,
        difficulty: action.difficulty,
        secret: generateSecret(newLen),
        guesses: [],
        currentGuess: Array(newLen).fill(null),
        selectedColor: null,
        gameOver: false,
        won: false,
      }

    default:
      return state
  }
}

export default function MastermindPage() {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const savedWins = typeof window !== 'undefined' ? parseInt(localStorage.getItem('mastermindWins') || '0') : 0
    return {
      difficulty: 'easy' as Difficulty,
      secret: generateSecret(CODE_LENGTHS.easy),
      guesses: [],
      currentGuess: Array(CODE_LENGTHS.easy).fill(null),
      selectedColor: null,
      gameOver: false,
      won: false,
      wins: savedWins,
    }
  })

  useEffect(() => {
    localStorage.setItem('mastermindWins', state.wins.toString())
  }, [state.wins])

  const codeLength = CODE_LENGTHS[state.difficulty]
  const currentAttempt = state.guesses.length

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
      
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #7209b7, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-start">
        
        {/* LEFT: Game Board */}
        <div className="w-full lg:w-auto">
          <div className="rounded-2xl p-6" style={{ 
            background: 'linear-gradient(135deg, rgba(139,90,43,0.3), rgba(101,67,33,0.3))',
            border: '3px solid #d4af37',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), inset 0 0 30px rgba(212,175,55,0.1)',
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(101,67,33,0.1) 0px, transparent 1px, transparent 40px, rgba(101,67,33,0.1) 41px), repeating-linear-gradient(0deg, rgba(101,67,33,0.1) 0px, transparent 1px, transparent 40px, rgba(101,67,33,0.1) 41px)',
          }}>
            
            {/* Secret row */}
            <div className="flex justify-center gap-3 mb-6 p-4 rounded-xl" style={{ background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(212,175,55,0.2)' }}>
              {Array(codeLength).fill(0).map((_, i) => (
                <div key={i} className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold" style={{ 
                  background: state.gameOver ? COLORS.find(c => c.id === state.secret[i])?.hex : 'linear-gradient(135deg, #333, #1a1a1a)', 
                  border: '3px solid #d4af37',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.2)',
                  color: '#d4af37'
                }}>
                  {!state.gameOver && '?'}
                </div>
              ))}
            </div>

            {/* Guess rows */}
            <div className="space-y-3">
              {Array(MAX_ATTEMPTS).fill(0).map((_, rowIndex) => {
                const isActive = rowIndex === currentAttempt && !state.gameOver
                const pastGuess = state.guesses[rowIndex]

                return (
                  <motion.div key={rowIndex} initial={{ opacity: 0.3 }} animate={{ opacity: isActive ? 1 : pastGuess ? 0.7 : 0.3 }} className="flex items-center gap-3 p-3 rounded-xl" style={{
                    background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.3)',
                    border: isActive ? '2px solid #d4af37' : '2px solid transparent',
                    boxShadow: isActive ? '0 0 20px rgba(212,175,55,0.3)' : 'none',
                  }}>
                    
                    {/* Pegs */}
                    <div className="flex gap-2 flex-1">
                      {Array(codeLength).fill(0).map((_, pegIndex) => {
                        const color = isActive ? state.currentGuess[pegIndex] : pastGuess?.guess[pegIndex]
                        const colorData = color ? COLORS.find(c => c.id === color) : null

                        return (
                          <motion.button key={pegIndex} onClick={() => isActive && dispatch({ type: 'PLACE_PEG', index: pegIndex })} disabled={!isActive} whileHover={isActive ? { scale: 1.1 } : {}} whileTap={isActive ? { scale: 0.95 } : {}} className="w-10 h-10 rounded-full border-2 transition-all disabled:cursor-default" style={{
                            background: colorData?.hex || 'linear-gradient(135deg, #444, #222)',
                            borderColor: colorData ? 'rgba(255,255,255,0.5)' : '#666',
                            boxShadow: colorData ? `0 0 15px ${colorData.glow}, inset 0 2px 4px rgba(255,255,255,0.3)` : '0 3px 10px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)',
                            cursor: isActive ? 'pointer' : 'default',
                          }} />
                        )
                      })}
                    </div>

                    {/* Feedback */}
                    <div className="grid gap-1 p-2 rounded-lg" style={{ 
                      gridTemplateColumns: codeLength === 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                      background: 'rgba(0,0,0,0.4)',
                      width: '60px',
                    }}>
                      {Array(codeLength).fill(0).map((_, i) => {
                        const isExact = pastGuess && i < pastGuess.feedback.exact
                        const isPartial = pastGuess && i >= pastGuess.feedback.exact && i < (pastGuess.feedback.exact + pastGuess.feedback.partial)
                        
                        return (
                          <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: isExact || isPartial ? 1 : 1 }} transition={{ delay: i * 0.05 }} className="w-3 h-3 rounded-full border" style={{
                            background: isExact ? 'radial-gradient(circle, #1a1a1a, #000)' : isPartial ? 'radial-gradient(circle, #fff, #ddd)' : '#333',
                            borderColor: isExact || isPartial ? '#fff' : '#555',
                            boxShadow: isExact ? '0 0 5px rgba(255,255,255,0.8)' : isPartial ? '0 0 5px rgba(255,255,255,0.5)' : 'none',
                          }} />
                        )
                      })}
                    </div>

                    {/* Inline Submit */}
                    {isActive && (
                      <motion.button initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onClick={() => dispatch({ type: 'SUBMIT_GUESS' })} disabled={state.currentGuess.some(p => !p)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 rounded-lg font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed" style={{
                        background: state.currentGuess.every(p => p) ? 'linear-gradient(135deg, #d4af37, #a68a2e)' : 'rgba(100,100,100,0.3)',
                        color: state.currentGuess.every(p => p) ? '#0d0911' : '#666',
                        border: '2px solid',
                        borderColor: state.currentGuess.every(p => p) ? '#d4af37' : '#444',
                        fontFamily: 'Cinzel, serif',
                        letterSpacing: '0.1em',
                      }}>
                        SUBMIT
                      </motion.button>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Info & Controls */}
        <div className="space-y-6">
          
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-6xl font-bold mb-2" style={{ 
              fontFamily: 'Cinzel, serif', 
              background: 'linear-gradient(135deg, #d4af37, #c0c0c0, #d4af37)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent', 
              letterSpacing: '0.2em',
            }}>
              MASTERMIND
            </h1>
            <p className="text-sm tracking-widest uppercase opacity-70" style={{ color: '#d4af37' }}>Break the Code</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl" style={{ background: 'rgba(26,20,35,0.6)', border: '2px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(10px)' }}>
            <div className="text-center">
              <div className="text-xs opacity-70 mb-1 tracking-wider">DIFFICULTY</div>
              <select value={state.difficulty} onChange={e => dispatch({ type: 'SET_DIFFICULTY', difficulty: e.target.value as Difficulty })} className="text-xl font-bold px-2 py-1 rounded cursor-pointer" style={{ 
                fontFamily: 'Cinzel, serif', 
                background: 'rgba(212,175,55,0.2)', 
                border: '2px solid #d4af37', 
                color: '#d4af37' 
              }}>
                <option value="easy">Easy</option>
                <option value="medium">Med</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-70 mb-1 tracking-wider">ATTEMPTS</div>
              <div className="text-2xl font-bold" style={{ color: '#d4af37' }}>{currentAttempt}/{MAX_ATTEMPTS}</div>
            </div>
            <div className="text-center">
              <div className="text-xs opacity-70 mb-1 tracking-wider">GAMES WON</div>
              <div className="text-2xl font-bold" style={{ color: '#d4af37' }}>{state.wins}</div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="p-6 rounded-xl" style={{ background: 'rgba(26,20,35,0.6)', border: '2px solid rgba(212,175,55,0.3)' }}>
            <h3 className="text-center mb-4 tracking-widest text-sm opacity-70">COLOR PALETTE</h3>
            <div className="flex justify-center gap-3 flex-wrap">
              {COLORS.map(color => (
                <motion.button key={color.id} onClick={() => dispatch({ type: 'SELECT_COLOR', color: color.id })} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} className="w-14 h-14 rounded-full border-3 transition-all" style={{
                  background: color.hex,
                  border: state.selectedColor === color.id ? '4px solid rgba(255,255,255,0.8)' : '3px solid rgba(255,255,255,0.3)',
                  boxShadow: state.selectedColor === color.id ? `0 0 20px ${color.glow}` : `0 4px 15px rgba(0,0,0,0.5), inset 0 2px 5px rgba(255,255,255,0.2)`,
                }} />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            <motion.button onClick={() => dispatch({ type: 'NEW_GAME' })} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold transition-all" style={{
              background: 'linear-gradient(135deg, #d4af37, #a68a2e)',
              color: '#0d0911',
              border: '2px solid #d4af37',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.15em',
              boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
            }}>
              <RotateCcw size={20} /> NEW GAME
            </motion.button>
          </div>

          {/* Instructions */}
          <div className="p-4 rounded-xl text-sm space-y-2" style={{ background: 'rgba(26,20,35,0.4)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <h3 className="font-bold mb-2 tracking-wider" style={{ color: '#d4af37' }}>HOW TO PLAY</h3>
            <p>• Select a color, then click pegs to place</p>
            <p>• <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: '#000', border: '1px solid #fff' }} /> = correct color & position</p>
            <p>• <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: '#fff', border: '1px solid #fff' }} /> = correct color, wrong position</p>
          </div>
        </div>
      </div>

      {/* Win/Loss Modal */}
      <AnimatePresence>
        {state.gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} className="max-w-md w-full p-8 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(26,20,35,0.98), rgba(45,27,61,0.98))', border: '3px solid #d4af37', boxShadow: '0 0 60px rgba(212,175,55,0.4)' }}>
              {state.won ? (
                <>
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
                    <Trophy size={80} className="mx-auto mb-4" style={{ color: '#d4af37', filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.8))' }} />
                  </motion.div>
                  <h2 className="text-5xl font-bold mb-3" style={{ fontFamily: 'Cinzel, serif', color: '#d4af37' }}>YOU WIN!</h2>
                  <p className="text-xl mb-6">Code cracked in {currentAttempt} attempts!</p>
                </>
              ) : (
                <>
                  <Sparkles size={80} className="mx-auto mb-4 opacity-60" style={{ color: '#c0c0c0' }} />
                  <h2 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>Code Remains Hidden</h2>
                  <p className="mb-4">The secret was:</p>
                  <div className="flex justify-center gap-2 mb-6">
                    {state.secret.map((color, i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-2" style={{ background: COLORS.find(c => c.id === color)?.hex, borderColor: '#d4af37' }} />
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => dispatch({ type: 'NEW_GAME' })} className="px-10 py-4 rounded-xl font-bold text-lg" style={{ background: 'linear-gradient(135deg, #d4af37, #a68a2e)', color: '#0d0911', fontFamily: 'Cinzel, serif' }}>
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
