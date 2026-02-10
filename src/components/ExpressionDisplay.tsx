import { motion } from 'framer-motion';
import type { FruitPuzzle, DialState, GamePhase, Operator } from '@/types/puzzle';
import { formatExpression, evaluateForDisplay, formatResult } from '@/lib/evaluate';
import { cn } from '@/lib/utils';

interface ExpressionDisplayProps {
  puzzle: FruitPuzzle;
  dialStates: DialState[];
  phase: GamePhase;
  currentResult: number | null;
  isCorrect: boolean;
  target: number;
}

export default function ExpressionDisplay({
  puzzle,
  dialStates,
  phase,
  currentResult,
  isCorrect,
  target,
}: ExpressionDisplayProps) {
  if (phase === 'ready' || phase === 'spinning') {
    return (
      <div className="h-12 flex items-center justify-center">
        <span className="text-lg text-fruit-brown/40 font-medium select-none">
          {phase === 'ready' ? 'Spin to start!' : 'Spinning...'}
        </span>
      </div>
    );
  }

  const values = dialStates.map((ds, i) => puzzle.dials[i].values[ds.currentIndex]);
  const n1 = values[0] as number;
  const op1 = values[1] as string;
  const n2 = values[2] as number;
  const op2 = values[3] as string;
  const n3 = values[4] as number;

  const expr = formatExpression(n1, op1, n2, op2, n3);
  const displayResult = evaluateForDisplay(n1, op1 as Operator, n2, op2 as Operator, n3);
  const displayStr = formatResult(displayResult);

  return (
    <motion.div
      className="h-12 flex items-center justify-center gap-2"
      animate={isCorrect ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.4, repeat: isCorrect ? 2 : 0 }}
    >
      <span className="text-xl sm:text-2xl font-semibold text-nerdle-purple select-none font-mono tracking-wide">
        {expr}
      </span>
      <span className="text-xl sm:text-2xl font-semibold select-none">=</span>
      <span
        className={cn(
          'text-xl sm:text-2xl font-bold select-none font-mono min-w-[3ch] text-center',
          isCorrect ? 'text-nerdle-teal' : 'text-fruit-red',
        )}
      >
        {displayStr}
      </span>
      {isCorrect && (
        <motion.span
          className="text-2xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          ✅
        </motion.span>
      )}
    </motion.div>
  );
}
