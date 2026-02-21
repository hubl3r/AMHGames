// app/puzzle/jigsaw/page.tsx

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'

type Point = { x: number; y: number }
type Tile = {
  id: number
  gridX: number
  gridY: number
  position: Point
  group: Tile[]
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  path: Path2D
  isDragging?: boolean
}

const TILE_SIZE = 100
const TAB_SIZE = 20
const MARGIN = TILE_SIZE * 0.2

// Preloaded images
const SAMPLE_IMAGES = [
  { 
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    name: 'Mountain Landscape'
  },
  {
    url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&h=600&fit=crop',
    name: 'Tropical Waterfall'
  },
  {
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop',
    name: 'Forest Path'
  },
  {
    url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=600&fit=crop',
    name: 'Colorful Parrots'
  }
]

export default function JigsawPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Tile[] | null>(null)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [numCols, setNumCols] = useState(4)
  const [numRows, setNumRows] = useState(3)
  const [complete, setComplete] = useState(false)
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // Tab curve coordinates (from JigsawGalaxy - creates smooth rounded tabs)
  const tabCurve = [
    0, 0, 35, 15, 37, 5,
    37, 5, 40, 0, 38, -5,
    38, -5, 20, -20, 50, -20,
    50, -20, 80, -20, 62, -5,
    62, -5, 60, 0, 63, 5,
    63, 5, 65, 15, 100, 0
  ]

  // Generate jigsaw piece path with tabs/sockets
  const createPiecePath = (gridX: number, gridY: number, hasTop: boolean, hasRight: boolean, hasBottom: boolean, hasLeft: boolean, tabPattern: number[][]) => {
    const path = new Path2D()
    const scale = TILE_SIZE / 100

    // Start at top-left
    path.moveTo(0, 0)

    // Top edge
    if (hasTop && tabPattern[gridY * numCols + gridX][0] !== 0) {
      const dir = tabPattern[gridY * numCols + gridX][0]
      for (let i = 0; i < tabCurve.length; i += 6) {
        const cp1x = tabCurve[i] * scale
        const cp1y = dir * tabCurve[i + 1] * scale
        const cp2x = tabCurve[i + 2] * scale
        const cp2y = dir * tabCurve[i + 3] * scale
        const x = tabCurve[i + 4] * scale
        const y = dir * tabCurve[i + 5] * scale
        path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
      }
    } else {
      path.lineTo(TILE_SIZE, 0)
    }

    // Right edge
    if (hasRight && tabPattern[gridY * numCols + gridX][1] !== 0) {
      const dir = tabPattern[gridY * numCols + gridX][1]
      for (let i = 0; i < tabCurve.length; i += 6) {
        const cp1x = TILE_SIZE - dir * tabCurve[i + 1] * scale
        const cp1y = tabCurve[i] * scale
        const cp2x = TILE_SIZE - dir * tabCurve[i + 3] * scale
        const cp2y = tabCurve[i + 2] * scale
        const x = TILE_SIZE - dir * tabCurve[i + 5] * scale
        const y = tabCurve[i + 4] * scale
        path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
      }
    } else {
      path.lineTo(TILE_SIZE, TILE_SIZE)
    }

    // Bottom edge
    if (hasBottom && tabPattern[gridY * numCols + gridX][2] !== 0) {
      const dir = tabPattern[gridY * numCols + gridX][2]
      for (let i = 0; i < tabCurve.length; i += 6) {
        const cp1x = TILE_SIZE - tabCurve[i] * scale
        const cp1y = TILE_SIZE - dir * tabCurve[i + 1] * scale
        const cp2x = TILE_SIZE - tabCurve[i + 2] * scale
        const cp2y = TILE_SIZE - dir * tabCurve[i + 3] * scale
        const x = TILE_SIZE - tabCurve[i + 4] * scale
        const y = TILE_SIZE - dir * tabCurve[i + 5] * scale
        path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
      }
    } else {
      path.lineTo(0, TILE_SIZE)
    }

    // Left edge
    if (hasLeft && tabPattern[gridY * numCols + gridX][3] !== 0) {
      const dir = tabPattern[gridY * numCols + gridX][3]
      for (let i = 0; i < tabCurve.length; i += 6) {
        const cp1x = dir * tabCurve[i + 1] * scale
        const cp1y = TILE_SIZE - tabCurve[i] * scale
        const cp2x = dir * tabCurve[i + 3] * scale
        const cp2y = TILE_SIZE - tabCurve[i + 2] * scale
        const x = dir * tabCurve[i + 5] * scale
        const y = TILE_SIZE - tabCurve[i + 4] * scale
        path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
      }
    } else {
      path.lineTo(0, 0)
    }

    path.closePath()
    return path
  }

  // Initialize puzzle
  const initPuzzle = (img: HTMLImageElement, scatter = true) => {
    if (!canvasRef.current || !boardRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    
    // Set canvas size - larger work area
    canvas.width = 1200
    canvas.height = 800

    // Generate random tab pattern
    const tabPattern: number[][] = []
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const top = y === 0 ? 0 : -tabPattern[(y - 1) * numCols + x][2]
        const left = x === 0 ? 0 : -tabPattern[y * numCols + (x - 1)][1]
        const right = x === numCols - 1 ? 0 : Math.random() > 0.5 ? 1 : -1
        const bottom = y === numRows - 1 ? 0 : Math.random() > 0.5 ? 1 : -1
        tabPattern.push([top, right, bottom, left])
      }
    }

    // Create tiles
    const newTiles: Tile[] = []

    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const tileCanvas = document.createElement('canvas')
        const tileCtx = tileCanvas.getContext('2d')!
        tileCanvas.width = TILE_SIZE + MARGIN * 2
        tileCanvas.height = TILE_SIZE + MARGIN * 2

        // Create piece path
        const path = createPiecePath(
          x, y,
          y > 0, x < numCols - 1, y < numRows - 1, x > 0,
          tabPattern
        )

        // Draw piece with image
        tileCtx.save()
        tileCtx.translate(MARGIN, MARGIN)
        tileCtx.clip(path)
        tileCtx.drawImage(
          img,
          (x * img.width) / numCols, (y * img.height) / numRows,
          img.width / numCols, img.height / numRows,
          -MARGIN, -MARGIN,
          TILE_SIZE + MARGIN * 2, TILE_SIZE + MARGIN * 2
        )
        tileCtx.restore()

        // Draw outline
        tileCtx.save()
        tileCtx.translate(MARGIN, MARGIN)
        tileCtx.strokeStyle = 'rgba(255,255,255,0.3)'
        tileCtx.lineWidth = 1
        tileCtx.stroke(path)
        tileCtx.restore()

        // Position: either scattered or in grid on right side
        let position: Point
        if (scatter) {
          // Scatter pieces around the canvas
          position = {
            x: 400 + Math.random() * 700,
            y: 50 + Math.random() * 700
          }
        } else {
          // Arrange in grid on right side
          const gridCols = Math.ceil(Math.sqrt(numCols * numRows))
          const gridX = (x + y * numCols) % gridCols
          const gridY = Math.floor((x + y * numCols) / gridCols)
          position = {
            x: 500 + gridX * (TILE_SIZE + 20),
            y: 100 + gridY * (TILE_SIZE + 20)
          }
        }

        const tile: Tile = {
          id: y * numCols + x,
          gridX: x,
          gridY: y,
          position,
          group: [],
          canvas: tileCanvas,
          ctx: tileCtx,
          path,
        }
        tile.group = [tile]
        newTiles.push(tile)
      }
    }

    setTiles(newTiles)
    setComplete(false)
  }

  // Scatter pieces randomly
  const scatterPieces = () => {
    setTiles(prev => prev.map(tile => ({
      ...tile,
      position: {
        x: 400 + Math.random() * 700,
        y: 50 + Math.random() * 700
      }
    })))
  }

  // Load sample image
  const loadSampleImage = (url: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      initPuzzle(img)
    }
    img.src = url
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        initPuzzle(img)
      }
      img.src = URL.createObjectURL(file)
    }
  }

  // Draw all tiles on main canvas
  useEffect(() => {
    if (!canvasRef.current || tiles.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Sort tiles: selected group last (on top)
    const sortedTiles = [...tiles].sort((a, b) => {
      const aSelected = selectedGroup?.includes(a)
      const bSelected = selectedGroup?.includes(b)
      if (aSelected && !bSelected) return 1
      if (!aSelected && bSelected) return -1
      return 0
    })

    for (const tile of sortedTiles) {
      ctx.save()
      ctx.shadowColor = selectedGroup?.includes(tile) ? 'rgba(168,85,247,0.5)' : 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = selectedGroup?.includes(tile) ? 15 : 10
      ctx.shadowOffsetY = 5
      ctx.drawImage(
        tile.canvas,
        tile.position.x - MARGIN,
        tile.position.y - MARGIN
      )
      ctx.restore()
    }
  }, [tiles, selectedGroup])

  // Mouse/Touch handlers
  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return null

    let clientX: number, clientY: number
    if ('touches' in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getPointerPosition(e)
    if (!pos) return

    // Find clicked tile (check from top to bottom in render order)
    const sortedTiles = [...tiles].sort((a, b) => {
      const aSelected = selectedGroup?.includes(a)
      const bSelected = selectedGroup?.includes(b)
      if (aSelected && !bSelected) return 1
      if (!aSelected && bSelected) return -1
      return 0
    }).reverse()

    for (const tile of sortedTiles) {
      const relX = pos.x - tile.position.x + MARGIN
      const relY = pos.y - tile.position.y + MARGIN

      // Bounding box check
      if (relX >= 0 && relX <= TILE_SIZE + MARGIN * 2 && 
          relY >= 0 && relY <= TILE_SIZE + MARGIN * 2) {
        
        // Path check
        const ctx = tile.ctx
        ctx.save()
        ctx.translate(MARGIN, MARGIN)
        const hit = ctx.isPointInPath(tile.path, relX - MARGIN, relY - MARGIN)
        ctx.restore()

        if (hit) {
          setSelectedGroup(tile.group)
          setDragStart(pos)
          return
        }
      }
    }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selectedGroup || !dragStart) return
    e.preventDefault()

    const pos = getPointerPosition(e)
    if (!pos) return

    const dx = pos.x - dragStart.x
    const dy = pos.y - dragStart.y

    setTiles(prev => prev.map(tile => {
      if (selectedGroup.includes(tile)) {
        return {
          ...tile,
          position: {
            x: tile.position.x + dx,
            y: tile.position.y + dy
          }
        }
      }
      return tile
    }))

    setDragStart(pos)
  }

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!selectedGroup) return

    // Try to connect pieces
    const snapThreshold = 20
    let connected = false

    setTiles(prev => {
      const newTiles = [...prev]
      
      for (const tile of selectedGroup) {
        // Check all 4 neighbors
        const neighbors = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 }
        ]

        for (const { dx, dy } of neighbors) {
          const neighborTile = newTiles.find(
            t => t.gridX === tile.gridX + dx && t.gridY === tile.gridY + dy
          )

          if (!neighborTile || tile.group.includes(neighborTile)) continue

          const expectedX = tile.position.x + dx * TILE_SIZE
          const expectedY = tile.position.y + dy * TILE_SIZE
          const dist = Math.hypot(
            neighborTile.position.x - expectedX,
            neighborTile.position.y - expectedY
          )

          if (dist < snapThreshold) {
            // Merge groups
            const combined = [...tile.group, ...neighborTile.group]
            const newGroup = Array.from(new Set(combined))
            newGroup.forEach(t => (t.group = newGroup))
            
            // Snap to grid
            neighborTile.position.x = expectedX
            neighborTile.position.y = expectedY
            
            connected = true
          }
        }
      }

      return newTiles
    })

    // Check completion
    if (tiles[0]?.group.length === tiles.length) {
      setComplete(true)
    }

    setSelectedGroup(null)
    setDragStart(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
      
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-7xl w-full">
        
        <div className="text-center mb-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-2" style={{ 
            fontFamily: 'Cinzel, serif', 
            background: 'linear-gradient(135deg, #a855f7, #6d28d9)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            letterSpacing: '0.1em',
          }}>
            JIGSAW PUZZLE
          </h1>
          <p className="text-sm tracking-widest uppercase opacity-70 text-purple-300">{numCols}x{numRows} Pieces</p>
        </div>

        {!image ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <label className="block p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-purple-400 hover:bg-purple-500/5" style={{ borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.05)' }}>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="text-center">
                <Upload size={48} className="mx-auto mb-4 text-purple-400" />
                <p className="text-xl font-semibold mb-2 text-white">Upload Your Own Image</p>
                <p className="text-sm text-gray-400">Click to select a photo from your device</p>
              </div>
            </label>

            {/* Sample images */}
            <div>
              <p className="text-center text-sm text-purple-300 mb-3">Or try a sample image:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SAMPLE_IMAGES.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => loadSampleImage(sample.url)}
                    className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition-all"
                  >
                    <img 
                      src={sample.url} 
                      alt={sample.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-semibold">{sample.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty selector */}
            <div className="p-4 rounded-xl" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <label className="block text-sm text-purple-300 mb-2">Difficulty:</label>
              <select value={`${numCols}x${numRows}`} onChange={e => {
                const [cols, rows] = e.target.value.split('x').map(Number)
                setNumCols(cols)
                setNumRows(rows)
              }} className="w-full p-2 rounded bg-purple-900/30 border border-purple-500/50 text-white">
                <option value="3x2">Easy (6 pieces)</option>
                <option value="4x3">Medium (12 pieces)</option>
                <option value="6x4">Hard (24 pieces)</option>
                <option value="8x6">Expert (48 pieces)</option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-center gap-3 mb-4 flex-wrap">
              <button onClick={() => image && initPuzzle(image)} className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 text-sm" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: 'white' }}>
                <RotateCcw size={16} /> Reset
              </button>
              <button onClick={scatterPieces} className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 text-sm" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: 'white' }}>
                <Sparkles size={16} /> Scatter
              </button>
              <button onClick={() => setImage(null)} className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105 text-sm" style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: 'white' }}>
                <Upload size={16} /> New Image
              </button>
            </div>

            <div ref={boardRef} className="mx-auto overflow-auto rounded-xl" style={{ 
              maxWidth: '100%',
              maxHeight: '70vh',
              border: '2px solid rgba(168,85,247,0.3)',
              background: 'rgba(0,0,0,0.3)',
            }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                style={{ 
                  display: 'block',
                  cursor: selectedGroup ? 'grabbing' : 'grab',
                  touchAction: 'none'
                }}
              />
            </div>

            {complete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-6"
              >
                <div className="inline-flex items-center gap-3 px-8 py-4 rounded-xl" style={{ background: 'rgba(168,85,247,0.2)', border: '2px solid rgba(168,85,247,0.5)' }}>
                  <CheckCircle size={32} className="text-purple-400" />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-white">Puzzle Complete!</p>
                    <p className="text-sm text-purple-300">All pieces connected</p>
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
