// app/puzzle/jigsaw/page.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, RotateCcw, CheckCircle } from 'lucide-react'
import Image from 'next/image'

type PiecePosition = { x: number; y: number }
type Piece = {
  id: number
  position: PiecePosition
  correctPosition: PiecePosition
  isPlaced: boolean
}

const PIECE_SIZE = 200 // Base size for each piece
const SNAP_THRESHOLD = 40 // Pixels to snap

export default function JigsawPage() {
  const [image, setImage] = useState<string | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [completed, setCompleted] = useState(false)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize puzzle when image loads
  useEffect(() => {
    if (!image) return
    initializePuzzle()
  }, [image])

  const initializePuzzle = () => {
    // Define correct positions (2x2 grid)
    const correctPositions = [
      { x: 0, y: 0 },           // Top-left
      { x: PIECE_SIZE, y: 0 },  // Top-right
      { x: 0, y: PIECE_SIZE },  // Bottom-left
      { x: PIECE_SIZE, y: PIECE_SIZE }, // Bottom-right
    ]

    // Randomize starting positions
    const newPieces: Piece[] = correctPositions.map((correct, i) => ({
      id: i,
      position: {
        x: Math.random() * 400 + 450, // Scatter to the right
        y: Math.random() * 300 + 50,
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
      reader.onload = () => setImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDragEnd = (id: number, event: any, info: any) => {
    setPieces(prev => {
      const updated = prev.map(piece => {
        if (piece.id !== id) return piece

        const newX = piece.position.x + info.offset.x
        const newY = piece.position.y + info.offset.y

        // Check if close to correct position
        const dx = Math.abs(newX - piece.correctPosition.x)
        const dy = Math.abs(newY - piece.correctPosition.y)

        if (dx < SNAP_THRESHOLD && dy < SNAP_THRESHOLD) {
          // Snap to correct position
          return {
            ...piece,
            position: piece.correctPosition,
            isPlaced: true,
          }
        }

        return { ...piece, position: { x: newX, y: newY } }
      })

      // Check if puzzle is complete
      if (updated.every(p => p.isPlaced)) {
        setCompleted(true)
      }

      return updated
    })
    setDraggingId(null)
  }

  // Clip paths for each piece (extracted from the template)
  const clipPaths = [
    // Top-left: has tab on right, tab on bottom
    `polygon(
      0% 0%, 100% 0%, 100% 45%, 
      110% 45%, 110% 55%, 100% 55%,
      100% 100%, 45% 100%,
      45% 110%, 55% 110%, 55% 100%,
      0% 100%, 0% 0%
    )`,
    // Top-right: has socket on left, tab on bottom
    `polygon(
      0% 0%, 100% 0%, 100% 100%,
      55% 100%, 55% 110%, 45% 110%,
      45% 100%, 0% 100%, 0% 55%,
      -10% 55%, -10% 45%, 0% 45%, 0% 0%
    )`,
    // Bottom-left: has tab on right, socket on top
    `polygon(
      0% 0%, 45% 0%, 45% -10%,
      55% -10%, 55% 0%, 100% 0%,
      100% 45%, 110% 45%, 110% 55%,
      100% 55%, 100% 100%, 0% 100%, 0% 0%
    )`,
    // Bottom-right: has socket on left, socket on top
    `polygon(
      0% 0%, 55% 0%, 55% -10%,
      45% -10%, 45% 0%, 100% 0%,
      100% 100%, 0% 100%, 0% 55%,
      -10% 55%, -10% 45%, 0% 45%, 0% 0%
    )`,
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
      
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-6xl w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold mb-2" style={{ 
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
          /* Upload Screen */
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
          /* Puzzle Game */
          <div>
            {/* Controls */}
            <div className="flex justify-center gap-4 mb-6">
              <button onClick={initializePuzzle} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: 'white' }}>
                <RotateCcw size={18} /> Shuffle
              </button>
              <button onClick={() => setImage(null)} className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: 'white' }}>
                <Upload size={18} /> New Image
              </button>
            </div>

            {/* Puzzle Area */}
            <div ref={containerRef} className="relative mx-auto" style={{ width: PIECE_SIZE * 2, height: PIECE_SIZE * 2 + 100 }}>
              
              {/* Board outline (shows where pieces go) */}
              <div className="absolute top-0 left-0 rounded-xl" style={{ 
                width: PIECE_SIZE * 2, 
                height: PIECE_SIZE * 2,
                border: '2px dashed rgba(168,85,247,0.3)',
                background: 'rgba(168,85,247,0.05)',
              }} />

              {/* Puzzle Pieces */}
              {pieces.map((piece, index) => (
                <motion.div
                  key={piece.id}
                  drag={!piece.isPlaced}
                  dragMomentum={false}
                  onDragStart={() => setDraggingId(piece.id)}
                  onDragEnd={(e, info) => handleDragEnd(piece.id, e, info)}
                  animate={{ 
                    x: piece.position.x, 
                    y: piece.position.y,
                    scale: draggingId === piece.id ? 1.05 : 1,
                    zIndex: draggingId === piece.id ? 50 : piece.isPlaced ? 10 : 20,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute cursor-move"
                  style={{
                    width: PIECE_SIZE,
                    height: PIECE_SIZE,
                    cursor: piece.isPlaced ? 'default' : 'grab',
                  }}
                >
                  <div className="relative w-full h-full" style={{
                    clipPath: clipPaths[index],
                    filter: piece.isPlaced ? 'none' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                  }}>
                    <div 
                      className="absolute"
                      style={{
                        width: PIECE_SIZE * 2,
                        height: PIECE_SIZE * 2,
                        backgroundImage: `url(${image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        // Offset background to show correct part of image
                        left: -piece.correctPosition.x,
                        top: -piece.correctPosition.y,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Completion Message */}
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
