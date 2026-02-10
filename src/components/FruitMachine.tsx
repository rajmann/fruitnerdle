import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { useFruitMachine } from '@/hooks/useFruitMachine';
import { evaluateForDisplay } from '@/lib/evaluate';
import { calculatePayout } from '@/lib/puzzleEngine';
import type { FruitPuzzle, DialState, GamePhase, Operator } from '@/types/puzzle';
import Dial from './Dial';
import TargetDisplay from './TargetDisplay';
import Lever from './Lever';
import HelpModal from './HelpModal';
import NerdleLogo from './NerdleLogo';
import CoinTray from './CoinTray';
import ReelMockup from './ReelMockup';

type LightMode = 'idle' | 'spinning' | 'celebrating' | 'won';

/** Row of decorative light bulbs with animation modes */
function LightBulbs({ count = 9, mode = 'idle' as LightMode }: { count?: number; mode?: LightMode }) {
  const colors = ['#ff4444', '#ffcc00', '#44ff44', '#ff8800', '#ff44ff'];

  function getBulbStyle(i: number): React.CSSProperties {
    const color = colors[i % colors.length];
    const base: React.CSSProperties = { backgroundColor: color, color };

    switch (mode) {
      case 'spinning':
        // Sweep L→R: each bulb flashes in sequence, animation runs twice
        return { ...base, opacity: 0.4, animation: `bulb-sweep 1s ease-in-out ${i * 0.08}s 2` };
      case 'celebrating':
        // Rapid pulsing with stagger, each bulb scales up
        return { ...base, opacity: 0.4, animation: `bulb-celebrate 0.3s ease-in-out ${i * 0.04}s infinite` };
      case 'won':
        // Chase animation
        return { ...base, opacity: 1, animation: `bulb-chase 0.8s ease-in-out ${i * 0.1}s infinite` };
      default:
        return { ...base, opacity: 0.4 };
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-1.5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bulb-glow transition-all"
          style={getBulbStyle(i)}
        />
      ))}
    </div>
  );
}

type GameMode = 'easy' | 'medium' | 'hard';
const MODE_ORDER: GameMode[] = ['easy', 'medium', 'hard'];
const MODE_LABELS: Record<GameMode, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const MODE_COLORS: Record<GameMode, string> = { easy: '#44ff44', medium: '#ffcc00', hard: '#ff4444' };

function getLockedDials(
  puzzle: FruitPuzzle,
  dialStates: DialState[],
  mode: GameMode,
  phase: GamePhase,
): boolean[] {
  const none = [false, false, false, false, false];
  if (mode === 'hard' || phase !== 'playing') return none;

  const solution = puzzle.solutions[0];
  return puzzle.dials.map((_, i) => {
    if (mode === 'medium' && i !== 1 && i !== 3) return false; // medium: only operators lock
    return dialStates[i].currentIndex === solution[i];
  });
}

/** Celebration content for each dial when all puzzles solved */
function getCelebrationDisplay(dialIndex: number, totalCoins: number): React.ReactNode {
  if (dialIndex === 2) {
    // Center dial: gold coin with total
    return (
      <div className="flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #ffec80 30%, #daa520 70%, #b8860b 100%)',
          boxShadow: '0 0 10px 2px rgba(255,215,0,0.5), inset 0 1px 3px rgba(255,255,255,0.5)',
          border: '2px solid #996515',
        }}>
        <span className="text-sm sm:text-xl font-bold font-mono leading-none"
          style={{ color: '#2a1500' }}>
          ñ{totalCoins}
        </span>
      </div>
    );
  }
  // Tier symbol for outer dials
  if (totalCoins >= 25) return <span className="text-3xl sm:text-5xl select-none">💎</span>;
  if (totalCoins >= 20) return (
    <span className="text-base sm:text-2xl font-black tracking-tight select-none text-white px-1.5 py-0.5 rounded"
      style={{ background: 'linear-gradient(180deg, #222 0%, #444 50%, #222 100%)', fontFamily: 'serif' }}>
      BAR
    </span>
  );
  if (totalCoins >= 15) return <span className="text-3xl sm:text-5xl select-none">🍒</span>;
  if (totalCoins >= 10) return <span className="text-3xl sm:text-5xl select-none">🍌</span>;
  if (totalCoins >= 5) return <span className="text-3xl sm:text-5xl select-none">🍋</span>;
  return (
    <svg viewBox="0 0 116.9 122.88" className="w-8 h-8 sm:w-12 sm:h-12" fill="#888" style={{ transform: 'rotate(180deg)' }}>
      <path fillRule="evenodd" d="M25,80.18A33.31,33.31,0,0,0,36.67,94.3a38.86,38.86,0,0,0,43.44.09A33.37,33.37,0,0,0,92,80.18c5.83-13.42,4.56-36.7-1.84-50-1.67-3.46-3.81-6.34-7.25-12.4C80.1,13,78.79,8.63,83.73,4.59A22,22,0,0,1,97.47,0c4.67.14,7.54,3.4,9.14,7.61,1.07,2.78,2.25,8.35,1.5,11.35-.37,1.53-1.16,2-1.65,3-.72,1.46.09,2.95,1.18,5.07,16.4,32,11,69.78-15.88,86.81-17.14,10.86-41.64,11.89-60,3.55C-.75,102.61-8.4,61.46,9.27,27c1.08-2.12,1.89-3.61,1.17-5.07-.49-1-1.27-1.42-1.65-3-.74-3,.44-8.57,1.5-11.35C11.89,3.41,14.76.15,19.43,0A22,22,0,0,1,33.17,4.59c4.94,4,3.63,8.36.87,13.23-3.43,6.06-5.57,8.94-7.25,12.4-6.4,13.26-7.66,36.54-1.84,50ZM21.87,12.29a3.3,3.3,0,1,1-3.3,3.3,3.29,3.29,0,0,1,3.3-3.3Zm36.58,94.77a3.66,3.66,0,1,1-3.65,3.66,3.65,3.65,0,0,1,3.65-3.66Zm41-19.31a3.66,3.66,0,1,1-3.65,3.65,3.65,3.65,0,0,1,3.65-3.65Zm-81.9,0a3.66,3.66,0,1,1-3.65,3.65,3.66,3.66,0,0,1,3.65-3.65Zm88.76-26.1a3.65,3.65,0,1,1-3.66,3.65,3.65,3.65,0,0,1,3.66-3.65Zm-95.61,0A3.65,3.65,0,1,1,7,65.3a3.65,3.65,0,0,1,3.66-3.65Zm91.87-26.11a3.66,3.66,0,1,1-3.66,3.66,3.66,3.66,0,0,1,3.66-3.66Zm-88.13,0a3.66,3.66,0,1,1-3.66,3.66,3.66,3.66,0,0,1,3.66-3.66ZM95,12.29a3.3,3.3,0,1,1-3.3,3.3,3.29,3.29,0,0,1,3.3-3.3Z" />
    </svg>
  );
}

export default function FruitMachine() {
  const {
    puzzle,
    dialStates,
    phase,
    moveCount,
    nudgeCount,
    minMoves,
    spinStopIndices,
    currentResult,
    isCorrect,
    puzzleIndex,
    totalPuzzles,
    spin,
    nudge,
    nextPuzzle,
    prevPuzzle,
    selectPuzzle,
    onSpinComplete,
  } = useFruitMachine();

  const [spinningDials, setSpinningDials] = useState<boolean[]>([false, false, false, false, false]);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeverHint, setShowLeverHint] = useState(false);
  const [mode, setMode] = useState<GameMode>('hard');
  const spinTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firstSpinDoneRef = useRef(false);

  // Coin system
  const [totalCoins, setTotalCoins] = useState(0);
  const puzzlePayoutsRef = useRef<Map<number, number>>(new Map());
  const prevCorrectRef = useRef(false);

  // Mode-based scoring reduction: tracks worst (easiest) mode used during current game
  // 0 = hard, 1 = medium, 2 = easy
  const modeReductionRef = useRef(0);

  // Celebration state (in-machine animation when all puzzles solved)
  const [celebrationPhase, setCelebrationPhase] = useState<'none' | 'spinning' | 'revealed'>('none');
  const celebrationTriggeredRef = useRef(false);
  const celebrationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startCelebration = () => {
    setCelebrationPhase('spinning');
    setSpinningDials([true, true, true, true, true]);

    const baseDelay = 800;
    const stagger = 400;
    const timers: ReturnType<typeof setTimeout>[] = [];

    [0, 1, 2, 3, 4].forEach(i => {
      timers.push(setTimeout(() => {
        setSpinningDials(prev => {
          const next = [...prev];
          next[i] = false;
          return next;
        });
      }, baseDelay + i * stagger));
    });

    timers.push(setTimeout(() => {
      setCelebrationPhase('revealed');
    }, baseDelay + 4 * stagger + 300));

    celebrationTimersRef.current = timers;
  };

  const handlePlayAgain = () => {
    celebrationTimersRef.current.forEach(clearTimeout);
    celebrationTimersRef.current = [];
    setCelebrationPhase('none');
    setSpinningDials([false, false, false, false, false]);
    celebrationTriggeredRef.current = false;
    setTotalCoins(0);
    puzzlePayoutsRef.current.clear();
    modeReductionRef.current = 0;
    selectPuzzle(0);
  };

  // Reset first-spin tracker when puzzle changes
  useEffect(() => {
    firstSpinDoneRef.current = false;
  }, [puzzleIndex]);

  // Hide lever hint when spinning starts
  useEffect(() => {
    if (phase !== 'ready') setShowLeverHint(false);
  }, [phase]);

  // Detect win → award coins based on scoring tiers + mode cap
  useEffect(() => {
    if (isCorrect && !prevCorrectRef.current) {
      const payout = calculatePayout(moveCount, minMoves, modeReductionRef.current);
      setTotalCoins(prev => prev + payout);
      puzzlePayoutsRef.current.set(puzzleIndex, payout);
    }
    prevCorrectRef.current = isCorrect;
  }, [isCorrect, moveCount, minMoves, puzzleIndex]);

  // Deduct coins when re-spinning a previously won puzzle + reset mode reduction
  useEffect(() => {
    if (phase === 'spinning') {
      modeReductionRef.current = mode === 'easy' ? 2 : mode === 'medium' ? 1 : 0;
      const prevPayout = puzzlePayoutsRef.current.get(puzzleIndex);
      if (prevPayout) {
        setTotalCoins(prev => Math.max(0, prev - prevPayout));
        puzzlePayoutsRef.current.delete(puzzleIndex);
      }
    }
  }, [phase, puzzleIndex, mode]);

  // Track mode changes during play - increase reduction if switching to easier mode
  useEffect(() => {
    if (phase === 'playing') {
      const reduction = mode === 'easy' ? 2 : mode === 'medium' ? 1 : 0;
      modeReductionRef.current = Math.max(modeReductionRef.current, reduction);
    }
  }, [mode, phase]);

  // All puzzles solved? (derived from coin payouts tracker)
  const allSolved = puzzlePayoutsRef.current.size >= totalPuzzles;
  const isCelebrating = celebrationPhase !== 'none';

  // Trigger celebration when all puzzles solved
  useEffect(() => {
    if (phase === 'won' && allSolved && !celebrationTriggeredRef.current) {
      celebrationTriggeredRef.current = true;
      const timer = setTimeout(() => startCelebration(), 1500);
      celebrationTimersRef.current.push(timer);
      return () => clearTimeout(timer);
    }
  }, [phase, allSolved]);

  // Handle spin animation sequence
  useEffect(() => {
    if (phase !== 'spinning') return;

    spinTimersRef.current.forEach(clearTimeout);
    spinTimersRef.current = [];

    setSpinningDials([true, true, true, true, true]);

    const baseDelay = 800;
    const stagger = 400;

    puzzle.dials.forEach((_, i) => {
      const timer = setTimeout(() => {
        setSpinningDials(prev => {
          const next = [...prev];
          next[i] = false;
          return next;
        });
      }, baseDelay + i * stagger);
      spinTimersRef.current.push(timer);
    });

    const completeTimer = setTimeout(() => {
      onSpinComplete();
      setSpinningDials([false, false, false, false, false]);
      firstSpinDoneRef.current = true;
    }, baseDelay + 4 * stagger + 300);
    spinTimersRef.current.push(completeTimer);

    return () => {
      spinTimersRef.current.forEach(clearTimeout);
    };
  }, [phase, puzzle.dials, onSpinComplete]);

  // Build effective dial states
  const effectiveDialStates = dialStates.map((ds, i) => {
    if (phase === 'spinning' && !spinningDials[i]) {
      return { currentIndex: spinStopIndices[i] };
    }
    return ds;
  });

  const isWon = phase === 'won';

  // Determine light animation mode
  const lightMode: LightMode =
    celebrationPhase === 'spinning' ? 'spinning'
    : celebrationPhase === 'revealed' ? 'celebrating'
    : isWon ? 'won'
    : (phase === 'playing' && isCorrect) ? 'celebrating'
    : phase === 'spinning' ? 'spinning'
    : 'idle';

  const lockedDials = getLockedDials(puzzle, effectiveDialStates, mode, phase);

  // Nudge button accent colors based on mode
  const nudgeAccents: ('green' | 'red')[] = puzzle.dials.map((_, i) => {
    if (mode === 'easy') return 'green';
    if (mode === 'hard') return 'red';
    // medium: operators (1,3) lockable = green, numbers = red
    return (i === 1 || i === 3) ? 'green' : 'red';
  });

  // Potential coins: what would be earned if the user won on the next move
  const potentialCoins = (phase === 'playing' && !isCorrect)
    ? calculatePayout(moveCount + 1, minMoves, modeReductionRef.current)
    : 0;

  return (
    <div className="min-h-screen flex flex-col sm:items-center px-2 sm:px-6 py-4 sm:py-6 bg-gradient-to-b from-slate-900 via-machine-body to-slate-900">
      <div className="flex flex-row justify-center w-full">
        {/* Left desktop ad */}
        <div id="nerdlegame_D_x1" className="desktopSideAd mr-2 ml-2" />

        {/* Center column */}
        <div className="flex flex-col sm:items-center">

      {/* ===== SLOT MACHINE BODY ===== */}
      <div className="relative ml-10 sm:ml-14 mr-10 sm:mr-14">
        <div
          className="bg-gradient-to-b from-machine-panel via-machine-body to-machine-panel rounded-2xl border-2 border-chrome-dark shadow-2xl overflow-hidden"
          onClick={() => { if (phase === 'ready') setShowLeverHint(true); }}
        >
          {/* Chrome top rail with lights */}
          <div className="chrome-gradient px-2 py-1 border-b border-chrome-dark">
            <LightBulbs mode={lightMode} />
          </div>

          {/* Header: title + LED marquee + logo, all vertically centered */}
          <div className="relative flex items-center px-2 sm:px-3 py-2 sm:py-3">
            {/* Title - left */}
            <motion.h1
              className="font-title font-bold text-white select-none tracking-wide leading-none text-base sm:text-2xl shrink-0 cursor-pointer"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ textShadow: '0 0 20px rgba(130, 4, 88, 0.6)' }}
              onClick={() => { if (!isCelebrating) startCelebration(); }}
            >
              <span className="block">fruit</span>
              <span className="block">nerdle</span>
            </motion.h1>

            {/* LED marquee display - true center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
            {(() => {
              let calcResult: number | null = null;
              if (phase === 'playing' || phase === 'won') {
                const vals = effectiveDialStates.map((ds, i) => puzzle.dials[i].values[ds.currentIndex]);
                calcResult = evaluateForDisplay(
                  vals[0] as number,
                  vals[1] as string as Operator,
                  vals[2] as number,
                  vals[3] as string as Operator,
                  vals[4] as number,
                );
              }
              return (
                <TargetDisplay
                  target={puzzle.target}
                  calcResult={calcResult}
                  isCorrect={isCelebrating || isCorrect}
                  moveCount={moveCount}
                  nudgeCount={nudgeCount}
                  payout={calculatePayout(moveCount, minMoves, modeReductionRef.current)}
                  minMoves={minMoves}
                  phase={phase}
                  celebrationTotal={celebrationPhase === 'revealed' ? totalCoins : undefined}
                />
              );
            })()}
              </div>
            </div>

            {/* Spacer to push logo right */}
            <div className="flex-1" />

            {/* Logo - right */}
            <div className="shrink-0">
              <NerdleLogo isSpinning={spinningDials[0] && !firstSpinDoneRef.current} size={36} />
            </div>
          </div>

          {/* Reel window */}
          <div className="relative mx-2 sm:mx-3 mb-3 rounded-lg border border-chrome-dark bg-gradient-to-b from-slate-800 to-slate-900 p-1.5 sm:p-2 shadow-inner">
            {/* Glass overlay */}
            <div className="absolute inset-0 glass-overlay rounded-lg z-10" />

            {/* Dials row */}
            <div className="relative flex items-center justify-center gap-1 sm:gap-3">
              {puzzle.dials.map((dialConfig, i) => {
                const celebDisplay = isCelebrating && !spinningDials[i]
                  ? getCelebrationDisplay(i, totalCoins)
                  : undefined;
                return (
                  <Dial
                    key={`${puzzleIndex}-${i}`}
                    config={dialConfig}
                    state={effectiveDialStates[i]}
                    phase={spinningDials[i] ? 'spinning' : phase}
                    dialIndex={i}
                    isSpinning={spinningDials[i]}
                    isWon={isCelebrating || isCorrect}
                    isLocked={lockedDials[i]}
                    hideBottomNudge={isCorrect || isCelebrating || (showLeverHint && phase === 'ready')}
                    nudgeAccent={nudgeAccents[i]}
                    overrideDisplay={celebDisplay}
                    onNudgeUp={() => nudge(i, 'up')}
                    onNudgeDown={() => nudge(i, 'down')}
                  />
                );
              })}
            </div>

            {/* PULL LEVER TO START hint - shown when user clicks machine in ready state */}
            {showLeverHint && phase === 'ready' && (
              <motion.div
                onClick={spin}
                className="relative z-20 w-full h-7 sm:h-8 rounded-lg bg-black border border-slate-600 font-bold text-slate-400 text-xs sm:text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                Pull Lever to Start
              </motion.div>
            )}

            {/* NEXT CHALLENGE button - replaces bottom nudge buttons on win */}
            {isCorrect && !allSolved && !isCelebrating && (
              <motion.button
                onClick={nextPuzzle}
                className="relative z-20 w-full mt-1 h-7 sm:h-8 rounded-lg bg-black border border-red-500 font-bold text-red-500 text-xs sm:text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  boxShadow: [
                    '0 0 4px rgba(239,68,68,0.3)',
                    '0 0 16px 4px rgba(239,68,68,0.7)',
                    '0 0 4px rgba(239,68,68,0.3)',
                  ],
                }}
                transition={{
                  opacity: { duration: 0.3 },
                  y: { duration: 0.3 },
                  boxShadow: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                Next Challenge
              </motion.button>
            )}

            {/* PLAY AGAIN button - shown after celebration lands */}
            {celebrationPhase === 'revealed' && (
              <motion.button
                onClick={handlePlayAgain}
                className="relative z-20 w-full mt-1 h-7 sm:h-8 rounded-lg bg-black border border-led-green font-bold text-led-green text-xs sm:text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  boxShadow: [
                    '0 0 4px rgba(0,255,136,0.3)',
                    '0 0 16px 4px rgba(0,255,136,0.7)',
                    '0 0 4px rgba(0,255,136,0.3)',
                  ],
                }}
                transition={{
                  opacity: { duration: 0.3 },
                  y: { duration: 0.3 },
                  boxShadow: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                Play Again
              </motion.button>
            )}
          </div>

          {/* Coin tray */}
          <CoinTray totalCoins={totalCoins} potentialCoins={potentialCoins} />
        </div>

        {/* Lever assembly - mounted to the right side */}
        <div className="absolute -right-10 sm:-right-14 top-[45%] -translate-y-1/2 flex items-end">
          {/* Horizontal mounting bracket connecting machine to lever */}
          <div className="w-6 sm:w-8 h-5 sm:h-6 chrome-gradient border border-chrome-dark border-l-0 rounded-r-sm shadow -mr-2 mb-1" />
          <div className="relative z-10">
            <Lever phase={phase} onSpin={spin} />
          </div>
        </div>
      </div>

      {/* Game selector + move counter below machine */}
      <div className="mt-3 flex self-center items-center gap-3 text-sm font-medium text-slate-400">
        <button
          onClick={() => setMode(prev => MODE_ORDER[(MODE_ORDER.indexOf(prev) + 1) % 3])}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-600 hover:border-slate-400 transition-all"
        >
          <div
            className="w-2 h-2 rounded-full bulb-glow"
            style={{ backgroundColor: MODE_COLORS[mode], color: MODE_COLORS[mode] }}
          />
          <span className="text-xs font-semibold text-slate-300">{MODE_LABELS[mode]}</span>
        </button>
        <button
          onClick={prevPuzzle}
          className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Previous puzzle"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <span className="whitespace-nowrap">
          Game {puzzleIndex + 1}/{totalPuzzles}
        </span>
        <button
          onClick={nextPuzzle}
          className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Next puzzle"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
        {phase !== 'ready' && !isCelebrating && (
          <>
            <span className="text-slate-600">|</span>
            <span>
              Moves: <span className="font-bold text-led-amber" style={{ textShadow: '0 0 6px #ffcc00' }}>{moveCount}</span>
            </span>
          </>
        )}
      </div>

      {/* Help button */}
      <button
        onClick={() => setShowHelp(true)}
        className="mt-3 flex self-center items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        <span>How to Play</span>
      </button>

        </div>
        {/* Right desktop ad */}
        <div id="nerdlegame_D_x2" className="desktopSideAd ml-2 mr-2" />
      </div>

      {/* Bottom ad units - desktop and mobile */}
      <div className="mt-2 max-w-[90%] mx-auto justify-center items-center text-center">
        <div id="nerdlegame_D_1" />
        <div id="nerdlegame_M_1" style={{ paddingTop: 10 }} />
      </div>

      {/* Reel design mockup - DELETE WHEN DONE */}
      <ReelMockup />

      {/* Help modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
