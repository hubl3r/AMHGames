// app/paper/dots-and-boxes/page.tsx
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

  /** ---------- Responsive sizing & spacing ---------- */
  const updateCellSize = useCallback(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Space around the board for page chrome (header, selects, scoreboard).
    const verticalReserve = vw < 640 ? 200 : 300   // smaller reserve on phones
    const horizontalGutters = 32                   // side padding

    const availW = Math.max(240, vw - horizontalGutters * 2)
    const availH = Math.max(240, vh - verticalReserve)

    const size = Math.min(
      Math.floor(availW / cols),
      Math.floor(availH / rows)
    )

    // Bound the size so it fills most screens but stays usable on tiny viewports
    setCellSize(Math.max(26, Math.min(size, 120)))
  }, [rows, cols])

  useEffect(() => {
    updateCellSize()
    window.addEventListener('resize', updateCellSize)
    return () => window.removeEventListener('resize', updateCellSize)
  }, [updateCellSize])

  // Derived metrics scale with cell size (good for touch targets)
  const METRICS = useMemo(() => {
    const DOT_R   = Math.max(4, Math.round(cellSize * 0.10))     // dot radius
    const LINE_T  = Math.max(4, Math.round(cellSize * 0.10))     // line thickness
    const HOVER_G = Math.max(3, Math.round(LINE_T * 0.75))       // hover growth
    const PADDING = Math.max(12, Math.min(32, Math.round(cellSize * 0.20))) // inner padding
    const BOX_IN  = Math.max(DOT_R + 2, Math.round(cellSize * 0.18)) // box inset from dot centers

    return { DOT_R, LINE_T, HOVER_G, PADDING, BOX_IN }
  }, [cellSize])

  /** ---------- Game init & state ---------- */
  const initGame = useCallback(() => {
    setLinesH(Array(rows + 1).fill(0).map(() => Array(cols).fill(0)))
    setLinesV(Array(rows).fill(0).map(() => Array(cols + 1).fill(0)))
    setBoxes (Array(rows).fill(0).map(() => Array(cols).fill(0)))
    setScores(Array(numPlayers).fill(0))
    setCurrentPlayer(1)
    setGameOver(false)
    setWinnerText('')
  }, [rows, cols, numPlayers])

  // Initialize whenever grid shape or player count changes.
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

  /** ---------- Simple AI for solo mode ---------- */
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
