// app/paper/dots-and-boxes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Trophy } from 'lucide-react'

const ROWS = 6
const COLS = 6
const CELL = 72

export default function DotsAndBoxesPage() {
  const [linesH, setLinesH] = useState<number[][]>([])
  const [linesV, setLinesV] = useState<number[][]>([])
  const [boxes, setBoxes] = useState<number[][]>([])
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1)
  const [scores, setScores] = useState<[number, number]>([0, 0])
  const [gameOver, setGameOver] = useState(false)
  const [winnerText, setWinnerText] = useState('')

  const initGame = () => {
    setLinesH(Array(ROWS + 1).fill(0).map(() => Array(COLS).fill(0)))
    setLinesV(Array(ROWS).fill(0).map(() => Array(COLS + 1).fill(0)))
    setBoxes(Array(ROWS).fill(0).map(() => Array(COLS).fill(0)))
    setScores([0, 0])
    setCurrentPlayer(1)
    setGameOver(false)
    setWinnerText('')
  }

  useEffect(() => {
    initGame()
  }, [])

  const isBoxComplete = (r: number, c: number): boolean => {
    return linesH[r][c] !== 0 &&
           linesH[r + 1][c] !== 0 &&
           linesV[r][c] !== 0 &&
           linesV[r][c + 1] !== 0 &&
           boxes[r][c] === 0
  }

  const handleLineClick = (type: 'h' | 'v', row: number, col: number) => {
    if (gameOver) return

    let newH = [...linesH]
    let newV = [...linesV]
    let newBoxes = [...boxes]
    let newScores = [...scores] as [number, number]
    let boxesCompleted = 0
    let switchTurn = true

    if (type === 'h') {
      if (newH[row][col] !== 0) return
      newH[row][col] = currentPlayer

      // Check above
      if (row > 0 && isBoxComplete(row - 1, col)) {
        newBoxes[row - 1][col] = currentPlayer
        newScores[currentPlayer - 1]++
        boxesCompleted++
      }
      // Check below
      if (row < ROWS && isBoxComplete(row, col)) {
        newBoxes[row][col] = currentPlayer
        newScores[currentPlayer - 1]++
        boxesCompleted++
      }
    } else {
      if (newV[row][col] !== 0) return
      newV[row][col] = currentPlayer

      // Check left
      if (col > 0 && isBoxComplete(row, col - 1)) {
        newBoxes[row][col - 1] = currentPlayer
        newScores[currentPlayer - 1]++
        boxesCompleted++
      }
      // Check right
      if (col < COLS && isBoxComplete(row, col)) {
        newBoxes[row][col] = currentPlayer
        newScores[currentPlayer - 1]++
        boxesCompleted++
      }
    }

    setLinesH(newH)
    setLinesV(newV)
    setBoxes(newBoxes)
    setScores(newScores)

    if (boxesCompleted === 0) {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    }

    // Check end
    const totalFilled = newScores[0] + newScores[1]
    if (totalFilled === ROWS * COLS) {
      setGameOver(true)
      const p1 = newScores[0]
      const p2 = newScores[1]
      if (p1 > p2) setWinnerText(`RED WINS ${p1}–${p2}`)
      else if (p2 > p1) setWinnerText(`BLUE WINS ${p2}–${p1}`)
      else setWinnerText(`DRAW ${p1}–${p1}`)
    }
  }

  const totalBoxes = ROWS * COLS
  const filledBoxes = scores[0] + scores[1]

  return (
    <div className="min-h-screen bg-[#0d1117] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-4">
            <span className="text-6xl">🔲</span>
            <h1 className="text-7xl font-black tracking-[0.06em] text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              DOTS &amp; BOXES
            </h1>
          </div>
          <p className="text-gray-400 tracking-widest">CLAIM THE MOST BOXES</p>
        </div>

        {/* Scoreboard */}
        <div className="flex justify-center gap-6 mb-10">
          <div className={`px-10 py-5 rounded-2xl flex-1 max-w-[260px] text-center transition-all ${currentPlayer === 1 ? 'scale-105 border-[#ff3366]' : 'border-transparent'}`}
            style={{ background: 'rgba(28,33,40,0.8)', border: '3px solid' }}>
            <div className="text-[#ff3366] text-2xl font-bold tracking-widest">RED</div>
            <div className="text-6xl font-black text-white mt-1">{scores[0]}</div>
          </div>
          <div className={`px-10 py-5 rounded-2xl flex-1 max-w-[260px] text-center transition-all ${currentPlayer === 2 ? 'scale-105 border-[#00d4ff]' : 'border-transparent'}`}
            style={{ background: 'rgba(28,33,40,0.8)', border: '3px solid' }}>
            <div className="text-[#00d4ff] text-2xl font-bold tracking-widest">BLUE</div>
            <div className="text-6xl font-black text-white mt-1">{scores[1]}</div>
          </div>
        </div>

        {/* Board */}
        <div className="flex justify-center mb-12">
          <div 
            className="relative"
            style={{ 
              width: COLS * CELL + 12, 
              height: ROWS * CELL + 12,
              background: '#1c2128',
              border: '12px solid #30363d',
              borderRadius: '20px'
            }}
          >
            {/* Dots */}
            {Array.from({ length: ROWS + 1 }).map((_, r) =>
              Array.from({ length: COLS + 1 }).map((_, c) => (
                <div
                  key={`${r}-${c}`}
                  className="absolute w-3 h-3 bg-white rounded-full shadow-xl"
                  style={{
                    left: c * CELL + 6,
                    top: r * CELL + 6,
                  }}
                />
              ))
            )}

            {/* Horizontal lines */}
            {linesH.map((row, r) =>
              row.map((owner, c) => (
                <motion.div
                  key={`h-${r}-${c}`}
                  onClick={() => handleLineClick('h', r, c)}
                  className={`absolute cursor-pointer transition-all duration-200 ${owner ? 'pointer-events-none' : 'hover:bg-white/30'}`}
                  style={{
                    left: c * CELL + 12,
                    top: r * CELL + 6,
                    width: CELL - 12,
                    height: 6,
                    background: owner === 1 ? '#ff3366' : owner === 2 ? '#00d4ff' : '#4b5563',
                    borderRadius: 999,
                  }}
                  whileHover={owner === 0 ? { scaleY: 1.8 } : {}}
                />
              ))
            )}

            {/* Vertical lines */}
            {linesV.map((row, r) =>
              row.map((owner, c) => (
                <motion.div
                  key={`v-${r}-${c}`}
                  onClick={() => handleLineClick('v', r, c)}
                  className={`absolute cursor-pointer transition-all duration-200 ${owner ? 'pointer-events-none' : 'hover:bg-white/30'}`}
                  style={{
                    left: c * CELL + 6,
                    top: r * CELL + 12,
                    width: 6,
                    height: CELL - 12,
                    background: owner === 1 ? '#ff3366' : owner === 2 ? '#00d4ff' : '#4b5563',
                    borderRadius: 999,
                  }}
                  whileHover={owner === 0 ? { scaleX: 1.8 } : {}}
                />
              ))
            )}

            {/* Boxes */}
            {boxes.map((row, r) =>
              row.map((owner, c) => 
                owner ? (
                  <motion.div
                    key={`box-${r}-${c}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute flex items-center justify-center text-5xl font-black"
                    style={{
                      left: c * CELL + 18,
                      top: r * CELL + 18,
                      width: CELL - 36,
                      height: CELL - 36,
                      background: owner === 1 
                        ? 'rgba(255,51,102,0.15)' 
                        : 'rgba(0,212,255,0.15)',
                      border: `3px solid ${owner === 1 ? '#ff3366' : '#00d4ff'}`,
                      color: owner === 1 ? '#ff3366' : '#00d4ff',
                    }}
                  >
                    {owner}
                  </motion.div>
                ) : null
              )
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <motion.button
            onClick={initGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-12 py-5 rounded-2xl text-xl font-bold tracking-[0.08em] uppercase"
            style={{
              background: 'linear-gradient(135deg, #30363d, #1c2128)',
              border: '2px solid #4b5563',
            }}
          >
            <RotateCcw size={24} /> NEW GAME
          </motion.button>
        </div>
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          >
            <motion.div
              initial={{ scale: 0.75 }}
              animate={{ scale: 1 }}
              className="text-center p-12 rounded-3xl max-w-sm w-full"
              style={{
                background: 'linear-gradient(135deg, #1c2128, #0f1419)',
                border: '4px solid #fff',
                boxShadow: '0 0 90px rgba(255,255,255,0.15)',
              }}
            >
              <Trophy size={90} className="mx-auto mb-6 text-white" />
              <h2 className="text-6xl font-black text-white tracking-widest mb-4">{winnerText}</h2>
              <motion.button
                onClick={initGame}
                whileHover={{ scale: 1.05 }}
                className="mt-8 px-14 py-6 rounded-2xl text-2xl font-bold tracking-widest"
                style={{ background: '#fff', color: '#0d1117' }}
              >
                PLAY AGAIN
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
