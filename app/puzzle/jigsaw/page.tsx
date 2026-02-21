// app/puzzle/jigsaw/page.tsx

'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, RotateCcw, CheckCircle } from 'lucide-react'

type PiecePosition = { x: number; y: number }
type Piece = {
  id: number
  position: PiecePosition
  correctPosition: PiecePosition
  isPlaced: boolean
}

const PIECE_SIZE = 150 // Smaller pieces
const SNAP_THRESHOLD = 30

export default function JigsawPage() {
  const [image, setImage] = useState<string | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [completed, setCompleted] = useState(false)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const initializePuzzle = () => {
    if (!image) return

    // Correct positions - centered on screen
    const boardLeft = 50
    const boardTop = 100

    const correctPositions = [
      { x: boardLeft, y: boardTop },
      { x: boardLeft + PIECE_SIZE, y: boardTop },
      { x: boardLeft, y: boardTop + PIECE_SIZE },
      { x: boardLeft + PIECE_SIZE, y: boardTop + PIECE_SIZE },
    ]

    // Scatter pieces to the right side of the board
    const newPieces: Piece[] = correctPositions.map((correct, i) => ({
      id: i,
      position: {
        x: boardLeft + PIECE_SIZE * 2 + 100 + (i % 2) * 80,
        y: boardTop + Math.floor(i / 2) * (PIECE_SIZE + 20),
      },
      correctPosition: correct,
      isPlaced: false,
    }))

    setPieces(newPieces)
    setCompleted(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setImage(reader.result as string)
        setTimeout(() => initializePuzzle(), 100)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrag = (id: number, event: any, info: any) => {
    setPieces(prev => prev.map(piece => {
      if (piece.id !== id || piece.isPlaced) return piece

      // Calculate new position with constraints
      let newX = piece.position.x + info.delta.x
      let newY = piece.position.y + info.delta.y

      // Keep pieces on screen (roughly)
      newX = Math.max(0, Math.min(newX, 800))
      newY = Math.max(0, Math.min(newY, 600))

      return { ...piece, position: { x: newX, y: newY } }
    }))
  }

  const handleDragEnd = (id: number) => {
    setPieces(prev => {
      const updated = prev.map(piece => {
        if (piece.id !== id) return piece

        // Check if close to correct position
        const dx = Math.abs(piece.position.x - piece.correctPosition.x)
        const dy = Math.abs(piece.position.y - piece.correctPosition.y)

        if (dx < SNAP_THRESHOLD && dy < SNAP_THRESHOLD) {
          return {
            ...piece,
            position: piece.correctPosition,
            isPlaced: true,
          }
        }

        return piece
      })

      if (updated.every(p => p.isPlaced)) {
        setCompleted(true)
      }

      return updated
    })
    setDraggingId(null)
  }

  // Simple working SVG paths based on your template
  // These create proper jigsaw shapes with tabs and sockets
  const getSVGPath = (index: number) => {
    const w = PIECE_SIZE
    const h = PIECE_SIZE
    const t = 20 // tab size
    
    switch(index) {
      case 0: // Top-left: tab right, tab bottom
        return `M 0,0 L ${w},0 L ${w},${h/2-t} Q ${w+t},${h/2} ${w},${h/2+t} L ${w},${h} L ${w/2+t},${h} Q ${w/2},${h+t} ${w/2-t},${h} L 0,${h} Z`
      case 1: // Top-right: socket left, tab bottom
        return `M 0,0 L ${w},0 L ${w},${h} L ${w/2+t},${h} Q ${w/2},${h+t} ${w/2-t},${h} L 0,${h} L 0,${h/2+t} Q ${-t},${h/2} 0,${h/2-t} Z`
      case 2: // Bottom-left: tab right, socket top
        return `M 0,0 L ${w/2-t},0 Q ${w/2},${-t} ${w/2+t},0 L ${w},0 L ${w},${h/2-t} Q ${w+t},${h/2} ${w},${h/2+t} L ${w},${h} L 0,${h} Z`
      case 3: // Bottom-right: socket left, socket top
        return `M 0,0 L ${w/2-t},0 Q ${w/2},${-t} ${w/2+t},0 L ${w},0 L ${w},${h} L 0,${h} L 0,${h/2+t} Q ${-t},${h/2} 0,${h/2-t} Z`
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
      
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-2" style={{ 
            fontFamily: 'Cinzel, serif', 
            background: 'linear-gradient(135deg, #a855f7, #6d28d9)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            letterSpacing: '0.1em',
          }}>
            JIGSAW PUZZLE
          </h1>
          <p className="text-sm tracking-widest uppercase opacity-70 text-purple-300">4 Piece Challenge</p>
        </div>

        {!image ? (
          <div className="max-w-md mx-auto">
            <label className="block p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-purple-400 hover:bg-purple-500/5" style={{ borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.05)' }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="text-center">
                <Upload size={48} className="mx-auto mb-4 text-purple-400" />
                <p className="text-xl font-semibold mb-2 text-white">Upload an Image</p>
                <p className="text-sm text-gray-400">Click to select a photo for your puzzle</p>
              </div>
            </label>
          </div>
        ) : (
          <div>
            <div className="flex justify-center gap-4 mb-6">
              <button onClick={initializePuzzle} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: 'white' }}>
                <RotateCcw size={18} /> Shuffle
              </button>
              <button onClick={() => setImage(null)} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: 'white' }}>
                <Upload size={18} /> New Image
              </button>
            </div>

            {/* Puzzle Container */}
            <div ref={containerRef} className="relative mx-auto" style={{ width: '900px', height: '500px', maxWidth: '100%' }}>
              
              {/* Board outline */}
              <div className="absolute rounded-xl pointer-events-none" style={{ 
                left: 50,
                top: 100,
                width: PIECE_SIZE * 2, 
                height: PIECE_SIZE * 2,
                border: '2px dashed rgba(168,85,247,0.4)',
                background: 'rgba(168,85,247,0.05)',
              }} />

              {/* Pieces */}
              {pieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  drag={!piece.isPlaced}
                  dragMomentum={false}
                  dragElastic={0}
                  onDrag={(e, info) => handleDrag(piece.id, e, info)}
                  onDragStart={() => setDraggingId(piece.id)}
                  onDragEnd={() => handleDragEnd(piece.id)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    x: piece.position.x,
                    y: piece.position.y,
                    width: PIECE_SIZE,
                    height: PIECE_SIZE,
                    cursor: piece.isPlaced ? 'default' : 'grab',
                    zIndex: draggingId === piece.id ? 50 : piece.isPlaced ? 10 : 20,
                  }}
                  animate={{
                    scale: draggingId === piece.id ? 1.05 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <svg width={PIECE_SIZE} height={PIECE_SIZE} style={{ 
                    overflow: 'visible',
                    filter: piece.isPlaced ? 'none' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                  }}>
                    <defs>
                      <pattern id={`img-${piece.id}`} x="0" y="0" width={PIECE_SIZE * 2} height={PIECE_SIZE * 2} patternUnits="userSpaceOnUse">
                        <image 
                          href={image}
                          x={-piece.correctPosition.x + 50}
                          y={-piece.correctPosition.y + 100}
                          width={PIECE_SIZE * 2}
                          height={PIECE_SIZE * 2}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </pattern>
                    </defs>
                    <path
                      d={getSVGPath(piece.id)}
                      fill={`url(#img-${piece.id})`}
                      stroke={piece.isPlaced ? 'none' : 'rgba(168,85,247,0.3)'}
                      strokeWidth={piece.isPlaced ? 0 : 1}
                    />
                  </svg>
                </motion.div>
              ))}
            </div>

            {completed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-8"
              >
                <div className="inline-flex items-center gap-3 px-8 py-4 rounded-xl" style={{ background: 'rgba(168,85,247,0.2)', border: '2px solid rgba(168,85,247,0.5)' }}>
                  <CheckCircle size={32} className="text-purple-400" />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white">Puzzle Complete!</p>
                    <p className="text-sm text-purple-300">Great job assembling the pieces</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
