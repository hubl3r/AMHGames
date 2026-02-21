// app/puzzle/jigsaw/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'

type Point = { x: number; y: number }
type Tile = {
  id: number
  gridX: number
  gridY: number
  x: number
  y: number
  groupId: number
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  path: Path2D
}

const TILE_SIZE = 100
const MARGIN = TILE_SIZE * 0.2

const SAMPLE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', name: 'Mountain' },
  { url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&h=600&fit=crop', name: 'Waterfall' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', name: 'Forest' },
  { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=600&fit=crop', name: 'Parrots' }
]

export default function JigsawPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [numCols, setNumCols] = useState(4)
  const [numRows, setNumRows] = useState(3)
  const [complete, setComplete] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tilesRef = useRef<Tile[]>([])
  const dragStateRef = useRef<{
    dragging: boolean
    selectedGroupId: number | null
    lastX: number
    lastY: number
  }>({ dragging: false, selectedGroupId: null, lastX: 0, lastY: 0 })
  const animFrameRef = useRef<number>()

  // Tab curve from JigsawGalaxy
  const tabCurve = [0,0,35,15,37,5, 37,5,40,0,38,-5, 38,-5,20,-20,50,-20, 50,-20,80,-20,62,-5, 62,-5,60,0,63,5, 63,5,65,15,100,0]

  const createPiecePath = (gridX: number, gridY: number, hasTop: boolean, hasRight: boolean, hasBottom: boolean, hasLeft: boolean, tabPattern: number[][]) => {
    const path = new Path2D()
    const scale = TILE_SIZE / 100
    const pattern = tabPattern[gridY * numCols + gridX]

    path.moveTo(0, 0)

    // Top
    if (hasTop && pattern[0] !== 0) {
      const dir = pattern[0]
      for (let i = 0; i < tabCurve.length; i += 6) {
        path.bezierCurveTo(
          tabCurve[i] * scale, dir * tabCurve[i+1] * scale,
          tabCurve[i+2] * scale, dir * tabCurve[i+3] * scale,
          tabCurve[i+4] * scale, dir * tabCurve[i+5] * scale
        )
      }
    } else path.lineTo(TILE_SIZE, 0)

    // Right
    if (hasRight && pattern[1] !== 0) {
      const dir = pattern[1]
      for (let i = 0; i < tabCurve.length; i += 6) {
        path.bezierCurveTo(
          TILE_SIZE - dir * tabCurve[i+1] * scale, tabCurve[i] * scale,
          TILE_SIZE - dir * tabCurve[i+3] * scale, tabCurve[i+2] * scale,
          TILE_SIZE - dir * tabCurve[i+5] * scale, tabCurve[i+4] * scale
        )
      }
    } else path.lineTo(TILE_SIZE, TILE_SIZE)

    // Bottom
    if (hasBottom && pattern[2] !== 0) {
      const dir = pattern[2]
      for (let i = 0; i < tabCurve.length; i += 6) {
        path.bezierCurveTo(
          TILE_SIZE - tabCurve[i] * scale, TILE_SIZE - dir * tabCurve[i+1] * scale,
          TILE_SIZE - tabCurve[i+2] * scale, TILE_SIZE - dir * tabCurve[i+3] * scale,
          TILE_SIZE - tabCurve[i+4] * scale, TILE_SIZE - dir * tabCurve[i+5] * scale
        )
      }
    } else path.lineTo(0, TILE_SIZE)

    // Left
    if (hasLeft && pattern[3] !== 0) {
      const dir = pattern[3]
      for (let i = 0; i < tabCurve.length; i += 6) {
        path.bezierCurveTo(
          dir * tabCurve[i+1] * scale, TILE_SIZE - tabCurve[i] * scale,
          dir * tabCurve[i+3] * scale, TILE_SIZE - tabCurve[i+2] * scale,
          dir * tabCurve[i+5] * scale, TILE_SIZE - tabCurve[i+4] * scale
        )
      }
    } else path.lineTo(0, 0)

    path.closePath()
    return path
  }

  const initPuzzle = (img: HTMLImageElement) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.width = 1200
    canvas.height = 800

    // Generate tab pattern
    const tabPattern: number[][] = []
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const top = y === 0 ? 0 : -tabPattern[(y-1) * numCols + x][2]
        const left = x === 0 ? 0 : -tabPattern[y * numCols + (x-1)][1]
        const right = x === numCols - 1 ? 0 : Math.random() > 0.5 ? 1 : -1
        const bottom = y === numRows - 1 ? 0 : Math.random() > 0.5 ? 1 : -1
        tabPattern.push([top, right, bottom, left])
      }
    }

    // Create tiles
    const tiles: Tile[] = []
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const tileCanvas = document.createElement('canvas')
        const tileCtx = tileCanvas.getContext('2d')!
        tileCanvas.width = TILE_SIZE + MARGIN * 2
        tileCanvas.height = TILE_SIZE + MARGIN * 2

        const path = createPiecePath(x, y, y>0, x<numCols-1, y<numRows-1, x>0, tabPattern)

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

        tileCtx.save()
        tileCtx.translate(MARGIN, MARGIN)
        tileCtx.strokeStyle = 'rgba(255,255,255,0.3)'
        tileCtx.lineWidth = 1
        tileCtx.stroke(path)
        tileCtx.restore()

        const tile: Tile = {
          id: y * numCols + x,
          gridX: x,
          gridY: y,
          x: 400 + Math.random() * 700,
          y: 50 + Math.random() * 700,
          groupId: y * numCols + x,
          canvas: tileCanvas,
          ctx: tileCtx,
          path
        }
        tiles.push(tile)
      }
    }

    tilesRef.current = tiles
    setComplete(false)
    render()
  }

  const render = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const dragState = dragStateRef.current
    const tiles = tilesRef.current

    // Sort: selected group on top
    const sorted = [...tiles].sort((a, b) => {
      if (a.groupId === dragState.selectedGroupId && b.groupId !== dragState.selectedGroupId) return 1
      if (b.groupId === dragState.selectedGroupId && a.groupId !== dragState.selectedGroupId) return -1
      return 0
    })

    for (const tile of sorted) {
      ctx.save()
      ctx.shadowColor = tile.groupId === dragState.selectedGroupId ? 'rgba(168,85,247,0.6)' : 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = tile.groupId === dragState.selectedGroupId ? 20 : 10
      ctx.shadowOffsetY = 5
      ctx.drawImage(tile.canvas, tile.x - MARGIN, tile.y - MARGIN)
      ctx.restore()
    }
  }

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = clientX - rect.left
    const y = clientY - rect.top

    const tiles = tilesRef.current
    const dragState = dragStateRef.current

    // Find clicked tile (reverse for z-order)
    for (let i = tiles.length - 1; i >= 0; i--) {
      const tile = tiles[i]
      const relX = x - tile.x + MARGIN
      const relY = y - tile.y + MARGIN

      if (relX >= 0 && relX <= TILE_SIZE + MARGIN * 2 && relY >= 0 && relY <= TILE_SIZE + MARGIN * 2) {
        tile.ctx.save()
        tile.ctx.translate(MARGIN, MARGIN)
        const hit = tile.ctx.isPointInPath(tile.path, relX - MARGIN, relY - MARGIN)
        tile.ctx.restore()

        if (hit) {
          dragState.dragging = true
          dragState.selectedGroupId = tile.groupId
          dragState.lastX = x
          dragState.lastY = y
          render()
          return
        }
      }
    }
  }

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const dragState = dragStateRef.current
    if (!dragState.dragging) return

    e.preventDefault()
    e.stopPropagation()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY
    
    if (clientX === undefined || clientY === undefined) return

    const x = clientX - rect.left
    const y = clientY - rect.top

    const dx = x - dragState.lastX
    const dy = y - dragState.lastY

    // Move all tiles in selected group
    const tiles = tilesRef.current
    for (const tile of tiles) {
      if (tile.groupId === dragState.selectedGroupId) {
        tile.x += dx
        tile.y += dy
      }
    }

    dragState.lastX = x
    dragState.lastY = y
    
    // Render smoothly with RAF
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(() => {
        render()
        animFrameRef.current = undefined
      })
    }
  }

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    const dragState = dragStateRef.current
    if (!dragState.dragging) return

    e.preventDefault()
    e.stopPropagation()

    dragState.dragging = false
    const selectedGroupId = dragState.selectedGroupId
    dragState.selectedGroupId = null

    if (selectedGroupId === null) return

    // Try to snap - more forgiving threshold
    const tiles = tilesRef.current
    const snapThreshold = 30
    const selectedTiles = tiles.filter(t => t.groupId === selectedGroupId)

    for (const tile of selectedTiles) {
      const neighbors = [
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 }
      ]

      for (const { dx, dy } of neighbors) {
        const neighbor = tiles.find(t => t.gridX === tile.gridX + dx && t.gridY === tile.gridY + dy)
        if (!neighbor || neighbor.groupId === tile.groupId) continue

        const expectedX = tile.x + dx * TILE_SIZE
        const expectedY = tile.y + dy * TILE_SIZE
        const dist = Math.hypot(neighbor.x - expectedX, neighbor.y - expectedY)

        if (dist < snapThreshold) {
          // Snap neighbor to exact position relative to tile
          neighbor.x = expectedX
          neighbor.y = expectedY

          // Merge groups - update all tiles from neighbor's old group
          const oldGroupId = neighbor.groupId
          const newGroupId = tile.groupId

          for (const t of tiles) {
            if (t.groupId === oldGroupId) {
              t.groupId = newGroupId
              // Also adjust position to maintain relative positioning
              const relGridX = t.gridX - neighbor.gridX
              const relGridY = t.gridY - neighbor.gridY
              t.x = neighbor.x + relGridX * TILE_SIZE
              t.y = neighbor.y + relGridY * TILE_SIZE
            }
          }
        }
      }
    }

    // Check completion
    if (tiles.every(t => t.groupId === tiles[0].groupId)) {
      setComplete(true)
    }

    render()
  }

  const scatterPieces = () => {
    for (const tile of tilesRef.current) {
      tile.x = 400 + Math.random() * 700
      tile.y = 50 + Math.random() * 700
    }
    render()
  }

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

  const loadSampleImage = (url: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      initPuzzle(img)
    }
    img.src = url
  }

  // Render on demand
  useEffect(() => {
    render()
  }, [complete])

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
      
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      </div>

      <div className="relative z-10 max-w-7xl w-full">
        
        <div className="text-center mb-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif', background: 'linear-gradient(135deg, #a855f7, #6d28d9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.1em' }}>
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
                <p className="text-sm text-gray-400">Click to select a photo</p>
              </div>
            </label>

            <div>
              <p className="text-center text-sm text-purple-300 mb-3">Or try a sample:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SAMPLE_IMAGES.map((sample, i) => (
                  <button key={i} onClick={() => loadSampleImage(sample.url)} className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition-all">
                    <img src={sample.url} alt={sample.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-semibold">{sample.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

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

            <div className="mx-auto overflow-auto rounded-xl relative" style={{ maxWidth: '100%', maxHeight: '70vh', border: '2px solid rgba(168,85,247,0.3)', background: 'rgba(0,0,0,0.3)', WebkitOverflowScrolling: 'touch' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                onTouchCancel={handlePointerUp}
                style={{ 
                  display: 'block', 
                  cursor: dragStateRef.current?.dragging ? 'grabbing' : 'grab', 
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              />
            </div>

            {complete && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-6">
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
