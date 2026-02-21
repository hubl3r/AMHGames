'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useMemo, useCallback } from 'react';

const COLORS_LIST = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Black', 'White'];

const colorMap: Record<string, string> = {
  Red: '#ef4444', Orange: '#f97316', Yellow: '#eab308', Green: '#22c55e',
  Blue: '#3b82f6', Purple: '#a855f7', Black: '#1f2937', White: '#f8fafc',
};

export default function HexaPage() {
  const { data: session } = useSession();

  const [numColors, setNumColors] = useState(6);
  const [boardSizeStr, setBoardSizeStr] = useState<'small' | 'medium' | 'large'>('medium');
  const [board, setBoard] = useState<Record<string, string[]>>({});
  const [seedStacks, setSeedStacks] = useState<string[][]>([[], []]);
  const [collected, setCollected] = useState<Record<string, number>>({});
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [userStats, setUserStats] = useState<{ highScore: number | null; played: number; winRate: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const activeColors = useMemo(() => COLORS_LIST.slice(0, numColors), [numColors]);
  const rings = boardSizeStr === 'small' ? 1 : boardSizeStr === 'medium' ? 2 : 3;

  // init collected
  useEffect(() => {
    const init = activeColors.reduce((acc, c) => ({ ...acc, [c]: 0 }), {} as Record<string, number>);
    setCollected(init);
  }, [activeColors]);

  // fetch user stats
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/games/hexa/stats?userId=${session.user.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(setUserStats);
    }
  }, [session]);

  // timer
  useEffect(() => {
    let i: NodeJS.Timeout;
    if (isRunning && !gameWon) i = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(i);
  }, [isRunning, gameWon]);

  // win check
  const checkWin = useCallback(() => {
    if (activeColors.every(c => (collected[c] ?? 0) >= 100) && !gameWon) {
      setGameWon(true);
      setIsRunning(false);
      if (session?.user?.id) {
        fetch('/api/games/hexa/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: timer,
            won: true,
            metadata: { numColors, boardSize: boardSizeStr, finalCollected: collected },
          }),
        });
      }
    }
  }, [collected, activeColors, gameWon, timer, session, numColors, boardSizeStr]);

  useEffect(() => { checkWin(); }, [checkWin]);

  const generateSeed = () => {
    const avail = activeColors.filter(c => (collected[c] ?? 0) < 100);
    if (!avail.length) return [];
    const len = Math.floor(Math.random() * 8) + 3;
    return Array.from({ length: len }, () => avail[Math.floor(Math.random() * avail.length)]);
  };

  const startNewGame = () => {
    setBoard({});
    setSeedStacks([generateSeed(), generateSeed()]);
    const init = activeColors.reduce((acc, c) => ({ ...acc, [c]: 0 }), {} as Record<string, number>);
    setCollected(init);
    setTimer(0);
    setIsRunning(false);
    setGameWon(false);
    setSelectedSource(null);
  };

  useEffect(() => { startNewGame(); }, [numColors, boardSizeStr]);

  const playSound = () => {
    if (!soundEnabled) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 820;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => osc.stop(), 90);
  };

  const performMove = (sourceKey: string, destCoord: string) => {
    let sourceStack: string[] = [];
    let isFromSeed = false;
    let seedIdx = -1;

    if (sourceKey.startsWith('seed-')) {
      seedIdx = parseInt(sourceKey[5]);
      sourceStack = [...seedStacks[seedIdx]];
      isFromSeed = true;
    } else {
      sourceStack = [...(board[sourceKey] || [])];
    }

    if (!sourceStack.length) return;

    const topColor = sourceStack.at(-1)!;
    let count = 1;
    for (let i = sourceStack.length - 2; i >= 0; i--) {
      if (sourceStack[i] === topColor) count++;
      else break;
    }

    const newSource = sourceStack.slice(0, -count);
    const destStack = [...(board[destCoord] || [])];
    const newDest = [...destStack, ...sourceStack.slice(-count)];

    let newBoard = { ...board };
    let newSeeds = [...seedStacks];

    if (isFromSeed) {
      newSeeds[seedIdx] = newSource;
      setCollected(prev => ({ ...prev, [topColor]: (prev[topColor] ?? 0) + count }));
    } else {
      newBoard[sourceKey] = newSource;
    }
    newBoard[destCoord] = newDest;

    setBoard(newBoard);
    setSeedStacks(newSeeds);
    if (soundEnabled) playSound();
    if (!isRunning) setIsRunning(true);

    // respawn seed if emptied
    if (isFromSeed && newSource.length === 0) {
      setTimeout(() => {
        setSeedStacks(prev => {
          const updated = [...prev];
          updated[seedIdx] = generateSeed();
          return updated;
        });
      }, 5000);
    }
  };

  const handleClick = (key: string, isBoardCell: boolean) => {
    if (!selectedSource) {
      const hasTiles = isBoardCell
        ? (board[key] || []).length > 0
        : seedStacks[parseInt(key[5])].length > 0;
      if (hasTiles) setSelectedSource(key);
    } else {
      if (selectedSource === key) {
        setSelectedSource(null);
        return;
      }
      if (isBoardCell) {
        performMove(selectedSource, key);
        setSelectedSource(null);
      } else {
        setSelectedSource(null); // cannot place on seed
      }
    }
  };

  // hex cells
  const cells = useMemo(() => {
    const list: { coord: string; x: number; y: number }[] = [];
    for (let q = -rings; q <= rings; q++) {
      const rMin = Math.max(-rings, -q - rings);
      const rMax = Math.min(rings, -q + rings);
      for (let r = rMin; r <= rMax; r++) {
        const x = 60 * 1.5 * q;
        const y = 60 * (Math.sqrt(3) * r + Math.sqrt(3) / 2 * q);
        list.push({ coord: `${q},${r}`, x, y });
      }
    }
    const cx = (Math.min(...list.map(c => c.x)) + Math.max(...list.map(c => c.x))) / 2;
    const cy = (Math.min(...list.map(c => c.y)) + Math.max(...list.map(c => c.y))) / 2;
    return list.map(c => ({ ...c, x: c.x - cx + 460, y: c.y - cy + 320 }));
  }, [rings]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* controls */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-6">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">COLORS</label>
              <select value={numColors} onChange={e => setNumColors(+e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded px-4 py-2">
                {[4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">BOARD</label>
              <select value={boardSizeStr} onChange={e => setBoardSizeStr(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-700 rounded px-4 py-2">
                <option value="small">Small (7)</option>
                <option value="medium">Medium (19)</option>
                <option value="large">Large (37)</option>
              </select>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-mono tabular-nums">{timer}s</div>
            <div className="text-xs text-zinc-500">TIME</div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded flex items-center gap-2">
              {soundEnabled ? '🔊' : '🔇'} SOUND
            </button>
            <button onClick={startNewGame}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded font-medium">
              NEW GAME
            </button>
          </div>
        </div>

        {!session && <div className="text-amber-400 text-center mb-4">Sign in to track scores</div>}

        {/* stats */}
        {session && userStats && (
          <div className="flex justify-center gap-12 text-sm mb-6">
            <div>High Score: <span className="font-mono">{userStats.highScore ?? '—'}s</span></div>
            <div>Played: {userStats.played}</div>
            <div>Win Rate: {userStats.winRate}%</div>
          </div>
        )}

        {/* progress */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          {activeColors.map(c => (
            <div key={c} className="text-center">
              <div className="text-xs text-zinc-400">{c}</div>
              <div className="font-mono text-lg">{collected[c] ?? 0}/100</div>
              <div className="h-1.5 w-24 bg-zinc-800 rounded overflow-hidden">
                <div className="h-full bg-current" style={{ width: `${Math.min((collected[c] ?? 0) / 100, 1) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* board */}
        <div className="relative mx-auto" style={{ width: '950px', height: '680px', perspective: '1400px' }}>
          <div className="absolute inset-0" style={{ transform: 'rotateX(30deg) rotateY(8deg)', transformOrigin: '50% 60%' }}>
            {cells.map(({ coord, x, y }) => {
              const stack = board[coord] || [];
              const isSel = selectedSource === coord;
              return (
                <div
                  key={coord}
                  onClick={() => handleClick(coord, true)}
                  className={`absolute cursor-pointer ${isSel ? 'selected' : ''}`}
                  style={{ left: x, top: y, width: '120px', height: '120px' }}
                >
                  <div className="hex-shape" />
                  {stack.length > 0 && (
                    <div className="stack">
                      {stack.map((col, i) => (
                        <div
                          key={i}
                          className="tile"
                          style={{
                            backgroundColor: colorMap[col],
                            top: `-${i * 11}px`,
                            zIndex: i,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* seed stacks */}
        <div className="flex justify-center gap-16 mt-12">
          {seedStacks.map((stack, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-zinc-400 mb-2">SEED {i + 1}</div>
              <div
                onClick={() => handleClick(`seed-${i}`, false)}
                className={`seed-stack ${selectedSource === `seed-${i}` ? 'selected' : ''}`}
              >
                {stack.map((col, j) => (
                  <div
                    key={j}
                    className="tile"
                    style={{ backgroundColor: colorMap[col], top: `-${j * 9}px` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {gameWon && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <div className="text-5xl font-bold mb-2">YOU WIN!</div>
              <div className="text-3xl font-mono mb-8">in {timer} seconds</div>
              <button onClick={startNewGame} className="px-12 py-4 bg-white text-black font-medium rounded">PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .hex-shape {
          width: 120px; height: 104px;
          background: #27272a;
          border: 6px solid #3f3f46;
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          box-shadow: 0 15px 25px -5px rgb(0 0 0 / 0.5), inset 0 6px 10px -3px rgb(255 255 255 / 0.2);
        }
        .stack, .seed-stack { position: absolute; bottom: 22px; left: 50%; transform: translateX(-50%); width: 84px; }
        .tile {
          position: absolute; left: 50%; transform: translateX(-50%);
          width: 78px; height: 66px;
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
          border: 3px solid #e4e4e7;
          box-shadow: 0 8px 14px -4px rgb(0 0 0 / 0.5), inset 0 -6px 8px -3px rgb(255 255 255 / 0.6);
          transition: transform 0.15s;
        }
        .hex-cell:not(.selected) .stack, .seed-stack:not(.selected) { opacity: 0.45; }
        .selected .tile { transform: translateX(-50%) scale(1.08); }
        .selected { filter: drop-shadow(0 0 25px #fde047); }
      `}</style>
    </div>
  );
}
