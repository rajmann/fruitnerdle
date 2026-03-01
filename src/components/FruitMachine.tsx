import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFruitMachine } from '@/hooks/useFruitMachine';
import { evaluateForDisplay } from '@/lib/evaluate';
import { calculatePayout } from '@/lib/puzzleEngine';
import type { DaySet, FruitPuzzle, DialState, GamePhase, Operator } from '@/types/puzzle';
import allDaysData from '@/data/puzzles.json';

const allDays = allDaysData as DaySet[];

/** Day 1 epoch: 2026-03-01 */
const EPOCH = new Date('2026-03-01T00:00:00');

function getDayNumber(date: Date): number {
  const ms = date.setHours(0, 0, 0, 0) - EPOCH.getTime();
  return Math.floor(ms / 86400000) + 1;
}

function parseDateFromPath(path: string): Date | null {
  // Support both root (/20260212) and subfolder (/fruitnerdle/20260212) deployment
  const match = path.match(/\/(\d{8})$/);
  if (!match) return null;
  const s = match[1];
  const year = parseInt(s.slice(0, 4));
  const month = parseInt(s.slice(4, 6)) - 1;
  const day = parseInt(s.slice(6, 8));
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  return date;
}

function getDayPuzzles(): { puzzles: FruitPuzzle[]; dayNum: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pathDate = parseDateFromPath(window.location.pathname);
  let targetDate = today;

  if (pathDate) {
    pathDate.setHours(0, 0, 0, 0);
    // Only allow past or today, not future
    if (pathDate <= today) {
      targetDate = pathDate;
    }
  }

  const dayNum = getDayNumber(targetDate);
  // Wrap around available days
  const dayIndex = ((dayNum - 1) % allDays.length + allDays.length) % allDays.length;
  return { puzzles: allDays[dayIndex].puzzles as FruitPuzzle[], dayNum };
}

import Dial from './Dial';
import NudgeButton from './NudgeButton';
import Lever from './Lever';
import HelpModal from './HelpModal';
import CoinTray from './CoinTray';

const FRUITS = ['\uD83C\uDF52', '\uD83C\uDF4B', '\uD83C\uDF4A', '\uD83C\uDF47', '\uD83C\uDF51', '\uD83C\uDF53', '\uD83C\uDF49'];

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
    <div className="flex items-center justify-center gap-3 sm:gap-5 py-1.5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${mode !== 'idle' ? 'bulb-glow' : ''}`}
          style={getBulbStyle(i)}
        />
      ))}
    </div>
  );
}

type DifficultyMode = 'easy' | 'medium' | 'hard';
const MODE_ORDER: DifficultyMode[] = ['easy', 'medium', 'hard'];
const MODE_LABELS: Record<DifficultyMode, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const MODE_COLORS: Record<DifficultyMode, string> = { easy: '#44ff44', medium: '#ffcc00', hard: '#ff4444' };

function getLockedDials(
  puzzle: FruitPuzzle,
  dialStates: DialState[],
  mode: DifficultyMode,
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
      <div className="flex items-center justify-center w-8 h-8 sm:w-[3.2rem] sm:h-[3.2rem] rounded-full"
        style={{
          background: 'linear-gradient(135deg, #ffd700 0%, #ffec80 30%, #daa520 70%, #b8860b 100%)',
          boxShadow: '0 0 10px 2px rgba(255,215,0,0.5), inset 0 1px 3px rgba(255,255,255,0.5)',
          border: '2px solid #996515',
        }}>
        <span className="text-xs sm:text-lg font-bold font-mono leading-none"
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

/** Row of nudge buttons aligned to match the 5 dials */
function NudgeRow({ direction, disabled, nudgeAccents, onNudge, pulse }: {
  direction: 'up' | 'down';
  disabled: boolean[];
  nudgeAccents: ('green' | 'red')[];
  onNudge: (dialIndex: number) => void;
  pulse?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-14 sm:w-24 flex justify-center">
          <div className="w-12 sm:w-22">
            <NudgeButton
              direction={direction}
              disabled={disabled[i]}
              accent={nudgeAccents[i]}
              onClick={() => onNudge(i)}
              pulse={pulse}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Calendar date picker */
function CalendarPicker({ onChooseDay }: { onChooseDay: (date: Date) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start viewing the most recent valid month
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const DAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // First day of month (0=Sun), days in month
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  // Convert Sunday=0 to Monday-first: Mon=0, Tue=1, ... Sun=6
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Can navigate back to epoch month, forward to current month
  const epochMonth = EPOCH.getFullYear() * 12 + EPOCH.getMonth();
  const todayMonth = today.getFullYear() * 12 + today.getMonth();
  const currentViewMonth = viewYear * 12 + viewMonth;
  const canGoBack = currentViewMonth > epochMonth;
  const canGoForward = currentViewMonth < todayMonth;

  const goBack = () => {
    if (!canGoBack) return;
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const goForward = () => {
    if (!canGoForward) return;
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const isDateValid = (d: Date) => d >= EPOCH && d < today;

  // Build grid cells
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  return (
    <div className="flex flex-col gap-2">
      {/* Month/year nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5 text-slate-300" />
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAY_HEADERS.map((h, i) => (
          <div key={i} className="text-center text-xs font-semibold text-slate-500 py-1">{h}</div>
        ))}

        {/* Day cells */}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const valid = isDateValid(date);
          const dayNum = valid ? getDayNumber(date) : 0;
          return (
            <button
              key={date.getDate()}
              disabled={!valid}
              onClick={() => valid && onChooseDay(date)}
              className={`
                relative aspect-square flex items-center justify-center rounded text-sm transition-colors
                ${valid
                  ? 'text-white hover:bg-nerdle-teal/40 cursor-pointer'
                  : 'text-slate-600 cursor-not-allowed'
                }
              `}
              title={valid ? `#${dayNum}` : undefined}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FruitMachine() {
  const [{ puzzles: activePuzzles, dayNum: gameNumber }, setActiveGame] = useState(() => getDayPuzzles());
  const [showDatePicker, setShowDatePicker] = useState(() => {
    // Open date picker automatically if URL has an invalid date
    const pathDate = parseDateFromPath(window.location.pathname);
    if (!pathDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pathDate.setHours(0, 0, 0, 0);
    return pathDate < EPOCH || pathDate > today;
  });

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
    selectPuzzle,
    onSpinComplete,
  } = useFruitMachine(activePuzzles);

  const [spinningDials, setSpinningDials] = useState<boolean[]>([false, false, false, false, false]);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeverHint, setShowLeverHint] = useState(false);
  const [mode, setMode] = useState<DifficultyMode>('hard');
  const [showWinBanner, setShowWinBanner] = useState(false);
  const [showNextChallenge, setShowNextChallenge] = useState(false);
  const [lcdLit, setLcdLit] = useState(false);
  const [showNerdleConfirm, setShowNerdleConfirm] = useState(false);


  // Dial interaction hint — stays until first nudge
  const [showDialHint, setShowDialHint] = useState(false);
  // "Pull lever to start" prompt when tapping dials in ready state
  const [showLeverPrompt, setShowLeverPrompt] = useState(false);
  const leverPromptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDialClick = useCallback(() => {
    if (phase === 'ready') {
      setShowLeverPrompt(true);
      if (leverPromptTimerRef.current) clearTimeout(leverPromptTimerRef.current);
      leverPromptTimerRef.current = setTimeout(() => setShowLeverPrompt(false), 2500);
      return;
    }
    if (phase !== 'playing') return;
    setShowDialHint(true);
  }, [phase]);

  // Dismiss hint on first nudge
  useEffect(() => {
    if (nudgeCount > 0) setShowDialHint(false);
  }, [nudgeCount]);

  // Dismiss lever prompt when leaving ready state
  useEffect(() => {
    if (phase !== 'ready') {
      setShowLeverPrompt(false);
      if (leverPromptTimerRef.current) {
        clearTimeout(leverPromptTimerRef.current);
        leverPromptTimerRef.current = null;
      }
    }
  }, [phase]);

  // Auto-cycle lever hint in ready state: show for 2s, then 5s gap, repeat
  useEffect(() => {
    if (phase !== 'ready') {
      setShowLeverHint(false);
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = (delay: number) => {
      timer = setTimeout(() => {
        if (!active) return;
        setShowLeverHint(true);
        timer = setTimeout(() => {
          if (!active) return;
          setShowLeverHint(false);
          cycle(5000);
        }, 2000);
      }, delay);
    };
    cycle(5000);
    return () => { active = false; clearTimeout(timer); };
  }, [phase]);
  const spinTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firstSpinDoneRef = useRef(false);

  // Rotating fruit brand mark (cycles every 10s)
  const [fruitIndex, setFruitIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFruitIndex(i => (i + 1) % FRUITS.length), 10000);
    return () => clearInterval(id);
  }, []);

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
      setShowWinBanner(false);
    }, baseDelay + 4 * stagger + 300));

    celebrationTimersRef.current = timers;
  };

  const resetCelebration = useCallback(() => {
    celebrationTimersRef.current.forEach(clearTimeout);
    celebrationTimersRef.current = [];
    setCelebrationPhase('none');
    setSpinningDials([false, false, false, false, false]);
    celebrationTriggeredRef.current = false;
    setTotalCoins(0);
    puzzlePayoutsRef.current.clear();
    modeReductionRef.current = 0;
    prevCorrectRef.current = false;
    pendingSpinRef.current = false;
    setShowWinBanner(false);
    setShowNextChallenge(false);
  }, []);

  const handleRandomPuzzle = useCallback(() => {
    resetCelebration();
    const randomDayIdx = Math.floor(Math.random() * allDays.length);
    const dayPuzzleList = allDays[randomDayIdx].puzzles as FruitPuzzle[];
    const randomPuzzleIdx = Math.floor(Math.random() * dayPuzzleList.length);
    setActiveGame({ puzzles: [dayPuzzleList[randomPuzzleIdx]], dayNum: 0 });
  }, [resetCelebration]);

  const handleChooseDay = useCallback((date: Date) => {
    resetCelebration();
    const num = getDayNumber(date);
    const dayIndex = ((num - 1) % allDays.length + allDays.length) % allDays.length;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    history.pushState(null, '', `/${yyyy}${mm}${dd}`);
    setActiveGame({ puzzles: allDays[dayIndex].puzzles as FruitPuzzle[], dayNum: num });
  }, [resetCelebration]);

  // Auto-spin after lever-triggered puzzle advance
  const pendingSpinRef = useRef(false);

  // Reset first-spin tracker when puzzle changes
  useEffect(() => {
    firstSpinDoneRef.current = false;
    if (pendingSpinRef.current) {
      pendingSpinRef.current = false;
      spin();
    }
  }, [puzzleIndex, spin]);

  // (lever hint hide/show handled by auto-cycle effect above)

  // Detect win → award coins + show "YOU WIN!" banner, then "NEXT CHALLENGE"
  // For non-final puzzles: banner shows 3s then transitions to "NEXT CHALLENGE"
  // For final puzzle (allSolved): banner persists through celebration spin
  useEffect(() => {
    if (isCorrect && !prevCorrectRef.current) {
      const payout = calculatePayout(moveCount, minMoves, modeReductionRef.current);
      setTotalCoins(prev => prev + payout);
      puzzlePayoutsRef.current.set(puzzleIndex, payout);
      setShowWinBanner(true);
      setShowNextChallenge(false);
      // Don't auto-clear banner for final puzzle — celebration reveal will handle it
      const justSolvedAll = puzzlePayoutsRef.current.size >= totalPuzzles;
      if (!justSolvedAll) {
        const timer = setTimeout(() => {
          setShowWinBanner(false);
          setShowNextChallenge(true);
        }, 3000);
        prevCorrectRef.current = isCorrect;
        return () => clearTimeout(timer);
      }
      prevCorrectRef.current = isCorrect;
      return;
    }
    if (!isCorrect) {
      setShowWinBanner(false);
      setShowNextChallenge(false);
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

  // LCD button flash: snap on/off like the lever ball
  const lcdIsButton = (showNextChallenge && !allSolved && !isCelebrating) || celebrationPhase === 'revealed';
  useEffect(() => {
    if (!lcdIsButton) { setLcdLit(false); return; }
    const id = setInterval(() => setLcdLit(l => !l), 500);
    return () => clearInterval(id);
  }, [lcdIsButton]);

  // Trigger celebration when all puzzles solved
  // Start after a short pause so "You Win!" has a moment to display
  useEffect(() => {
    if (isCorrect && allSolved && !celebrationTriggeredRef.current) {
      celebrationTriggeredRef.current = true;
      const timer = setTimeout(() => startCelebration(), 1500);
      celebrationTimersRef.current.push(timer);
      return () => clearTimeout(timer);
    }
  }, [isCorrect, allSolved]);

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

  // Per-dial disabled state for nudge buttons
  const canNudge = phase === 'playing' && !isCorrect && !isCelebrating;
  const nudgeDisabled = puzzle.dials.map((_, i) => !canNudge || lockedDials[i]);

  // Potential coins: what would be earned if the user won on the next move
  const potentialCoins = (phase === 'playing' && !isCorrect)
    ? calculatePayout(moveCount + 1, minMoves, modeReductionRef.current)
    : 0;

  return (
    <div className="min-h-screen flex flex-col sm:items-center px-2 sm:px-6 py-1 sm:py-3 bg-gradient-to-b from-slate-900 via-machine-body to-slate-900">
      <div className="flex flex-row justify-center w-full" style={{ touchAction: 'none' }}>
        {/* Left desktop ad */}
        <div id="nerdlegame_D_x1" className="desktopSideAd mr-2 ml-2" />

        {/* Center column */}
        <div className="flex flex-col sm:items-center flex-1 min-w-0 max-w-xl sm:px-8">

      {/* ===== SLOT MACHINE BODY ===== */}
      <div className="relative mr-10 sm:mr-[72px]">
        <div
          className="relative z-10 rounded-2xl border-2 border-chrome-dark shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(to bottom, #58616e 0%, #2a2f38 8%, #3a4250 25%, #505a6c 50%, #3a4250 75%, #2a2f38 92%, #58616e 100%)',
            boxShadow: 'inset 4px 0 12px -4px rgba(0,0,0,0.5), inset -4px 0 12px -4px rgba(0,0,0,0.5), 0 25px 50px -12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Chrome top rail */}
          <div className="h-3 sm:h-4 border-b border-chrome-dark" style={{ background: 'linear-gradient(to bottom, #8a9098, #58616e)' }} />

          {/* Unified LED marquee display */}
          {(() => {
            let calcDisplay = '??';
            if (phase === 'playing' || phase === 'won') {
              const vals = effectiveDialStates.map((ds, i) => puzzle.dials[i].values[ds.currentIndex]);
              const calcResult = evaluateForDisplay(
                vals[0] as number,
                vals[1] as string as Operator,
                vals[2] as number,
                vals[3] as string as Operator,
                vals[4] as number,
              );
              if (calcResult !== null && Number.isInteger(calcResult)) {
                calcDisplay = String(calcResult);
              }
            }
            const showWin = isCelebrating || isCorrect;
            const showHint = !showWin && nudgeCount === 0;
            const hintValue = (phase === 'playing' && minMoves != null && minMoves > 0) ? String(minMoves) : '?';
            const showCalc = !showWin && nudgeCount > 0;
            const payout = calculatePayout(moveCount, minMoves, modeReductionRef.current);
            const celebTotal = celebrationPhase === 'revealed' ? totalCoins : undefined;

            return (
              <div className="mx-2 sm:mx-3 mt-3 sm:mt-4 mb-2 sm:mb-3">
                <div
                  className="flex items-stretch bg-black/90 rounded-md overflow-hidden relative"
                  style={{
                    borderTop: '2px solid rgba(255,255,255,0.12)',
                    borderLeft: '2px solid rgba(255,255,255,0.1)',
                    borderBottom: '2px solid rgba(255,255,255,0.35)',
                    borderRight: '2px solid rgba(255,255,255,0.25)',
                  }}
                >
                  {/* Brand mark: fruit + n (hidden during spin and pre-nudge objective) */}
                  <div className="absolute left-0 top-0 bottom-0 flex items-center gap-0.5 px-1.5 sm:px-2.5 z-10" style={{ display: phase === 'spinning' || (phase === 'playing' && nudgeCount === 0) ? 'none' : undefined }}>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={fruitIndex}
                        className="text-xl sm:text-3xl select-none"
                        initial={{ y: -12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 12, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {FRUITS[fruitIndex]}
                      </motion.span>
                    </AnimatePresence>
                    <span className="font-title font-bold text-4xl sm:text-6xl text-led-green select-none leading-none led-glow" style={{ position: 'relative', top: '-2px' }}>
                      n
                    </span>
                    <span className="font-mono font-bold text-led-green/60 select-none leading-none text-center" style={{ fontSize: '17px', position: 'relative', top: '-14px', lineHeight: '0.9' }}>
                      {gameNumber > 0 ? `#${gameNumber}` : <><span className="block" style={{ fontSize: '11px' }}>free</span><span className="block" style={{ fontSize: '11px' }}>play</span></>}
                    </span>
                  </div>

                  {/* Content area */}
                  <div className="relative w-full flex items-center justify-center px-2 sm:px-3 py-1.5 sm:py-2 min-h-[56px] sm:min-h-[72px]">
                    <AnimatePresence>
                      {showWin ? (
                        <motion.div
                          key="win"
                          className="absolute inset-0 flex flex-col items-center justify-center"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <span className="text-xl sm:text-3xl font-bold font-mono text-led-green led-glow select-none tabular-nums whitespace-nowrap leading-tight">
                            {celebTotal != null ? `\u00f1${celebTotal}` : `${puzzle.target} solved`}
                          </span>
                          <span className="text-sm sm:text-lg font-medium font-mono text-nerdle-teal select-none tabular-nums whitespace-nowrap leading-tight">
                            {celebTotal != null
                              ? 'Complete!'
                              : `${moveCount} moves = \u00f1${payout}`
                            }
                          </span>
                        </motion.div>
                      ) : phase === 'ready' ? (
                        <motion.span
                          key="title"
                          className="absolute inset-0 flex items-center justify-center font-title font-bold text-xl sm:text-3xl select-none tracking-wider"
                          style={{ color: '#00ff88', textShadow: '0 0 8px #00ff88, 0 0 16px #00ff88' }}
                          initial={{ x: 120, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        >
                          fruit nerdle
                        </motion.span>
                      ) : phase === 'spinning' || (phase === 'playing' && nudgeCount === 0) ? (
                        <motion.span
                          key="objective"
                          className="absolute inset-0 flex items-center justify-center font-body text-lg sm:text-3xl font-bold select-none text-center"
                          style={{
                            color: '#ffcc00',
                            textShadow: '0 0 8px #ffcc00, 0 0 16px rgba(255,204,0,0.4)',
                          }}
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          Nudge dials to make{' \u00a0'}<span className="tabular-nums animate-target-pulse" style={{ textShadow: '0 0 8px #ffcc00, 0 0 16px #ffcc00' }}>{puzzle.target}</span>
                        </motion.span>
                      ) : (
                        <motion.div
                          key="game"
                          className="flex items-center w-full"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Left spacer for centering */}
                          <div className="flex-1" />

                          {/* Target - centered */}
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] sm:text-[12px] font-medium text-led-green tracking-widest uppercase select-none">
                              Target
                            </span>
                            <span className="text-xl sm:text-3xl font-bold font-mono text-led-green led-glow select-none tabular-nums">
                              {puzzle.target}
                            </span>
                          </div>

                          {/* Right section - hint or calc */}
                          <div className="flex-1 flex justify-end">
                            {showHint && (
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] sm:text-[12px] font-medium text-led-green tracking-widest uppercase select-none whitespace-nowrap">
                                  Solvable in
                                </span>
                                <span className="text-xl sm:text-3xl font-bold font-mono text-led-green led-glow select-none tabular-nums">
                                  {hintValue}
                                </span>
                              </div>
                            )}

                            {showCalc && (
                              <motion.div
                                className="flex flex-col items-center"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                              >
                                <span className="text-[9px] sm:text-[12px] font-medium text-led-green tracking-widest uppercase select-none">
                                  Calc
                                </span>
                                <span
                                  className={`text-xl sm:text-3xl font-bold font-mono select-none tabular-nums ${
                                    calcDisplay === '??' ? 'text-led-amber led-glow' : 'text-led-green led-glow'
                                  }`}
                                >
                                  {calcDisplay}
                                </span>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Reel area wrapper — lever connector anchors to this */}
          <div className="relative">

          {/* Nudge up row - outside glass window */}
          <div className="mx-2 sm:mx-3 mt-2 sm:mt-3 mb-1.5 sm:mb-2">
            <NudgeRow
              direction="up"
              disabled={nudgeDisabled}
              nudgeAccents={nudgeAccents}
              onNudge={(i) => nudge(i, 'up')}
              pulse={showDialHint}
            />
          </div>

          {/* Glass reel window with chrome frame */}
          <div className="relative w-fit mx-auto mb-1.5 sm:mb-2">
            {/* Chrome surround */}
            <div className="chrome-gradient rounded-lg" style={{ padding: '3px' }}>
              {/* Inner dark window */}
              <div
                className="relative rounded-[6px] bg-gradient-to-b from-slate-800 to-slate-900 py-1.5 sm:py-2 px-0.5 shadow-inner overflow-hidden"
                style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), inset 0 -2px 8px rgba(0,0,0,0.4)' }}
              >
                {/* Dials row */}
                <div className="flex items-center justify-center gap-1 sm:gap-3">
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
                        isLocked={lockedDials[i]}
                        overrideDisplay={celebDisplay}
                        onTap={handleDialClick}
                        onSwipe={(dir) => { if (phase === 'ready') { handleDialClick(); } else { nudge(i, dir); } }}
                      />
                    );
                  })}
                </div>

                {/* Payline - thin center line */}
                <div
                  className="absolute pointer-events-none"
                  style={{ left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(0,0,0,0.3)', zIndex: 4 }}
                />

                {/* Left arrow */}
                <div
                  className="absolute pointer-events-none flex items-center"
                  style={{ left: '-1px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}
                >
                  <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '10px solid rgba(0,0,0,0.7)' }} />
                </div>

                {/* Right arrow */}
                <div
                  className="absolute pointer-events-none flex items-center"
                  style={{ right: '-1px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}
                >
                  <div style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid rgba(0,0,0,0.7)' }} />
                </div>

                {/* Diagonal glass reflection */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[6px]" style={{ zIndex: 6 }}>
                  <div style={{
                    position: 'absolute', top: '-20%', left: '-10%', width: '40%', height: '140%',
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 55%, transparent 60%)',
                    transform: 'rotate(-15deg)',
                  }} />
                </div>
              </div>
            </div>

            {/* Marching color border overlay - shown on win (same size, no layout shift) */}
            {(isCelebrating || isCorrect) && (
              <div
                className="absolute payline-marching rounded-lg pointer-events-none"
                style={{ inset: 0, zIndex: 10 }}
              />
            )}
          </div>

          {/* Dial interaction hint toast */}
          <AnimatePresence>
            {showDialHint && (
              <motion.div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-center pointer-events-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-black/90 text-led-green text-sm sm:text-base font-semibold px-5 py-3 rounded-lg border border-led-green/30 shadow-lg">
                  Swipe dials or use the arrow buttons
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* "Pull lever to start" prompt toast */}
          <AnimatePresence>
            {showLeverPrompt && (
              <motion.div
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-center pointer-events-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-black/90 text-led-green text-sm sm:text-base font-semibold px-5 py-3 rounded-lg border border-led-green/30 shadow-lg">
                  Pull lever to start
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nudge down row - always visible */}
          <div className="mx-2 sm:mx-3 mb-1.5 sm:mb-2">
            <NudgeRow
              direction="down"
              disabled={nudgeDisabled}
              nudgeAccents={nudgeAccents}
              onNudge={(i) => nudge(i, 'down')}
              pulse={showDialHint}
            />
          </div>

          </div>{/* end reel area wrapper */}

          {/* Bottom LCD status display */}
          <div className="mx-2 sm:mx-3 mb-2 sm:mb-3">
            <div
              className="rounded-md overflow-hidden"
              style={{
                transition: lcdIsButton ? 'none' : 'all 300ms',
                background: (showNextChallenge && !allSolved && !isCelebrating)
                  ? (lcdLit ? '#ff5cb0' : '#ff2d95')
                  : celebrationPhase === 'revealed'
                    ? (lcdLit ? '#4ade80' : '#00ff88')
                    : 'rgba(0,0,0,0.9)',
                borderTop: '2px solid rgba(255,255,255,0.18)',
                borderLeft: '2px solid rgba(255,255,255,0.19)',
                borderBottom: '2px solid rgba(255,255,255,0.25)',
                borderRight: '2px solid rgba(255,255,255,0.22)',
                boxShadow: (showNextChallenge && !allSolved && !isCelebrating)
                  ? (lcdLit
                      ? '0 0 18px rgba(255,92,176,0.8), 0 0 36px rgba(255,45,149,0.4)'
                      : '0 0 10px rgba(255,45,149,0.5), 0 0 20px rgba(255,45,149,0.2)')
                  : celebrationPhase === 'revealed'
                    ? (lcdLit
                        ? '0 0 18px rgba(74,222,128,0.8), 0 0 36px rgba(0,255,136,0.4)'
                        : '0 0 10px rgba(0,255,136,0.5), 0 0 20px rgba(0,255,136,0.2)')
                    : 'none',
              }}
            >
              <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 min-h-[42px] sm:min-h-[54px]">
                <AnimatePresence mode="wait">
                  {showLeverHint && phase === 'ready' ? (
                    <motion.div
                      key="lever"
                      onClick={spin}
                      className="font-bold text-slate-400 text-sm sm:text-base tracking-wider uppercase cursor-pointer select-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      Pull Lever to Start
                    </motion.div>
                  ) : showWinBanner && celebrationPhase !== 'revealed' ? (
                    <motion.div
                      key="win-banner"
                      className="font-bold text-xl sm:text-2xl tracking-widest uppercase select-none rainbow-text"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      You Win!
                    </motion.div>
                  ) : showNextChallenge && !allSolved && !isCelebrating ? (
                    <motion.button
                      key="next"
                      onClick={() => { setShowNextChallenge(false); nextPuzzle(); }}
                      className="font-bold text-black text-base sm:text-xl tracking-wider uppercase cursor-pointer select-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      Next Game ({puzzleIndex + 2}/{totalPuzzles})
                    </motion.button>
                  ) : celebrationPhase === 'revealed' ? (
                    <motion.div
                      key="complete"
                      className="flex flex-col items-center gap-1 sm:gap-1.5 w-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="font-bold text-black text-xs sm:text-sm tracking-wider uppercase select-none">
                        Challenge Complete!
                      </span>
                      <div className="flex items-center gap-1 sm:gap-2 w-full">
                        <button
                          onClick={handleRandomPuzzle}
                          className="flex-1 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold text-white cursor-pointer hover:brightness-110 transition-colors"
                          style={{ backgroundColor: '#820458' }}
                        >
                          Random puzzle
                        </button>
                        <button
                          onClick={() => setShowDatePicker(true)}
                          className="flex-1 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold text-white cursor-pointer hover:brightness-110 transition-colors"
                          style={{ backgroundColor: '#398874' }}
                        >
                          Previous games
                        </button>
                        <a
                          href="https://www.nerdlegame.com"
                          className="flex-1 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-bold text-white cursor-pointer hover:brightness-110 transition-colors text-center"
                          style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
                        >
                          Back to nerdle
                        </a>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="status"
                      className="flex items-center w-full text-xs sm:text-sm font-medium text-slate-400 select-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Left: mode */}
                      <div className="flex-1 flex justify-start">
                        <button
                          onClick={() => {
                            setMode(prev => {
                              const idx = MODE_ORDER.indexOf(prev);
                              return MODE_ORDER[(idx + 1) % MODE_ORDER.length];
                            });
                          }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-400 hover:border-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <div
                            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bulb-glow shrink-0"
                            style={{ backgroundColor: MODE_COLORS[mode], color: MODE_COLORS[mode] }}
                          />
                          <span className="font-semibold text-slate-300">{MODE_LABELS[mode]}</span>
                        </button>
                      </div>

                      {/* Center: game label */}
                      <div className="flex items-center">
                        <span className="whitespace-nowrap">
                          {totalPuzzles > 1 ? `Game ${puzzleIndex + 1}/${totalPuzzles}` : 'Random'}
                        </span>
                      </div>

                      {/* Right: solvable-in + moves */}
                      <div className="flex-1 flex flex-col items-end">
                        {!isCelebrating && (
                          <>
                            {minMoves != null && minMoves > 0 && (
                              <span className="text-slate-400">
                                Solvable in: <span className="font-bold">{minMoves}</span>
                              </span>
                            )}
                            <span>
                              Moves: <span className="font-bold text-led-amber" style={{ textShadow: '0 0 6px #ffcc00' }}>{moveCount}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Coin tray */}
          <CoinTray totalCoins={totalCoins} potentialCoins={potentialCoins} />
        </div>

        {/* Lever assembly — centered on machine, outside overflow:hidden */}
        <div
          className="absolute flex items-center z-[15] right-[-40px] sm:right-[-60px]"
          style={{ top: '50%', transform: 'translateY(calc(-50% - 20px))' }}
        >
          {/* 1. Big connector plate */}
          <div
            className="border border-chrome-dark border-l-0 border-r-0 rounded-r-md"
            style={{
              width: 'clamp(18px, 3vw, 26px)',
              height: 'clamp(44px, 7vw, 64px)',
              transform: 'translateY(20px)',
              background: 'linear-gradient(180deg, #58616e 0%, #3a4250 30%, #505a6c 50%, #3a4250 70%, #58616e 100%)',
              boxShadow: '2px 0 6px rgba(0,0,0,0.3), inset -2px 0 4px rgba(255,255,255,0.1)',
            }}
          />
          {/* 2. Chrome bridge */}
          <div
            style={{
              width: 'clamp(8px, 1.5vw, 12px)',
              height: 'clamp(20px, 3.5vw, 30px)',
              transform: 'translateY(20px)',
              background: 'linear-gradient(180deg, #8a9098 0%, #62666e 30%, #747880 50%, #62666e 70%, #8a9098 100%)',
              boxShadow: '1px 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.15)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(0,0,0,0.3)',
            }}
          />
          {/* 3. Arm shaft + 4. Ball */}
          <div className="relative sm:-ml-3.5" style={{ transform: 'translateY(-20px)' }}>
            <Lever
              phase={phase}
              canPull={phase === 'ready' || phase === 'playing' || (showNextChallenge && !allSolved && !isCelebrating)}
              onSpin={() => {
                if (showNextChallenge && !allSolved && !isCelebrating) {
                  setShowNextChallenge(false);
                  pendingSpinRef.current = true;
                  nextPuzzle();
                } else {
                  spin();
                }
              }}
            />
          </div>
        </div>

        {/* Side display panel - bottom right of machine */}
        <div
          className="absolute z-[5] rounded-lg border border-chrome-dark overflow-hidden"
          style={{
            right: 'clamp(-40px, -3.5vw, -56px)',
            bottom: '48px',
            transform: 'translate(3px, 0)',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.4), inset 2px 0 6px rgba(0,0,0,0.3), inset -2px 0 6px rgba(0,0,0,0.3)',
          }}
        >
          {/* Top chrome rail */}
          <div className="h-1.5 sm:h-2" style={{ background: 'linear-gradient(to bottom, #8a9098, #58616e)' }} />
          {/* Machine body with buttons */}
          <div
            className="flex flex-col items-center gap-2 px-1.5 sm:px-2 py-2 sm:py-2.5"
            style={{
              background: 'linear-gradient(to bottom, #58616e 0%, #2a2f38 15%, #3a4250 40%, #505a6c 60%, #3a4250 85%, #2a2f38 100%)',
            }}
          >
            <button
              onClick={() => setShowNerdleConfirm(true)}
              className="rounded-full flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 cursor-pointer"
              style={{
                backgroundColor: '#820458',
                boxShadow: 'inset 0 -2px 3px rgba(255,255,255,0.35), inset 0 2px 3px rgba(0,0,0,0.15), inset 2px 0 3px rgba(255,255,255,0.08), inset -2px 0 3px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.4)',
              }}
              aria-label="Back to Nerdleverse"
            >
              <span className="text-white font-title font-bold select-none" style={{ fontSize: '26px', lineHeight: 1, position: 'relative', top: '-2px' }}>n</span>
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="rounded-full flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 cursor-pointer"
              style={{
                backgroundColor: '#398874',
                boxShadow: 'inset 0 -2px 3px rgba(255,255,255,0.35), inset 0 2px 3px rgba(0,0,0,0.15), inset 2px 0 3px rgba(255,255,255,0.08), inset -2px 0 3px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.4)',
              }}
              aria-label="How to play"
            >
              <span className="text-white font-bold select-none" style={{ fontSize: '22px', lineHeight: 1, position: 'relative', top: '-1px' }}>?</span>
            </button>
          </div>
          {/* Bottom chrome rail — dark at top (matching body bottom), lighter below */}
          <div className="h-1.5 sm:h-2" style={{ background: 'linear-gradient(to bottom, #2a2f38, #8a9098)' }} />
        </div>
      </div>


        </div>
        {/* Right desktop ad */}
        <div id="nerdlegame_D_x2" className="desktopSideAd ml-2 mr-2" />
      </div>

      {/* Bottom ad units - desktop and mobile */}
      <div className="mt-2 max-w-[90%] mx-auto justify-center items-center text-center">
        <div id="nerdlegame_D_1" />
        <div id="nerdlegame_M_1" style={{ paddingTop: 10 }} />
      </div>

      {/* Help modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} onOpenDatePicker={() => setShowDatePicker(true)} />}

      {/* Nerdle confirm modal */}
      {showNerdleConfirm && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowNerdleConfirm(false)}
        >
          <motion.div
            className="relative bg-slate-800/95 border-2 border-chrome-dark rounded-2xl shadow-2xl mx-4 max-w-xs w-full"
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-4 pb-0">
              <button
                onClick={() => setShowNerdleConfirm(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-10 sm:px-8 sm:pb-12">
              <a
                href="https://www.nerdlegame.com"
                className="w-full text-center px-4 py-2.5 rounded-lg font-bold text-white text-lg sm:text-xl tracking-wide cursor-pointer transition-colors hover:brightness-110"
                style={{ backgroundColor: '#820458' }}
              >
                nerdleverse home
              </a>
              <button
                onClick={() => { setShowNerdleConfirm(false); setShowDatePicker(true); }}
                className="w-full text-center px-4 py-2.5 rounded-lg font-bold text-white text-base sm:text-lg tracking-wide cursor-pointer transition-colors hover:brightness-110"
                style={{ backgroundColor: '#398874' }}
              >
                previous fruit nerdle games
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Date picker modal */}
      {showDatePicker && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowDatePicker(false)}
        >
          <motion.div
            className="relative bg-slate-800/95 border-2 border-chrome-dark rounded-2xl shadow-2xl mx-4 max-w-xs w-full"
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 pb-0">
              <h3 className="font-title font-bold text-lg text-white">Previous Games</h3>
              <button
                onClick={() => setShowDatePicker(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col gap-4 px-6 pt-4 pb-8 sm:px-8 sm:pb-10">
              <p className="text-sm text-slate-400">
                Play any fruit nerdle from 11 Feb 2026 onwards.
              </p>
              <CalendarPicker onChooseDay={(date) => { setShowDatePicker(false); handleChooseDay(date); }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
