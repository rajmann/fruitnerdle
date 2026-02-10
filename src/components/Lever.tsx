import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GamePhase } from '@/types/puzzle';

interface LeverProps {
  phase: GamePhase;
  onSpin: () => void;
}

export default function Lever({ phase, onSpin }: LeverProps) {
  const canSpin = phase === 'ready' || phase === 'playing';
  const [pulled, setPulled] = useState(false);

  const handlePull = () => {
    if (!canSpin || pulled) return;
    setPulled(true);
    onSpin();
    setTimeout(() => setPulled(false), 600);
  };

  const springDown = { type: 'spring' as const, stiffness: 300, damping: 15 };
  const springUp = { type: 'spring' as const, stiffness: 400, damping: 20 };

  return (
    <button
      onClick={handlePull}
      disabled={!canSpin}
      className="relative flex flex-col items-center cursor-pointer disabled:cursor-not-allowed group"
      aria-label="Pull lever to spin"
    >
      {/* Ball handle - higher z-index, moves down */}
      <motion.div
        className="relative z-20"
        animate={pulled ? { y: 40 } : { y: 0 }}
        transition={pulled ? springDown : springUp}
      >
        <motion.div
          className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full shadow-lg transition-colors ${
            pulled
              ? 'bg-gradient-to-br from-red-700 to-red-900'
              : 'bg-gradient-to-br from-red-500 to-red-700 group-hover:from-red-400 group-hover:to-red-600'
          }`}
          animate={phase === 'ready' && !pulled ? {
            boxShadow: [
              '0 0 4px rgba(239,68,68,0.3)',
              '0 0 24px 6px rgba(239,68,68,0.9)',
              '0 0 4px rgba(239,68,68,0.3)',
            ],
          } : {}}
          transition={phase === 'ready' && !pulled ? {
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          } : {}}
        />
      </motion.div>

      {/* Arm shaft - shrinks from top, bottom stays fixed */}
      <motion.div
        className="w-2.5 sm:w-3 h-28 sm:h-[10.5rem] chrome-gradient rounded-b -mt-4"
        style={{ transformOrigin: '50% 100%' }}
        animate={pulled ? { scaleY: 0.65 } : { scaleY: 1 }}
        transition={pulled ? springDown : springUp}
      />
    </button>
  );
}
