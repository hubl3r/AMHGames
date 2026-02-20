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
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
      
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #d4af37, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #7209b7, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-7xl w-full">
        
        {/* Header - mobile top, desktop right */}
        <div className="lg:hidden text-center mb-3">
          <h1 className="text-4xl font-bold" style={{ 
            fontFamily: 'Cinzel, serif', 
            background: 'linear-gradient(135deg, #d4af37, #c0c0c0, #d4af37)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            letterSpacing: '0.15em',
          }}>
            MASTERMIND
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
          
          {/* LEFT/TOP: Game Board + Color Palette */}
          <div className="order-2 lg:order-1">
            <div className="rounded-xl p-3 sm:p-4" style={{ 
              background: 'linear-gradient(135deg, rgba(139,90,43,0.4), rgba(101,67,33,0.4))',
              border: '2px solid #d4af37',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(212,175,55,0.1)',
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(101,67,33,0.1) 0px, transparent 1px, transparent 30px, rgba(101,67,33,0.1) 31px), repeating-linear-gradient(0deg, rgba(101,67,33,0.1) 0px, transparent 1px, transparent 30px, rgba(101,67,33,0.1) 31px)',
            }}>
              
              {/* Secret row */}
              <div className="flex justify-center gap-2 mb-3 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(212,175,55,0.2)' }}>
                {Array(codeLength).fill(0).map((_, i) => (
                  <div key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-lg font-bold" style={{ 
                    background: state.gameOver ? COLORS.find(c => c.id === state.secret[i])?.hex : 'linear-gradient(135deg, #333, #1a1a1a)', 
                    border: '2px solid #d4af37',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.2)',
                    color: '#d4af37',
                    fontSize: '0.9rem'
                  }}>
                    {!state.gameOver && '?'}
                  </div>
                ))}
              </div>

              {/* Guess rows */}
              <div className="space-y-1.5">
                {Array(MAX_ATTEMPTS).fill(0).map((_, rowIndex) => {
                  const isActive = rowIndex === currentAttempt && !state.gameOver
                  const pastGuess = state.guesses[rowIndex]

                  return (
                    <motion.div key={rowIndex} initial={{ opacity: 0.25 }} animate={{ opacity: isActive ? 1 : pastGuess ? 0.7 : 0.25 }} className="flex items-center gap-2 p-2 rounded-lg" style={{
                      background: isActive ? 'rgba(212,175,55,0.15)' : 'rgba(0,0,0,0.25)',
                      border: isActive ? '2px solid #d4af37' : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isActive ? '0 0 15px rgba(212,175,55,0.25)' : 'none',
                    }}>
                      
                      {/* Pegs */}
                      <div className="flex gap-1.5 flex-1">
                        {Array(codeLength).fill(0).map((_, pegIndex) => {
                          const color = isActive ? state.currentGuess[pegIndex] : pastGuess?.guess[pegIndex]
                          const colorData = color ? COLORS.find(c => c.id === color) : null

                          return (
                            <motion.button key={pegIndex} onClick={() => isActive && dispatch({ type: 'PLACE_PEG', index: pegIndex })} disabled={!isActive} whileHover={isActive ? { scale: 1.1 } : {}} whileTap={isActive ? { scale: 0.9 } : {}} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border transition-all disabled:cursor-default" style={{
                              background: colorData?.hex || 'linear-gradient(135deg, #444, #222)',
                              borderWidth: '2px',
                              borderColor: colorData ? 'rgba(255,255,255,0.4)' : '#555',
                              boxShadow: colorData ? `0 0 10px ${colorData.glow}, inset 0 1px 3px rgba(255,255,255,0.3)` : '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)',
                              cursor: isActive ? 'pointer' : 'default',
                            }} />
                          )
                        })}
                      </div>

                      {/* Submit button - fixed position left of feedback */}
                      <div className="w-14 flex items-center justify-center">
                        {isActive ? (
                          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={() => dispatch({ type: 'SUBMIT_GUESS' })} disabled={state.currentGuess.some(p => !p)} whileHover={state.currentGuess.every(p => p) ? { scale: 1.05 } : {}} whileTap={state.currentGuess.every(p => p) ? { scale: 0.95 } : {}} className="px-2 py-1 rounded text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed" style={{
                            background: state.currentGuess.every(p => p) ? 'linear-gradient(135deg, #d4af37, #a68a2e)' : 'rgba(100,100,100,0.3)',
                            color: state.currentGuess.every(p => p) ? '#0d0911' : '#666',
                            border: '1px solid',
                            borderColor: state.currentGuess.every(p => p) ? '#d4af37' : '#444',
                            fontFamily: 'Cinzel, serif',
                            letterSpacing: '0.05em',
                            fontSize: '0.65rem'
                          }}>
                            GO
                          </motion.button>
                        ) : <div className="w-8" />}
                      </div>

                      {/* Feedback pegs */}
                      <div className="grid gap-0.5 p-1 rounded" style={{ 
                        gridTemplateColumns: codeLength === 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                        background: 'rgba(0,0,0,0.4)',
                        width: codeLength === 4 ? '28px' : '40px',
                      }}>
                        {Array(codeLength).fill(0).map((_, i) => {
                          const isExact = pastGuess && i < pastGuess.feedback.exact
                          const isPartial = pastGuess && i >= pastGuess.feedback.exact && i < (pastGuess.feedback.exact + pastGuess.feedback.partial)
                          
                          return (
                            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: isExact || isPartial ? 1 : 1 }} transition={{ delay: i * 0.03 }} className="w-2 h-2 rounded-full" style={{
                              background: isExact ? 'radial-gradient(circle, #1a1a1a, #000)' : isPartial ? 'radial-gradient(circle, #fff, #ddd)' : '#333',
                              border: isExact || isPartial ? '0.5px solid #fff' : '0.5px solid #555',
                              boxShadow: isExact ? '0 0 3px rgba(255,255,255,0.8)' : isPartial ? '0 0 3px rgba(255,255,255,0.5)' : 'none',
                            }} />
                          )
                        })}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Color Palette - always visible at bottom of board */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex justify-center gap-2 flex-wrap">
                  {COLORS.map(color => (
                    <motion.button key={color.id} onClick={() => dispatch({ type: 'SELECT_COLOR', color: color.id })} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all" style={{
                      background: color.hex,
                      border: state.selectedColor === color.id ? '3px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.3)',
                      boxShadow: state.selectedColor === color.id ? `0 0 15px ${color.glow}` : `0 3px 10px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.2)`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT/BOTTOM: Info & Controls */}
          <div className="order-1 lg:order-2 space-y-3 lg:w-72">
            
            {/* Header - desktop only */}
            <div className="hidden lg:block">
              <h1 className="text-5xl font-bold mb-1" style={{ 
                fontFamily: 'Cinzel, serif', 
                background: 'linear-gradient(135deg, #d4af37, #c0c0c0, #d4af37)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent', 
                letterSpacing: '0.15em',
              }}>
                MASTERMIND
              </h1>
              <p className="text-xs tracking-widest uppercase opacity-70" style={{ color: '#d4af37' }}>Break the Code</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg" style={{ background: 'rgba(26,20,35,0.7)', border: '1px solid rgba(212,175,55,0.3)', backdropFilter: 'blur(10px)' }}>
              <div className="text-center">
                <div className="text-xs opacity-60 mb-1 tracking-wider">DIFF</div>
                <select value={state.difficulty} onChange={e => dispatch({ type: 'SET_DIFFICULTY', difficulty: e.target.value as Difficulty })} className="text-sm font-bold px-1 py-0.5 rounded cursor-pointer w-full" style={{ 
                  fontFamily: 'Cinzel, serif', 
                  background: 'rgba(212,175,55,0.2)', 
                  border: '1px solid #d4af37', 
                  color: '#d4af37',
                  fontSize: '0.8rem'
                }}>
                  <option value="easy">Easy</option>
                  <option value="medium">Med</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="text-center">
                <div className="text-xs opacity-60 mb-1 tracking-wider">TRY</div>
                <div className="text-lg font-bold" style={{ color: '#d4af37' }}>{currentAttempt}/{MAX_ATTEMPTS}</div>
              </div>
              <div className="text-center">
                <div className="text-xs opacity-60 mb-1 tracking-wider">WINS</div>
                <div className="text-lg font-bold" style={{ color: '#d4af37' }}>{state.wins}</div>
              </div>
            </div>

            {/* Controls */}
            <motion.button onClick={() => dispatch({ type: 'NEW_GAME' })} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all" style={{
              background: 'linear-gradient(135deg, #d4af37, #a68a2e)',
              color: '#0d0911',
              border: '2px solid #d4af37',
              fontFamily: 'Cinzel, serif',
              letterSpacing: '0.1em',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(212,175,55,0.3)',
            }}>
              <RotateCcw size={16} /> NEW GAME
            </motion.button>

            {/* Instructions */}
            <div className="p-3 rounded-lg text-xs space-y-1" style={{ background: 'rgba(26,20,35,0.5)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <p className="font-bold mb-1.5 tracking-wider text-sm" style={{ color: '#d4af37' }}>HOW TO PLAY</p>
              <p className="opacity-80">• Pick color, click pegs to place</p>
              <p className="opacity-80">• <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#000', border: '0.5px solid #fff' }} /> correct color & spot</p>
              <p className="opacity-80">• <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: '#fff', border: '0.5px solid #fff' }} /> correct color, wrong spot</p>
            </div>
          </div>
        </div>
      </div>

      {/* Win/Loss Modal */}
      <AnimatePresence>
        {state.gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.9)' }}>
            <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }} className="max-w-sm w-full p-6 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, rgba(26,20,35,0.98), rgba(45,27,61,0.98))', border: '3px solid #d4af37', boxShadow: '0 0 50px rgba(212,175,55,0.4)' }}>
              {state.won ? (
                <>
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
                    <Trophy size={60} className="mx-auto mb-3" style={{ color: '#d4af37', filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.8))' }} />
                  </motion.div>
                  <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', color: '#d4af37' }}>YOU WIN!</h2>
                  <p className="text-lg mb-4">Cracked in {currentAttempt} {currentAttempt === 1 ? 'try' : 'tries'}!</p>
                </>
              ) : (
                <>
                  <Sparkles size={60} className="mx-auto mb-3 opacity-60" style={{ color: '#c0c0c0' }} />
                  <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif' }}>Code Hidden</h2>
                  <p className="mb-3 text-sm">The secret was:</p>
                  <div className="flex justify-center gap-1.5 mb-4">
                    {state.secret.map((color, i) => (
                      <div key={i} className="w-9 h-9 rounded-full border-2" style={{ background: COLORS.find(c => c.id === color)?.hex, borderColor: '#d4af37' }} />
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => dispatch({ type: 'NEW_GAME' })} className="px-8 py-3 rounded-lg font-bold" style={{ background: 'linear-gradient(135deg, #d4af37, #a68a2e)', color: '#0d0911', fontFamily: 'Cinzel, serif', letterSpacing: '0.1em' }}>
                PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
