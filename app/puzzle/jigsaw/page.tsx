'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, RotateCcw, CheckCircle, Sparkles, Eye, Grid3X3, Maximize2, Plus, Minus, X } from 'lucide-react'
import Script from 'next/script'

// ── World size — big enough for assembly + scatter ring ──────────────────────
// Assembly is 400×300 (tileWidth=100, 4×3 default) centered at (600,400)
// World is 1600×1300 so scatter has room all around
const WORLD_W   = 1600
const WORLD_H   = 1300
const WORLD_CX  = WORLD_W / 2   // 800
const WORLD_CY  = WORLD_H / 2   // 650

const SAMPLE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', name: 'Mountain' },
  { url: 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&h=600&fit=crop', name: 'Waterfall' },
  { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop', name: 'Forest' },
  { url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=600&fit=crop', name: 'Parrots' },
]

const DIFFICULTIES = [
  { label: 'Easy',   cols: 3, rows: 2 },
  { label: 'Medium', cols: 4, rows: 3 },
  { label: 'Hard',   cols: 6, rows: 4 },
  { label: 'Expert', cols: 8, rows: 6 },
]

declare global { interface Window { paper: any } }

export default function JigsawPage() {
  const [image,       setImage]       = useState<HTMLImageElement | null>(null)
  const [imageSrc,    setImageSrc]    = useState('')
  const [numCols,     setNumCols]     = useState(4)
  const [numRows,     setNumRows]     = useState(3)
  const [complete,    setComplete]    = useState(false)
  const [paperLoaded, setPaperLoaded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showDiff,    setShowDiff]    = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef   = useRef<any>(null)

  // ── Build puzzle — same logic as original, just centered + bigger world ────
  const initPuzzle = (img: HTMLImageElement, cols = numCols, rows = numRows) => {
    if (!canvasRef.current || !window.paper) return
    const paper  = window.paper
    const canvas = canvasRef.current

    if (gameRef.current?.scope) gameRef.current.scope.project.clear()

    paper.setup(canvas)
    const scope = paper.project

    const tileWidth   = 100
    const puzzleWidth  = tileWidth * cols
    const puzzleHeight = tileWidth * rows

    // Raster centered in world
    const raster = new paper.Raster(img)
    raster.position = new paper.Point(WORLD_CX, WORLD_CY)
    raster.visible  = false
    raster.size     = new paper.Size(puzzleWidth, puzzleHeight)

    // Assembly zone guide
    const playArea = new paper.Path.Rectangle({
      center:      raster.position,
      size:        [puzzleWidth + 20, puzzleHeight + 20],
      fillColor:   'rgba(0,0,0,0.18)',
      strokeColor: 'rgba(168,85,247,0.35)',
      strokeWidth: 2,
      dashArray:   [8, 5],
    })
    playArea.guide = true
    playArea.sendToBack()

    const game: any = {
      scope, tiles: [], selectedTile: null,
      dragging: false, panning: false, lastPoint: null,
      tileWidth, numCols: cols, numRows: rows,
      raster, playArea, complete: false, zIndex: 0,
    }

    // ── Piece shapes — IDENTICAL to original ─────────────────────────────────
    const tabCurve = [0,0,35,15,37,5,37,5,40,0,38,-5,38,-5,20,-20,50,-20,50,-20,80,-20,62,-5,62,-5,60,0,63,5,63,5,65,15,100,0]

    const tabPattern: number[][] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const top    = y === 0      ? 0 : -tabPattern[(y-1)*cols+x][2]
        const left   = x === 0      ? 0 : -tabPattern[y*cols+(x-1)][1]
        const right  = x === cols-1 ? 0 : Math.random()>.5 ? 1 : -1
        const bottom = y === rows-1 ? 0 : Math.random()>.5 ? 1 : -1
        tabPattern.push([top, right, bottom, left])
      }
    }

    const createMask = (gridX: number, gridY: number) => {
      const sc      = tileWidth / 100
      const pattern = tabPattern[gridY * cols + gridX]
      const path    = new paper.Path()
      path.moveTo([0, 0])

      if (gridY > 0 && pattern[0] !== 0) {
        const dir = pattern[0]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tabCurve[i]*sc, dir*tabCurve[i+1]*sc], [tabCurve[i+2]*sc, dir*tabCurve[i+3]*sc], [tabCurve[i+4]*sc, dir*tabCurve[i+5]*sc])
      } else path.lineTo([tileWidth, 0])

      if (gridX < cols-1 && pattern[1] !== 0) {
        const dir = pattern[1]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tileWidth-dir*tabCurve[i+1]*sc, tabCurve[i]*sc], [tileWidth-dir*tabCurve[i+3]*sc, tabCurve[i+2]*sc], [tileWidth-dir*tabCurve[i+5]*sc, tabCurve[i+4]*sc])
      } else path.lineTo([tileWidth, tileWidth])

      if (gridY < rows-1 && pattern[2] !== 0) {
        const dir = pattern[2]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([tileWidth-tabCurve[i]*sc, tileWidth-dir*tabCurve[i+1]*sc], [tileWidth-tabCurve[i+2]*sc, tileWidth-dir*tabCurve[i+3]*sc], [tileWidth-tabCurve[i+4]*sc, tileWidth-dir*tabCurve[i+5]*sc])
      } else path.lineTo([0, tileWidth])

      if (gridX > 0 && pattern[3] !== 0) {
        const dir = pattern[3]
        for (let i = 0; i < tabCurve.length; i += 6)
          path.cubicCurveTo([dir*tabCurve[i+1]*sc, tileWidth-tabCurve[i]*sc], [dir*tabCurve[i+3]*sc, tileWidth-tabCurve[i+2]*sc], [dir*tabCurve[i+5]*sc, tileWidth-tabCurve[i+4]*sc])
      } else path.lineTo([0, 0])

      path.closePath()
      path.fillColor = new paper.Color(0, 0, 0, 0.01)
      path.offsets = [
        0 - path.bounds.left,
        0 - path.bounds.top,
        path.bounds.right  - tileWidth,
        path.bounds.bottom - tileWidth,
      ]
      return path
    }

    // ── Create pieces — IDENTICAL to original ────────────────────────────────
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const mask   = createMask(x, y)
        const margin = 20
        const pieceRaster = raster.getSubRaster(
          new paper.Rectangle(x*tileWidth - margin, y*tileWidth - margin, tileWidth+margin*2, tileWidth+margin*2)
        )
        pieceRaster.position = new paper.Point(tileWidth/2, tileWidth/2)

        const outline = mask.clone()
        outline.strokeColor = new paper.Color('rgba(255,255,255,0.3)')
        outline.strokeWidth = 1
        outline.fillColor   = null

        const group = new paper.Group([mask, pieceRaster, outline])
        group.clipped      = true
        group.gridPosition = new paper.Point(x, y)
        group.pieceGroup   = [group]
        group.offsets      = mask.offsets
        game.tiles.push(group)
      }
    }

    // ── Helpers — IDENTICAL to original ──────────────────────────────────────
    const getTileGridCenter = (tile: any) => {
      const [ol, ot, or_, ob] = tile.offsets
      return tile.position.add(new paper.Point((ol - or_)/2, (ot - ob)/2))
    }
    const setTileGridCenter = (tile: any, target: any) => {
      tile.position = target.add(tile.position).subtract(getTileGridCenter(tile))
    }
    const setTileNatural = (tile: any) => {
      const origin = raster.position.subtract(new paper.Point(puzzleWidth/2, puzzleHeight/2))
      const nat    = tile.gridPosition.add(new paper.Point(0.5,0.5)).multiply(tileWidth).add(origin)
      setTileGridCenter(tile, nat)
    }

    // Place at natural positions first
    game.tiles.forEach((t: any) => setTileNatural(t))

    // ── Scatter in ring around assembly ──────────────────────────────────────
    const doScatter = () => {
      const cx = WORLD_CX, cy = WORLD_CY
      const hw = puzzleWidth/2, hh = puzzleHeight/2
      const pad = 80  // gap between assembly edge and nearest scatter position

      const shuffled = [...game.tiles].sort(() => Math.random() - 0.5)
      shuffled.forEach((tile: any) => {
        let tx: number, ty: number, attempts = 0
        do {
          const side = Math.floor(Math.random() * 4)
          if      (side === 0) { // left
            tx = cx - hw - pad - Math.random() * 500
            ty = cy + (Math.random() - 0.5) * (hh * 2 + pad * 2 + 400)
          } else if (side === 1) { // right
            tx = cx + hw + pad + Math.random() * 500
            ty = cy + (Math.random() - 0.5) * (hh * 2 + pad * 2 + 400)
          } else if (side === 2) { // top
            tx = cx + (Math.random() - 0.5) * (hw * 2 + pad * 2 + 400)
            ty = cy - hh - pad - Math.random() * 400
          } else {               // bottom
            tx = cx + (Math.random() - 0.5) * (hw * 2 + pad * 2 + 400)
            ty = cy + hh + pad + Math.random() * 400
          }
          attempts++
        } while (
          attempts < 30 &&
          Math.abs(tx - cx) < hw + 20 &&
          Math.abs(ty - cy) < hh + 20
        )
        setTileGridCenter(tile, new paper.Point(tx, ty))
      })
      paper.view.draw()
    }
    doScatter()
    game.scatter = doScatter

    // ── Gather group — IDENTICAL to original ─────────────────────────────────
    const gatherGroup = (anchor: any) => {
      const ac = getTileGridCenter(anchor)
      for (const piece of anchor.pieceGroup) {
        if (piece === anchor) continue
        setTileGridCenter(piece, ac.add(piece.gridPosition.subtract(anchor.gridPosition).multiply(tileWidth)))
      }
      paper.view.draw()
    }

    // ── Try connect — IDENTICAL to original ──────────────────────────────────
    const tryConnect = () => {
      if (!game.selectedTile) return
      const thresh = tileWidth / 9
      const toConnect: any[] = []

      for (const tile of game.selectedTile.pieceGroup) {
        const tc = getTileGridCenter(tile)
        for (const {dx, dy} of [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}]) {
          const nb = game.tiles.find((t: any) =>
            t.gridPosition.x === tile.gridPosition.x+dx &&
            t.gridPosition.y === tile.gridPosition.y+dy
          )
          if (!nb || tile.pieceGroup.includes(nb)) continue
          const exp  = tc.add(new paper.Point(dx*tileWidth, dy*tileWidth))
          const dist = Math.abs(exp.x-getTileGridCenter(nb).x) + Math.abs(exp.y-getTileGridCenter(nb).y)
          if (dist < thresh && !toConnect.includes(nb)) toConnect.push(nb)
        }
      }

      if (toConnect.length) {
        const newG   = [...game.selectedTile.pieceGroup]
        toConnect.forEach(t => newG.push(...t.pieceGroup))
        const unique = Array.from(new Set(newG)) as any[]
        unique.forEach((p: any) => p.pieceGroup = unique)
        gatherGroup(game.selectedTile)
        if (unique.length === game.tiles.length) { setComplete(true); game.complete = true }
      }
    }

    // ── Mouse tool ────────────────────────────────────────────────────────────
    const tool = new paper.Tool()

    tool.onMouseDown = (e: any) => {
      if (game.complete) return
      const hit = scope.hitTest(e.point, { fill: true, tolerance: 15 })
      if (hit?.item) {
        let t = hit.item
        while (t && !t.gridPosition && t.parent) t = t.parent
        if (t?.gridPosition) {
          game.selectedTile = t; game.dragging = true; game.lastPoint = e.point
          game.zIndex++; t.pieceGroup.forEach((p: any) => { p.bringToFront(); p.data.zIndex = game.zIndex })
          return
        }
      }
      game.panning = true; game.lastPoint = e.point
    }

    tool.onMouseDrag = (e: any) => {
      if (game.dragging && game.selectedTile) {
        const d = e.point.subtract(game.lastPoint)
        game.selectedTile.pieceGroup.forEach((p: any) => p.position = p.position.add(d))
        game.lastPoint = e.point; paper.view.draw()
      } else if (game.panning) {
        paper.view.translate(e.point.subtract(game.lastPoint))
        game.lastPoint = e.point
      }
    }

    tool.onMouseUp = () => {
      if (game.dragging && game.selectedTile) { tryConnect(); game.selectedTile = null }
      game.dragging = false; game.panning = false; game.lastPoint = null
    }

    // ── Touch handling ────────────────────────────────────────────────────────
    let lastTouches: Touch[] = []
    let lastPinchDist = 0, lastMidX = 0, lastMidY = 0
    let tDragPiece = false, tPanning = false

    const touchToWorld = (t: Touch) => {
      const r  = canvas.getBoundingClientRect()
      const px = (t.clientX - r.left) * (canvas.width  / r.width)
      const py = (t.clientY - r.top)  * (canvas.height / r.height)
      return paper.view.viewToProject(new paper.Point(px, py))
    }

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault()
      const ts = Array.from(e.touches); lastTouches = ts
      if (ts.length === 1 && !game.complete) {
        const pt  = touchToWorld(ts[0])
        const hit = scope.hitTest(pt, { fill: true, tolerance: 20 })
        if (hit?.item) {
          let t = hit.item
          while (t && !t.gridPosition && t.parent) t = t.parent
          if (t?.gridPosition) {
            game.selectedTile = t; tDragPiece = true; game.lastPoint = pt
            game.zIndex++; t.pieceGroup.forEach((p: any) => { p.bringToFront(); p.data.zIndex = game.zIndex })
            return
          }
        }
        tPanning = true; game.lastPoint = pt
      } else if (ts.length === 2) {
        tDragPiece = false; tPanning = false
        lastPinchDist = Math.hypot(ts[0].clientX-ts[1].clientX, ts[0].clientY-ts[1].clientY)
        lastMidX = (ts[0].clientX+ts[1].clientX)/2; lastMidY = (ts[0].clientY+ts[1].clientY)/2
      }
    }, { passive: false })

    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault()
      const ts = Array.from(e.touches)
      if (ts.length === 1) {
        const pt = touchToWorld(ts[0])
        if (tDragPiece && game.selectedTile && game.lastPoint) {
          const d = pt.subtract(game.lastPoint)
          game.selectedTile.pieceGroup.forEach((p: any) => p.position = p.position.add(d))
          game.lastPoint = pt; paper.view.draw()
        } else if (tPanning && game.lastPoint) {
          paper.view.translate(pt.subtract(game.lastPoint))
          game.lastPoint = pt
        }
      } else if (ts.length === 2) {
        const dist = Math.hypot(ts[0].clientX-ts[1].clientX, ts[0].clientY-ts[1].clientY)
        const midX = (ts[0].clientX+ts[1].clientX)/2
        const midY = (ts[0].clientY+ts[1].clientY)/2
        if (lastPinchDist > 0) {
          const factor = dist / lastPinchDist
          const r      = canvas.getBoundingClientRect()
          const pivot  = paper.view.viewToProject(new paper.Point(
            (midX - r.left) * (canvas.width  / r.width),
            (midY - r.top)  * (canvas.height / r.height)
          ))
          paper.view.scale(factor, pivot)
          // pan from mid movement
          const dmx = midX - lastMidX, dmy = midY - lastMidY
          if (Math.abs(dmx) + Math.abs(dmy) > 0) {
            const scx = canvas.width / r.width, scy = canvas.height / r.height
            const dWorld = paper.view.viewToProject(new paper.Point(dmx * scx, dmy * scy))
              .subtract(paper.view.viewToProject(new paper.Point(0, 0)))
            paper.view.translate(dWorld)
          }
        }
        lastPinchDist = dist; lastMidX = midX; lastMidY = midY
      }
      lastTouches = ts
    }, { passive: false })

    canvas.addEventListener('touchend', (e: TouchEvent) => {
      const ts = Array.from(e.touches)
      if (ts.length === 0) {
        if (tDragPiece && game.selectedTile) { tryConnect(); game.selectedTile = null }
        tDragPiece = false; tPanning = false; game.lastPoint = null; lastPinchDist = 0
      }
      lastTouches = ts
    }, { passive: false })

    // Wheel zoom — IDENTICAL to original
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()
      paper.view.scale(e.deltaY > 0 ? 0.9 : 1.1)
    }, { passive: false })

    gameRef.current = game
    paper.view.draw()

    // Fit the entire puzzle+scatter area into view, centered on assembly
    requestAnimationFrame(() => {
      const vw = canvas.width  / (window.devicePixelRatio || 1)
      const vh = canvas.height / (window.devicePixelRatio || 1)
      // Total area to show: assembly + scatter pad on all sides
      const showW = puzzleWidth  + (80 + 50) * 2   // pad + maxSpread each side
      const showH = puzzleHeight + (80 + 50) * 2
      const zoom  = Math.min(vw / showW, vh / showH) * 0.92
      paper.view.zoom   = zoom
      paper.view.center = new paper.Point(WORLD_CX, WORLD_CY)
      paper.view.draw()
    })
  }

  // ── UI actions ─────────────────────────────────────────────────────────────
  const handleScatter = () => gameRef.current?.scatter?.()

  const handleReset = () => {
    setComplete(false)
    if (image) initPuzzle(image)
  }

  const handleDiff = (cols: number, rows: number) => {
    setNumCols(cols); setNumRows(rows); setShowDiff(false); setComplete(false)
    if (image) setTimeout(() => initPuzzle(image, cols, rows), 50)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { setImage(img); setImageSrc(url); setComplete(false); setTimeout(() => initPuzzle(img), 100) }
    img.src = url
  }

  const loadSample = (url: string) => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => { setImage(img); setImageSrc(url); setComplete(false); setTimeout(() => initPuzzle(img), 100) }
    img.src = url
  }

  useEffect(() => {
    if (paperLoaded && image) initPuzzle(image)
  }, [paperLoaded, numCols, numRows])

  // ── Styles ─────────────────────────────────────────────────────────────────
  const toolBtn: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10, padding: 0,
    background: 'rgba(168,85,247,0.15)',
    border: '1px solid rgba(168,85,247,0.4)',
    color: '#c084fc', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  }

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js"
        onLoad={() => setPaperLoaded(true)}
      />

      {/* ── Setup screen ── */}
      {!image && (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a1423,#2d1b3d,#1a1423)', padding: '40px 20px', fontFamily: 'ui-sans-serif,system-ui,sans-serif' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center', fontSize: 36, fontWeight: 900, color: '#c084fc', letterSpacing: '0.12em', marginBottom: 4 }}>JIGSAW</h1>
            <p style={{ textAlign: 'center', color: '#a78bfa', fontSize: 12, marginBottom: 28, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pick an image to start</p>

            <label style={{ display: 'block', padding: '30px 20px', borderRadius: 16, border: '2px dashed rgba(168,85,247,0.4)', background: 'rgba(168,85,247,0.05)', cursor: 'pointer', textAlign: 'center', marginBottom: 18 }}>
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <Upload size={36} style={{ color: '#a855f7', margin: '0 auto 10px', display: 'block' }} />
              <p style={{ color: '#e9d5ff', fontWeight: 600, marginBottom: 4 }}>Upload your own image</p>
              <p style={{ color: '#9ca3af', fontSize: 12 }}>Tap to select a photo</p>
            </label>

            <p style={{ color: '#a78bfa', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>Or pick a sample:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {SAMPLE_IMAGES.map((s, i) => (
                <button key={i} onClick={() => loadSample(s.url)} style={{ position: 'relative', aspectRatio: '16/10', borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(168,85,247,0.3)', cursor: 'pointer', padding: 0, background: 'none' }}>
                  <img src={s.url} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 8px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 11, textAlign: 'center' }}>{s.name}</div>
                </button>
              ))}
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.22)' }}>
              <p style={{ color: '#a78bfa', fontSize: 12, marginBottom: 10 }}>Difficulty</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {DIFFICULTIES.map(d => (
                  <button key={d.label} onClick={() => { setNumCols(d.cols); setNumRows(d.rows) }}
                    style={{ padding: '8px 4px', borderRadius: 8, border: `1px solid ${numCols===d.cols ? 'rgba(168,85,247,0.8)' : 'rgba(168,85,247,0.25)'}`, background: numCols===d.cols ? 'rgba(168,85,247,0.3)' : 'transparent', color: '#e9d5ff', fontSize: 12, cursor: 'pointer', fontWeight: numCols===d.cols ? 700 : 400 }}>
                    {d.label}<br /><span style={{ fontSize: 10, opacity: 0.6 }}>{d.cols*d.rows}pc</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Game screen ── */}
      {image && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0e0917', fontFamily: 'ui-sans-serif,system-ui,sans-serif', overflow: 'hidden' }}>

          {/* Navbar */}
          <div style={{ flexShrink: 0, height: 50, background: 'rgba(14,9,23,0.97)', borderBottom: '1px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', zIndex: 30 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#c084fc', letterSpacing: '0.12em' }}>JIGSAW</span>
            <span style={{ fontSize: 11, color: '#a78bfa' }}>{numCols}×{numRows} · {numCols*numRows}pc</span>
            <button onClick={() => setImage(null)} style={{ ...toolBtn, width: 'auto', padding: '0 12px', fontSize: 12, height: 34 }}>New Game</button>
          </div>

          {/* Canvas — fills remaining space */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <canvas
              ref={canvasRef}
              id="jigsaw-canvas"
              style={{ display: 'block', width: '100%', height: '100%' }}
            />
          </div>

          {/* Toolbar */}
          <div style={{ flexShrink: 0, height: 60, background: 'rgba(14,9,23,0.97)', borderTop: '1px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 10px', zIndex: 30 }}>
            <button style={toolBtn} onClick={handleScatter} title="Scatter"><Sparkles size={18} /></button>
            <button style={toolBtn} onClick={() => setShowPreview(true)} title="Preview"><Eye size={18} /></button>
            <div style={{ width: 1, height: 24, background: 'rgba(168,85,247,0.3)' }} />
            <div style={{ position: 'relative' }}>
              <button style={toolBtn} onClick={() => setShowDiff(d => !d)} title="Difficulty"><Grid3X3 size={18} /></button>
              {showDiff && (
                <div style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', background: 'rgba(14,9,23,0.98)', border: '1px solid rgba(168,85,247,0.5)', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 130, zIndex: 50 }}>
                  {DIFFICULTIES.map(d => (
                    <button key={d.label} onClick={() => handleDiff(d.cols, d.rows)}
                      style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: numCols===d.cols ? 'rgba(168,85,247,0.35)' : 'transparent', color: '#e9d5ff', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: numCols===d.cols ? 700 : 400 }}>
                      {d.label} <span style={{ opacity: 0.55, fontSize: 11 }}>({d.cols*d.rows}pc)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button style={toolBtn} onClick={handleReset} title="Reset"><RotateCcw size={18} /></button>
            <div style={{ width: 1, height: 24, background: 'rgba(168,85,247,0.3)' }} />
            <button style={toolBtn} onClick={() => window.paper?.view.scale(0.87)} title="Zoom out"><Minus size={18} /></button>
            <button style={toolBtn} onClick={() => { if (window.paper && canvasRef.current) { const c = canvasRef.current; const vw = c.width/(window.devicePixelRatio||1); const vh = c.height/(window.devicePixelRatio||1); const g = gameRef.current; const showW = g.numCols*g.tileWidth+260; const showH = g.numRows*g.tileWidth+260; window.paper.view.zoom = Math.min(vw/showW, vh/showH)*0.92; window.paper.view.center = new window.paper.Point(WORLD_CX, WORLD_CY) } }} title="Fit"><Maximize2 size={16} /></button>
            <button style={toolBtn} onClick={() => window.paper?.view.scale(1.15)} title="Zoom in"><Plus size={18} /></button>
          </div>

          {/* Preview modal */}
          <AnimatePresence>
            {showPreview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowPreview(false)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                  onClick={e => e.stopPropagation()}
                  style={{ background: 'rgba(14,9,23,0.98)', borderRadius: 16, border: '1px solid rgba(168,85,247,0.5)', padding: 12, maxWidth: 360, width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#c084fc', fontWeight: 700, fontSize: 14 }}>Reference</span>
                    <button onClick={() => setShowPreview(false)} style={{ ...toolBtn, width: 28, height: 28 }}><X size={14} /></button>
                  </div>
                  <img src={imageSrc} alt="Reference" style={{ width: '100%', borderRadius: 10, display: 'block' }} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion */}
          <AnimatePresence>
            {complete && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}
                  style={{ background: 'rgba(14,9,23,0.98)', borderRadius: 20, border: '2px solid rgba(168,85,247,0.6)', padding: 32, textAlign: 'center', maxWidth: 300, width: '90%' }}>
                  <CheckCircle size={52} style={{ color: '#a855f7', margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Puzzle Complete!</p>
                  <p style={{ color: '#a78bfa', fontSize: 13, marginBottom: 24 }}>All {numCols*numRows} pieces connected</p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleReset}
                      style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(168,85,247,0.5)', background: 'rgba(168,85,247,0.2)', color: '#e9d5ff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Play Again</button>
                    <button onClick={() => setImage(null)}
                      style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(168,85,247,0.7)', background: 'rgba(168,85,247,0.4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>New Game</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}
