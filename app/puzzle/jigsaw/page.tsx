'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, RotateCcw, CheckCircle, Sparkles, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import Script from 'next/script'

const SAMPLE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', name: 'Mountain' },
  { url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&h=600&fit=crop', name: 'Waterfall' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', name: 'Forest' },
  { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=600&fit=crop', name: 'Parrots' }
]

declare global {
  interface Window { paper: any }
}

export default function JigsawPage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [numCols, setNumCols] = useState(4)
  const [numRows, setNumRows] = useState(3)
  const [complete, setComplete] = useState(false)
  const [paperLoaded, setPaperLoaded] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  // Track old wheel listener so we can remove it on re-init
  const wheelCleanupRef = useRef<(() => void) | null>(null)
  // Track old touch listener so we can remove it on re-init
  const touchCleanupRef = useRef<(() => void) | null>(null)

  const initPuzzle = useCallback((img: HTMLImageElement) => {
    if (!canvasRef.current || !window.paper) return

    const paper = window.paper
    const canvas = canvasRef.current

    // --- FIX: properly clear previous puzzle ---
    // Remove old event listeners before re-setup
    if (wheelCleanupRef.current) { wheelCleanupRef.current(); wheelCleanupRef.current = null }
    if (touchCleanupRef.current) { touchCleanupRef.current(); touchCleanupRef.current = null }

    // paper.setup re-creates the project each call, so calling it is sufficient
    paper.setup(canvas)

    // --- VIRTUAL TABLE: large canvas so pieces have room to roam ---
    // The logical world is 3000x3000. The canvas element fills the screen.
    const WORLD_W = 3000
    const WORLD_H = 3000
    paper.view.viewSize = new paper.Size(WORLD_W, WORLD_H)

    const scope = paper.project  // correct reference — no scope.project needed

    // --- TILE SIZE: auto-size so puzzle fits nicely in ~40% of world ---
    const tileWidth = 100
    const puzzleWidth  = tileWidth * numCols
    const puzzleHeight = tileWidth * numRows

    // Assembly area centered in world
    const boardCenter = new paper.Point(WORLD_W / 2, WORLD_H / 2)

    // Draw the image raster (hidden, used for sub-rasters)
    const raster = new paper.Raster(img)
    raster.position = boardCenter
    raster.size = new paper.Size(puzzleWidth, puzzleHeight)
    raster.visible = false

    // Assembly zone outline
    const assemblyZone = new paper.Path.Rectangle({
      center: boardCenter,
      size: [puzzleWidth + 24, puzzleHeight + 24],
      fillColor: new paper.Color(0, 0, 0, 0.15),
      strokeColor: new paper.Color(0.66, 0.33, 0.97, 0.5),
      strokeWidth: 2,
      dashArray: [8, 4]
    })
    assemblyZone.guide = true
    assemblyZone.sendToBack()

    // Label for assembly zone
    const assemblyLabel = new paper.PointText({
      point: new paper.Point(boardCenter.x, boardCenter.y - puzzleHeight / 2 - 18),
      content: 'Assembly Area',
      fillColor: new paper.Color(0.66, 0.33, 0.97, 0.4),
      fontFamily: 'monospace',
      fontSize: 14,
      justification: 'center'
    })
    assemblyLabel.guide = true

    const game: any = {
      tiles: [] as any[],
      selectedTile: null,
      dragging: false,
      panning: false,
      lastPoint: null,
      tileWidth,
      numCols,
      numRows,
      raster,
      complete: false,
      zIndex: 0
    }

    // ---- TAB CURVE (unchanged) ----
    const tabCurve = [0,0,35,15,37,5,37,5,40,0,38,-5,38,-5,20,-20,50,-20,50,-20,80,-20,62,-5,62,-5,60,0,63,5,63,5,65,15,100,0]

    // ---- TAB PATTERN (unchanged) ----
    const tabPattern: number[][] = []
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const top    = y === 0          ? 0 : -tabPattern[(y-1) * numCols + x][2]
        const left   = x === 0          ? 0 : -tabPattern[y * numCols + (x-1)][1]
        const right  = x === numCols-1  ? 0 : Math.random() > 0.5 ? 1 : -1
        const bottom = y === numRows-1  ? 0 : Math.random() > 0.5 ? 1 : -1
        tabPattern.push([top, right, bottom, left])
      }
    }

    // ---- CREATE MASK (unchanged logic) ----
    const createMask = (gridX: number, gridY: number) => {
      const scale = tileWidth / 100
      const pattern = tabPattern[gridY * numCols + gridX]
      const path = new paper.Path()
      path.moveTo([0, 0])

      if (gridY > 0 && pattern[0] !== 0) {
        const dir = pattern[0]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tabCurve[i]*scale, dir*tabCurve[i+1]*scale],[tabCurve[i+2]*scale, dir*tabCurve[i+3]*scale],[tabCurve[i+4]*scale, dir*tabCurve[i+5]*scale])
      } else { path.lineTo([tileWidth, 0]) }

      if (gridX < numCols-1 && pattern[1] !== 0) {
        const dir = pattern[1]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tileWidth - dir*tabCurve[i+1]*scale, tabCurve[i]*scale],[tileWidth - dir*tabCurve[i+3]*scale, tabCurve[i+2]*scale],[tileWidth - dir*tabCurve[i+5]*scale, tabCurve[i+4]*scale])
      } else { path.lineTo([tileWidth, tileWidth]) }

      if (gridY < numRows-1 && pattern[2] !== 0) {
        const dir = pattern[2]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tileWidth - tabCurve[i]*scale, tileWidth - dir*tabCurve[i+1]*scale],[tileWidth - tabCurve[i+2]*scale, tileWidth - dir*tabCurve[i+3]*scale],[tileWidth - tabCurve[i+4]*scale, tileWidth - dir*tabCurve[i+5]*scale])
      } else { path.lineTo([0, tileWidth]) }

      if (gridX > 0 && pattern[3] !== 0) {
        const dir = pattern[3]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([dir*tabCurve[i+1]*scale, tileWidth - tabCurve[i]*scale],[dir*tabCurve[i+3]*scale, tileWidth - tabCurve[i+2]*scale],[dir*tabCurve[i+5]*scale, tileWidth - tabCurve[i+4]*scale])
      } else { path.lineTo([0, 0]) }

      path.closePath()
      path.fillColor = new paper.Color(0, 0, 0, 0.01)

      path.offsets = [
        0 - path.bounds.left,
        0 - path.bounds.top,
        path.bounds.right - tileWidth,
        path.bounds.bottom - tileWidth
      ]
      return path
    }

    // ---- CREATE PIECES (unchanged logic) ----
    for (let y = 0; y < numRows; y++) {
      for (let x = 0; x < numCols; x++) {
        const mask = createMask(x, y)
        const margin = 20
        const pieceRaster = raster.getSubRaster(
          new paper.Rectangle(x * tileWidth - margin, y * tileWidth - margin, tileWidth + margin*2, tileWidth + margin*2)
        )
        pieceRaster.position = new paper.Point(tileWidth / 2, tileWidth / 2)

        const outline = mask.clone()
        outline.strokeColor = new paper.Color('rgba(255,255,255,0.3)')
        outline.strokeWidth = 1
        outline.fillColor = null

        const group = new paper.Group([mask, pieceRaster, outline])
        group.clipped = true
        group.gridPosition = new paper.Point(x, y)
        group.pieceGroup = [group]
        group.offsets = mask.offsets

        game.tiles.push(group)
      }
    }

    // ---- HELPERS (unchanged) ----
    const getTileGridCenter = (tile: any) => {
      const o = tile.offsets
      return tile.position.add(new paper.Point((o[0] - o[2]) / 2, (o[1] - o[3]) / 2))
    }

    const setTileGridCenter = (tile: any, targetCenter: any) => {
      const currentCenter = getTileGridCenter(tile)
      tile.position = targetCenter.add(tile.position).subtract(currentCenter)
    }

    const setTileNatural = (tile: any) => {
      const boardOrigin = boardCenter.subtract(new paper.Point(puzzleWidth / 2, puzzleHeight / 2))
      const naturalCenter = tile.gridPosition.add(new paper.Point(0.5, 0.5)).multiply(tileWidth).add(boardOrigin)
      setTileGridCenter(tile, naturalCenter)
    }

    // Place at natural positions first
    game.tiles.forEach((tile: any) => setTileNatural(tile))

    // ---- SCATTER: randomly spread pieces across the whole virtual table ----
    // but keep the assembly zone clear
    const shufflePieces = () => {
      const margin = tileWidth * 1.5
      const halfPW = puzzleWidth / 2 + margin
      const halfPH = puzzleHeight / 2 + margin

      // Shuffle array for random placement order
      const shuffled = [...game.tiles].sort(() => Math.random() - 0.5)

      shuffled.forEach((tile: any) => {
        let tx: number, ty: number
        let attempts = 0
        do {
          // Random point anywhere on the virtual table with padding
          tx = margin + Math.random() * (WORLD_W - margin * 2)
          ty = margin + Math.random() * (WORLD_H - margin * 2)
          attempts++
          // avoid the central assembly zone
        } while (
          attempts < 30 &&
          Math.abs(tx - boardCenter.x) < halfPW &&
          Math.abs(ty - boardCenter.y) < halfPH
        )
        setTileGridCenter(tile, new paper.Point(tx, ty))
      })
    }
    shufflePieces()

    // ---- GATHER GROUP (unchanged) ----
    const gatherGroup = (anchor: any) => {
      const anchorCenter = getTileGridCenter(anchor)
      for (const piece of anchor.pieceGroup) {
        if (piece === anchor) continue
        const gridOffset = piece.gridPosition.subtract(anchor.gridPosition).multiply(tileWidth)
        setTileGridCenter(piece, anchorCenter.add(gridOffset))
      }
      paper.view.draw()
    }

    // ---- SCATTER button: re-scatter current pieces (FIX: proper group dedup) ----
    game.scatter = () => {
      // Deduplicate by pieceGroup array identity using a Set on a sentinel object
      const seen = new Set<any[]>()
      game.tiles.forEach((t: any) => seen.add(t.pieceGroup))

      const margin = tileWidth * 1.5
      const halfPW = puzzleWidth / 2 + margin
      const halfPH = puzzleHeight / 2 + margin

      seen.forEach((group: any[]) => {
        const anchor = group[0]
        let tx: number, ty: number
        let attempts = 0
        do {
          tx = margin + Math.random() * (WORLD_W - margin * 2)
          ty = margin + Math.random() * (WORLD_H - margin * 2)
          attempts++
        } while (
          attempts < 30 &&
          Math.abs(tx - boardCenter.x) < halfPW &&
          Math.abs(ty - boardCenter.y) < halfPH
        )

        const anchorCenter = getTileGridCenter(anchor)
        const delta = new paper.Point(tx, ty).subtract(anchorCenter)
        group.forEach((piece: any) => {
          piece.position = piece.position.add(delta)
        })
      })
      paper.view.draw()
    }

    // ---- TRY CONNECT (unchanged logic) ----
    const tryConnect = () => {
      if (!game.selectedTile) return
      const snapThreshold = tileWidth / 9
      const toConnect: any[] = []

      for (const tile of game.selectedTile.pieceGroup) {
        const tileCenter = getTileGridCenter(tile)
        for (const { dx, dy } of [{ dx:1,dy:0 },{ dx:-1,dy:0 },{ dx:0,dy:1 },{ dx:0,dy:-1 }]) {
          const neighbor = game.tiles.find((t: any) =>
            t.gridPosition.x === tile.gridPosition.x + dx &&
            t.gridPosition.y === tile.gridPosition.y + dy
          )
          if (!neighbor || tile.pieceGroup.includes(neighbor)) continue
          const expectedCenter = tileCenter.add(new paper.Point(dx * tileWidth, dy * tileWidth))
          const neighborCenter = getTileGridCenter(neighbor)
          const delta = expectedCenter.subtract(neighborCenter)
          const dist = Math.abs(delta.x) + Math.abs(delta.y)
          if (dist < snapThreshold && !toConnect.includes(neighbor)) {
            toConnect.push(neighbor)
          }
        }
      }

      if (toConnect.length > 0) {
        const newGroup = [...game.selectedTile.pieceGroup]
        toConnect.forEach(t => newGroup.push(...t.pieceGroup))
        const uniqueGroup = Array.from(new Set(newGroup))
        uniqueGroup.forEach((p: any) => (p.pieceGroup = uniqueGroup))
        gatherGroup(game.selectedTile)
        if (uniqueGroup.length === game.tiles.length) {
          setComplete(true)
          game.complete = true
        }
      }
    }

    // ---- MOUSE / POINTER EVENTS (unchanged logic) ----
    const tool = new paper.Tool()

    tool.onMouseDown = (event: any) => {
      if (game.complete) return
      const hitResult = scope.hitTest(event.point, { fill: true, tolerance: 15 })
      if (hitResult?.item) {
        let tile = hitResult.item
        while (tile && !tile.gridPosition && tile.parent) tile = tile.parent
        if (tile?.gridPosition) {
          game.selectedTile = tile
          game.dragging = true
          game.lastPoint = event.point
          game.zIndex++
          tile.pieceGroup.forEach((p: any) => { p.bringToFront(); p.data.zIndex = game.zIndex })
          return
        }
      }
      game.panning = true
      game.lastPoint = event.point
    }

    tool.onMouseDrag = (event: any) => {
      if (game.dragging && game.selectedTile) {
        const delta = event.point.subtract(game.lastPoint)
        game.selectedTile.pieceGroup.forEach((piece: any) => {
          piece.position = piece.position.add(delta)
        })
        game.lastPoint = event.point
        paper.view.draw()
      } else if (game.panning) {
        const delta = event.point.subtract(game.lastPoint)
        paper.view.translate(delta)
        game.lastPoint = event.point
      }
    }

    tool.onMouseUp = () => {
      if (game.dragging && game.selectedTile) { tryConnect() }
      game.selectedTile = null
      game.dragging = false
      game.panning = false
      game.lastPoint = null
    }

    // ---- WHEEL ZOOM (zoom toward cursor) ----
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
      // Zoom toward the mouse position
      const viewPos = paper.view.projectToView(paper.view.center)
      const mousePoint = new paper.Point(e.offsetX, e.offsetY)
      const worldBefore = paper.view.viewToProject(mousePoint)
      paper.view.scale(scaleFactor, worldBefore)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // ---- TOUCH EVENTS for mobile ----
    let activeTouches: Touch[] = []
    let lastPinchDist = 0
    let lastTouchPoint: any = null
    let touchDraggingTile: any = null
    let touchPanning = false

    const getTouchPoint = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const px = (touch.clientX - rect.left) * scaleX
      const py = (touch.clientY - rect.top)  * scaleY
      return paper.view.viewToProject(new paper.Point(px, py))
    }

    const getTouchViewPoint = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return new paper.Point((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY)
    }

    const pinchDist = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX
      const dy = t1.clientY - t2.clientY
      return Math.sqrt(dx*dx + dy*dy)
    }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      activeTouches = Array.from(e.touches)

      if (activeTouches.length === 1) {
        const pt = getTouchPoint(activeTouches[0])
        const hitResult = scope.hitTest(pt, { fill: true, tolerance: 20 })
        if (hitResult?.item) {
          let tile = hitResult.item
          while (tile && !tile.gridPosition && tile.parent) tile = tile.parent
          if (tile?.gridPosition) {
            touchDraggingTile = tile
            game.zIndex++
            tile.pieceGroup.forEach((p: any) => { p.bringToFront(); p.data.zIndex = game.zIndex })
            lastTouchPoint = pt
            return
          }
        }
        touchPanning = true
        lastTouchPoint = pt
      } else if (activeTouches.length === 2) {
        // Cancel any tile drag when second finger appears
        if (touchDraggingTile) {
          tryConnectTile(touchDraggingTile)
          touchDraggingTile = null
        }
        touchPanning = false
        lastPinchDist = pinchDist(activeTouches[0], activeTouches[1])
        // Midpoint in view coords for zoom anchor
        const mx = (activeTouches[0].clientX + activeTouches[1].clientX) / 2
        const my = (activeTouches[0].clientY + activeTouches[1].clientY) / 2
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        lastTouchPoint = new paper.Point((mx - rect.left) * scaleX, (my - rect.top) * scaleY)
      }
    }

    const tryConnectTile = (tile: any) => {
      game.selectedTile = tile
      tryConnect()
      game.selectedTile = null
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      activeTouches = Array.from(e.touches)

      if (activeTouches.length === 1) {
        const pt = getTouchPoint(activeTouches[0])
        if (touchDraggingTile && lastTouchPoint) {
          const delta = pt.subtract(lastTouchPoint)
          touchDraggingTile.pieceGroup.forEach((piece: any) => {
            piece.position = piece.position.add(delta)
          })
          paper.view.draw()
        } else if (touchPanning && lastTouchPoint) {
          const delta = pt.subtract(lastTouchPoint)
          paper.view.translate(delta)
        }
        lastTouchPoint = pt

      } else if (activeTouches.length === 2) {
        const dist = pinchDist(activeTouches[0], activeTouches[1])
        if (lastPinchDist > 0) {
          const scaleFactor = dist / lastPinchDist
          // Pinch anchor = midpoint in world coords
          const mx = (activeTouches[0].clientX + activeTouches[1].clientX) / 2
          const my = (activeTouches[0].clientY + activeTouches[1].clientY) / 2
          const rect = canvas.getBoundingClientRect()
          const sx = canvas.width / rect.width
          const sy = canvas.height / rect.height
          const midView = new paper.Point((mx - rect.left) * sx, (my - rect.top) * sy)
          const midWorld = paper.view.viewToProject(midView)
          paper.view.scale(scaleFactor, midWorld)

          // Pan with pinch midpoint movement
          if (lastTouchPoint) {
            const prevMidWorld = paper.view.viewToProject(lastTouchPoint)
            // recalc after scale
            const newMidWorld = paper.view.viewToProject(midView)
            // translate so pinch center stays fixed
          }
          lastTouchPoint = midView
        }
        lastPinchDist = dist
        paper.view.draw()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      activeTouches = Array.from(e.touches)

      if (activeTouches.length < 2) { lastPinchDist = 0 }

      if (activeTouches.length === 0) {
        if (touchDraggingTile) { tryConnectTile(touchDraggingTile) }
        touchDraggingTile = null
        touchPanning = false
        lastTouchPoint = null
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd, { passive: false })
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })

    // Store cleanup fns
    wheelCleanupRef.current = () => canvas.removeEventListener('wheel', onWheel)
    touchCleanupRef.current = () => {
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }

    gameRef.current = game

    // ---- Initial view: fit the assembly zone on screen ----
    // Zoom so assembly zone fills about 60% of the visible canvas area
    const canvasW = canvas.clientWidth  || canvas.width
    const canvasH = canvas.clientHeight || canvas.height
    const fitScale = Math.min(canvasW / (puzzleWidth * 2.2), canvasH / (puzzleHeight * 2.2))
    paper.view.zoom = fitScale
    paper.view.center = boardCenter

    paper.view.draw()
  }, [numCols, numRows])

  // ---- Zoom helpers exposed to UI buttons ----
  const zoomBy = (factor: number) => {
    if (!window.paper) return
    window.paper.view.scale(factor, window.paper.view.center)
  }

  const resetView = () => {
    if (!window.paper || !gameRef.current) return
    const paper = window.paper
    const { tileWidth, numCols, numRows } = gameRef.current
    const puzzleWidth  = tileWidth * numCols
    const puzzleHeight = tileWidth * numRows
    const boardCenter = new paper.Point(1500, 1500)
    const canvasW = canvasRef.current?.clientWidth  || 400
    const canvasH = canvasRef.current?.clientHeight || 600
    const fitScale = Math.min(canvasW / (puzzleWidth * 2.2), canvasH / (puzzleHeight * 2.2))
    paper.view.zoom   = fitScale
    paper.view.center = boardCenter
  }

  const scatterPieces = () => { if (gameRef.current?.scatter) gameRef.current.scatter() }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const img = new Image()
      img.onload = () => { setImage(img); setComplete(false); setTimeout(() => initPuzzle(img), 100) }
      img.src = URL.createObjectURL(file)
    }
  }

  const loadSampleImage = (url: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { setImage(img); setComplete(false); setTimeout(() => initPuzzle(img), 100) }
    img.src = url
  }

  useEffect(() => {
    if (paperLoaded && image) initPuzzle(image)
  }, [paperLoaded, numCols, numRows])

  // ---- RENDER ----
  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js"
        onLoad={() => setPaperLoaded(true)}
      />

      <div
        className="fixed inset-0 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, #6d28d9, transparent)' }} />
        </div>

        {!image ? (
          /* ---- SETUP SCREEN ---- */
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="max-w-2xl w-full space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-5xl md:text-6xl font-bold mb-2"
                  style={{ fontFamily: 'Cinzel, serif', background: 'linear-gradient(135deg, #a855f7, #6d28d9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.1em' }}>
                  JIGSAW
                </h1>
                <p className="text-sm tracking-widest uppercase opacity-60 text-purple-300">Virtual Table Puzzle</p>
              </div>

              <label className="block p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-purple-400"
                style={{ borderColor: 'rgba(168,85,247,0.3)', background: 'rgba(168,85,247,0.05)' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="text-center">
                  <Upload size={40} className="mx-auto mb-3 text-purple-400" />
                  <p className="text-lg font-semibold text-white">Upload Your Image</p>
                  <p className="text-sm text-gray-400 mt-1">Tap to choose a photo</p>
                </div>
              </label>

              <div>
                <p className="text-center text-sm text-purple-300 mb-3">Or choose a sample:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SAMPLE_IMAGES.map((s, i) => (
                    <button key={i} onClick={() => loadSampleImage(s.url)}
                      className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-400 transition-all">
                      <img src={s.url} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-semibold">{s.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <label className="block text-sm text-purple-300 mb-2">Difficulty</label>
                <select value={`${numCols}x${numRows}`}
                  onChange={e => { const [c, r] = e.target.value.split('x').map(Number); setNumCols(c); setNumRows(r) }}
                  className="w-full p-3 rounded-lg bg-purple-900/30 border border-purple-500/50 text-white text-base">
                  <option value="3x2">Easy — 6 pieces</option>
                  <option value="4x3">Medium — 12 pieces</option>
                  <option value="6x4">Hard — 24 pieces</option>
                  <option value="8x6">Expert — 48 pieces</option>
                </select>
              </div>
            </div>
          </div>

        ) : (
          /* ---- GAME SCREEN ---- */
          <div className="relative w-full h-full flex flex-col">

            {/* Top HUD */}
            <div className="relative z-20 flex items-center justify-between px-3 py-2 gap-2"
              style={{ background: 'rgba(26,20,35,0.85)', borderBottom: '1px solid rgba(168,85,247,0.2)', backdropFilter: 'blur(8px)' }}>

              <p className="text-purple-300 font-bold text-sm tracking-widest"
                style={{ fontFamily: 'Cinzel, serif' }}>JIGSAW</p>

              <div className="flex items-center gap-2">
                <button onClick={() => image && initPuzzle(image)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}>
                  <RotateCcw size={13} /> Reset
                </button>
                <button onClick={scatterPieces}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.4)' }}>
                  <Sparkles size={13} /> Scatter
                </button>
                <button onClick={() => setImage(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <Upload size={13} /> New
                </button>
              </div>
            </div>

            {/* Canvas — fills remaining space */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ touchAction: 'none' }}>
              <canvas
                ref={canvasRef}
                id="jigsaw-canvas"
                style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }}
              />

              {/* Floating zoom controls — bottom right */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                <button onClick={() => zoomBy(1.25)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                  style={{ background: 'rgba(26,20,35,0.85)', border: '1px solid rgba(168,85,247,0.4)', backdropFilter: 'blur(8px)' }}>
                  <ZoomIn size={20} />
                </button>
                <button onClick={() => zoomBy(0.8)}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                  style={{ background: 'rgba(26,20,35,0.85)', border: '1px solid rgba(168,85,247,0.4)', backdropFilter: 'blur(8px)' }}>
                  <ZoomOut size={20} />
                </button>
                <button onClick={resetView}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                  title="Fit to screen"
                  style={{ background: 'rgba(26,20,35,0.85)', border: '1px solid rgba(168,85,247,0.4)', backdropFilter: 'blur(8px)' }}>
                  <Maximize2 size={18} />
                </button>
              </div>

              {/* Hint pill — fades after first render */}
              <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                <p className="text-xs text-purple-300 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(26,20,35,0.7)', border: '1px solid rgba(168,85,247,0.3)', backdropFilter: 'blur(8px)' }}>
                  Drag to move • 2 fingers to zoom &amp; pan
                </p>
              </div>
            </div>

            {/* Completion overlay */}
            <AnimatePresence>
              {complete && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }}
                    className="pointer-events-auto text-center px-10 py-8 rounded-2xl shadow-2xl"
                    style={{ background: 'rgba(45,27,61,0.95)', border: '2px solid rgba(168,85,247,0.6)' }}>
                    <CheckCircle size={48} className="mx-auto mb-3 text-purple-400" />
                    <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Cinzel, serif' }}>Puzzle Complete!</p>
                    <p className="text-purple-300 text-sm mb-5">All pieces connected</p>
                    <button onClick={() => { setComplete(false); image && initPuzzle(image) }}
                      className="px-6 py-3 rounded-xl font-semibold text-white transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #a855f7, #6d28d9)' }}>
                      Play Again
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  )
}
