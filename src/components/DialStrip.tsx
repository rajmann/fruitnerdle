import { motion, AnimatePresence } from 'framer-motion';
import type { GamePhase } from '@/types/puzzle';

interface DialStripProps {
  values: (number | string)[];
  currentIndex: number;
  isSpinning: boolean;
  dialPosition: number;
  isOperator: boolean;
  nudgeDirection?: 'up' | 'down';
  phase: GamePhase;
  overrideDisplay?: React.ReactNode;
}

function formatValue(val: number | string): string {
  if (val === '*') return '\u00D7';
  return String(val);
}

export default function DialStrip({
  values,
  currentIndex,
  isSpinning,
  dialPosition,
  isOperator,
  nudgeDirection,
  phase,
  overrideDisplay,
}: DialStripProps) {
  // In ready state, show ? instead of actual value
  if (phase === 'ready') {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
        <span
          className="font-bold select-none text-2xl sm:text-3xl text-led-green"
          style={{ textShadow: '0 0 1px #1e293b, 0 0 1px #1e293b, 0 0 2px #1e293b, 0 0 8px #00ff88' }}
        >
          ?
        </span>
      </div>
    );
  }

  if (isSpinning) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
        <motion.div
          className="flex flex-col items-center"
          animate={{ y: [0, -values.length * 60] }}
          transition={{ y: { repeat: Infinity, duration: 0.3, ease: 'linear' } }}
        >
          {[...values, ...values].map((val, i) => (
            <div
              key={i}
              className="flex items-center justify-center h-[56px] sm:h-[68px]"
            >
              <span
                className={`font-bold select-none ${
                  isOperator ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                } text-nerdle-purple`}
              >
                {formatValue(val)}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    );
  }

  // Override display (e.g., celebration content)
  if (overrideDisplay) {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
        {overrideDisplay}
      </div>
    );
  }

  // Playing / Won - show current value with slide animation
  const displayValue = values[currentIndex];
  const enterY = nudgeDirection === 'up' ? -30 : 30;
  const exitY = nudgeDirection === 'up' ? 30 : -30;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`${dialPosition}-${currentIndex}`}
          className="flex items-center justify-center w-full h-full"
          initial={{ y: enterY, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: exitY, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            mass: 0.8,
          }}
        >
          <span className={`font-bold select-none ${
            isOperator ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
          } text-nerdle-purple`}>
            {formatValue(displayValue)}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
