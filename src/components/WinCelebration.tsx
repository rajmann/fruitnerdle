import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { createFruitConfetti } from '@/lib/fruitConfetti';

interface WinCelebrationProps {
  moveCount: number;
  target: number;
  totalCoins?: number;
  onNextPuzzle: () => void;
  onPlayAgain: () => void;
}

export default function WinCelebration({
  moveCount,
  target,
  totalCoins,
  onNextPuzzle,
  onPlayAgain,
}: WinCelebrationProps) {
  useEffect(() => {
    const timer = setTimeout(() => createFruitConfetti(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center overflow-hidden
          bg-gradient-to-b from-machine-panel via-machine-body to-machine-panel
          border-2 border-chrome-dark"
        initial={{ y: 50, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
      >
        <div className="text-5xl mb-3 select-none">🎉</div>

        <h2
          className="text-2xl sm:text-3xl font-title font-bold text-white mb-2"
          style={{ textShadow: '0 0 20px rgba(130, 4, 88, 0.8)' }}
        >
          All Challenges Complete!
        </h2>

        {totalCoins != null && (
          <p
            className="text-2xl font-bold font-mono text-led-amber mb-2"
            style={{ textShadow: '0 0 8px #ffcc00' }}
          >
            Total: ñ{totalCoins}
          </p>
        )}

        <p className="text-base text-slate-400 mb-6">
          You solved all 5 challenges.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 px-6 rounded-xl font-bold text-lg
              bg-gradient-to-br from-nerdle-teal to-nerdle-teal-dark text-white
              shadow-[0_0_15px_rgba(57,136,116,0.4)]
              hover:shadow-[0_0_25px_rgba(57,136,116,0.6)]
              active:scale-95 transition-all"
          >
            Play Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
