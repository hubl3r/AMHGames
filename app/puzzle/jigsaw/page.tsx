// app/puzzle/jigsaw/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, RotateCcw, CheckCircle, Sparkles } from 'lucide-react'
import Script from 'next/script'

const SAMPLE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', name: 'Mountain' },
  { url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&h=600&fit=crop', name: 'Waterfall' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', name: 'Forest' },
  { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=600&fit=crop', name: 'Parrots' }
]

declare global {
  interface Window {
    paper: any
  }
}

export default function JigsawPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [numCols, setNumCols] = useState(4)
  const [numRows, setNumRows] = useState(3)
  const [complete, setComplete] = useState(false)
  const [paperLoaded, setPaperLoaded] = useState(false)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<any>(null)

  const initPuzzle = (img: HTMLImageElement) => {
    if (!canvasRef.current || !window.paper) return

    const paper = window.paper
    const canvas = canvasRef.current
    
    // Clear any existing puzzle
    if (gameRef.current?.scope) {
      gameRef.current.scope.project.clear()
    }

    // Setup Paper.js
    paper.setup(canvas)
    paper.view.viewSize = new paper.Size(1200, 800)
    const scope = paper.project
    
    // Create puzzle image raster
    const raster = new paper.Raster(img)
    raster.position = new paper.Point(300, 250) // Left side
    raster.visible = false
    
    // Size image to fit
    const tileWidth = 100
    const puzzleWidth = tileWidth * numCols
    const puzzleHeight = tileWidth * numRows
    raster.size = new paper.Size(puzzleWidth, puzzleHeight)
    
    // Create play area background (where completed puzzle goes)
    const playArea = new paper.Path.Rectangle({
      center: raster.position,
      size: [puzzleWidth + 20, puzzleHeight + 20],
      fillColor: 'rgba(0,0,0,0.2)',
      strokeColor: 'rgba(168,85,247,0.3)',
      strokeWidth: 2
    })
    playArea.sendToBack()

    const game = {
      scope,
      tiles: [] as any[],
      selectedTile: null as any,
      dragging: false,
      panning: false,
      lastPoint: null as any,
      tileWidth,
      numCols,
      numRows,
      raster,
      playArea,
      complete: false,
      zIndex: 0
    }

    // Tab curve coordinates (from JigsawGalaxy)
    const tabCurve = [0,0,35,15,37,5, 37,5,40,0,38,-5, 38,-5,20,-20,50,-20, 50,-20,80,-20,62,-5, 62,-5,60,0,63,5, 63,5,65,15,100,0]

    // Generate random tab pattern
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

    // Create jigsaw mask for a piece
    const createMask = (gridX: number, gridY: number) => {
      const scale = tileWidth / 100
      const pattern = tabPattern[gridY * numCols + gridX]
      const path = new paper.Path()
      
      path.moveTo([0, 0])

      // Top edge
      if (gridY > 0 && pattern[0] !== 0) {
        const dir = pattern[0]
        for (let i = 0; i < tabCurve.length; i += 6) {
          path.cubicCurveTo(
            [tabCurve[i] * scale, dir * tabCurve[i+1] * scale],
            [tabCurve[i+2] * scale, dir * tabCurve[i+3] * scale],
            [tabCurve[i+4] * scale, dir * tabCurve[i+5] * scale]
          )
        }
      } else {
        path.lineTo([tileWidth, 0])
      }

      // Right edge
      if (gridX < numCols - 1 && pattern[1] !== 0) {
        const dir = pattern[1]
        for (let i = 0; i < tabCurve.length; i += 6) {
          path.cubicCurveTo(
            [tileWidth - dir * tabCurve[i+1] * scale, tabCurve[i] * scale],
            [tileWidth - dir * tabCurve[i+3] * scale, tabCurve[i+2] * scale],
            [tileWidth - dir * tabCurve[i+5] * scale, tabCurve[i+4] * scale]
          )
        }
      } else {
        path.lineTo([tileWidth, tileWidth])
      }

      // Bottom edge
      if (gridY < numRows - 1 && pattern[2] !== 0) {
        const dir = pattern[2]
        for (let i = 0; i < tabCurve.length; i += 6) {
          path.cubicCurveTo(
            [tileWidth - tabCurve[i] * scale, tileWidth - dir * tabCurve[i+1] * scale],
            [tileWidth - tabCurve[i+2] * scale, tileWidth - dir * tabCurve[i+3] * scale],
            [tileWidth - tabCurve[i+4] * scale, tileWidth - dir * tabCurve[i+5] * scale]
          )
        }
      } else {
        path.lineTo([0, tileWidth])
      }

      // Left edge
      if (gridX > 0 && pattern[3] !== 0) {
        const dir = pattern[3]
        for (let i = 0; i < tabCurve.length; i += 6) {
          path.cubicCurveTo(
            [dir * tabCurve[i+1] * scale, tileWidth - tabCurve[i] * scale],
            [dir * tabCurve[i+3] * scale, tileWidth - tabCurve[i+2] * scale],
            [dir * tabCurve[i+5] * scale, tileWidth - tabCurve[i+4] * scale]
          )
        }
      } else {
        path.lineTo([0, 0])
      }

      path.closePath()
      return path
    }

    // Create all pieces
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const mask = createMask(x, y)
        
        // Get piece image
        const pieceRaster = raster.getSubRaster(
          new paper.Rectangle(
            x * tileWidth - 20,
            y * tileWidth - 20,
            tileWidth + 40,
            tileWidth + 40
          )
        )
        pieceRaster.position = new paper.Point(tileWidth / 2, tileWidth / 2)

        // Create outline
        const outline = mask.clone()
        outline.strokeColor = new paper.Color('rgba(255,255,255,0.3)')
        outline.strokeWidth = 1

        // Group: mask, image, outline
        const group = new paper.Group([mask, pieceRaster, outline])
        group.clipped = true
        group.gridPosition = new paper.Point(x, y)
        group.pieceGroup = [group]
        
        // Store offsets for alignment
        group.offsets = [
          mask.bounds.left,
          mask.bounds.top,
          mask.bounds.right - tileWidth,
          mask.bounds.bottom - tileWidth
        ]

        game.tiles.push(group)
      }
    }

    // Shuffle pieces to the right of the board (plenty of space)
    const shufflePerimeter = () => {
      const boardRight = raster.position.x + puzzleWidth / 2 + 100
      const boardTop = raster.position.y - puzzleHeight / 2
      
      const rows = Math.ceil(Math.sqrt(game.tiles.length))
      const cols = Math.ceil(game.tiles.length / rows)
      
      game.tiles.forEach((tile, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        
        const x = boardRight + col * (tileWidth + 30) + Math.random() * 20
        const y = boardTop + row * (tileWidth + 30) + Math.random() * 20
        
        tile.position = new paper.Point(x, y)
      })
    }

    shufflePerimeter()

    // Mouse/Touch handlers with pan and zoom
    const tool = new paper.Tool()

    tool.onMouseDown = (event: any) => {
      if (game.complete) return
      
      // Check if clicking on a piece
      const hitResult = scope.project.hitTest(event.point, {
        fill: true,
        stroke: true,
        tolerance: 10
      })

      if (hitResult?.item) {
        let tile = hitResult.item
        
        // Find the tile group
        while (tile && !tile.gridPosition) {
          tile = tile.parent
        }
        
        if (tile && tile.gridPosition) {
          // Select this piece
          game.selectedTile = tile
          game.dragging = true
          game.lastPoint = event.point
          
          // Bring entire group to front and keep it there
          game.zIndex++
          tile.pieceGroup.forEach((piece: any) => {
            piece.bringToFront()
            piece.data.zIndex = game.zIndex
          })
          
          return
        }
      }
      
      // If not clicking a piece, start panning
      game.panning = true
      game.lastPoint = event.point
    }

    tool.onMouseDrag = (event: any) => {
      if (game.dragging && game.selectedTile) {
        // Drag the piece
        const delta = event.point.subtract(game.lastPoint)
        game.selectedTile.pieceGroup.forEach((piece: any) => {
          piece.position = piece.position.add(delta)
        })
        game.lastPoint = event.point
        paper.view.draw()
        
      } else if (game.panning) {
        // Pan the view
        const delta = event.point.subtract(game.lastPoint)
        paper.view.translate(delta)
        game.lastPoint = event.point
      }
    }

    tool.onMouseUp = () => {
      if (game.dragging && game.selectedTile) {
        // Piece stays on top (already set zIndex)
        tryConnect()
        game.selectedTile = null
      }
      
      game.dragging = false
      game.panning = false
      game.lastPoint = null
    }

    // Add zoom with mouse wheel
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const mousePos = paper.view.viewToProject(new paper.Point(e.offsetX, e.offsetY))
      
      paper.view.scale(delta, mousePos)
    }, { passive: false })

    // Add pinch-to-zoom for mobile
    let lastDist = 0
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastDist = Math.sqrt(dx * dx + dy * dy)
      }
    })

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (lastDist > 0) {
          const scale = dist / lastDist
          paper.view.scale(scale)
        }
        lastDist = dist
      }
    }, { passive: false })

    // Snap and connect pieces
    const tryConnect = () => {
      if (!game.selectedTile) return

      const snapThreshold = tileWidth / 9
      const toConnect: any[] = []

      for (const tile of game.selectedTile.pieceGroup) {
        const neighbors = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 }
        ]

        for (const { dx, dy } of neighbors) {
          const neighbor = game.tiles.find((t: any) => 
            t.gridPosition.x === tile.gridPosition.x + dx &&
            t.gridPosition.y === tile.gridPosition.y + dy
          )

          if (!neighbor || tile.pieceGroup.includes(neighbor)) continue

          const expectedPos = tile.position.add([dx * tileWidth, dy * tileWidth])
          const dist = neighbor.position.getDistance(expectedPos)

          if (dist < snapThreshold && !toConnect.includes(neighbor)) {
            toConnect.push(neighbor)
          }
        }
      }

      if (toConnect.length > 0) {
        // Merge groups
        const newGroup = [...game.selectedTile.pieceGroup]
        for (const tile of toConnect) {
          newGroup.push(...tile.pieceGroup)
        }

        // Update all pieces to reference the new group
        for (const tile of newGroup) {
          tile.pieceGroup = newGroup
        }

        // Snap to grid
        gatherGroup(game.selectedTile)

        // Check completion
        if (newGroup.length === game.tiles.length) {
          setComplete(true)
          game.complete = true
        }
      }
    }

    // Align group pieces to grid
    const gatherGroup = (tile: any) => {
      const anchor = tile
      const anchorGridPos = anchor.gridPosition

      for (const piece of tile.pieceGroup) {
        if (piece === anchor) continue
        
        const offset = piece.gridPosition.subtract(anchorGridPos)
        piece.position = anchor.position.add(offset.multiply(tileWidth))
      }
    }

    gameRef.current = game
    paper.view.draw()
  }

  const scatterPieces = () => {
    if (!gameRef.current) return
    
    const game = gameRef.current
    const groups = new Map<any, any[]>()

    // Group tiles
    for (const tile of game.tiles) {
      const group = tile.pieceGroup
      if (!groups.has(group)) {
        groups.set(group, group)
      }
    }

    // Scatter each group
    groups.forEach((group) => {
      const anchor = group[0]
      const playArea = game.playArea.bounds
      
      const newX = playArea.left + Math.random() * playArea.width
      const newY = playArea.top + Math.random() * playArea.height
      const delta = new window.paper.Point(newX, newY).subtract(anchor.position)

      for (const piece of group) {
        piece.position = piece.position.add(delta)
      }
    })

    window.paper.view.draw()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        setComplete(false)
        setTimeout(() => initPuzzle(img), 100)
      }
      img.src = URL.createObjectURL(file)
    }
  }

  const loadSampleImage = (url: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImage(img)
      setComplete(false)
      setTimeout(() => initPuzzle(img), 100)
    }
    img.src = url
  }

  useEffect(() => {
    if (paperLoaded && image) {
      initPuzzle(image)
    }
  }, [paperLoaded, numCols, numRows])

  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js"
        onLoad={() => setPaperLoaded(true)}
      />
      
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
                  <Upload size={16} /> New Game
                </button>
              </div>

              <div className="mb-3 text-center text-sm text-purple-300">
                <p>💡 Drag pieces to move • Drag background to pan • Scroll/pinch to zoom</p>
              </div>

              <div className="mx-auto rounded-xl" style={{ 
                maxWidth: '100%', 
                border: '2px solid rgba(168,85,247,0.3)', 
                background: 'rgba(0,0,0,0.3)' 
              }}>
                <canvas
                  ref={canvasRef}
                  id="jigsaw-canvas"
                  style={{ display: 'block', width: '100%', height: 'auto' }}
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
    </>
  )
}
