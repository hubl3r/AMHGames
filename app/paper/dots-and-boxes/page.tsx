// app/paper/dots-and-boxes/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Trophy, User, Users } from 'lucide-react'

type Difficulty = 'easy' | 'medium' | 'hard'
type Mode = 'solo' | '2p' | '3p' | '4p'

const DIFFICULTIES: Record<Difficulty, { rows: number; cols: number; label: string }> = {
  easy: { rows: 6, cols: 6, label: 'EASY 6×6' },
  medium: { rows: 8, cols: 8, label: 'MEDIUM 8×8' },
  hard: { rows: 8, cols: 10, label: 'HARD 8×10' },
}

const PLAYER_COLORS = ['#ff3366', '#00d4ff', '#22c55e', '#f59e0b'] as const
const PLAYER_NAMES = ['', 'RED', 'BLUE', 'GREEN', 'ORANGE']

export default function DotsAndBoxesPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [mode, setMode] = useState<Mode>('solo')
  const [cellSize, setCellSize] = useState(62)

  const { rows, cols } = DIFFICULTIES[difficulty]
  const numPlayers = mode === 'solo' ? 2 : parseInt(mode[0])

  const [linesH, setLinesH] = useState<number[][]>([])
  const [linesV, setLinesV] = useState<number[][]>([])
  const [boxes, setBoxes] = useState<number[][]>([])
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [scores, setScores] = useState<number[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winnerText, setWinnerText] = useState('')

  const totalBoxes = rows * cols

  const updateCellSize = useCallback(() => {
    const maxW = Math.min(window.innerWidth - 60, 820)
    const maxH = window.innerHeight - 460
    setCellSize(Math.min(Math.floor(maxW / cols), Math.floor(maxH / rows), 72))
  }, [rows, cols])

  useEffect(() => {
    updateCellSize()
    window.addEventListener('resize', updateCellSize)
    return () => window.removeEventListener('resize', updateCellSize)
  }, [updateCellSize])

  const initGame = useCallback(() => {
    setLinesH(Array(rows + 1).fill(0).map(() => Array(cols).fill(0)))
    setLinesV(Array(rows).fill(0).map(() => Array(cols + 1).fill(0)))
    setBoxes(Array(rows).fill(0).map(() => Array(cols).fill(0)))
    setScores(Array(numPlayers).fill(0))
    setCurrentPlayer(1)
    setGameOver(false)
    setWinnerText('')
  }, [rows, cols, numPlayers])

  useEffect(() => {
    initGame()
  }, [initGame])

  const isBoxComplete = (r: number, c: number, h: number[][], v: number[][]) =>
    h[r][c] !== 0 && h[r + 1][c] !== 0 && v[r][c] !== 0 && v[r][c + 1] !== 0

  const handleMove = (type: 'h' | 'v', row: number, col: number) => {
    if (gameOver || (type === 'h' ? linesH[row][col] : linesV[row][col]) !== 0) return

    let newH = linesH.map(r => [...r])
    let newV = linesV.map(r => [...r])
    let newBoxesArr = boxes.map(r => [...r])
    let newScoresArr = [...scores]
    let completed = 0
    const player = currentPlayer

    if (type === 'h') {
      newH[row][col] = player
      if (row > 0 && isBoxComplete(row - 1, col, newH, newV) && newBoxesArr[row - 1][col] === 0) {
        newBoxesArr[row - 1][col] = player
        newScoresArr[player - 1]++
        completed++
      }
      if (row < rows && isBoxComplete(row, col, newH, newV) && newBoxesArr[row][col] === 0) {
        newBoxesArr[row][col] = player
        newScoresArr[player - 1]++
        completed++
      }
    } else {
      newV[row][col] = player
      if (col > 0 && isBoxComplete(row, col - 1, newH, newV) && newBoxesArr[row][col - 1] === 0) {
        newBoxesArr[row][col - 1] = player
        newScoresArr[player - 1]++
        completed++
      }
      if (col < cols && isBoxComplete(row, col, newH, newV) && newBoxesArr[row][col] === 0) {
        newBoxesArr[row][col] = player
        newScoresArr[player - 1]++
        completed++
      }
    }

    setLinesH(newH)
    setLinesV(newV)
    setBoxes(newBoxesArr)
    setScores(newScoresArr)

    const filled = newScoresArr.reduce((a, b) => a + b, 0)
    if (filled === totalBoxes) {
      setGameOver(true)
      const maxScore = Math.max(...newScoresArr)
      const winners = newScoresArr
        .map((s, i) => (s === maxScore ? PLAYER_NAMES[i + 1] : ''))
        .filter(Boolean)

      let scoreStr = `${maxScore}`
      if (winners.length === 1) {
        const winnerIdx = PLAYER_NAMES.indexOf(winners[0])
        const otherTotal = newScoresArr.reduce((sum, s, i) => (i + 1 !== winnerIdx ? sum + s : sum), 0)
        scoreStr = `${maxScore}–${otherTotal}`
      }
      setWinnerText(
        winners.length > 1
          ? `TIE ${maxScore}–${maxScore}`
          : `${winners[0]} WINS ${scoreStr}`
      )
      return
    }

    if (completed === 0) {
      const next = currentPlayer === numPlayers ? 1 : currentPlayer + 1
      setCurrentPlayer(next)
    }
  }

  // AI (solo only – player 2)
  const aiPlay = useCallback(() => {
    if (mode !== 'solo' || currentPlayer !== 2 || gameOver) return

    const getCompletingMoves = () => {
      const moves: { type: 'h' | 'v'; row: number; col: number; completed: number }[] = []
      // Horizontal
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (linesH[r][c] !== 0) continue
          let tempH = linesH.map(x => [...x])
          let tempV = linesV.map(x => [...x])
          tempH[r][c] = 2
          let comp = 0
          if (r > 0 && isBoxComplete(r - 1, c, tempH, tempV)) comp++
          if (r < rows && isBoxComplete(r, c, tempH, tempV)) comp++
          if (comp > 0) moves.push({ type: 'h', row: r, col: c, completed: comp })
        }
      }
      // Vertical
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= cols; c++) {
          if (linesV[r][c] !== 0) continue
          let tempH = linesH.map(x => [...x])
          let tempV = linesV.map(x => [...x])
          tempV[r][c] = 2
          let comp = 0
          if (c > 0 && isBoxComplete(r, c - 1, tempH, tempV)) comp++
          if (c < cols && isBoxComplete(r, c, tempH, tempV)) comp++
          if (comp > 0) moves.push({ type: 'v', row: r, col: c, completed: comp })
        }
      }
      return moves
    }

    let moves = getCompletingMoves()
    if (moves.length > 0) {
      const move = moves[Math.floor(Math.random() * moves.length)]
      setTimeout(() => handleMove(move.type, move.row, move.col), 420)
      return
    }

    // Safe moves (no immediate box for opponent)
    const safeMoves: { type: 'h' | 'v'; row: number; col: number }[] = []
    const opponent = 1

    // Horizontal safe
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (linesH[r][c] !== 0) continue
        let tempH = linesH.map(x => [...x])
        let tempV = linesV.map(x => [...x])
        tempH[r][c] = 2
        let givesAway = false

        // check opponent horizontal
        for (let or = 0; or <= rows && !givesAway; or++) {
          for (let oc = 0; oc < cols && !givesAway; oc++) {
            if (tempH[or][oc] === 0) {
              let ch = tempH.map(x => [...x])
              let cv = tempV.map(x => [...x])
              ch[or][oc] = opponent
              if ((or > 0 && isBoxComplete(or - 1, oc, ch, cv)) ||
                  (or < rows && isBoxComplete(or, oc, ch, cv))) givesAway = true
            }
          }
        }
        // check opponent vertical
        for (let or = 0; or < rows && !givesAway; or++) {
          for (let oc = 0; oc <= cols && !givesAway; oc++) {
            if (tempV[or][oc] === 0) {
              let ch = tempH.map(x => [...x])
              let cv = tempV.map(x => [...x])
              cv[or][oc] = opponent
              if ((oc > 0 && isBoxComplete(or, oc - 1, ch, cv)) ||
                  (oc < cols && isBoxComplete(or, oc, ch, cv))) givesAway = true
            }
          }
        }
        if (!givesAway) safeMoves.push({ type: 'h', row: r, col: c })
      }
    }

    // Vertical safe
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        if (linesV[r][c] !== 0) continue
        let tempH = linesH.map(x => [...x])
        let tempV = linesV.map(x => [...x])
        tempV[r][c] = 2
        let givesAway = false

        for (let or = 0; or <= rows && !givesAway; or++) {
          for (let oc = 0; oc < cols && !givesAway; oc++) {
            if (tempH[or][oc] === 0) {
              let ch = tempH.map(x => [...x])
              let cv = tempV.map(x => [...x])
              ch[or][oc] = opponent
              if ((or > 0 && isBoxComplete(or - 1, oc, ch, cv)) ||
                  (or < rows && isBoxComplete(or, oc, ch, cv))) givesAway = true
            }
          }
        }
        for (let or = 0; or < rows && !givesAway; or++) {
          for (let oc = 0; oc <= cols && !givesAway; oc++) {
            if (tempV[or][oc] === 0) {
              let ch = tempH.map(x => [...x])
              let cv = tempV.map(x => [...x])
              cv[or][oc] = opponent
              if ((oc > 0 && isBoxComplete(or, oc - 1, ch, cv)) ||
                  (oc < cols && isBoxComplete(or, oc, ch, cv))) givesAway = true
            }
          }
        }
        if (!givesAway) safeMoves.push({ type: 'v', row: r, col: c })
      }
    }

    if (safeMoves.length > 0) {
      const move = safeMoves[Math.floor(Math.random() * safeMoves.length)]
      setTimeout(() => handleMove(move.type, move.row, move.col), 420)
      return
    }

    // Random any remaining
    const all: { type: 'h' | 'v'; row: number; col: number }[] = []
    for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) if (linesH[r][c] === 0) all.push({ type: 'h', row: r, col: c })
    for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) if (linesV[r][c] === 0) all.push({ type: 'v', row: r, col: c })

    if (all.length > 0) {
      const move = all[Math.floor(Math.random() * all.length)]
      setTimeout(() => handleMove(move.type, move.row, move.col), 420)
    }
  }, [mode, currentPlayer, gameOver, linesH, linesV, rows, cols, handleMove])

  useEffect(() => {
    if (mode === 'solo' && currentPlayer === 2 && !gameOver) {
      const t = setTimeout(aiPlay, 380)
      return () => clearTimeout(t)
    }
  }, [currentPlayer, mode, gameOver, aiPlay])

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4">
            <span className="text-6xl">🔲</span>
            <h1 className="text-7xl font-black tracking-[0.05em]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              DOTS &amp; BOXES
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <motion.button
              key={d}
              onClick={() => { setDifficulty(d); setTimeout(initGame, 50) }}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold tracking-widest transition-all ${difficulty === d ? 'bg-white text-black scale-105' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            >
              {DIFFICULTIES[d].label}
            </motion.button>
          ))}
          {(['solo', '2p', '3p', '4p'] as const).map(m => (
            <motion.button
              key={m}
              onClick={() => { setMode(m); setTimeout(initGame, 50) }}
              className={`px-6 py-2.5 rounded-2xl text-sm font-bold tracking-widest flex items-center gap-2 transition-all ${mode === m ? 'bg-white text-black scale-105' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            >
              {m === 'solo' ? <User size={16} /> : <Users size={16} />}
              {m === 'solo' ? 'VS AI' : m.toUpperCase()}
            </motion.button>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {Array.from({ length: numPlayers }).map((_, i) => {
            const p = i + 1
            const isActive = p === currentPlayer && !gameOver
            return (
              <div
                key={p}
                className={`px-8 py-4 rounded-3xl text-center transition-all min-w-[130px] ${isActive ? 'ring-4 ring-offset-4 ring-offset-[#0d1117]' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: `3px solid ${PLAYER_COLORS[p - 1]}`,
                  boxShadow: isActive ? `0 0 30px ${PLAYER_COLORS[p - 1]}80` : 'none',
                }}
              >
                <div className="text-xs tracking-[0.2em] uppercase opacity-70 mb-1" style={{ color: PLAYER_COLORS[p - 1] }}>
                  {mode === 'solo' && p === 2 ? 'AI ' : ''}{PLAYER_NAMES[p]}
                </div>
                <div className="text-5xl font-black" style={{ color: PLAYER_COLORS[p - 1] }}>
                  {scores[p - 1] || 0}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center">
          <div
            className="relative rounded-3xl shadow-2xl overflow-hidden"
            style={{
              width: cols * cellSize + 28,
              height: rows * cellSize + 28,
              background: '#ffffff',
              border: '14px solid #111111',
            }}
          >
            {Array.from({ length: rows + 1 }).map((_, r) =>
              Array.from({ length: cols + 1 }).map((_, c) => (
                <div
                  key={`${r}-${c}`}
                  className="absolute w-4 h-4 bg-black rounded-full shadow-md z-20"
                  style={{
                    left: c * cellSize + cellSize / 2 - 8,
                    top: r * cellSize + cellSize / 2 - 8,
                  }}
                />
              ))
            )}

            {linesH.map((row, r) =>
              row.map((owner, c) => (
                <motion.div
                  key={`h-${r}-${c}`}
                  onClick={() => handleMove('h', r, c)}
                  className={`absolute transition-all ${owner === 0 ? 'cursor-pointer hover:scale-y-125' : ''}`}
                  style={{
                    left: c * cellSize + 14,
                    top: r * cellSize + cellSize / 2 - 3,
                    width: cellSize - 28,
                    height: 8,
                    background: owner ? PLAYER_COLORS[owner - 1] : '#444444',
                    borderRadius: 4,
                  }}
                  whileHover={owner === 0 ? { scaleY: 1.6 } : {}}
                />
              ))
            )}

            {linesV.map((row, r) =>
              row.map((owner, c) => (
                <motion.div
                  key={`v-${r}-${c}`}
                  onClick={() => handleMove('v', r, c)}
                  className={`absolute transition-all ${owner === 0 ? 'cursor-pointer hover:scale-x-125' : ''}`}
                  style={{
                    left: c * cellSize + cellSize / 2 - 3,
                    top: r * cellSize + 14,
                    width: 8,
                    height: cellSize - 28,
                    background: owner ? PLAYER_COLORS[owner - 1] : '#444444',
                    borderRadius: 4,
                  }}
                  whileHover={owner === 0 ? { scaleX: 1.6 } : {}}
                />
              ))
            )}

            {boxes.map((row, r) =>
              row.map((owner, c) =>
                owner ? (
                  <motion.div
                    key={`box-${r}-${c}`}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute flex items-center justify-center font-black text-6xl select-none"
                    style={{
                      left: c * cellSize + cellSize * 0.12,
                      top: r * cellSize + cellSize * 0.12,
                      width: cellSize * 0.76,
                      height: cellSize * 0.76,
                      background: `${PLAYER_COLORS[owner - 1]}15`,
                      border: `4px solid ${PLAYER_COLORS[owner - 1]}`,
                      color: PLAYER_COLORS[owner - 1],
                    }}
                  >
                    {owner}
                  </motion.div>
                ) : null
              )
            )}
          </div>
        </div>

        <div className="flex justify-center mt-10">
          <motion.button
            onClick={initGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 px-10 py-5 rounded-3xl text-xl font-bold tracking-widest border border-zinc-700"
          >
            <RotateCcw size={26} /> NEW GAME
          </motion.button>
        </div>

        <div className="text-center text-xs text-gray-500 mt-6 tracking-widest">
          {mode === 'solo' ? 'You are RED • AI is BLUE' : 'Hot-seat multiplayer'}
        </div>
      </div>

      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.82, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#1c2128] border-4 border-white/80 rounded-3xl p-12 text-center max-w-xs w-full"
            >
              <Trophy size={82} className="mx-auto mb-6 text-white" />
              <h2 className="text-5xl font-black tracking-widest mb-3" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {winnerText.includes('TIE') ? 'TIE GAME' : winnerText.split(' ')[0] + ' WINS'}
              </h2>
              <p className="text-2xl text-gray-300 mb-10">{winnerText}</p>

              <motion.button
                onClick={initGame}
                whileHover={{ scale: 1.05 }}
                className="w-full py-6 bg-white text-black rounded-2xl text-2xl font-bold tracking-widest"
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
