'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, RotateCcw, CheckCircle, Sparkles,
  ZoomIn, ZoomOut, Maximize2, Eye, Grid3x3, ImageIcon
} from 'lucide-react'
import Script from 'next/script'

const SAMPLE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', name: 'Mountain' },
  { url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&h=600&fit=crop', name: 'Waterfall' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', name: 'Forest' },
  { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=600&fit=crop', name: 'Parrots' }
]

const DIFFICULTIES = [
  { label: 'Easy',   value: '3x2',  pieces: 6  },
  { label: 'Medium', value: '4x3',  pieces: 12 },
  { label: 'Hard',   value: '6x4',  pieces: 24 },
  { label: 'Expert', value: '8x6',  pieces: 48 },
]

declare global {
  interface Window { paper: any }
}

// World size — virtual table
const WORLD_W = 1000
const WORLD_H = 700

export default function JigsawPage() {
  const [image, setImage]             = useState<HTMLImageElement | null>(null)
  const [imageSrc, setImageSrc]       = useState<string>('')
  const [numCols, setNumCols]         = useState(4)
  const [numRows, setNumRows]         = useState(3)
  const [complete, setComplete]       = useState(false)
  const [paperLoaded, setPaperLoaded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showDiffMenu, setShowDiffMenu] = useState(false)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef      = useRef<any>(null)
  const wheelCleanup = useRef<(() => void) | null>(null)
  const touchCleanup = useRef<(() => void) | null>(null)
  const numColsRef   = useRef(numCols)
  const numRowsRef   = useRef(numRows)
  useEffect(() => { numColsRef.current = numCols }, [numCols])
  useEffect(() => { numRowsRef.current = numRows }, [numRows])

  const initPuzzle = useCallback((img: HTMLImageElement, cols: number, rows: number) => {
    if (!canvasRef.current || !window.paper) return

    const paper  = window.paper
    const canvas = canvasRef.current

    if (wheelCleanup.current) { wheelCleanup.current(); wheelCleanup.current = null }
    if (touchCleanup.current) { touchCleanup.current(); touchCleanup.current = null }

    paper.setup(canvas)
    paper.view.viewSize = new paper.Size(WORLD_W, WORLD_H)

    const scope = paper.project

    const tileWidth    = 100
    const puzzleWidth  = tileWidth * cols
    const puzzleHeight = tileWidth * rows

    const boardCenter = new paper.Point(WORLD_W / 2, WORLD_H / 2)

    const raster = new paper.Raster(img)
    raster.position = boardCenter
    raster.size     = new paper.Size(puzzleWidth, puzzleHeight)
    raster.visible  = false

    // Assembly zone
    const assemblyZone = new paper.Path.Rectangle({
      center:      boardCenter,
      size:        [puzzleWidth + 20, puzzleHeight + 20],
      fillColor:   new paper.Color(0, 0, 0, 0.12),
      strokeColor: new paper.Color(0.66, 0.33, 0.97, 0.45),
      strokeWidth: 1.5,
      dashArray:   [6, 4],
    })
    assemblyZone.guide = true
    assemblyZone.sendToBack()

    const assemblyLabel = new paper.PointText({
      point:         new paper.Point(boardCenter.x, boardCenter.y - puzzleHeight / 2 - 10),
      content:       'Assembly Area',
      fillColor:     new paper.Color(0.66, 0.33, 0.97, 0.35),
      fontFamily:    'monospace',
      fontSize:      11,
      justification: 'center',
    })
    assemblyLabel.guide = true

    const game: any = {
      tiles: [] as any[],
      selectedTile: null,
      dragging:     false,
      panning:      false,
      lastPoint:    null,
      tileWidth,
      numCols: cols,
      numRows: rows,
      raster,
      boardCenter,
      puzzleWidth,
      puzzleHeight,
      complete: false,
      zIndex:   0,
    }

    // ── Tab curve ──────────────────────────────────────────────────────────
    const tabCurve = [0,0,35,15,37,5,37,5,40,0,38,-5,38,-5,20,-20,50,-20,50,-20,80,-20,62,-5,62,-5,60,0,63,5,63,5,65,15,100,0]

    const tabPattern: number[][] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const top    = y === 0      ? 0 : -tabPattern[(y-1)*cols+x][2]
        const left   = x === 0      ? 0 : -tabPattern[y*cols+(x-1)][1]
        const right  = x === cols-1 ? 0 : Math.random() > 0.5 ? 1 : -1
        const bottom = y === rows-1 ? 0 : Math.random() > 0.5 ? 1 : -1
        tabPattern.push([top, right, bottom, left])
      }
    }

    // ── Mask ──────────────────────────────────────────────────────────────
    const createMask = (gridX: number, gridY: number) => {
      const scale   = tileWidth / 100
      const pattern = tabPattern[gridY * cols + gridX]
      const path    = new paper.Path()
      path.moveTo([0, 0])

      if (gridY > 0 && pattern[0] !== 0) {
        const dir = pattern[0]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tabCurve[i]*scale,dir*tabCurve[i+1]*scale],[tabCurve[i+2]*scale,dir*tabCurve[i+3]*scale],[tabCurve[i+4]*scale,dir*tabCurve[i+5]*scale])
      } else { path.lineTo([tileWidth, 0]) }

      if (gridX < cols-1 && pattern[1] !== 0) {
        const dir = pattern[1]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tileWidth-dir*tabCurve[i+1]*scale,tabCurve[i]*scale],[tileWidth-dir*tabCurve[i+3]*scale,tabCurve[i+2]*scale],[tileWidth-dir*tabCurve[i+5]*scale,tabCurve[i+4]*scale])
      } else { path.lineTo([tileWidth, tileWidth]) }

      if (gridY < rows-1 && pattern[2] !== 0) {
        const dir = pattern[2]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tileWidth-tabCurve[i]*scale,tileWidth-dir*tabCurve[i+1]*scale],[tileWidth-tabCurve[i+2]*scale,tileWidth-dir*tabCurve[i+3]*scale],[tileWidth-tabCurve[i+4]*scale,tileWidth-dir*tabCurve[i+5]*scale])
      } else { path.lineTo([0, tileWidth]) }

      if (gridX > 0 && pattern[3] !== 0) {
        const dir = pattern[3]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([dir*tabCurve[i+1]*scale,tileWidth-tabCurve[i]*scale],[dir*tabCurve[i+3]*scale,tileWidth-tabCurve[i+2]*scale],[dir*tabCurve[i+5]*scale,tileWidth-tabCurve[i+4]*scale])
      } else { path.lineTo([0, 0]) }

      path.closePath()
      path.fillColor = new paper.Color(0, 0, 0, 0.01)
      path.offsets   = [
        0 - path.bounds.left,
        0 - path.bounds.top,
        path.bounds.right - tileWidth,
        path.bounds.bottom - tileWidth,
      ]
      return path
    }

    // ── Create pieces ──────────────────────────────────────────────────────
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const mask   = createMask(x, y)
        const margin = 20
        const pieceRaster = raster.getSubRaster(
          new paper.Rectangle(x*tileWidth-margin, y*tileWidth-margin, tileWidth+margin*2, tileWidth+margin*2)
        )
        pieceRaster.position = new paper.Point(tileWidth/2, tileWidth/2)

        const outline = mask.clone()
        outline.strokeColor = new paper.Color('rgba(255,255,255,0.3)')
        outline.strokeWidth = 1
        outline.fillColor   = null

        const group        = new paper.Group([mask, pieceRaster, outline])
        group.clipped      = true
        group.gridPosition = new paper.Point(x, y)
        group.pieceGroup   = [group]
        group.offsets      = mask.offsets
        game.tiles.push(group)
      }
    }

    // ── Helpers ────────────────────────────────────────────────────────────
    const getTileGridCenter = (tile: any) => {
      const o = tile.offsets
      return tile.position.add(new paper.Point((o[0]-o[2])/2, (o[1]-o[3])/2))
    }
    const setTileGridCenter = (tile: any, target: any) => {
      const cur = getTileGridCenter(tile)
      tile.position = target.add(tile.position).subtract(cur)
    }
    const setTileNatural = (tile: any) => {
      const origin = boardCenter.subtract(new paper.Point(puzzleWidth/2, puzzleHeight/2))
      const nat    = tile.gridPosition.add(new paper.Point(0.5,0.5)).multiply(tileWidth).add(origin)
      setTileGridCenter(tile, nat)
    }

    game.tiles.forEach((t: any) => setTileNatural(t))

    // ── Scatter pieces close around assembly zone ──────────────────────────
    const doScatter = (tiles: any[]) => {
      const halfW = puzzleWidth  / 2
      const halfH = puzzleHeight / 2
      const cx    = boardCenter.x
      const cy    = boardCenter.y
      // Ring around assembly area (overlap allowed, just avoid center box)
      const innerPad = 20   // min gap from assembly edge
      const outerRng = Math.max(WORLD_W, WORLD_H) * 0.35  // max ring width

      const shuffled = [...tiles].sort(() => Math.random() - 0.5)
      shuffled.forEach((tile: any) => {
        let tx = cx, ty = cy
        let tries = 0
        do {
          const side = Math.floor(Math.random() * 4)
          if (side === 0) {
            // left
            tx = cx - halfW - innerPad - Math.random() * outerRng
            ty = cy + (Math.random() - 0.5) * (puzzleHeight + outerRng * 1.5)
          } else if (side === 1) {
            // right
            tx = cx + halfW + innerPad + Math.random() * outerRng
            ty = cy + (Math.random() - 0.5) * (puzzleHeight + outerRng * 1.5)
          } else if (side === 2) {
            // top
            tx = cx + (Math.random() - 0.5) * (puzzleWidth + outerRng * 1.5)
            ty = cy - halfH - innerPad - Math.random() * outerRng
          } else {
            // bottom
            tx = cx + (Math.random() - 0.5) * (puzzleWidth + outerRng * 1.5)
            ty = cy + halfH + innerPad + Math.random() * outerRng
          }
          tries++
        } while (
          tries < 40 &&
          (Math.abs(tx - cx) < halfW + innerPad - 10 &&
           Math.abs(ty - cy) < halfH + innerPad - 10)
        )
        setTileGridCenter(tile, new paper.Point(tx, ty))
      })
    }

    doScatter(game.tiles)

    // ── Gather group ───────────────────────────────────────────────────────
    const gatherGroup = (anchor: any) => {
      const anchorCenter = getTileGridCenter(anchor)
      for (const piece of anchor.pieceGroup) {
        if (piece === anchor) continue
        const gridOffset = piece.gridPosition.subtract(anchor.gridPosition).multiply(tileWidth)
        setTileGridCenter(piece, anchorCenter.add(gridOffset))
      }
      paper.view.draw()
    }

    // ── Scatter button ─────────────────────────────────────────────────────
    game.scatter = () => {
      const seen = new Set<any[]>()
      game.tiles.forEach((t: any) => seen.add(t.pieceGroup))
      const groups: any[] = []
      seen.forEach(g => groups.push(g))
      // For each group, scatter the anchor and then gather
      const anchors = groups.map(g => g[0])
      doScatter(anchors)
      groups.forEach(g => {
        if (g.length > 1) gatherGroup(g[0])
      })
      paper.view.draw()
    }

    // ── Try connect ────────────────────────────────────────────────────────
    const tryConnect = () => {
      if (!game.selectedTile) return
      const snapThreshold = tileWidth / 9
      const toConnect: any[] = []

      for (const tile of game.selectedTile.pieceGroup) {
        const tileCenter = getTileGridCenter(tile)
        for (const {dx,dy} of [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}]) {
          const neighbor = game.tiles.find((t: any) =>
            t.gridPosition.x === tile.gridPosition.x + dx &&
            t.gridPosition.y === tile.gridPosition.y + dy
          )
          if (!neighbor || tile.pieceGroup.includes(neighbor)) continue
          const expected = tileCenter.add(new paper.Point(dx*tileWidth, dy*tileWidth))
          const actual   = getTileGridCenter(neighbor)
          const dist     = Math.abs(expected.x-actual.x) + Math.abs(expected.y-actual.y)
          if (dist < snapThreshold && !toConnect.includes(neighbor)) toConnect.push(neighbor)
        }
      }

      if (toConnect.length > 0) {
        const newGroup = [...game.selectedTile.pieceGroup]
        toConnect.forEach(t => newGroup.push(...t.pieceGroup))
        const unique = Array.from(new Set(newGroup))
        unique.forEach((p: any) => (p.pieceGroup = unique))
        gatherGroup(game.selectedTile)
        if (unique.length === game.tiles.length) { setComplete(true); game.complete = true }
      }
    }

    // ── Mouse events ───────────────────────────────────────────────────────
    const tool = new paper.Tool()

    tool.onMouseDown = (event: any) => {
      if (game.complete) return
      const hit = scope.hitTest(event.point, { fill: true, tolerance: 15 })
      if (hit?.item) {
        let tile = hit.item
        while (tile && !tile.gridPosition && tile.parent) tile = tile.parent
        if (tile?.gridPosition) {
          game.selectedTile = tile
          game.dragging     = true
          game.lastPoint    = event.point
          game.zIndex++
          tile.pieceGroup.forEach((p: any) => { p.bringToFront(); p.data.zIndex = game.zIndex })
          return
        }
      }
      game.panning   = true
      game.lastPoint = event.point
    }

    tool.onMouseDrag = (event: any) => {
      if (game.dragging && game.selectedTile) {
        const delta = event.point.subtract(game.lastPoint)
        game.selectedTile.pieceGroup.forEach((p: any) => { p.position = p.position.add(delta) })
        game.lastPoint = event.point
        paper.view.draw()
      } else if (game.panning) {
        paper.view.translate(event.point.subtract(game.lastPoint))
        game.lastPoint = event.point
      }
    }

    tool.onMouseUp = () => {
      if (game.dragging && game.selectedTile) tryConnect()
      game.selectedTile = null
      game.dragging     = false
      game.panning      = false
      game.lastPoint    = null
    }

    // ── Wheel zoom ─────────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor     = e.deltaY > 0 ? 0.9 : 1.1
      const mouseWorld = paper.view.viewToProject(new paper.Point(e.offsetX, e.offsetY))
      paper.view.scale(factor, mouseWorld)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // ── Touch events ───────────────────────────────────────────────────────
    let activeTouches: Touch[]     = []
    let lastPinchDist              = 0
    let lastTouchPoint: any        = null
    let touchDraggingTile: any     = null
    let touchPanning               = false

    const getTouchWorldPt = (touch: Touch) => {
      const rect   = canvas.getBoundingClientRect()
      const scaleX = canvas.width  / rect.width
      const scaleY = canvas.height / rect.height
      return paper.view.viewToProject(new paper.Point((touch.clientX-rect.left)*scaleX, (touch.clientY-rect.top)*scaleY))
    }
    const pinchDist = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX-t2.clientX; const dy = t1.clientY-t2.clientY
      return Math.sqrt(dx*dx+dy*dy)
    }
    const tryConnectTile = (tile: any) => { game.selectedTile = tile; tryConnect(); game.selectedTile = null }

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      activeTouches = Array.from(e.touches)
      if (activeTouches.length === 1) {
        const pt  = getTouchWorldPt(activeTouches[0])
        const hit = scope.hitTest(pt, { fill: true, tolerance: 20 })
        if (hit?.item) {
          let tile = hit.item
          while (tile && !tile.gridPosition && tile.parent) tile = tile.parent
          if (tile?.gridPosition) {
            touchDraggingTile = tile; game.zIndex++
            tile.pieceGroup.forEach((p: any) => { p.bringToFront(); p.data.zIndex = game.zIndex })
            lastTouchPoint = pt; return
          }
        }
        touchPanning = true; lastTouchPoint = pt
      } else if (activeTouches.length === 2) {
        if (touchDraggingTile) { tryConnectTile(touchDraggingTile); touchDraggingTile = null }
        touchPanning  = false
        lastPinchDist = pinchDist(activeTouches[0], activeTouches[1])
        const mx = (activeTouches[0].clientX+activeTouches[1].clientX)/2
        const my = (activeTouches[0].clientY+activeTouches[1].clientY)/2
        const rect = canvas.getBoundingClientRect()
        lastTouchPoint = new paper.Point((mx-rect.left)*canvas.width/rect.width, (my-rect.top)*canvas.height/rect.height)
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      activeTouches = Array.from(e.touches)
      if (activeTouches.length === 1) {
        const pt = getTouchWorldPt(activeTouches[0])
        if (touchDraggingTile && lastTouchPoint) {
          const delta = pt.subtract(lastTouchPoint)
          touchDraggingTile.pieceGroup.forEach((p: any) => { p.position = p.position.add(delta) })
          paper.view.draw()
        } else if (touchPanning && lastTouchPoint) {
          paper.view.translate(pt.subtract(lastTouchPoint))
        }
        lastTouchPoint = pt
      } else if (activeTouches.length === 2) {
        const dist = pinchDist(activeTouches[0], activeTouches[1])
        if (lastPinchDist > 0) {
          const factor = dist / lastPinchDist
          const mx     = (activeTouches[0].clientX+activeTouches[1].clientX)/2
          const my     = (activeTouches[0].clientY+activeTouches[1].clientY)/2
          const rect   = canvas.getBoundingClientRect()
          const midView  = new paper.Point((mx-rect.left)*canvas.width/rect.width, (my-rect.top)*canvas.height/rect.height)
          const midWorld = paper.view.viewToProject(midView)
          paper.view.scale(factor, midWorld)
          lastTouchPoint = midView
        }
        lastPinchDist = dist
        paper.view.draw()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      activeTouches = Array.from(e.touches)
      if (activeTouches.length < 2) lastPinchDist = 0
      if (activeTouches.length === 0) {
        if (touchDraggingTile) tryConnectTile(touchDraggingTile)
        touchDraggingTile = null; touchPanning = false; lastTouchPoint = null
      }
    }

    canvas.addEventListener('touchstart',  onTouchStart,  { passive: false })
    canvas.addEventListener('touchmove',   onTouchMove,   { passive: false })
    canvas.addEventListener('touchend',    onTouchEnd,    { passive: false })
    canvas.addEventListener('touchcancel', onTouchEnd,    { passive: false })

    wheelCleanup.current = () => canvas.removeEventListener('wheel', onWheel)
    touchCleanup.current = () => {
      canvas.removeEventListener('touchstart',  onTouchStart)
      canvas.removeEventListener('touchmove',   onTouchMove)
      canvas.removeEventListener('touchend',    onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }

    gameRef.current = game

    // Initial view: fit the whole world on screen
    const cW = canvas.clientWidth  || 390
    const cH = canvas.clientHeight || 680
    paper.view.zoom   = Math.min(cW / WORLD_W, cH / WORLD_H)
    paper.view.center = boardCenter

    paper.view.draw()
  }, [])

  // ── Overlay controls ───────────────────────────────────────────────────────
  const zoomBy = (factor: number) => {
    if (!window.paper) return
    window.paper.view.scale(factor, window.paper.view.center)
  }

  const centerView = () => {
    if (!window.paper || !gameRef.current) return
    const p = window.paper
    const { boardCenter } = gameRef.current
    const cW = canvasRef.current?.clientWidth  || 390
    const cH = canvasRef.current?.clientHeight || 680
    p.view.zoom   = Math.min(cW / WORLD_W, cH / WORLD_H)
    p.view.center = boardCenter
  }

  const scatterPieces = () => { if (gameRef.current?.scatter) gameRef.current.scatter() }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const src  = URL.createObjectURL(file)
    const img  = new Image()
    img.onload = () => { setImageSrc(src); setImage(img); setComplete(false); setTimeout(() => initPuzzle(img, numColsRef.current, numRowsRef.current), 100) }
    img.src = src
  }

  const loadSampleImage = (url: string) => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => { setImageSrc(url); setImage(img); setComplete(false); setTimeout(() => initPuzzle(img, numColsRef.current, numRowsRef.current), 100) }
    img.src = url
  }

  const changeDifficulty = (cols: number, rows: number) => {
    setNumCols(cols); setNumRows(rows); setShowDiffMenu(false)
    if (image) { setComplete(false); setTimeout(() => initPuzzle(image, cols, rows), 50) }
  }

  useEffect(() => {
    if (paperLoaded && image) initPuzzle(image, numColsRef.current, numRowsRef.current)
  }, [paperLoaded])

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js"
        onLoad={() => setPaperLoaded(true)}
      />

      <div className="fixed inset-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1423 0%, #2d1b3d 50%, #1a1423 100%)' }}>
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #6d28d9, transparent)' }} />
        </div>

        {/* ── SETUP SCREEN ─────────────────────────────────────────────────── */}
        {!image ? (
          <div className="relative z-10 flex items-center justify-center min-h-full p-4 overflow-y-auto">
            <div className="max-w-2xl w-full space-y-5 py-8">
              <div className="text-center">
                <h1 className="text-5xl font-bold mb-1"
                  style={{ fontFamily: 'Cinzel, serif', background: 'linear-gradient(135deg, #a855f7, #6d28d9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.1em' }}>
                  JIGSAW
                </h1>
                <p className="text-xs tracking-widest uppercase text-purple-400 opacity-70">Virtual Table Puzzle</p>
              </div>

              <label className="block p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-purple-400"
                style={{ borderColor: 'rgba(168,85,247,0.35)', background: 'rgba(168,85,247,0.05)' }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="text-center">
                  <Upload size={36} className="mx-auto mb-2 text-purple-400" />
                  <p className="text-base font-semibold text-white">Upload Your Image</p>
                  <p className="text-xs text-gray-400 mt-1">Tap to choose a photo from your device</p>
                </div>
              </label>

              <div>
                <p className="text-center text-xs text-purple-300 mb-2 uppercase tracking-widest">Or choose a sample</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SAMPLE_IMAGES.map((s, i) => (
                    <button key={i} onClick={() => loadSampleImage(s.url)}
                      className="group relative aspect-video rounded-xl overflow-hidden border-2 border-transparent hover:border-purple-400 transition-all">
                      <img src={s.url} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-bold">{s.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <p className="text-xs text-purple-300 mb-2 uppercase tracking-widest">Difficulty</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {DIFFICULTIES.map(d => {
                    const active = `${numCols}x${numRows}` === d.value
                    return (
                      <button key={d.value}
                        onClick={() => { const [c,r] = d.value.split('x').map(Number); setNumCols(c); setNumRows(r) }}
                        className="py-2 px-3 rounded-lg text-sm font-semibold transition-all"
                        style={{
                          background: active ? 'rgba(168,85,247,0.4)' : 'rgba(168,85,247,0.1)',
                          border: `1px solid ${active ? 'rgba(168,85,247,0.8)' : 'rgba(168,85,247,0.3)'}`,
                          color: 'white'
                        }}>
                        <span className="block">{d.label}</span>
                        <span className="block text-xs opacity-60">{d.pieces} pcs</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

        ) : (
          /* ── GAME SCREEN ───────────────────────────────────────────────── */
          <div className="relative w-full h-full" style={{ touchAction: 'none' }}>

            {/* Canvas fills everything */}
            <div ref={containerRef} className="absolute inset-0" style={{ touchAction: 'none' }}>
              <canvas ref={canvasRef} id="jigsaw-canvas"
                style={{ display: 'block', width: '100%', height: '100%', touchAction: 'none' }} />
            </div>

            {/* ── OVERLAY HUD ────────────────────────────────────────────── */}

            {/* Title — top left */}
            <div className="absolute top-3 left-3 z-20 pointer-events-none select-none">
              <p className="text-purple-300 font-bold text-lg tracking-widest leading-none"
                style={{ fontFamily: 'Cinzel, serif', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
                JIGSAW
              </p>
              <p className="text-purple-400 text-xs opacity-60">{numCols}×{numRows} · {numCols*numRows} pieces</p>
            </div>

            {/* New Game — top right */}
            <div className="absolute top-3 right-3 z-20">
              <button onClick={() => setImage(null)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
                style={{ background: 'rgba(18,12,28,0.88)', border: '1px solid rgba(168,85,247,0.4)', backdropFilter: 'blur(10px)' }}>
                <ImageIcon size={13} /> New Game
              </button>
            </div>

            {/* Hint — top center */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
              <p className="text-xs text-purple-400 opacity-45 whitespace-nowrap"
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
                Drag piece · 2-finger pinch to zoom
              </p>
            </div>

            {/* Bottom toolbar */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20">
              <div className="flex items-center gap-1 px-2 py-2 rounded-2xl"
                style={{ background: 'rgba(14,9,23,0.92)', border: '1px solid rgba(168,85,247,0.35)', backdropFilter: 'blur(14px)', boxShadow: '0 4px 28px rgba(0,0,0,0.6)' }}>

                {/* Scatter */}
                <HudBtn onClick={scatterPieces} title="Scatter pieces">
                  <Sparkles size={17} />
                </HudBtn>

                {/* Preview */}
                <HudBtn onClick={() => setShowPreview(true)} title="Preview image">
                  <Eye size={17} />
                </HudBtn>

                <Divider />

                {/* Piece count / difficulty */}
                <div className="relative">
                  <HudBtn onClick={() => setShowDiffMenu(v => !v)} title="Change pieces">
                    <Grid3x3 size={16} />
                  </HudBtn>
                  <AnimatePresence>
                    {showDiffMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 rounded-xl overflow-hidden z-30"
                        style={{ background: 'rgba(14,9,23,0.97)', border: '1px solid rgba(168,85,247,0.45)', backdropFilter: 'blur(14px)', minWidth: 138 }}>
                        {DIFFICULTIES.map(d => {
                          const [c,r] = d.value.split('x').map(Number)
                          const active = numCols === c && numRows === r
                          return (
                            <button key={d.value} onClick={() => changeDifficulty(c, r)}
                              className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-4 transition-colors"
                              style={{ color: active ? '#c084fc' : '#d1d5db', background: active ? 'rgba(168,85,247,0.18)' : 'transparent' }}>
                              <span className="font-medium">{d.label}</span>
                              <span className="text-xs opacity-50">{d.pieces}pcs</span>
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reset */}
                <HudBtn onClick={() => { setComplete(false); initPuzzle(image!, numCols, numRows) }} title="Reset puzzle">
                  <RotateCcw size={16} />
                </HudBtn>

                <Divider />

                {/* Zoom out */}
                <HudBtn onClick={() => zoomBy(0.8)} title="Zoom out">
                  <ZoomOut size={17} />
                </HudBtn>

                {/* Center / fit */}
                <HudBtn onClick={centerView} title="Fit to screen">
                  <Maximize2 size={16} />
                </HudBtn>

                {/* Zoom in */}
                <HudBtn onClick={() => zoomBy(1.25)} title="Zoom in">
                  <ZoomIn size={17} />
                </HudBtn>
              </div>
            </div>

            {/* ── PREVIEW MODAL ───────────────────────────────────────────── */}
            <AnimatePresence>
              {showPreview && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 flex items-center justify-center p-6"
                  style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)' }}
                  onClick={() => setShowPreview(false)}>
                  <motion.div initial={{ scale: 0.88 }} animate={{ scale: 1 }} exit={{ scale: 0.88 }}
                    className="rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm"
                    style={{ border: '2px solid rgba(168,85,247,0.55)' }}
                    onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-4 py-2.5"
                      style={{ background: 'rgba(18,12,28,0.98)' }}>
                      <p className="text-purple-300 text-sm font-semibold tracking-wide">Reference</p>
                      <button onClick={() => setShowPreview(false)}
                        className="text-purple-400 hover:text-white text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                        style={{ background: 'rgba(168,85,247,0.15)' }}>
                        ✕
                      </button>
                    </div>
                    <img src={imageSrc} alt="Puzzle reference" className="w-full object-cover block" style={{ maxHeight: '65vh' }} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── COMPLETION ─────────────────────────────────────────────── */}
            <AnimatePresence>
              {complete && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(4px)' }}>
                  <motion.div initial={{ scale: 0.8, y: 24 }} animate={{ scale: 1, y: 0 }}
                    className="text-center px-10 py-8 rounded-2xl shadow-2xl"
                    style={{ background: 'rgba(22,14,36,0.98)', border: '2px solid rgba(168,85,247,0.6)' }}>
                    <CheckCircle size={52} className="mx-auto mb-3 text-purple-400" />
                    <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                      Puzzle Complete!
                    </p>
                    <p className="text-purple-300 text-sm mb-6">All {numCols*numRows} pieces connected</p>
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => { setComplete(false); initPuzzle(image!, numCols, numRows) }}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #a855f7, #6d28d9)' }}>
                        Play Again
                      </button>
                      <button onClick={() => setImage(null)}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
                        style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)' }}>
                        New Game
                      </button>
                    </div>
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

// ── Shared small components ────────────────────────────────────────────────────
function HudBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-300 transition-all active:scale-90 hover:text-white hover:bg-purple-500/20 select-none">
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-6 mx-0.5 flex-shrink-0" style={{ background: 'rgba(168,85,247,0.22)' }} />
}
