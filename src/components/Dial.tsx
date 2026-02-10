import { motion, AnimatePresence } from 'framer-motion';
import DialStrip from './DialStrip';
import NudgeButton from './NudgeButton';
import type { DialConfig, DialState, GamePhase } from '@/types/puzzle';
import { cn } from '@/lib/utils';

interface DialProps {
  config: DialConfig;
  state: DialState;
  phase: GamePhase;
  dialIndex: number;
  isSpinning: boolean;
  isWon: boolean;
  isLocked: boolean;
  hideBottomNudge?: boolean;
  nudgeAccent?: 'green' | 'red';
  overrideDisplay?: React.ReactNode;
  onNudgeUp: () => void;
  onNudgeDown: () => void;
}

function formatValue(val: number | string) {
  if (val === '*') return '\u00D7';
  return String(val);
}

/** Mini spinning strip for preview rows during spin */
function SpinningPreview({ values, small, isOperator }: { values: (number | string)[]; small?: boolean; isOperator?: boolean }) {
  const itemH = small ? 32 : 48;
  const numberClass = small ? 'text-base sm:text-lg' : 'text-2xl sm:text-3xl';
  const operatorClass = small ? 'text-xl sm:text-2xl' : 'text-4xl sm:text-5xl';
  const textClass = isOperator ? operatorClass : numberClass;
  return (
    <motion.div
      className="flex flex-col"
      animate={{ y: [0, -values.length * itemH] }}
      transition={{ y: { repeat: Infinity, duration: 0.25, ease: 'linear' } }}
    >
      {[...values, ...values].map((val, i) => (
        <div key={i} className={`${small ? 'h-8 sm:h-9' : 'h-12 sm:h-14'} flex items-center justify-center`}>
          <span className={`${textClass} font-semibold text-nerdle-purple opacity-60`}>
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
  const opacity = small ? 'opacity-50' : 'opacity-70';
  const numberClass = small ? 'text-base sm:text-lg' : '';
  const operatorClass = small ? 'text-xl sm:text-2xl' : 'text-4xl sm:text-5xl';
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
        <span className={`text-nerdle-purple ${opacity}`}>
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
  isWon,
  isLocked,
  hideBottomNudge = false,
  nudgeAccent = 'green',
  overrideDisplay,
  onNudgeUp,
  onNudgeDown,
}: DialProps) {
  const canNudge = phase === 'playing' && !isWon;
  const len = config.values.length;
  const prevIndex = (state.currentIndex - 1 + len) % len;
  const nextIndex = (state.currentIndex + 1) % len;
  const prev2Index = (state.currentIndex - 2 + len) % len;
  const next2Index = (state.currentIndex + 2) % len;

  return (
    <div className="flex flex-col items-center w-12 sm:w-20">
      {/* Up nudge */}
      <div className="w-10 sm:w-18">
        <NudgeButton direction="up" disabled={!canNudge || isLocked} accent={nudgeAccent} onClick={onNudgeUp} />
      </div>

      {/* Outer preview above (prev-2) - smallest, most tilted */}
      <div
        className="h-8 sm:h-9 flex items-center justify-center bg-white/[0.85] border border-slate-300/40 rounded-sm text-base sm:text-lg font-semibold select-none overflow-hidden"
        style={{
          width: 'calc(100% - 10px)',
          perspective: '200px',
          transform: 'perspective(200px) rotateX(50deg)',
          transformOrigin: 'bottom center',
        }}
      >
        {isSpinning ? (
          <SpinningPreview values={config.values} small isOperator={config.type === 'operator'} />
        ) : (
          <AnimatedPreview
            val={config.values[prev2Index]}
            nudgeDirection={state.lastNudgeDirection}
            dialIndex={dialIndex}
            previewIndex={prev2Index}
            small
            isOperator={config.type === 'operator'}
          />
        )}
      </div>

      {/* Inner preview above (prev) */}
      <div
        className="h-12 sm:h-14 flex items-center justify-center bg-white/90 border border-slate-300/60 rounded-sm text-2xl sm:text-3xl font-semibold select-none overflow-hidden"
        style={{
          width: 'calc(100% - 4px)',
          perspective: '200px',
          transform: 'perspective(200px) rotateX(30deg)',
          transformOrigin: 'bottom center',
          marginTop: '-10px',
        }}
      >
        {isSpinning ? (
          <SpinningPreview values={config.values} isOperator={config.type === 'operator'} />
        ) : (
          <AnimatedPreview
            val={config.values[prevIndex]}
            nudgeDirection={state.lastNudgeDirection}
            dialIndex={dialIndex}
            previewIndex={prevIndex}
            isOperator={config.type === 'operator'}
          />
        )}
      </div>

      {/* Main dial display */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-lg border-2 shadow-lg transition-all duration-300',
          'w-12 h-12 sm:w-20 sm:h-20',
          'bg-white border-slate-300',
          !isWon && isLocked && 'border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
        )}
        style={{
          zIndex: 2,
          marginTop: '2px',
          marginBottom: '2px',
          ...(isWon ? { animation: `border-chase 0.8s ease-in-out ${dialIndex * 0.15}s infinite` } : {}),
        }}
      >
        <DialStrip
          values={config.values}
          currentIndex={state.currentIndex}
          isSpinning={isSpinning}
          dialPosition={dialIndex}
          isOperator={config.type === 'operator'}
          nudgeDirection={state.lastNudgeDirection}
          phase={phase}
          overrideDisplay={overrideDisplay}
        />
      </div>

      {/* Inner preview below (next) */}
      <div
        className="h-12 sm:h-14 flex items-center justify-center bg-white/90 border border-slate-300/60 rounded-sm text-2xl sm:text-3xl font-semibold select-none overflow-hidden"
        style={{
          width: 'calc(100% - 4px)',
          perspective: '200px',
          transform: 'perspective(200px) rotateX(-30deg)',
          transformOrigin: 'top center',
        }}
      >
        {isSpinning ? (
          <SpinningPreview values={config.values} isOperator={config.type === 'operator'} />
        ) : (
          <AnimatedPreview
            val={config.values[nextIndex]}
            nudgeDirection={state.lastNudgeDirection}
            dialIndex={dialIndex}
            previewIndex={nextIndex}
            isOperator={config.type === 'operator'}
          />
        )}
      </div>

      {/* Outer preview below (next+2) - smallest, most tilted */}
      <div
        className="h-8 sm:h-9 flex items-center justify-center bg-white/[0.85] border border-slate-300/40 rounded-sm text-base sm:text-lg font-semibold select-none overflow-hidden"
        style={{
          width: 'calc(100% - 10px)',
          perspective: '200px',
          transform: 'perspective(200px) rotateX(-50deg)',
          transformOrigin: 'top center',
          marginTop: '-10px',
        }}
      >
        {isSpinning ? (
          <SpinningPreview values={config.values} small isOperator={config.type === 'operator'} />
        ) : (
          <AnimatedPreview
            val={config.values[next2Index]}
            nudgeDirection={state.lastNudgeDirection}
            dialIndex={dialIndex}
            previewIndex={next2Index}
            small
            isOperator={config.type === 'operator'}
          />
        )}
      </div>

      {/* Down nudge - hidden when won, replaced by NEXT CHALLENGE in parent */}
      {!hideBottomNudge && (
        <div className="w-10 sm:w-18">
          <NudgeButton direction="down" disabled={!canNudge || isLocked} accent={nudgeAccent} onClick={onNudgeDown} />
        </div>
      )}
    </div>
  );
}
