import { motion, AnimatePresence } from 'framer-motion';
import DialStrip from './DialStrip';
import type { DialConfig, DialState, GamePhase } from '@/types/puzzle';

interface DialProps {
  config: DialConfig;
  state: DialState;
  phase: GamePhase;
  dialIndex: number;
  isSpinning: boolean;
  isLocked: boolean;
  overrideDisplay?: React.ReactNode;
}

function formatValue(val: number | string) {
  if (val === '*') return '\u00D7';
  return String(val);
}

/** Mini spinning strip for preview rows during spin */
function SpinningPreview({ values, small, isOperator }: { values: (number | string)[]; small?: boolean; isOperator?: boolean }) {
  const itemH = small ? 32 : 48;
  const numberClass = 'text-2xl sm:text-3xl';
  const operatorClass = 'text-4xl sm:text-5xl';
  const textClass = isOperator ? operatorClass : numberClass;
  const colorClass = small ? 'text-nerdle-purple/50' : 'text-nerdle-purple/60';
  return (
    <motion.div
      className="flex flex-col"
      animate={{ y: [0, -values.length * itemH] }}
      transition={{ y: { repeat: Infinity, duration: 0.25, ease: 'linear' } }}
    >
      {[...values, ...values].map((val, i) => (
        <div key={i} className={`${small ? 'h-8 sm:h-9' : 'h-12 sm:h-14'} flex items-center justify-center`}>
          <span className={`${textClass} font-bold ${colorClass}`}>
            {formatValue(val)}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

/** Animated preview value that slides on nudge */
function AnimatedPreview({
  val,
  nudgeDirection,
  dialIndex,
  previewIndex,
  small,
  isOperator,
}: {
  val: number | string;
  nudgeDirection?: 'up' | 'down';
  dialIndex: number;
  previewIndex: number;
  small?: boolean;
  isOperator?: boolean;
}) {
  const dist = small ? 14 : 20;
  const enterY = nudgeDirection === 'up' ? -dist : dist;
  const exitY = nudgeDirection === 'up' ? dist : -dist;
  const colorClass = small ? 'text-nerdle-purple/50' : 'text-nerdle-purple/60';
  const numberClass = 'text-2xl sm:text-3xl';
  const operatorClass = 'text-4xl sm:text-5xl';
  const textClass = isOperator ? operatorClass : numberClass;

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={`${dialIndex}-preview-${previewIndex}`}
        className={`flex items-center justify-center ${textClass}`}
        initial={{ y: enterY, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: exitY, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }}
      >
        <span className={`font-bold ${colorClass}`}>
          {formatValue(val)}
        </span>
      </motion.span>
    </AnimatePresence>
  );
}

export default function Dial({
  config,
  state,
  phase,
  dialIndex,
  isSpinning,
  isLocked,
  overrideDisplay,
}: DialProps) {
  const len = config.values.length;
  const prevIndex = (state.currentIndex - 1 + len) % len;
  const nextIndex = (state.currentIndex + 1) % len;
  const prev2Index = (state.currentIndex - 2 + len) % len;
  const next2Index = (state.currentIndex + 2) % len;

  const isOperator = config.type === 'operator';
  const textSmall = isOperator ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl';
  const textBase = isOperator ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl';

  return (
    <div className="relative w-14 sm:w-24">
      <div
        className="relative w-full rounded-lg border-2 border-slate-400"
        style={{
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5), inset 0 -4px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.2)',
          ...(isLocked ? { borderColor: '#22c55e', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5), inset 0 -4px 12px rgba(0,0,0,0.5), 0 0 8px rgba(34,197,94,0.4)' } : {}),
        }}
      >
        {/* Single white reel body */}
        <div className="bg-white flex flex-col items-center rounded-md overflow-hidden">
          {/* Outer top (prev-2) */}
          <div
            className="h-4 sm:h-5 flex items-center justify-center w-full overflow-hidden"
            style={{
              transform: 'perspective(200px) rotateX(50deg)',
              transformOrigin: 'bottom center',
            }}
          >
            {isSpinning ? (
              <SpinningPreview values={config.values} small isOperator={isOperator} />
            ) : (
              <AnimatedPreview
                val={config.values[prev2Index]}
                nudgeDirection={state.lastNudgeDirection}
                dialIndex={dialIndex}
                previewIndex={prev2Index}
                small
                isOperator={isOperator}
              />
            )}
          </div>

          {/* Inner top (prev) */}
          <div
            className="h-8 sm:h-9 flex items-center justify-center w-full overflow-hidden"
            style={{
              transform: 'perspective(200px) rotateX(30deg)',
              transformOrigin: 'bottom center',
              marginBottom: '2px',
            }}
          >
            {isSpinning ? (
              <SpinningPreview values={config.values} isOperator={isOperator} />
            ) : (
              <AnimatedPreview
                val={config.values[prevIndex]}
                nudgeDirection={state.lastNudgeDirection}
                dialIndex={dialIndex}
                previewIndex={prevIndex}
                isOperator={isOperator}
              />
            )}
          </div>

          {/* Center row */}
          <div className="h-10 sm:h-16 flex items-center justify-center w-full">
            <DialStrip
              values={config.values}
              currentIndex={state.currentIndex}
              isSpinning={isSpinning}
              dialPosition={dialIndex}
              isOperator={isOperator}
              nudgeDirection={state.lastNudgeDirection}
              phase={phase}
              overrideDisplay={overrideDisplay}
            />
          </div>

          {/* Inner bottom (next) */}
          <div
            className="h-8 sm:h-9 flex items-center justify-center w-full overflow-hidden"
            style={{
              transform: 'perspective(200px) rotateX(-30deg)',
              transformOrigin: 'top center',
              marginTop: '2px',
            }}
          >
            {isSpinning ? (
              <SpinningPreview values={config.values} isOperator={isOperator} />
            ) : (
              <AnimatedPreview
                val={config.values[nextIndex]}
                nudgeDirection={state.lastNudgeDirection}
                dialIndex={dialIndex}
                previewIndex={nextIndex}
                isOperator={isOperator}
              />
            )}
          </div>

          {/* Outer bottom (next+2) */}
          <div
            className="h-4 sm:h-5 flex items-center justify-center w-full overflow-hidden"
            style={{
              transform: 'perspective(200px) rotateX(-50deg)',
              transformOrigin: 'top center',
            }}
          >
            {isSpinning ? (
              <SpinningPreview values={config.values} small isOperator={isOperator} />
            ) : (
              <AnimatedPreview
                val={config.values[next2Index]}
                nudgeDirection={state.lastNudgeDirection}
                dialIndex={dialIndex}
                previewIndex={next2Index}
                small
                isOperator={isOperator}
              />
            )}
          </div>
        </div>

        {/* Clipped overlay container for shadows and glass */}
        <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none">
          {/* Shadow overlay - top */}
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: '45%',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)',
            }}
          />

          {/* Shadow overlay - bottom */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: '45%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.05) 70%, transparent 100%)',
            }}
          />

          {/* Center highlight band */}
          <div
            className="absolute inset-x-0"
            style={{
              top: '33%',
              height: '34%',
              background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.15) 70%, transparent)',
              borderTop: '1px solid rgba(200,200,200,0.3)',
              borderBottom: '1px solid rgba(200,200,200,0.3)',
            }}
          />

          {/* Glass overlay */}
          <div className="absolute inset-0 glass-overlay rounded-lg" />
        </div>
      </div>
    </div>
  );
}
