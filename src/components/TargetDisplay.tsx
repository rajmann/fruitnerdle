import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TargetDisplayProps {
  target: number;
  calcResult: number | null;
  isCorrect: boolean;
  moveCount: number;
  nudgeCount: number;
  payout?: number;
  minMoves?: number;
  phase?: string;
  celebrationTotal?: number;
}

export default function TargetDisplay({ target, calcResult, isCorrect, moveCount, nudgeCount, payout, minMoves, phase, celebrationTotal }: TargetDisplayProps) {
  let calcDisplay = '??';
  if (calcResult !== null && Number.isInteger(calcResult)) {
    calcDisplay = String(calcResult);
  }

  // Always show "solvable in" panel when not won and no nudges yet; display "?" until spin completes
  const showHint = !isCorrect && nudgeCount === 0;
  const hintValue = (phase === 'playing' && minMoves != null && minMoves > 0) ? String(minMoves) : '?';
  const showCalc = !isCorrect && nudgeCount > 0;

  return (
    <div className="flex items-stretch justify-center gap-2 sm:gap-3">
      <AnimatePresence mode="wait">
        {isCorrect ? (
          /* Win message LED panel - matches TARGET panel height */
          <motion.div
            key="win"
            className="flex flex-col items-center justify-center bg-black/80 border border-nerdle-teal/60 rounded-md px-3 sm:px-6 py-0.5 sm:py-1 shadow-inner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="text-xl sm:text-3xl font-bold font-mono text-led-green led-glow select-none tabular-nums whitespace-nowrap leading-tight">
              {celebrationTotal != null ? `ñ${celebrationTotal}` : `${target} solved`}
            </span>
            <span className="text-[15px] sm:text-[21px] font-medium font-mono text-nerdle-teal select-none tabular-nums whitespace-nowrap leading-tight">
              {celebrationTotal != null
                ? 'Complete!'
                : `${moveCount} moves = ñ${payout ?? moveCount}`
              }
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="panels"
            className="flex items-stretch justify-center gap-2 sm:gap-3"
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Target LED panel */}
            <div className="flex flex-col items-center justify-center bg-black/80 border border-chrome-dark rounded-md px-2 sm:px-6 py-1 sm:py-1.5 min-w-[56px] sm:min-w-[90px] shadow-inner">
              <span className="text-[8px] sm:text-[10px] font-medium text-slate-400 tracking-widest uppercase select-none">
                Target
              </span>
              <span className="text-xl sm:text-3xl font-bold font-mono text-led-green led-glow select-none tabular-nums">
                {target}
              </span>
            </div>

            {/* Hint panel - always visible before first nudge; shows "?" until spin completes */}
            {showHint && (
              <div
                className="flex flex-col items-center justify-center bg-black/80 border border-chrome-dark rounded-md px-2 sm:px-4 py-1 sm:py-1.5 shadow-inner"
              >
                <span className="text-[8px] sm:text-[10px] font-medium text-slate-400 tracking-widest uppercase select-none">
                  Solvable in
                </span>
                <span className="text-xl sm:text-3xl font-bold font-mono text-led-green led-glow select-none tabular-nums">
                  {hintValue}
                </span>
              </div>
            )}

            {/* Calc LED panel - appears after first nudge */}
            {showCalc && (
              <motion.div
                className={cn(
                  'flex flex-col items-center justify-center bg-black/80 border rounded-md px-2 sm:px-6 py-1 sm:py-1.5 min-w-[56px] sm:min-w-[90px] shadow-inner',
                  'border-chrome-dark',
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <span className="text-[8px] sm:text-[10px] font-medium text-slate-400 tracking-widest uppercase select-none">
                  Calc
                </span>
                <span
                  className={cn(
                    'text-xl sm:text-3xl font-bold font-mono select-none tabular-nums',
                    calcDisplay === '??'
                      ? 'text-slate-600'
                      : 'text-led-amber led-glow',
                  )}
                >
                  {calcDisplay}
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
