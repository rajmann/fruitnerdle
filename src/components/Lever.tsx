import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import type { GamePhase } from '@/types/puzzle';

interface LeverProps {
  phase: GamePhase;
  onSpin: () => void;
}

export default function Lever({ phase, onSpin }: LeverProps) {
  const canSpin = phase === 'ready' || phase === 'playing';
  const [pulled, setPulled] = useState(false);
  const [lit, setLit] = useState(false);
  const pulledRef = useRef(false);

  // Keep ref in sync so drag handler sees latest value
  pulledRef.current = pulled;

  // Simple on/off toggle for ball glow – 500ms on, 500ms off
  useEffect(() => {
    if (phase !== 'ready' || pulled) { setLit(false); return; }
    const id = setInterval(() => setLit(l => !l), 500);
    return () => clearInterval(id);
  }, [phase, pulled]);

  // Motion value for drag tracking
  const dragY = useMotionValue(0);
  // Shaft scale driven reactively by drag position
  const shaftScale = useTransform(dragY, [0, 40], [1, 0.65]);

  const triggerSpin = () => {
    setPulled(true);
    onSpin();
    animate(dragY, 40, { type: 'spring', stiffness: 300, damping: 15 }).then(() => {
      animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 20 });
      setTimeout(() => setPulled(false), 200);
    });
  };

  // Click fallback
  const handlePull = () => {
    if (!canSpin || pulledRef.current) return;
    triggerSpin();
  };

  // Drag end: trigger spin if past threshold, otherwise snap back
  const handleDragEnd = () => {
    if (dragY.get() >= 30 && canSpin && !pulledRef.current) {
      triggerSpin();
    } else if (!pulledRef.current) {
      animate(dragY, 0, { type: 'spring', stiffness: 400, damping: 20 });
    }
  };

  return (
    <button
      onClick={handlePull}
      disabled={!canSpin}
      className="relative flex flex-col items-center cursor-pointer disabled:cursor-not-allowed group"
      style={{ touchAction: 'none' }}
      aria-label="Pull lever to spin"
    >
      {/* Ball handle - higher z-index, draggable downward */}
      <motion.div
        className="relative z-20"
        style={{ y: dragY, x: 1, marginTop: '-20px' }}
        drag={canSpin && !pulled ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 40 }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        <div
          className="w-7 h-7 sm:w-10 sm:h-10 rounded-full relative overflow-hidden"
          style={{
            transition: 'none',
            background: lit
              ? 'radial-gradient(circle at 35% 30%, #fca5a5 0%, #ef4444 20%, #dc2626 45%, #991b1b 80%, #7f1d1d 100%)'
              : 'radial-gradient(circle at 35% 30%, #cd2d2d 0%, #b91c1c 20%, #991b1b 45%, #7f1d1d 80%, #6b1818 100%)',
            boxShadow: lit
              ? '0 4px 10px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3), inset 0 -3px 8px rgba(0,0,0,0.3), 0 0 24px 6px rgba(239,68,68,0.9)'
              : '0 4px 10px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3), inset 0 -3px 8px rgba(0,0,0,0.3)',
          }}
        >
          {/* Specular highlight – grey when dark, white when lit */}
          <div
            className="absolute rounded-full"
            style={{
              top: '15%',
              left: '20%',
              width: '35%',
              height: '25%',
              background: 'radial-gradient(ellipse, rgba(200,200,200,0.3) 0%, rgba(200,200,200,0) 100%)',
              opacity: lit ? 1 : 0.4,
            }}
          />
        </div>
      </motion.div>

      {/* Arm shaft - shrinks from top, bottom stays fixed */}
      <motion.div
        className="w-2.5 sm:w-3 h-[8.25rem] sm:h-[11.75rem] chrome-gradient rounded-b -mt-4"
        style={{ scaleY: shaftScale, transformOrigin: '50% 100%' }}
      />
    </button>
  );
}
