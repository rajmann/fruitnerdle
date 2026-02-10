import { motion } from 'framer-motion';

interface CoinTrayProps {
  totalCoins: number;
  potentialCoins: number;
}

const SLOTS_PER_SIDE = 5;
const MAX_SLOTS = SLOTS_PER_SIDE * 2; // 10

type CoinStyle = 'empty' | 'gold' | 'grey' | 'green5';

function CoinSlot({ style, index, label }: { style: CoinStyle; index: number; label?: string }) {
  const isGreen = style === 'green5';
  const isFilled = style !== 'empty';

  return (
    <motion.div
      className="rounded-full flex items-center justify-center"
      initial={{
        background: '#0a0a14',
        borderColor: '#2a2a3a',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
      }}
      animate={
        style === 'gold'
          ? {
              background: 'linear-gradient(135deg, #ffd700 0%, #ffec80 30%, #daa520 70%, #b8860b 100%)',
              borderColor: '#996515',
              boxShadow: '0 0 6px 1px rgba(255,215,0,0.5), inset 0 1px 2px rgba(255,255,255,0.5)',
            }
          : style === 'grey'
            ? {
                background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 30%, #4b5563 70%, #374151 100%)',
                borderColor: '#374151',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15)',
              }
            : isGreen
              ? {
                  background: 'linear-gradient(135deg, #22c55e 0%, #86efac 30%, #16a34a 70%, #15803d 100%)',
                  borderColor: '#166534',
                  boxShadow: '0 0 6px 1px rgba(34,197,94,0.5), inset 0 1px 2px rgba(255,255,255,0.5)',
                }
              : {
                  background: '#0a0a14',
                  borderColor: '#2a2a3a',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
                }
      }
      transition={{ duration: 0.3, delay: isFilled ? index * 0.06 : 0 }}
      style={{
        width: 'var(--coin-size)',
        height: 'var(--coin-size)',
        border: '1.5px solid',
      }}
    >
      {isFilled && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: style === 'grey' ? 0.7 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20, delay: index * 0.06 + 0.1 }}
          style={{
            color: isGreen ? '#052e16' : style === 'grey' ? '#1f2937' : '#2a1500',
            fontWeight: 800,
            fontSize: label ? 'calc(var(--coin-size) * 0.45)' : 'calc(var(--coin-size) * 0.55)',
            fontFamily: 'monospace',
            lineHeight: 1,
          }}
        >
          {label ?? 'ñ'}
        </motion.span>
      )}
    </motion.div>
  );
}

export default function CoinTray({ totalCoins, potentialCoins }: CoinTrayProps) {
  // Build slot array: green "5" coins consolidate earned coins when needed,
  // then individual gold (earned), grey (potential), and empty slots.
  const totalDisplay = totalCoins + potentialCoins;

  // How many green "5" coins needed to fit everything in 16 slots?
  // Each green5 saves 4 slots (5 coins in 1 slot).
  let green5Count = 0;
  let remainingEarned = totalCoins;

  if (totalDisplay > MAX_SLOTS) {
    const overflow = totalDisplay - MAX_SLOTS;
    green5Count = Math.ceil(overflow / 4);
    green5Count = Math.min(green5Count, Math.floor(totalCoins / 5));
    remainingEarned = totalCoins - green5Count * 5;
  }

  const slotsUsed = green5Count + remainingEarned + potentialCoins;
  const emptySlots = Math.max(0, MAX_SLOTS - slotsUsed);

  // Build slot array: green5s, gold, grey (potential), empty
  const slots: { style: CoinStyle; label?: string }[] = [];

  for (let i = 0; i < green5Count; i++) {
    slots.push({ style: 'green5', label: '5' });
  }
  for (let i = 0; i < remainingEarned; i++) {
    slots.push({ style: 'gold' });
  }
  for (let i = 0; i < potentialCoins; i++) {
    slots.push({ style: 'grey' });
  }
  for (let i = 0; i < emptySlots; i++) {
    slots.push({ style: 'empty' });
  }

  // Ensure exactly MAX_SLOTS
  while (slots.length > MAX_SLOTS) slots.pop();

  return (
    <div
      className="border-t border-chrome-dark flex items-center justify-center gap-[3px] sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2"
      style={{
        background: 'linear-gradient(to bottom, #58616e, #3a4250)',
        ['--coin-size' as string]: 'clamp(20px, 5vw, 30px)',
      }}
    >
      {/* Left coins */}
      {slots.slice(0, SLOTS_PER_SIDE).map((slot, i) => (
        <CoinSlot key={i} index={i} style={slot.style} label={slot.label} />
      ))}

      {/* Center LED counter */}
      <div className="flex items-center justify-center bg-black/80 border border-chrome-dark rounded px-1.5 sm:px-2 py-0.5 mx-0.5 sm:mx-1 shadow-inner" style={{ minWidth: '2.5rem' }}>
        <motion.span
          key={totalCoins}
          className="text-xs sm:text-sm font-bold font-mono text-led-amber led-glow select-none tabular-nums"
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          ñ{totalCoins}
        </motion.span>
      </div>

      {/* Right coins */}
      {slots.slice(SLOTS_PER_SIDE, MAX_SLOTS).map((slot, i) => (
        <CoinSlot key={i + SLOTS_PER_SIDE} index={i + SLOTS_PER_SIDE} style={slot.style} label={slot.label} />
      ))}
    </div>
  );
}
