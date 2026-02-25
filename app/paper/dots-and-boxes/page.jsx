"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAYER_COLORS = ["#e63946", "#457b9d", "#2a9d8f", "#e9c46a"];
const PLAYER_BG     = ["#fff5f5", "#f0f7fa", "#f0faf8", "#fffbf0"];

const GRID_OPTIONS = [6, 8, 10];
const MODE_OPTIONS = [
  { id: "2p",  label: "2 Players" },
  { id: "3p",  label: "3 Players" },
  { id: "4p",  label: "4 Players" },
  { id: "cpu", label: "vs Computer" },
];

// Base cell size — will be scaled down via CSS transform to fit container
const BASE_CELL = 72;

function numPlayers(mode) {
  if (mode === "3p") return 3;
  if (mode === "4p") return 4;
  return 2;
}

// ─── Pure game helpers ────────────────────────────────────────────────────────

function makeLines(n) {
  return {
    horizontal: Array(n + 1).fill(null).map(() => Array(n).fill(0)),
    vertical:   Array(n).fill(null).map(() => Array(n + 1).fill(0)),
  };
}
function makeBoxes(n) {
  return Array(n).fill(null).map(() => Array(n).fill(0));
}

function checkBox(lines, boxes, r, c) {
  return (
    lines.horizontal[r][c]     !== 0 &&
    lines.horizontal[r + 1][c] !== 0 &&
    lines.vertical[r][c]       !== 0 &&
    lines.vertical[r][c + 1]   !== 0 &&
    boxes[r][c] === 0
  );
}

// Returns null if line already taken, otherwise { lines, boxes, scored }
function applyLine(lines, boxes, type, row, col, player, n) {
  if (lines[type][row][col] !== 0) return null;
  const nl = {
    horizontal: lines.horizontal.map(r => [...r]),
    vertical:   lines.vertical.map(r => [...r]),
  };
  nl[type][row][col] = player;
  const nb = boxes.map(r => [...r]);
  let scored = 0;

  if (type === "horizontal") {
    if (row > 0 && checkBox(nl, nb, row - 1, col)) { nb[row - 1][col] = player; scored++; }
    if (row < n && checkBox(nl, nb, row, col))      { nb[row][col]     = player; scored++; }
  } else {
    if (col > 0 && checkBox(nl, nb, row, col - 1)) { nb[row][col - 1] = player; scored++; }
    if (col < n && checkBox(nl, nb, row, col))      { nb[row][col]     = player; scored++; }
  }
  return { lines: nl, boxes: nb, scored };
}

// ─── AI ───────────────────────────────────────────────────────────────────────

function getAllMoves(lines, n) {
  const moves = [];
  for (let r = 0; r <= n; r++)
    for (let c = 0; c < n; c++)
      if (lines.horizontal[r][c] === 0) moves.push({ type: "horizontal", row: r, col: c });
  for (let r = 0; r < n; r++)
    for (let c = 0; c <= n; c++)
      if (lines.vertical[r][c] === 0) moves.push({ type: "vertical", row: r, col: c });
  return moves;
}

function countSides(lines, r, c) {
  return (
    (lines.horizontal[r][c]     !== 0 ? 1 : 0) +
    (lines.horizontal[r + 1][c] !== 0 ? 1 : 0) +
    (lines.vertical[r][c]       !== 0 ? 1 : 0) +
    (lines.vertical[r][c + 1]   !== 0 ? 1 : 0)
  );
}

function pickAiMove(lines, boxes, n) {
  const moves = getAllMoves(lines, n);
  if (!moves.length) return null;
  // 1) score immediately
  for (const m of moves) {
    const res = applyLine(lines, boxes, m.type, m.row, m.col, 2, n);
    if (res && res.scored > 0) return m;
  }
  // 2) don't give opponent a 3-sided box
  const safe = moves.filter(m => {
    const res = applyLine(lines, boxes, m.type, m.row, m.col, 2, n);
    if (!res) return false;
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++)
        if (res.boxes[r][c] === 0 && countSides(res.lines, r, c) === 3) return false;
    return true;
  });
  const pool = safe.length ? safe : moves;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Buttons ──────────────────────────────────────────────────────────────────

function Btn({ onClick, children, active, small, outline }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Work Sans', sans-serif",
        fontWeight: 600,
        fontSize: small ? "0.78rem" : "0.88rem",
        padding: small ? "0.38rem 0.9rem" : "0.65rem 1.8rem",
        border: "2px solid #2b2d42",
        borderRadius: 50,
        cursor: "pointer",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        transition: "all 0.2s ease",
        transform: hov && !active ? "translateY(-1px)" : "none",
        background: active ? "#2b2d42" : (hov ? "#f0f0f0" : "transparent"),
        color: active ? "#fff" : "#2b2d42",
        boxShadow: active ? "0 4px 14px rgba(43,45,66,0.22)" : "none",
      }}
    >{children}</button>
  );
}

function PrimaryBtn({ onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Work Sans', sans-serif",
        fontSize: "0.88rem", fontWeight: 600,
        padding: "0.7rem 2rem",
        background: hov ? "#1a1b2e" : "#2b2d42",
        color: "#fff", border: "none", borderRadius: 50,
        cursor: "pointer", textTransform: "uppercase",
        letterSpacing: "0.1em",
        boxShadow: "0 4px 14px rgba(43,45,66,0.2)",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "all 0.2s ease",
      }}
    >{children}</button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DotsAndBoxes() {
  // settings
  const [mode,    setMode]    = useState("2p");
  const [grid,    setGrid]    = useState(6);
  const [started, setStarted] = useState(false);

  // game state — all kept in a single ref for the AI loop, mirrored to React state for rendering
  const [gameState, setGameState] = useState(null);
  const gsRef = useRef(null);

  const [showModal,   setShowModal]   = useState(false);
  const [finalScores, setFinalScores] = useState(null);

  // board container measurement for responsive scaling
  const boardContainerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const np    = numPlayers(mode);
  const cpuOn = mode === "cpu";

  // AI scheduling
  const aiTimer   = useRef(null);
  const aiRunning = useRef(false);

  // ── responsive scale ──────────────────────────────────────────────────────

  useEffect(() => {
    function measure() {
      if (!boardContainerRef.current) return;
      const available = boardContainerRef.current.clientWidth - 32; // inner padding
      const boardPx   = grid * BASE_CELL;
      setScale(Math.min(1, available / boardPx));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [grid, started]);

  // ── start / reset ─────────────────────────────────────────────────────────

  const startGame = useCallback((m, g) => {
    clearTimeout(aiTimer.current);
    aiRunning.current = false;
    const gs = {
      lines:   makeLines(g),
      boxes:   makeBoxes(g),
      scores:  [0, 0, 0, 0],
      current: 1,
      np:      numPlayers(m),
      n:       g,
      cpuOn:   m === "cpu",
    };
    gsRef.current = gs;
    setGameState({ ...gs });
    setShowModal(false);
    setFinalScores(null);
    setStarted(true);
  }, []);

  // ── core: apply a move to a gs snapshot, return next gs ──────────────────

  const applyMove = useCallback((gs, type, row, col) => {
    const res = applyLine(gs.lines, gs.boxes, type, row, col, gs.current, gs.n);
    if (!res) return null;

    const ns = [...gs.scores];
    ns[gs.current - 1] += res.scored;
    const total = ns.slice(0, gs.np).reduce((a, b) => a + b, 0);
    const gameOver = total === gs.n * gs.n;

    // player keeps turn if they scored, otherwise next player
    const next = (!gameOver && res.scored > 0) ? gs.current : (gs.current % gs.np) + 1;

    return { ...gs, lines: res.lines, boxes: res.boxes, scores: ns, current: next, gameOver };
  }, []);

  // ── commit gs → React state ───────────────────────────────────────────────

  const commit = useCallback((gs) => {
    gsRef.current = gs;
    setGameState({ ...gs });
    if (gs.gameOver) {
      setTimeout(() => { setFinalScores([...gs.scores]); setShowModal(true); }, 350);
    }
  }, []);

  // ── AI loop (runs inside a chained setTimeout so it can keep scoring) ─────

  const runAi = useCallback(() => {
    if (aiRunning.current) return;
    aiRunning.current = true;

    function step() {
      const gs = gsRef.current;
      if (!gs || !gs.cpuOn || gs.current !== 2 || gs.gameOver) {
        aiRunning.current = false;
        return;
      }
      const move = pickAiMove(gs.lines, gs.boxes, gs.n);
      if (!move) { aiRunning.current = false; return; }

      const next = applyMove(gs, move.type, move.row, move.col);
      if (!next) { aiRunning.current = false; return; }

      commit(next);

      if (!next.gameOver && next.current === 2) {
        // AI scored — chain immediately after short delay
        aiTimer.current = setTimeout(step, 400);
      } else {
        aiRunning.current = false;
      }
    }

    aiTimer.current = setTimeout(step, 550);
  }, [applyMove, commit]);

  // Trigger AI when it becomes CPU's turn
  useEffect(() => {
    if (!started || !cpuOn || !gameState) return;
    if (gameState.current === 2 && !gameState.gameOver) {
      runAi();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.current, gameState?.gameOver, started, cpuOn]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(aiTimer.current), []);

  // ── human click ───────────────────────────────────────────────────────────

  const handleClick = useCallback((type, row, col) => {
    const gs = gsRef.current;
    if (!gs || gs.gameOver) return;
    if (gs.cpuOn && gs.current === 2) return;
    const next = applyMove(gs, type, row, col);
    if (next) commit(next);
  }, [applyMove, commit]);

  // ── derived ───────────────────────────────────────────────────────────────

  const playerName = (i) => (cpuOn && i === 1 ? "CPU" : `P${i + 1}`);

  const winnerInfo = () => {
    if (!finalScores) return { text: "", color: "#2b2d42" };
    const best = Math.max(...finalScores.slice(0, np));
    const wIdx = finalScores.slice(0, np).reduce((a, s, i) => s === best ? [...a, i] : a, []);
    if (wIdx.length > 1) return { text: `It's a Tie! (${best})`, color: "#2b2d42" };
    const i = wIdx[0];
    const name = cpuOn && i === 1 ? "Computer" : `Player ${i + 1}`;
    return { text: `${name} Wins! (${best})`, color: PLAYER_COLORS[i] };
  };

  // ── Setup screen ──────────────────────────────────────────────────────────

  if (!started) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet" />
        <div style={{
          fontFamily: "'Work Sans', sans-serif",
          background: "linear-gradient(135deg, #f5f3f4 0%, #e8e8e4 100%)",
          minHeight: "100vh",
          display: "flex", justifyContent: "center", alignItems: "center",
          padding: "2rem", color: "#2b2d42",
        }}>
          <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.5rem", marginBottom: "0.4rem", letterSpacing: "0.05em" }}>
              DOTS & BOXES
            </h1>
            <p style={{ fontSize: "0.85rem", color: "#8d99ae", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: "2.5rem" }}>
              Connect the Dots
            </p>

            <div style={{ background: "#fff", borderRadius: 24, padding: "2.5rem", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
              <div style={{ marginBottom: "1.8rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "#8d99ae", marginBottom: "0.75rem" }}>
                  Game Mode
                </div>
                <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", justifyContent: "center" }}>
                  {MODE_OPTIONS.map(o => (
                    <Btn key={o.id} active={mode === o.id} onClick={() => setMode(o.id)} small>{o.label}</Btn>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", color: "#8d99ae", marginBottom: "0.75rem" }}>
                  Grid Size
                </div>
                <div style={{ display: "flex", gap: "0.45rem", justifyContent: "center" }}>
                  {GRID_OPTIONS.map(g => (
                    <Btn key={g} active={grid === g} onClick={() => setGrid(g)} small>{g}×{g}</Btn>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", marginBottom: "2rem" }}>
                {Array(numPlayers(mode)).fill(null).map((_, i) => (
                  <div key={i} style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: PLAYER_COLORS[i],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: "0.8rem",
                    boxShadow: `0 3px 10px ${PLAYER_COLORS[i]}55`,
                  }}>
                    {mode === "cpu" && i === 1 ? "AI" : `P${i + 1}`}
                  </div>
                ))}
              </div>

              <PrimaryBtn onClick={() => startGame(mode, grid)}>Start Game</PrimaryBtn>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Game screen ───────────────────────────────────────────────────────────

  const gs         = gameState;
  const current    = gs?.current ?? 1;
  const scores     = gs?.scores  ?? [0, 0, 0, 0];
  const lines      = gs?.lines   ?? makeLines(grid);
  const boxes      = gs?.boxes   ?? makeBoxes(grid);
  const isAiTurn   = cpuOn && current === 2;

  const boardPx    = grid * BASE_CELL;
  const { text: wText, color: wColor } = winnerInfo();

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet" />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .dab-h:hover { opacity: 0.65 !important; background: #2b2d42 !important; }
        .dab-v:hover { opacity: 0.65 !important; background: #2b2d42 !important; }
        @keyframes popIn { from { opacity:0; transform:scale(0.6); } to { opacity:1; transform:scale(1); } }
        .dab-box { animation: popIn 0.28s cubic-bezier(0.175,0.885,0.32,1.275) forwards; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ai-blink { animation: blink 0.85s infinite; }
      `}</style>

      <div style={{
        fontFamily: "'Work Sans', sans-serif",
        background: "linear-gradient(135deg, #f5f3f4 0%, #e8e8e4 100%)",
        minHeight: "100vh",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: "1.5rem 1rem",
        color: "#2b2d42",
      }}>
        <div style={{ width: "100%", maxWidth: 860 }}>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.6rem", textAlign: "center",
            marginBottom: "0.2rem", letterSpacing: "0.05em",
          }}>DOTS & BOXES</h1>
          <p style={{
            textAlign: "center", fontSize: "0.72rem", color: "#8d99ae",
            marginBottom: "1.2rem", letterSpacing: "0.2em",
            textTransform: "uppercase", fontWeight: 600,
          }}>Connect the Dots</p>

          <div
            ref={boardContainerRef}
            style={{
              background: "#fff", borderRadius: 24, padding: "1.4rem 1.5rem",
              boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            }}
          >
            {/* Compact scoreboard */}
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
              {Array(np).fill(null).map((_, i) => {
                const p = i + 1;
                const isActive = current === p;
                const col = PLAYER_COLORS[i];
                return (
                  <div key={p} style={{
                    display: "flex", alignItems: "center", gap: "0.35rem",
                    padding: "0.28rem 0.65rem",
                    borderRadius: 50,
                    background: isActive ? PLAYER_BG[i] : "#f8f9fa",
                    border: `2px solid ${isActive ? col : "transparent"}`,
                    transform: isActive ? "translateY(-2px)" : "none",
                    boxShadow: isActive ? `0 3px 10px ${col}28` : "none",
                    transition: "all 0.25s ease",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                    <span style={{
                      fontSize: "0.68rem", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.06em",
                      color: isActive ? "#2b2d42" : "#8d99ae",
                    }}>{playerName(i)}</span>
                    <span style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1rem", fontWeight: 700, color: col,
                    }}>{scores[i]}</span>
                  </div>
                );
              })}
            </div>

            {isAiTurn && (
              <div className="ai-blink" style={{
                textAlign: "center", fontSize: "0.72rem", color: "#8d99ae",
                fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}>Computer is thinking…</div>
            )}

            {/* Board — fixed pixel size, CSS-scaled to fit container */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.2rem" }}>
              <div style={{
                width:  boardPx * scale,
                height: boardPx * scale,
                flexShrink: 0,
              }}>
                <div style={{
                  position: "relative",
                  width:  boardPx,
                  height: boardPx,
                  transformOrigin: "top left",
                  transform: `scale(${scale})`,
                }}>

                  {/* Boxes */}
                  {boxes.map((rowArr, r) =>
                    rowArr.map((owner, c) => {
                      if (!owner) return null;
                      const col = PLAYER_COLORS[owner - 1];
                      return (
                        <div key={`bx-${r}-${c}`} className="dab-box" style={{
                          position: "absolute",
                          left: c * BASE_CELL + 5, top: r * BASE_CELL + 5,
                          width: BASE_CELL - 10, height: BASE_CELL - 10,
                          borderRadius: 7,
                          background: `linear-gradient(135deg, ${col}20, ${col}3a)`,
                          border: `1.5px solid ${col}50`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1rem", fontWeight: 700, color: col,
                        }}>
                          {cpuOn && owner === 2 ? "AI" : owner}
                        </div>
                      );
                    })
                  )}

                  {/* Horizontal lines */}
                  {lines.horizontal.map((rowArr, r) =>
                    rowArr.map((owner, c) => {
                      const filled = owner !== 0;
                      const col = filled ? PLAYER_COLORS[owner - 1] : "#8d99ae";
                      return (
                        <div
                          key={`h-${r}-${c}`}
                          className={(!filled && !isAiTurn) ? "dab-h" : ""}
                          onClick={(!filled && !isAiTurn) ? () => handleClick("horizontal", r, c) : undefined}
                          style={{
                            position: "absolute",
                            left: c * BASE_CELL, top: r * BASE_CELL,
                            width: BASE_CELL, height: 6,
                            background: col,
                            transform: "translateY(-50%)",
                            opacity: filled ? 1 : 0.27,
                            cursor: (!filled && !isAiTurn) ? "pointer" : "default",
                            borderRadius: 3,
                            transition: "opacity 0.15s, background 0.15s",
                          }}
                        />
                      );
                    })
                  )}

                  {/* Vertical lines */}
                  {lines.vertical.map((rowArr, r) =>
                    rowArr.map((owner, c) => {
                      const filled = owner !== 0;
                      const col = filled ? PLAYER_COLORS[owner - 1] : "#8d99ae";
                      return (
                        <div
                          key={`v-${r}-${c}`}
                          className={(!filled && !isAiTurn) ? "dab-v" : ""}
                          onClick={(!filled && !isAiTurn) ? () => handleClick("vertical", r, c) : undefined}
                          style={{
                            position: "absolute",
                            left: c * BASE_CELL, top: r * BASE_CELL,
                            width: 6, height: BASE_CELL,
                            background: col,
                            transform: "translateX(-50%)",
                            opacity: filled ? 1 : 0.27,
                            cursor: (!filled && !isAiTurn) ? "pointer" : "default",
                            borderRadius: 3,
                            transition: "opacity 0.15s, background 0.15s",
                          }}
                        />
                      );
                    })
                  )}

                  {/* Dots */}
                  {Array(grid + 1).fill(null).map((_, r) =>
                    Array(grid + 1).fill(null).map((_, c) => (
                      <div key={`d-${r}-${c}`} style={{
                        position: "absolute",
                        left: c * BASE_CELL, top: r * BASE_CELL,
                        width: 11, height: 11,
                        background: "#2b2d42", borderRadius: "50%",
                        transform: "translate(-50%,-50%)",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.18)",
                        zIndex: 10,
                      }} />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" }}>
              <PrimaryBtn onClick={() => startGame(mode, grid)}>New Game</PrimaryBtn>
              <Btn onClick={() => { clearTimeout(aiTimer.current); setStarted(false); }} outline>Settings</Btn>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff", padding: "2.5rem 3rem",
            borderRadius: 24, textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            maxWidth: 400, width: "90%",
          }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.6rem", marginBottom: "0.8rem", color: "#2b2d42" }}>
              Game Over!
            </h2>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.2rem", flexWrap: "wrap" }}>
              {Array(np).fill(null).map((_, i) => (
                <div key={i} style={{
                  padding: "0.3rem 0.75rem", borderRadius: 50,
                  background: `${PLAYER_COLORS[i]}18`,
                  border: `2px solid ${PLAYER_COLORS[i]}50`,
                  fontWeight: 700, fontSize: "0.82rem",
                  color: PLAYER_COLORS[i],
                }}>
                  {playerName(i)}: {finalScores?.[i] ?? 0}
                </div>
              ))}
            </div>

            <p style={{ fontSize: "1.5rem", marginBottom: "1.8rem" }}>
              <span style={{ fontWeight: 700, color: wColor }}>{wText}</span>
            </p>

            <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center" }}>
              <PrimaryBtn onClick={() => startGame(mode, grid)}>Play Again</PrimaryBtn>
              <Btn onClick={() => { setShowModal(false); clearTimeout(aiTimer.current); setStarted(false); }} outline>Settings</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
