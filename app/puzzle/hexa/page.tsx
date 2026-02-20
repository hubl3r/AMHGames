// app/board/hex/page.tsx
'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Trophy } from 'lucide-react'

const BOARD_SIZE = 11
const HEX_RADIUS = 24

type Player = 1 | 2
type Cell = { row: number; col: number }

export default function HexPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<number[][]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player>(1)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const hexWidth = HEX_RADIUS * Math.sqrt(3)
  const hexHeight = HEX_RADIUS * 2

  const getHexCenter = useCallback((row: number, col: number) => {
    const x = 50 + col * hexWidth + (row * hexWidth / 2)
    const y = 50 + row * hexHeight * 0.75
    return { x, y }
  }, [hexWidth, hexHeight])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const { x, y } = getHexCenter(row, col)
        const owner = board[row]?.[col] || 0

        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6
          ctx.lineTo(
            x + HEX_RADIUS * Math.cos(angle),
            y + HEX_RADIUS * Math.sin(angle)
          )
        }
        ctx.closePath()

        if (owner === 1) {
          ctx.fillStyle = '#ff3366'
          ctx.shadowBlur = 20
          ctx.shadowColor = 'rgba(255,51,102,0.7)'
        } else if (owner === 2) {
          ctx.fillStyle = '#00d4ff'
          ctx.shadowBlur = 20
          ctx.shadowColor = 'rgba(0,212,255,0.7)'
        } else {
          ctx.fillStyle = '#1c2128'
          ctx.shadowBlur = 0
        }
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.strokeStyle = owner === 0 ? '#30363d' : 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 2.5
        ctx.stroke()
      }
    }
  }, [board, getHexCenter])

  const initBoard = useCallback(() => {
    const newBoard: number[][] = Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(0)
    )
    setBoard(newBoard)
    setCurrentPlayer(1)
    setGameOver(false)
    setWinner(null)
  }, [])

  const findHexAtPoint = (x: number, y: number): Cell | null => {
    let closest: Cell | null = null
    let minDist = Infinity

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const { x: cx, y: cy } = getHexCenter(row, col)
        const dist = Math.hypot(cx - x, cy - y)
        if (dist < minDist) {
          minDist = dist
          closest = { row, col }
        }
      }
    }
    return minDist < HEX_RADIUS * 1.1 ? closest : null
  }

  const getNeighbors = (row: number, col: number): Cell[] => {
    const dirs = [
      [-1, 0], [-1, 1], [0, 1],
      [1, 0], [1, -1], [0, -1]
    ]
    return dirs
      .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
      .filter(n => n.row >= 0 && n.row < BOARD_SIZE && n.col >= 0 && n.col < BOARD_SIZE)
  }

  const hasPath = (player: Player, starts: Cell[], isGoal: (r: number, c: number) => boolean): boolean => {
    const visited = new Set<string>()
    const queue: Cell[] = []

    for (const cell of starts) {
      if (board[cell.row]?.[cell.col] === player) {
        const key = `${cell.row},${cell.col}`
        visited.add(key)
        queue.push(cell)
      }
    }

    while (queue.length) {
      const cur = queue.shift()!
      if (isGoal(cur.row, cur.col)) return true

      for (const n of getNeighbors(cur.row, cur.col)) {
        const key = `${n.row},${n.col}`
        if (!visited.has(key) && board[n.row]?.[n.col] === player) {
          visited.add(key)
          queue.push(n)
        }
      }
    }
    return false
  }

  const checkWin = (player: Player): boolean => {
    if (player === 1) {
      // Top to bottom
      const starts = Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: 0, col: i }))
      return hasPath(player, starts, (r) => r === BOARD_SIZE - 1)
    } else {
      // Left to right
      const starts = Array.from({ length: BOARD_SIZE }, (_, i) => ({ row: i, col: 0 }))
      return hasPath(player, starts, (_, c) => c === BOARD_SIZE - 1)
    }
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver || isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const hex = findHexAtPoint(clickX, clickY)
    if (!hex || board[hex.row][hex.col] !== 0) return

    setIsDrawing(true)

    const newBoard = board.map(row => [...row])
    newBoard[hex.row][hex.col] = currentPlayer
    setBoard(newBoard)

    if (checkWin(currentPlayer)) {
      setGameOver(true)
      setWinner(currentPlayer)
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    }

    setIsDrawing(false)
  }

  // Init
  useEffect(() => {
    initBoard()
  }, [initBoard])

  // Draw whenever board changes
  useEffect(() => {
    draw()
  }, [draw])

  // Canvas size
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 620
    canvas.height = 620
  }, [])

  const newGame = () => {
    initBoard()
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#ff3366] opacity-5 blur-3xl rounded-full" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#00d4ff] opacity-5 blur-3xl rounded-full" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="text-6xl">🔷</div>
            <h1 
              className="text-7xl font-black tracking-[0.07em] text-white"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              HEX
            </h1>
          </div>
          <p className="text-gray-400 tracking-[0.25em] uppercase text-sm">CONNECT YOUR SIDES</p>
        </div>

        {/* Players */}
        <div className="flex justify-center gap-8 mb-8">
          <div className={`player-indicator ${currentPlayer === 1 ? 'active' : ''} flex-1 max-w-[240px]`}
            style={{
              background: 'rgba(28,33,40,0.85)',
              border: currentPlayer === 1 ? '3px solid #ff3366' : '3px solid transparent',
              boxShadow: currentPlayer === 1 ? '0 0 35px rgba(255,51,102,0.5)' : 'none',
            }}>
            <div className="text-[#ff3366] text-3xl font-bold tracking-widest">RED</div>
            <div className="text-xs uppercase tracking-[0.2em] opacity-70 mt-1">TOP ↔ BOTTOM</div>
          </div>

          <div className={`player-indicator ${currentPlayer === 2 ? 'active' : ''} flex-1 max-w-[240px]`}
            style={{
              background: 'rgba(28,33,40,0.85)',
              border: currentPlayer === 2 ? '3px solid #00d4ff' : '3px solid transparent',
              boxShadow: currentPlayer === 2 ? '0 0 35px rgba(0,212,255,0.5)' : 'none',
            }}>
            <div className="text-[#00d4ff] text-3xl font-bold tracking-widest">BLUE</div>
            <div className="text-xs uppercase tracking-[0.2em] opacity-70 mt-1">LEFT ↔ RIGHT</div>
          </div>
        </div>

        {/* Board */}
        <div className="flex justify-center mb-8">
          <div 
            className="relative p-8 rounded-3xl"
            style={{
              background: 'rgba(28,33,40,0.6)',
              border: '2px solid #30363d',
              boxShadow: '0 0 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Edge highlights */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-6 left-12 right-12 h-1.5 bg-[#ff3366] opacity-40 rounded" />
              <div className="absolute bottom-6 left-12 right-12 h-1.5 bg-[#ff3366] opacity-40 rounded" />
              <div className="absolute left-6 top-12 bottom-12 w-1.5 bg-[#00d4ff] opacity-40 rounded" />
              <div className="absolute right-6 top-12 bottom-12 w-1.5 bg-[#00d4ff] opacity-40 rounded" />
            </div>

            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="cursor-pointer touch-none"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center">
          <motion.button
            onClick={newGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg tracking-widest uppercase"
            style={{
              background: 'linear-gradient(135deg, #30363d, #1c2128)',
              border: '2px solid #30363d',
              color: '#fff',
            }}
          >
            <RotateCcw size={22} /> NEW GAME
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="max-w-md mx-auto mt-10 text-center text-sm text-gray-400">
          Red connects top to bottom.<br />
          Blue connects left to right.<br />
          Click empty hexes. First to connect wins.
        </div>
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {gameOver && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              className="rounded-3xl p-12 text-center max-w-sm w-full"
              style={{
                background: winner === 1 
                  ? 'linear-gradient(135deg, #2a0f17, #1a0a10)' 
                  : 'linear-gradient(135deg, #0a1f26, #08181f)',
                border: `4px solid ${winner === 1 ? '#ff3366' : '#00d4ff'}`,
                boxShadow: `0 0 80px ${winner === 1 ? 'rgba(255,51,102,0.6)' : 'rgba(0,212,255,0.6)'}`,
              }}
            >
              <Trophy size={80} className="mx-auto mb-6" style={{ color: winner === 1 ? '#ff3366' : '#00d4ff' }} />
              
              <h2 className="text-6xl font-black tracking-widest mb-3" style={{ color: winner === 1 ? '#ff3366' : '#00d4ff' }}>
                {winner === 1 ? 'RED' : 'BLUE'} WINS!
              </h2>
              <p className="text-xl text-gray-300 mb-10">
                {winner === 1 ? 'Top to bottom connected' : 'Left to right connected'}
              </p>

              <motion.button
                onClick={newGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 rounded-2xl text-xl font-bold tracking-widest"
                style={{
                  background: winner === 1 ? '#ff3366' : '#00d4ff',
                  color: '#0d1117',
                }}
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
