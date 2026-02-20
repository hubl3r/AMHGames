'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Trophy } from 'lucide-react'

type Difficulty = 'easy' | 'medium' | 'hard'
type Mode = 'solo' | '2p' | '3p' | '4p'

const DIFFICULTIES: Record<Difficulty, { rows: number; cols: number; label: string }> = {
  easy:   { rows: 6, cols: 6,  label: 'EASY 6×6' },
  medium: { rows: 8, cols: 8,  label: 'MEDIUM 8×8' },
  hard:   { rows: 8, cols: 10, label: 'HARD 8×10' },
}

const PLAYER_COLORS = ['#ff3366', '#00d4ff', '#22c55e', '#f59e0b'] as const
const PLAYER_NAMES  = ['', 'RED', 'BLUE', 'GREEN', 'ORANGE']

export default function DotsAndBoxesPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [mode, setMode] = useState<Mode>('solo')
  const [cellSize, setCellSize] = useState(68)

  const { rows, cols } = DIFFICULTIES[difficulty]
  const numPlayers = mode === 'solo' ? 2 : parseInt(mode[0])

  const [linesH, setLinesH] = useState<number[][]>([])
  const [linesV, setLinesV] = useState<number[][]>([])
  const [boxes,  setBoxes]  = useState<number[][]>([])
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [scores, setScores] = useState<number[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winnerText, setWinnerText] = useState('')

  const totalBoxes = rows * cols

  /** =================== Responsive sizing =================== */
  const updateCellSize = useCallback(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Reserve some vertical space for title/controls/scoreboard (smaller on phones).
    const verticalReserve = vw < 640 ? 180 : 280
    const horizontalGutters = 32 // page side padding

    const availW = Math.max(240, vw - horizontalGutters * 2)

    // Allow the board to be ~60% “longer” (taller) to favor bigger cells
    const availHBase = Math.max(240, vh - verticalReserve)
    const availH = Math.floor(availHBase * 1.6) // << 60% boost

    const computed = Math.min(
      Math.floor(availW / cols),
      Math.floor(availH / rows)
    )

    // Keep playable on tiny phones; don’t explode on large displays
    setCellSize(Math.max(26, Math.min(computed, 120)))
  }, [rows, cols])

  useEffect(() => {
    updateCellSize()
    window.addEventListener('resize', updateCellSize)
    return () => window.removeEventListener('resize', updateCellSize)
  }, [updateCellSize])

  // Metrics derived from cellSize so touch targets scale on mobile
  const METRICS = useMemo(() => {
    const DOT_R   = Math.max(4, Math.round(cellSize * 0.10))        // dot radius
    const LINE_T  = Math.max(4, Math.round(cellSize * 0.10))        // line thickness
    const HOVER_G = Math.max(3, Math.round(LINE_T * 0.75))          // hover growth (desktop)
    // Ensure padding >= max(DOT_R, LINE_T/2) so nothing clips at edges
    const basePad = Math.max(DOT_R, Math.ceil(LINE_T / 2))
    const PADDING = Math.max(12, Math.min(36, Math.round(cellSize * 0.22), basePad + 6))
    const BOX_IN  = Math.max(DOT_R + 2, Math.round(cellSize * 0.18)) // inset for claimed box
    return { DOT_R, LINE_T, HOVER_G, PADDING, BOX_IN }
  }, [cellSize])

  /** =================== Init & game state =================== */
  const initGame = useCallback(() => {
    setLinesH(Array(rows + 1).fill(0).map(() => Array(cols).fill(0)))
    setLinesV(Array(rows).fill(0).map(() => Array(cols + 1).fill(0)))
    setBoxes (Array(rows).fill(0).map(() => Array(cols).fill(0)))
    setScores(Array(numPlayers).fill(0))
    setCurrentPlayer(1)
    setGameOver(false)
    setWinnerText('')
  }, [rows, cols, numPlayers])

  // Re-init when grid shape or players change
  useEffect(() => { initGame() }, [initGame])

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
        const otherTotal = newScoresArr.reduce((sum, s, i) => i + 1 !== winnerIdx ? sum + s : sum, 0)
        scoreStr = `${maxScore}–${otherTotal}`
      }
      setWinnerText(
        winners.length > 1 ? `TIE ${maxScore}–${maxScore}` : `${winners[0]} WINS ${scoreStr}`
      )
      return
    }

    if (completed === 0) {
      setCurrentPlayer(currentPlayer === numPlayers ? 1 : currentPlayer + 1)
    }
  }

  /** =================== AI (solo) =================== */
  const aiPlay = useCallback(() => {
    if (mode !== 'solo' || currentPlayer !== 2 || gameOver) return

    const getCompletingMoves = () => {
      const moves: { type: 'h' | 'v'; row: number; col: number }[] = []
      for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) {
        if (linesH[r][c] === 0) {
          let tH = linesH.map(x => [...x]); tH[r][c] = 2
          let comp = 0
          if (r > 0   && isBoxComplete(r-1, c, tH, linesV)) comp++
          if (r < rows && isBoxComplete(r,   c, tH, linesV)) comp++
          if (comp) moves.push({type:'h', row:r, col:c})
        }
      }
      for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) {
        if (linesV[r][c] === 0) {
          let tV = linesV.map(x => [...x]); tV[r][c] = 2
          let comp = 0
          if (c > 0   && isBoxComplete(r, c-1, linesH, tV)) comp++
          if (c < cols && isBoxComplete(r, c,   linesH, tV)) comp++
          if (comp) moves.push({type:'v', row:r, col:c})
        }
      }
      return moves
    }

    let moves = getCompletingMoves()
    if (moves.length) {
      const m = moves[Math.floor(Math.random() * moves.length)]
      setTimeout(() => handleMove(m.type, m.row, m.col), 380)
      return
    }

    const safe: { type:'h'|'v'; row:number; col:number }[] = []
    const opp = 1

    for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) {
      if (linesH[r][c] !== 0) continue
      let tH = linesH.map(x => [...x]); tH[r][c] = 2
      let gives = false
      for (let or=0; or<=rows && !gives; or++) for (let oc=0; oc<cols && !gives; oc++) {
        if (tH[or][oc]===0) {
          let ch = tH.map(x=>[...x]); ch[or][oc]=opp
          if ((or>0 && isBoxComplete(or-1,oc,ch,linesV)) ||
              (or<rows && isBoxComplete(or,oc,ch,linesV))) gives=true
        }
      }
      for (let or=0; or<rows && !gives; or++) for (let oc=0; oc<=cols && !gives; oc++) {
        if (linesV[or][oc]===0) {
          let ch = tH.map(x=>[...x]); let cv = linesV.map(x=>[...x]); cv[or][oc]=opp
          if ((oc>0 && isBoxComplete(or,oc-1,ch,cv)) ||
              (oc<cols && isBoxComplete(or,oc,ch,cv))) gives=true
        }
      }
      if (!gives) safe.push({type:'h',row:r,col:c})
    }

    for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) {
      if (linesV[r][c] !== 0) continue
      let tV = linesV.map(x => [...x]); tV[r][c] = 2
      let gives = false
      for (let or=0; or<=rows && !gives; or++) for (let oc=0; oc<cols && !gives; oc++) {
        if (linesH[or][oc]===0) {
          let ch = linesH.map(x=>[...x]); ch[or][oc]=opp; let cv=tV.map(x=>[...x])
          if ((or>0 && isBoxComplete(or-1,oc,ch,cv)) ||
              (or<rows && isBoxComplete(or,oc,ch,cv))) gives=true
        }
      }
      for (let or=0; or<rows && !gives; or++) for (let oc=0; oc<=cols && !gives; oc++) {
        if (tV[or][oc]===0) {
          let ch=linesH.map(x=>[...x]); let cv=tV.map(x=>[...x]); cv[or][oc]=opp
          if ((oc>0 && isBoxComplete(or,oc-1,ch,cv)) ||
              (oc<cols && isBoxComplete(or,oc,ch,cv))) gives=true
        }
      }
      if (!gives) safe.push({type:'v',row:r,col:c})
    }

    if (safe.length) {
      const m = safe[Math.floor(Math.random() * safe.length)]
      setTimeout(() => handleMove(m.type, m.row, m.col), 380)
      return
    }

    const all: any[] = []
    for (let r=0;r<=rows;r++) for (let c=0;c<cols;c++) if (linesH[r][c]===0) all.push({type:'h',row:r,col:c})
    for (let r=0;r<rows;r++) for (let c=0;c<=cols;c++) if (linesV[r][c]===0) all.push({type:'v',row:r,col:c})
    if (all.length) {
      const m = all[Math.floor(Math.random()*all.length)]
      setTimeout(() => handleMove(m.type, m.row, m.col), 380)
    }
  }, [mode, currentPlayer, gameOver, linesH, linesV, rows, cols]) // handleMove captured intentionally

  useEffect(() => {
    if (mode === 'solo' && currentPlayer === 2 && !gameOver) {
      const t = setTimeout(aiPlay, 360)
      return () => clearTimeout(t)
    }
  }, [currentPlayer, mode, gameOver, aiPlay])

  /** =================== Render =================== */
  const { DOT_R, LINE_T, HOVER_G, PADDING, BOX_IN } = METRICS
  const boardW = cols * cellSize + PADDING * 2
  const boardH = rows * cellSize + PADDING * 2

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-10">
      <div className="mx-auto px-4 pt-6 max-w-[1200px]">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3">
            <span className="text-5xl sm:text-6xl">🔲</span>
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-[0.05em]"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              DOTS & BOXES
            </h1>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mb-6">
          <div className="text-center">
            <div className="text-xs tracking-[0.2em] opacity-60 mb-1.5">DIFFICULTY</div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className="bg-zinc-900 border border-zinc-700 text-white px-5 py-3 rounded-2xl text-base font-bold focus:outline-none focus:border-white/50 w-52"
            >
              {Object.entries(DIFFICULTIES).map(([key, d]) => (
                <option key={key} value={key}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="text-center">
            <div className="text-xs tracking-[0.2em] opacity-60 mb-1.5">PLAYERS</div>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              className="bg-zinc-900 border border-zinc-700 text-white px-5 py-3 rounded-2xl text-base font-bold focus:outline-none focus:border-white/50 w-52"
            >
              <option value="solo">Solo vs AI</option>
              <option value="2p">2 Players</option>
              <option value="3p">3 Players</option>
              <option value="4p">4 Players</option>
            </select>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {Array.from({ length: numPlayers }).map((_, i) => {
            const p = i + 1
            const isActive = p === currentPlayer && !gameOver
            return (
              <div
                key={p}
                className={`px-5 py-3 rounded-2xl text-center min-w-[108px] transition-all ${isActive ? 'ring-2 ring-offset-4 ring-offset-[#0d1117]' : ''}`}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `2px solid ${PLAYER_COLORS[p-1]}`,
                  boxShadow: isActive ? `0 0 25px ${PLAYER_COLORS[p-1]}60` : 'none',
                }}
              >
                <div className="text-[10px] tracking-widest opacity-70 mb-0.5" style={{ color: PLAYER_COLORS[p-1] }}>
                  {mode === 'solo' && p === 2 ? 'AI ' : ''}{PLAYER_NAMES[p]}
                </div>
                <div className="text-3xl sm:text-4xl font-black" style={{ color: PLAYER_COLORS[p-1] }}>
                  {scores[p-1] ?? 0}
                </div>
              </div>
            )
          })}
        </div>

        {/* Board */}
        <div className="flex justify-center">
          <div
            key={`board-${rows}x${cols}-${numPlayers}`}
            className="relative rounded-3xl shadow-2xl overflow-hidden border-[14px] border-black touch-manipulation select-none"
            style={{
              width: boardW,
              height: boardH,
              background: '#ffffff',
            }}
          >
            {/* Dots */}
            {Array.from({ length: rows + 1 }).map((_, r) =>
              Array.from({ length: cols + 1 }).map((_, c) => (
                <div
                  key={`${r}-${c}`}
                  className="absolute bg-black rounded-full z-20 shadow"
                  style={{
                    width: METRICS.DOT_R * 2,
                    height: METRICS.DOT_R * 2,
                    left: METRICS.PADDING + c * cellSize - METRICS.DOT_R,
                    top:  METRICS.PADDING + r * cellSize - METRICS.DOT_R,
                  }}
                />
              ))
            )}

            {/* Horizontal lines */}
            {linesH.map((row, r) =>
              row.map((owner, c) => (
                <motion.div
                  key={`h-${r}-${c}`}
                  onClick={() => handleMove('h', r, c)}
                  className={`absolute transition-all ${owner === 0 ? 'cursor-pointer hover:bg-zinc-300' : ''}`}
                  style={{
                    left: METRICS.PADDING + c * cellSize,
                    top:  METRICS.PADDING + r * cellSize - Math.floor(METRICS.LINE_T / 2),
                    width: cellSize,
                    height: METRICS.LINE_T,
                    background: owner ? PLAYER_COLORS[owner - 1] : '#555555',
                    borderRadius: 999,
                  }}
                  whileHover={owner === 0 ? { height: METRICS.LINE_T + METRICS.HOVER_G } : {}}
                />
              ))
            )}

            {/* Vertical lines */}
            {linesV.map((row, r) =>
              row.map((owner, c) => (
                <motion.div
                  key={`v-${r}-${c}`}
                  onClick={() => handleMove('v', r, c)}
                  className={`absolute transition-all ${owner === 0 ? 'cursor-pointer hover:bg-zinc-300' : ''}`}
                  style={{
                    left: METRICS.PADDING + c * cellSize - Math.floor(METRICS.LINE_T / 2),
                    top:  METRICS.PADDING + r * cellSize,
                    width: METRICS.LINE_T,
                    height: cellSize,
                    background: owner ? PLAYER_COLORS[owner - 1] : '#555555',
                    borderRadius: 999,
                  }}
                  whileHover={owner === 0 ? { width: METRICS.LINE_T + METRICS.HOVER_G } : {}}
                />
              ))
            )}

            {/* Claimed boxes */}
            {boxes.map((row, r) =>
              row.map((owner, c) =>
                owner ? (
                  <motion.div
                    key={`box-${r}-${c}`}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute flex items-center justify-center font-black select-none"
                    style={{
                      left:  METRICS.PADDING + c * cellSize + METRICS.BOX_IN,
                      top:   METRICS.PADDING + r * cellSize + METRICS.BOX_IN,
                      width: cellSize - METRICS.BOX_IN * 2,
                      height: cellSize - METRICS.BOX_IN * 2,
                      background: `${PLAYER_COLORS[owner-1]}15`,
                      border: `${Math.max(2, Math.round(METRICS.LINE_T * 0.8))}px solid ${PLAYER_COLORS[owner-1]}`,
                      color: PLAYER_COLORS[owner-1],
                      fontSize: Math.max(20, Math.round(cellSize * 0.55)),
                      borderRadius: 12,
                    }}
                  >
                    {owner}
                  </motion.div>
                ) : null
              )
            )}
          </div>
        </div>

        {/* New game */}
        <div className="flex justify-center mt-8">
          <motion.button
            onClick={initGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 px-8 py-4 rounded-3xl text-lg sm:text-xl font-bold tracking-widest border border-zinc-700"
          >
            <RotateCcw size={22} /> NEW GAME
          </motion.button>
        </div>

        <div className="text-center text-xs text-gray-500 mt-5 tracking-widest">
          {mode === 'solo' ? 'RED = You • BLUE = AI' : 'Hot-seat multiplayer • Tap lines to claim'}
        </div>
      </div>

      {/* Winner overlay */}
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
              className="bg-[#1c2128] border-4 border-white/80 rounded-3xl p-10 text-center max-w-xs w-full"
            >
              <Trophy size={72} className="mx-auto mb-5 text-white" />
              <h2
                className="text-4xl sm:text-5xl font-black tracking-widest mb-3"
                style={{ fontFamily: 'Bebas Neue, sans-serif' }}
              >
                {winnerText.includes('TIE') ? 'TIE GAME' : winnerText.split(' ')[0] + ' WINS'}
              </h2>
              <p className="text-xl sm:text-2xl text-gray-300 mb-8">{winnerText}</p>
              <motion.button
                onClick={initGame}
                whileHover={{ scale: 1.05 }}
                className="w-full py-5 bg-white text-black rounded-2xl text-xl sm:text-2xl font-bold tracking-widest"
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
