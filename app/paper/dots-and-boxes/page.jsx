import { useState, useCallback, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAYER_COLORS = ["#e63946", "#457b9d", "#2a9d8f", "#e9c46a"];
const PLAYER_BG     = ["#fff5f5", "#f0f7fa", "#f0faf8", "#fffbf0"];

const GRID_OPTIONS  = [6, 8, 10];
const MODE_OPTIONS  = [
  { id: "2p",  label: "2 Players" },
  { id: "3p",  label: "3 Players" },
  { id: "4p",  label: "4 Players" },
  { id: "cpu", label: "vs Computer" },
];

function cellSizeFor(grid) {
  if (grid === 6)  return 72;
  if (grid === 8)  return 58;
  return 48;
}

function numPlayers(mode) {
  if (mode === "3p") return 3;
  if (mode === "4p") return 4;
  return 2;
}

// ─── Game helpers ─────────────────────────────────────────────────────────────

function makeLines(rows, cols) {
  return {
    horizontal: Array(rows + 1).fill(null).map(() => Array(cols).fill(0)),
    vertical:   Array(rows).fill(null).map(() => Array(cols + 1).fill(0)),
  };
}

function makeBoxes(rows, cols) {
  return Array(rows).fill(null).map(() => Array(cols).fill(0));
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

function applyLine(lines, boxes, type, row, col, player, rows, cols) {
  if (lines[type][row][col] !== 0) return null;
  const nl = {
    horizontal: lines.horizontal.map(r => [...r]),
    vertical:   lines.vertical.map(r => [...r]),
  };
  nl[type][row][col] = player;
  const nb = boxes.map(r => [...r]);
  let scored = 0;

  if (type === "horizontal") {
    if (row > 0    && checkBox(nl, nb, row - 1, col)) { nb[row - 1][col] = player; scored++; }
    if (row < rows && checkBox(nl, nb, row, col))     { nb[row][col]     = player; scored++; }
  } else {
    if (col > 0    && checkBox(nl, nb, row, col - 1)) { nb[row][col - 1] = player; scored++; }
    if (col < cols && checkBox(nl, nb, row, col))     { nb[row][col]     = player; scored++; }
  }
  return { lines: nl, boxes: nb, scored };
}

// ─── AI ───────────────────────────────────────────────────────────────────────

function getAllMoves(lines, rows, cols) {
  const moves = [];
  for (let r = 0; r <= rows; r++)
    for (let c = 0; c < cols; c++)
      if (lines.horizontal[r][c] === 0) moves.push({ type: "horizontal", row: r, col: c });
  for (let r = 0; r < rows; r++)
    for (let c = 0; c <= cols; c++)
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

function aiMove(lines, boxes, rows, cols) {
  const moves = getAllMoves(lines, rows, cols);
  if (!moves.length) return null;

  // 1) Take any scoring move
  for (const m of moves) {
    const res = applyLine(lines, boxes, m.type, m.row, m.col, 2, rows, cols);
    if (res && res.scored > 0) return m;
  }

  // 2) Avoid giving opponent 3-sided boxes
  const safe = moves.filter(m => {
    const res = applyLine(lines, boxes, m.type, m.row, m.col, 2, rows, cols);
    if (!res) return false;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (res.boxes[r][c] === 0 && countSides(res.lines, r, c) === 3) return false;
    return true;
  });

  if (safe.length) return safe[Math.floor(Math.random() * safe.length)];
  return moves[Math.floor(Math.random() * moves.length)];
}

// ─── Shared button ─────────────────────────────────────────────────────────────

function Btn({ onClick, children, active, small, variant }) {
  const [hov, setHov] = useState(false);
  const isOutline = variant === "outline";
  const base = {
    fontFamily: "'Work Sans', sans-serif",
    fontWeight: 600,
    fontSize:   small ? "0.78rem" : "0.88rem",
    padding:    small ? "0.4rem 0.95rem" : "0.65rem 1.8rem",
    border:     "2px solid #2b2d42",
    borderRadius: 50,
    cursor:     "pointer",
    transition: "all 0.2s ease",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    transform:  hov && !active ? "translateY(-1px)" : "none",
  };
  const style = active
    ? { ...base, background: "#2b2d42", color: "#fff", boxShadow: "0 4px 14px rgba(43,45,66,0.22)" }
    : isOutline
    ? { ...base, background: hov ? "#f0f0f0" : "transparent", color: "#2b2d42" }
    : { ...base, background: hov ? "#f0f0f0" : "transparent", color: "#2b2d42" };

  return (
    <button style={style} onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DotsAndBoxes() {
  const [mode,    setMode]    = useState("2p");
  const [grid,    setGrid]    = useState(6);
  const [started, setStarted] = useState(false);

  const [lines,   setLines]   = useState(() => makeLines(6, 6));
  const [boxes,   setBoxes]   = useState(() => makeBoxes(6, 6));
  const [scores,  setScores]  = useState([0, 0, 0, 0]);
  const [current, setCurrent] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [finalScores, setFinalScores] = useState(null);

  const rows = grid;
  const cols = grid;
  const np   = numPlayers(mode);
  const cpuOn = mode === "cpu";
  const cellSize = cellSizeFor(grid);

  const aiPending = useRef(false);
  const stateRef  = useRef({ lines, boxes, scores, current });
  useEffect(() => { stateRef.current = { lines, boxes, scores, current }; }, [lines, boxes, scores, current]);

  // ── start ──────────────────────────────────────────────────────────────────

  const startGame = useCallback((m, g) => {
    const l = makeLines(g, g);
    const b = makeBoxes(g, g);
    const s = [0, 0, 0, 0];
    setLines(l);
    setBoxes(b);
    setScores(s);
    setCurrent(1);
    setShowModal(false);
    setFinalScores(null);
    setStarted(true);
    aiPending.current = false;
    stateRef.current = { lines: l, boxes: b, scores: s, current: 1 };
  }, []);

  // ── place move (pure) ──────────────────────────────────────────────────────

  const placeMove = useCallback((curL, curB, curS, curP, type, row, col) => {
    const res = applyLine(curL, curB, type, row, col, curP, rows, cols);
    if (!res) return null;

    const ns = [...curS];
    ns[curP - 1] += res.scored;
    const total = ns.slice(0, np).reduce((a, b) => a + b, 0);

    if (total === rows * cols) {
      return { lines: res.lines, boxes: res.boxes, scores: ns, next: curP, gameOver: true };
    }
    const next = res.scored > 0 ? curP : (curP % np) + 1;
    return { lines: res.lines, boxes: res.boxes, scores: ns, next };
  }, [rows, cols, np]);

  const commitResult = useCallback((result) => {
    setLines(result.lines);
    setBoxes(result.boxes);
    setScores(result.scores);
    setCurrent(result.next);
    stateRef.current = { lines: result.lines, boxes: result.boxes, scores: result.scores, current: result.next };
    if (result.gameOver) {
      setTimeout(() => { setFinalScores(result.scores); setShowModal(true); }, 400);
    }
  }, []);

  // ── human ──────────────────────────────────────────────────────────────────

  const handleClick = useCallback((type, row, col) => {
    if (cpuOn && stateRef.current.current === 2) return;
    const { lines: curL, boxes: curB, scores: curS, current: curP } = stateRef.current;
    if (curL[type][row][col] !== 0) return;
    const result = placeMove(curL, curB, curS, curP, type, row, col);
    if (result) commitResult(result);
  }, [cpuOn, placeMove, commitResult]);

  // ── AI turn ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!started || !cpuOn || current !== 2 || showModal) return;
    if (aiPending.current) return;
    aiPending.current = true;
    const t = setTimeout(() => {
      aiPending.current = false;
      const { lines: curL, boxes: curB, scores: curS, current: curP } = stateRef.current;
      if (curP !== 2) return;
      const move = aiMove(curL, curB, rows, cols);
      if (!move) return;
      const result = placeMove(curL, curB, curS, curP, move.type, move.row, move.col);
      if (result) commitResult(result);
    }, 550);
    return () => clearTimeout(t);
  }, [started, cpuOn, current, showModal, rows, cols, placeMove, commitResult]);

  // ── winner ─────────────────────────────────────────────────────────────────

  const winnerInfo = () => {
    if (!finalScores) return { text: "", color: "#2b2d42" };
    const best = Math.max(...finalScores.slice(0, np));
    const wIdx = finalScores.slice(0, np).reduce((a, s, i) => s === best ? [...a, i] : a, []);
    if (wIdx.length > 1) return { text: `It's a Tie! (${best})`, color: "#2b2d42" };
    const i = wIdx[0];
    const name = cpuOn && i === 1 ? "Computer" : `Player ${i + 1}`;
    return { text: `${name} Wins! (${best})`, color: PLAYER_COLORS[i] };
  };

  const playerName = (i) => (cpuOn && i === 1 ? "CPU" : `P${i + 1}`);
  const isAiTurn = cpuOn && current === 2;

  // ── Setup screen ───────────────────────────────────────────────────────────

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

              {/* Player chips */}
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

  // ── Game screen ────────────────────────────────────────────────────────────

  const boardW = cols * cellSize;
  const boardH = rows * cellSize;
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
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .ai-blink { animation: blink 0.9s infinite; }
      `}</style>

      <div style={{
        fontFamily: "'Work Sans', sans-serif",
        background: "linear-gradient(135deg, #f5f3f4 0%, #e8e8e4 100%)",
        minHeight: "100vh",
        display: "flex", justifyContent: "center", alignItems: "flex-start",
        padding: "1.5rem 1rem",
        color: "#2b2d42",
      }}>
        <div style={{ width: "100%", maxWidth: Math.max(boardW + 80, 500) }}>
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

          <div style={{
            background: "#fff", borderRadius: 24, padding: "1.4rem 1.5rem",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          }}>

            {/* ── Compact scoreboard ── */}
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

            {/* ── Board ── */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.2rem", overflowX: "auto" }}>
              <div style={{ position: "relative", width: boardW, height: boardH, flexShrink: 0 }}>

                {/* Boxes */}
                {boxes.map((rowArr, r) =>
                  rowArr.map((owner, c) => {
                    if (!owner) return null;
                    const col = PLAYER_COLORS[owner - 1];
                    return (
                      <div key={`bx-${r}-${c}`} className="dab-box" style={{
                        position: "absolute",
                        left: c * cellSize + 4, top: r * cellSize + 4,
                        width: cellSize - 8, height: cellSize - 8,
                        borderRadius: 6,
                        background: `linear-gradient(135deg, ${col}20, ${col}38)`,
                        border: `1.5px solid ${col}50`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: cellSize > 60 ? "1rem" : "0.8rem",
                        fontWeight: 700, color: col,
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
                          left: c * cellSize, top: r * cellSize,
                          width: cellSize, height: 5,
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
                          left: c * cellSize, top: r * cellSize,
                          width: 5, height: cellSize,
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
                {Array(rows + 1).fill(null).map((_, r) =>
                  Array(cols + 1).fill(null).map((_, c) => (
                    <div key={`d-${r}-${c}`} style={{
                      position: "absolute",
                      left: c * cellSize, top: r * cellSize,
                      width: 10, height: 10,
                      background: "#2b2d42", borderRadius: "50%",
                      transform: "translate(-50%,-50%)",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.18)",
                      zIndex: 10,
                    }} />
                  ))
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", gap: "0.7rem", justifyContent: "center", flexWrap: "wrap" }}>
              <PrimaryBtn onClick={() => startGame(mode, grid)}>New Game</PrimaryBtn>
              <Btn onClick={() => setStarted(false)} variant="outline">Settings</Btn>
            </div>
          </div>
        </div>
      </div>

      {/* ── Winner Modal ── */}
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
              <Btn onClick={() => { setShowModal(false); setStarted(false); }} variant="outline">Settings</Btn>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
