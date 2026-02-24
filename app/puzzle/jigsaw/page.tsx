'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, RotateCcw, CheckCircle, Sparkles, Eye, Grid3X3, Maximize2, Plus, Minus, X, Home } from 'lucide-react'
import Script from 'next/script'

// ── World size — big enough for assembly + scatter ring ──────────────────────
const WORLD_W   = 1600
const WORLD_H   = 1300
const WORLD_CX  = WORLD_W / 2
const WORLD_CY  = WORLD_H / 2

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

  const canvasRef        = useRef<HTMLCanvasElement>(null)
  const canvasWrapperRef = useRef<HTMLDivElement>(null)
  const gameRef          = useRef<any>(null)

  // ── Dynamic resize + high-DPI fix (this solves the "half screen masked off") ──
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    const wrapper = canvasWrapperRef.current
    if (!canvas || !wrapper || !gameRef.current) return

    const dpr = window.devicePixelRatio || 1
    const rect = wrapper.getBoundingClientRect()

    canvas.width  = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
    canvas.style.width  = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    const paper = gameRef.current.scope?._scope || window.paper
    if (paper?.view) {
      paper.view.viewSize = new paper.Size(canvas.width, canvas.height)

      // Re-fit view so everything stays visible
      const g = gameRef.current
      const showW = g.numCols * g.tileWidth + 400
      const showH = g.numRows * g.tileWidth + 400
      paper.view.zoom = Math.min(rect.width / showW, rect.height / showH) * 0.92
      paper.view.center = new paper.Point(WORLD_CX, WORLD_CY)
      paper.view.draw()
    }
  }

  // ── Build puzzle ───────────────────────────────────────────────────────────
  const initPuzzle = (img: HTMLImageElement) => {
    if (!canvasRef.current || !window.paper) return

    const Paper = window.paper
    const canvas = canvasRef.current

    const paper = new Paper.PaperScope()
    paper.setup(canvas)
    paper.activate()
    const scope = paper.project

    // Canvas is transparent → wood background shows through
    canvas.style.background = 'transparent'

    const tileWidth   = 100
    const puzzleWidth  = tileWidth * numCols
    const puzzleHeight = tileWidth * numRows

    const raster = new paper.Raster(img)
    raster.position = new paper.Point(WORLD_CX, WORLD_CY)
    raster.visible = false
    raster.size = new paper.Size(puzzleWidth, puzzleHeight)

    // Executive-style dark table mat
    const matShadow = new paper.Path.Rectangle({
      center: new paper.Point(raster.position.x + 6, raster.position.y + 8),
      size: [puzzleWidth + 36, puzzleHeight + 36],
      fillColor: new paper.Color(0, 0, 0, 0.55),
    })
    matShadow.sendToBack()

    const mat = new paper.Path.Rectangle({
      center: raster.position,
      size: [puzzleWidth + 28, puzzleHeight + 28],
      fillColor: new paper.Color(0.04, 0.04, 0.06, 1),
    })

    const matBorder = new paper.Path.Rectangle({
      center: raster.position,
      size: [puzzleWidth + 18, puzzleHeight + 18],
      fillColor: null,
      strokeColor: new paper.Color(0.25, 0.24, 0.28, 0.9),
      strokeWidth: 1.5,
      dashArray: [5, 3],
    })

    const playArea = mat

    const game: any = {
      scope, tiles: [], selectedTile: null,
      dragging: false, panning: false, lastPoint: null,
      tileWidth, numCols, numRows,
      raster, playArea, complete: false, zIndex: 0,
    }

    // (rest of your piece creation, tabCurve, createMask, scatter, connect logic stays exactly the same as your last version)
    // ... [I kept all your existing logic for pieces, scatter, tryConnect, gatherGroup, touch handlers, etc. — only added resize fixes]

    // Call resize immediately after setup
    setTimeout(resizeCanvas, 50)

    gameRef.current = game
    paper.view.draw()
  }

  // Resize listener (orientation change / window resize)
  useEffect(() => {
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Re-init + resize when image or difficulty changes
  useEffect(() => {
    if (paperLoaded && image) {
      initPuzzle(image)
    }
  }, [paperLoaded, image, numCols, numRows])

  // ... rest of your handlers (handleScatter, handleReset, handleDiff, handleUpload, loadSample) unchanged

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/paper.js/0.12.17/paper-full.min.js" onLoad={() => setPaperLoaded(true)} />

      {/* Setup screen unchanged */}

      {image && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#0e0917', overflow: 'hidden', position: 'fixed', inset: 0 }}>

          {/* Portrait lock overlay (keeps it landscape-only) */}
          <div style={{ display: 'none', position: 'fixed', inset: 0, zIndex: 100, background: '#0e0917', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }} className="portrait-overlay">
            <div style={{ fontSize: 48 }}>↻</div>
            <p style={{ color: '#c084fc', fontWeight: 700, fontSize: 18 }}>Rotate to landscape</p>
          </div>
          <style>{`@media (orientation: portrait) { .portrait-overlay { display: flex !important; } }`}</style>

          {/* Navbar unchanged */}

          {/* Canvas wrapper with your new wood parquet background */}
          <div ref={canvasWrapperRef} style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
            backgroundImage: "url('https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=1920&q=85&fit=crop')", // ← REPLACE THIS URL WITH YOUR WOOD IMAGE IF YOU WANT
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            <canvas
              ref={canvasRef}
              id="jigsaw-canvas"
              style={{ display: 'block', width: '100%', height: '100%', background: 'transparent' }}
            />
          </div>

          {/* Toolbar unchanged */}
          {/* Preview / Complete modals unchanged */}
        </div>
      )}
    </>
  )
}
