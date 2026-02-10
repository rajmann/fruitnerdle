import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NudgeButtonProps {
  direction: 'up' | 'down';
  disabled: boolean;
  accent?: 'green' | 'red';
  onClick: () => void;
}

export default function NudgeButton({ direction, disabled, accent = 'green', onClick }: NudgeButtonProps) {
  const Icon = direction === 'up' ? ChevronDown : ChevronUp;
  const isGreen = accent === 'green';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-center rounded transition-all duration-200',
        'h-8 sm:h-9',
        'border border-chrome-dark',
        disabled
          ? 'cursor-not-allowed opacity-70 shadow-[0_2px_3px_rgba(0,0,0,0.3)]'
          : cn(
              'active:scale-90 active:shadow-none cursor-pointer',
              'shadow-[0_3px_5px_rgba(0,0,0,0.4),_0_1px_2px_rgba(0,0,0,0.3)]',
              isGreen ? 'shadow-[0_3px_5px_rgba(0,0,0,0.4),_0_0_10px_rgba(0,255,136,0.3)]' : 'shadow-[0_3px_5px_rgba(0,0,0,0.4),_0_0_10px_rgba(239,68,68,0.3)]',
            ),
      )}
      style={{ background: `linear-gradient(to bottom, #969aa2, #848890)` }}
      aria-label={`Nudge ${direction}`}
    >
      <Icon
        className={cn(
          'w-5 h-5 transition-all duration-200',
          disabled ? 'text-slate-600' : isGreen ? 'text-led-green' : 'text-red-500',
        )}
        strokeWidth={3}
        style={disabled ? undefined : {
          filter: isGreen
            ? 'drop-shadow(0 0 1px #1e293b) drop-shadow(0 0 1px #1e293b) drop-shadow(0 0 4px #00ff88)'
            : 'drop-shadow(0 0 1px #1e293b) drop-shadow(0 0 1px #1e293b) drop-shadow(0 0 4px #ef4444)',
        }}
      />
    </button>
  );
}
