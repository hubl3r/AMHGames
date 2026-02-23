'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, RotateCcw, Sparkles, Eye, Grid3X3, Maximize2, Plus, Minus, CheckCircle, X } from 'lucide-react'
import Script from 'next/script'

// ── World constants ────────────────────────────────────────────────────────────
const WORLD_W     = 2200
const WORLD_H     = 1600
const ASSEMBLY_W  = 1200
const ASSEMBLY_H  = 900
const ASSEMBLY_CX = WORLD_W / 2
const ASSEMBLY_CY = WORLD_H / 2
const ASSEMBLY_X  = ASSEMBLY_CX - ASSEMBLY_W / 2   // 500
const ASSEMBLY_Y  = ASSEMBLY_CY - ASSEMBLY_H / 2   // 350
const SCATTER_W   = 1600
const SCATTER_H   = 1300

const NAVBAR_H    = 50
const TOOLBAR_H   = 60
const PAN_MARGIN  = 10
const INIT_SCALE  = 0.265
const MIN_ZOOM    = 0.05
const MAX_ZOOM    = 1.0

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
  const viewState = useRef({ panX: 0, panY: 0, scale: INIT_SCALE })

  // ── Usable screen area (between navbar and toolbar) ───────────────────────
  const getUsable = useCallback(() => {
    const cv = canvasRef.current
    const w  = cv ? cv.clientWidth  : 390
    const h  = cv ? cv.clientHeight : 660
    return { x: 0, y: NAVBAR_H, w, h: h - NAVBAR_H - TOOLBAR_H }
  }, [])

  // ── Max zoom so assembly never exceeds usable area ────────────────────────
  const getMaxZoom = useCallback(() => {
    const u = getUsable()
    return Math.min(MAX_ZOOM, u.w / ASSEMBLY_W, u.h / ASSEMBLY_H)
  }, [getUsable])

  // ── Pan clamping: assembly edge cannot cross its OPPOSITE screen edge ─────
  //   assembly RIGHT  must stay right of screen LEFT  → minX
  //   assembly LEFT   must stay left  of screen RIGHT → maxX
  //   assembly BOTTOM must stay below screen TOP      → minY
  //   assembly TOP    must stay above screen BOTTOM   → maxY
  const clampPan = useCallback((px: number, py: number, sc?: number) => {
    const s = sc ?? viewState.current.scale
    const u = getUsable()
    const M = PAN_MARGIN
    const minX = u.x + M          - (ASSEMBLY_X + ASSEMBLY_W) * s
    const maxX = u.x + u.w - M   - ASSEMBLY_X * s
    const minY = u.y + M          - (ASSEMBLY_Y + ASSEMBLY_H) * s
    const maxY = u.y + u.h - M   - ASSEMBLY_Y * s
    return {
      x: Math.max(minX, Math.min(maxX, px)),
      y: Math.max(minY, Math.min(maxY, py)),
    }
  }, [getUsable])

  // ── Apply pan/zoom to Paper.js view ──────────────────────────────────────
  const applyView = useCallback(() => {
    const p = window.paper
    if (!p?.view) return
    const { panX, panY, scale } = viewState.current
    const u   = getUsable()
    const scx = u.x + u.w / 2
    const scy = u.y + u.h / 2
    p.view.zoom   = scale
    p.view.center = new p.Point((scx - panX) / scale, (scy - panY) / scale)
  }, [getUsable])

  // ── Center assembly in usable area ────────────────────────────────────────
  const centerAssembly = useCallback((sc?: number) => {
    const s = sc ?? viewState.current.scale
    const u = getUsable()
    const rawX = (u.x + u.w / 2) - ASSEMBLY_CX * s
    const rawY = (u.y + u.h / 2) - ASSEMBLY_CY * s
    const c    = clampPan(rawX, rawY, s)
    viewState.current = { panX: c.x, panY: c.y, scale: s }
  }, [getUsable, clampPan])

  // ── Build puzzle ──────────────────────────────────────────────────────────
  const initPuzzle = useCallback((img: HTMLImageElement, cols: number, rows: number) => {
    if (!canvasRef.current || !window.paper) return
    const paper  = window.paper
    const canvas = canvasRef.current

    // Tear down previous
    if (gameRef.current?.tool) gameRef.current.tool.remove()
    paper.setup(canvas)
    paper.view.viewSize = new paper.Size(WORLD_W, WORLD_H)
    const scope = paper.project

    // Raster
    const raster = new paper.Raster(img)
    raster.position = new paper.Point(ASSEMBLY_CX, ASSEMBLY_CY)
    raster.size     = new paper.Size(ASSEMBLY_W, ASSEMBLY_H)
    raster.visible  = false

    const tileW = ASSEMBLY_W / cols
    const tileH = ASSEMBLY_H / rows

    // Assembly zone
    new paper.Path.Rectangle({
      point:  [ASSEMBLY_X, ASSEMBLY_Y],
      size:   [ASSEMBLY_W, ASSEMBLY_H],
      fillColor:   new paper.Color(0, 0, 0, 0.12),
      strokeColor: new paper.Color(0.66, 0.33, 0.97, 0.3),
      strokeWidth: 2,
      dashArray:   [8, 5],
    }).guide = true

    const game: any = {
      scope, tiles: [], selectedTile: null,
      dragging: false, panning: false, lastPoint: null,
      complete: false, zIndex: 0, tool: null,
    }

    // Tab curve (normalised to 0-100)
    const TC = [0,0,35,15,37,5,37,5,40,0,38,-5,38,-5,20,-20,50,-20,50,-20,80,-20,62,-5,62,-5,60,0,63,5,63,5,65,15,100,0]

    // Tab pattern
    const tabPat: number[][] = []
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const top    = y === 0      ? 0 : -tabPat[(y-1)*cols+x][2]
        const left   = x === 0      ? 0 : -tabPat[y*cols+(x-1)][1]
        const right  = x === cols-1 ? 0 : Math.random()>.5 ? 1 : -1
        const bottom = y === rows-1 ? 0 : Math.random()>.5 ? 1 : -1
        tabPat.push([top, right, bottom, left])
      }
    }

    const createMask = (gx: number, gy: number) => {
      const tw = tileW, th = tileH
      const sx = tw / 100, sy = th / 100
      const pat = tabPat[gy * cols + gx]
      const path = new paper.Path()
      path.moveTo([0, 0])

      // Top
      if (gy > 0 && pat[0] !== 0) {
        const d = pat[0]
        for (let i = 0; i < TC.length; i += 6)
          path.cubicCurveTo([TC[i]*sx, d*TC[i+1]*sy], [TC[i+2]*sx, d*TC[i+3]*sy], [TC[i+4]*sx, d*TC[i+5]*sy])
      } else path.lineTo([tw, 0])

      // Right
      if (gx < cols-1 && pat[1] !== 0) {
        const d = pat[1]
        for (let i = 0; i < TC.length; i += 6)
          path.cubicCurveTo([tw-d*TC[i+1]*sx, TC[i]*sy], [tw-d*TC[i+3]*sx, TC[i+2]*sy], [tw-d*TC[i+5]*sx, TC[i+4]*sy])
      } else path.lineTo([tw, th])

      // Bottom
      if (gy < rows-1 && pat[2] !== 0) {
        const d = pat[2]
        for (let i = 0; i < TC.length; i += 6)
          path.cubicCurveTo([tw-TC[i]*sx, th-d*TC[i+1]*sy], [tw-TC[i+2]*sx, th-d*TC[i+3]*sy], [tw-TC[i+4]*sx, th-d*TC[i+5]*sy])
      } else path.lineTo([0, th])

      // Left
      if (gx > 0 && pat[3] !== 0) {
        const d = pat[3]
        for (let i = 0; i < TC.length; i += 6)
          path.cubicCurveTo([d*TC[i+1]*sx, th-TC[i]*sy], [d*TC[i+3]*sx, th-TC[i+2]*sy], [d*TC[i+5]*sx, th-TC[i+4]*sy])
      } else path.lineTo([0, 0])

      path.closePath()
      path.fillColor = new paper.Color(0, 0, 0, 0.01)
      path.offsets = [0 - path.bounds.left, 0 - path.bounds.top, path.bounds.right - tw, path.bounds.bottom - th]
      return path
    }

    // Build pieces
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const mask = createMask(x, y)
        const mg   = 20
        const pr   = raster.getSubRaster(new paper.Rectangle(x*tileW - mg, y*tileH - mg, tileW + mg*2, tileH + mg*2))
        pr.position = new paper.Point(tileW/2, tileH/2)

        const outline = mask.clone()
        outline.strokeColor = new paper.Color('rgba(255,255,255,0.22)')
        outline.strokeWidth = 1
        outline.fillColor   = null

        const group = new paper.Group([mask, pr, outline])
        group.clipped      = true
        group.gridPosition = new paper.Point(x, y)
        group.pieceGroup   = [group]
        group.offsets      = mask.offsets
        game.tiles.push(group)
      }
    }

    // Helpers
    const getCenter = (t: any) => {
      const [ol, ot, or_, ob] = t.offsets
      return t.position.add(new paper.Point((ol - or_)/2, (ot - ob)/2))
    }
    const setCenter = (t: any, target: any) => {
      t.position = target.add(t.position).subtract(getCenter(t))
    }
    const setNatural = (t: any) => {
      const origin = new paper.Point(ASSEMBLY_X, ASSEMBLY_Y)
      setCenter(t, t.gridPosition.add(new paper.Point(.5,.5)).multiply(new paper.Point(tileW, tileH)).add(origin))
    }

    game.tiles.forEach((t: any) => setNatural(t))

    // Scatter pieces in ring around assembly
    const doScatter = () => {
      const cx = ASSEMBLY_CX, cy = ASSEMBLY_CY
      const hw = SCATTER_W / 2, hh = SCATTER_H / 2
      const shuffled = [...game.tiles].sort(() => Math.random() - 0.5)
      shuffled.forEach((tile: any) => {
        let tx = cx, ty = cy, att = 0
        do {
          const side = Math.floor(Math.random() * 4)
          if      (side === 0) { tx = cx - ASSEMBLY_W/2 - 30 - Math.random()*(hw - ASSEMBLY_W/2); ty = cy + (Math.random()-.5)*SCATTER_H }
          else if (side === 1) { tx = cx + ASSEMBLY_W/2 + 30 + Math.random()*(hw - ASSEMBLY_W/2); ty = cy + (Math.random()-.5)*SCATTER_H }
          else if (side === 2) { tx = cx + (Math.random()-.5)*SCATTER_W; ty = cy - ASSEMBLY_H/2 - 30 - Math.random()*(hh - ASSEMBLY_H/2) }
          else                 { tx = cx + (Math.random()-.5)*SCATTER_W; ty = cy + ASSEMBLY_H/2 + 30 + Math.random()*(hh - ASSEMBLY_H/2) }
          att++
        } while (att < 50 && Math.abs(tx-cx) < ASSEMBLY_W/2+20 && Math.abs(ty-cy) < ASSEMBLY_H/2+20)
        setCenter(tile, new paper.Point(tx, ty))
      })
      paper.view.draw()
    }
    doScatter()
    game.scatter = doScatter

    // Gather group
    const gatherGroup = (anchor: any) => {
      const ac = getCenter(anchor)
      for (const p of anchor.pieceGroup) {
        if (p === anchor) continue
        const off = p.gridPosition.subtract(anchor.gridPosition).multiply(new paper.Point(tileW, tileH))
        setCenter(p, ac.add(off))
      }
      paper.view.draw()
    }

    // Try connect
    const tryConnect = () => {
      if (!game.selectedTile) return
      const thresh = Math.min(tileW, tileH) / 8
      const toConnect: any[] = []
      for (const tile of game.selectedTile.pieceGroup) {
        const tc = getCenter(tile)
        for (const {dx, dy} of [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}]) {
          const nb = game.tiles.find((t: any) => t.gridPosition.x === tile.gridPosition.x+dx && t.gridPosition.y === tile.gridPosition.y+dy)
          if (!nb || tile.pieceGroup.includes(nb)) continue
          const exp  = tc.add(new paper.Point(dx*tileW, dy*tileH))
          const dist = Math.abs(exp.x - getCenter(nb).x) + Math.abs(exp.y - getCenter(nb).y)
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

    // ── Mouse tool ──────────────────────────────────────────────────────────
    const tool = new paper.Tool()
    game.tool  = tool

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
        // delta in world coords → convert to screen delta
        const d    = e.point.subtract(game.lastPoint)
        const s    = viewState.current.scale
        const rawX = viewState.current.panX + d.x * s
        const rawY = viewState.current.panY + d.y * s
        const c    = clampPan(rawX, rawY)
        viewState.current = { ...viewState.current, panX: c.x, panY: c.y }
        applyView(); game.lastPoint = e.point
      }
    }

    tool.onMouseUp = () => {
      if (game.dragging && game.selectedTile) { tryConnect(); game.selectedTile = null }
      game.dragging = false; game.panning = false; game.lastPoint = null
    }

    // ── Touch ───────────────────────────────────────────────────────────────
    let lastT: Touch[] = [], lpd = 0, lmx = 0, lmy = 0
    let tDragPiece = false, tPan = false

    const toWorld = (t: Touch) => {
      const r = canvas.getBoundingClientRect()
      return paper.view.viewToProject(new paper.Point(
        (t.clientX - r.left) * (WORLD_W / r.width),
        (t.clientY - r.top)  * (WORLD_H / r.height),
      ))
    }

    canvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault()
      const ts = Array.from(e.touches); lastT = ts
      if (ts.length === 1 && !game.complete) {
        const pt  = toWorld(ts[0])
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
        tPan = true; game.lastPoint = pt
      } else if (ts.length === 2) {
        tDragPiece = false; tPan = false
        lpd = Math.hypot(ts[0].clientX-ts[1].clientX, ts[0].clientY-ts[1].clientY)
        lmx = (ts[0].clientX+ts[1].clientX)/2; lmy = (ts[0].clientY+ts[1].clientY)/2
      }
    }, { passive: false })

    canvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault()
      const ts = Array.from(e.touches)
      if (ts.length === 1) {
        const pt = toWorld(ts[0])
        if (tDragPiece && game.selectedTile && game.lastPoint) {
          const d = pt.subtract(game.lastPoint)
          game.selectedTile.pieceGroup.forEach((p: any) => p.position = p.position.add(d))
          game.lastPoint = pt; paper.view.draw()
        } else if (tPan && game.lastPoint) {
          const d    = pt.subtract(game.lastPoint)
          const s    = viewState.current.scale
          const rawX = viewState.current.panX + d.x * s
          const rawY = viewState.current.panY + d.y * s
          const c    = clampPan(rawX, rawY)
          viewState.current = { ...viewState.current, panX: c.x, panY: c.y }
          applyView(); game.lastPoint = pt
        }
      } else if (ts.length === 2) {
        const d    = Math.hypot(ts[0].clientX-ts[1].clientX, ts[0].clientY-ts[1].clientY)
        const mx   = (ts[0].clientX+ts[1].clientX)/2
        const my   = (ts[0].clientY+ts[1].clientY)/2
        if (lpd > 0) {
          const ns   = Math.max(MIN_ZOOM, Math.min(getMaxZoom(), viewState.current.scale * d/lpd))
          const sf   = ns / viewState.current.scale
          const rawX = mx - (mx - viewState.current.panX)*sf + (mx - lmx)
          const rawY = my - (my - viewState.current.panY)*sf + (my - lmy)
          const c    = clampPan(rawX, rawY, ns)
          viewState.current = { panX: c.x, panY: c.y, scale: ns }; applyView()
        }
        lpd = d; lmx = mx; lmy = my
      }
      lastT = ts
    }, { passive: false })

    canvas.addEventListener('touchend', (e: TouchEvent) => {
      const ts = Array.from(e.touches)
      if (ts.length === 0) {
        if (tDragPiece && game.selectedTile) { tryConnect(); game.selectedTile = null }
        tDragPiece = false; tPan = false; game.lastPoint = null; lpd = 0
      }
      lastT = ts
    }, { passive: false })

    // Wheel zoom
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()
      const ns   = Math.max(MIN_ZOOM, Math.min(getMaxZoom(), viewState.current.scale * (e.deltaY > 0 ? 0.92 : 1.08)))
      const r    = canvas.getBoundingClientRect()
      const mx   = e.clientX - r.left
      const my   = e.clientY - r.top
      const sf   = ns / viewState.current.scale
      const c    = clampPan(mx-(mx-viewState.current.panX)*sf, my-(my-viewState.current.panY)*sf, ns)
      viewState.current = { panX: c.x, panY: c.y, scale: ns }; applyView()
    }, { passive: false })

    gameRef.current = game

    // Center and render after layout
    requestAnimationFrame(() => requestAnimationFrame(() => {
      centerAssembly(INIT_SCALE)
      applyView()
      paper.view.draw()
    }))
  }, [clampPan, applyView, centerAssembly, getMaxZoom])

  // ── Toolbar actions ────────────────────────────────────────────────────────
  const handleScatter = () => gameRef.current?.scatter?.()

  const handleFit = () => { centerAssembly(INIT_SCALE); applyView() }

  const handleZoom = (dir: 1 | -1) => {
    const ns   = Math.max(MIN_ZOOM, Math.min(getMaxZoom(), viewState.current.scale * (dir > 0 ? 1.15 : 0.87)))
    const u    = getUsable()
    const cx   = u.x + u.w / 2, cy = u.y + u.h / 2
    const sf   = ns / viewState.current.scale
    const c    = clampPan(cx-(cx-viewState.current.panX)*sf, cy-(cy-viewState.current.panY)*sf, ns)
    viewState.current = { panX: c.x, panY: c.y, scale: ns }; applyView()
  }

  const handleDiff = (cols: number, rows: number) => {
    setNumCols(cols); setNumRows(rows); setShowDiff(false); setComplete(false)
    if (image) setTimeout(() => initPuzzle(image, cols, rows), 50)
  }

  const handleImageLoad = (img: HTMLImageElement, src: string) => {
    setImage(img); setImageSrc(src); setComplete(false)
    setTimeout(() => initPuzzle(img, numCols, numRows), 100)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image(); img.onload = () => handleImageLoad(img, url); img.src = url
  }

  const handleSample = (url: string) => {
    const img = new Image(); img.crossOrigin = 'anonymous'
    img.onload = () => handleImageLoad(img, url); img.src = url
  }

  useEffect(() => { if (paperLoaded && image) initPuzzle(image, numCols, numRows) }, [paperLoaded])

  const btn: React.CSSProperties = {
    width: 38, height: 38, borderRadius: 10,
    background: 'rgba(168,85,247,0.15)',
    border: '1px solid rgba(168,85,247,0.35)',
    color: '#c084fc', display: 'flex', alignItems: 'center',
    justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0,
  }

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js" onLoad={() => setPaperLoaded(true)} />

      <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,#1a1423,#2d1b3d,#1a1423)', overflow: 'hidden', fontFamily: 'ui-sans-serif,system-ui,sans-serif' }}>

        {/* ── Setup ── */}
        {!image && (
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '40px 20px 40px' }}>
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <h1 style={{ textAlign: 'center', fontSize: 38, fontWeight: 900, color: '#c084fc', letterSpacing: '0.12em', marginBottom: 4 }}>JIGSAW</h1>
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
                  <button key={i} onClick={() => handleSample(s.url)} style={{ position: 'relative', aspectRatio: '16/10', borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(168,85,247,0.3)', cursor: 'pointer', padding: 0, background: 'none' }}>
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

        {/* ── Game ── */}
        {image && (
          <>
            <canvas ref={canvasRef} id="jigsaw-canvas"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />

            {/* Navbar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: NAVBAR_H, background: 'rgba(14,9,23,0.96)', borderBottom: '1px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', zIndex: 30 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#c084fc', letterSpacing: '0.12em' }}>JIGSAW</span>
              <span style={{ fontSize: 11, color: '#a78bfa' }}>{numCols}×{numRows} · {numCols*numRows}pc</span>
              <button onClick={() => setImage(null)} style={{ ...btn, width: 'auto', padding: '0 12px', fontSize: 12, height: 34 }}>New Game</button>
            </div>

            {/* Toolbar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: TOOLBAR_H, background: 'rgba(14,9,23,0.96)', borderTop: '1px solid rgba(168,85,247,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 10px', zIndex: 30 }}>
              <button style={btn} onClick={handleScatter}><Sparkles size={17} /></button>
              <button style={btn} onClick={() => setShowPreview(true)}><Eye size={17} /></button>
              <div style={{ width: 1, height: 22, background: 'rgba(168,85,247,0.3)' }} />
              <div style={{ position: 'relative' }}>
                <button style={btn} onClick={() => setShowDiff(d => !d)}><Grid3X3 size={17} /></button>
                {showDiff && (
                  <div style={{ position: 'absolute', bottom: 46, left: '50%', transform: 'translateX(-50%)', background: 'rgba(14,9,23,0.97)', border: '1px solid rgba(168,85,247,0.5)', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 130, zIndex: 50 }}>
                    {DIFFICULTIES.map(d => (
                      <button key={d.label} onClick={() => handleDiff(d.cols, d.rows)}
                        style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: numCols===d.cols ? 'rgba(168,85,247,0.35)' : 'transparent', color: '#e9d5ff', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontWeight: numCols===d.cols ? 700 : 400 }}>
                        {d.label} <span style={{ opacity: 0.55, fontSize: 11 }}>({d.cols*d.rows}pc)</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button style={btn} onClick={() => { setComplete(false); if (image) initPuzzle(image, numCols, numRows) }}><RotateCcw size={17} /></button>
              <div style={{ width: 1, height: 22, background: 'rgba(168,85,247,0.3)' }} />
              <button style={btn} onClick={() => handleZoom(-1)}><Minus size={17} /></button>
              <button style={btn} onClick={handleFit}><Maximize2 size={15} /></button>
              <button style={btn} onClick={() => handleZoom(1)}><Plus size={17} /></button>
            </div>

            {/* Preview modal */}
            <AnimatePresence>
              {showPreview && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowPreview(false)}
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'rgba(14,9,23,0.98)', borderRadius: 16, border: '1px solid rgba(168,85,247,0.5)', padding: 12, maxWidth: 360, width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ color: '#c084fc', fontWeight: 700, fontSize: 14 }}>Reference</span>
                      <button onClick={() => setShowPreview(false)} style={{ ...btn, width: 28, height: 28 }}><X size={14} /></button>
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
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}
                    style={{ background: 'rgba(14,9,23,0.98)', borderRadius: 20, border: '2px solid rgba(168,85,247,0.6)', padding: 32, textAlign: 'center', maxWidth: 300, width: '90%' }}>
                    <CheckCircle size={52} style={{ color: '#a855f7', margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Puzzle Complete!</p>
                    <p style={{ color: '#a78bfa', fontSize: 13, marginBottom: 24 }}>All {numCols*numRows} pieces connected</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => { setComplete(false); if (image) initPuzzle(image, numCols, numRows) }}
                        style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(168,85,247,0.5)', background: 'rgba(168,85,247,0.2)', color: '#e9d5ff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Play Again</button>
                      <button onClick={() => setImage(null)}
                        style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(168,85,247,0.7)', background: 'rgba(168,85,247,0.4)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>New Game</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </>
  )
}
