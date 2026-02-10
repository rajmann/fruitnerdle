/**
 * Static mockup of the proposed unified reel design.
 * Shows celebration state: lemons on outer dials, 5ñ coin in center.
 * DELETE THIS FILE when done comparing.
 */
import React from 'react';

const SAMPLE_VALUES = [
  ['3', '7', '11', '5', '9'],
  ['+', '\u00D7', '-', '/'],
  ['4', '8', '2', '12', '6'],
  ['-', '+', '/', '\u00D7'],
  ['1', '10', '6', '3', '7'],
];

const CURRENT_INDICES = [1, 2, 0, 1, 3];

/** Gold coin for center dial - same size as real game */
function CoinDisplay() {
  return (
    <div className="flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 rounded-full"
      style={{
        background: 'linear-gradient(135deg, #ffd700 0%, #ffec80 30%, #daa520 70%, #b8860b 100%)',
        boxShadow: '0 0 10px 2px rgba(255,215,0,0.5), inset 0 1px 3px rgba(255,255,255,0.5)',
        border: '2px solid #996515',
      }}>
      <span className="text-sm sm:text-xl font-bold font-mono leading-none"
        style={{ color: '#2a1500' }}>
        ñ5
      </span>
    </div>
  );
}

/** Reel-only dial - no nudge buttons */
function MockDial({ values, currentIdx, isOperator, dialIndex, overrideCenter }: {
  values: string[];
  currentIdx: number;
  isOperator: boolean;
  dialIndex: number;
  overrideCenter?: React.ReactNode;
}) {
  const len = values.length;
  const prev2 = values[(currentIdx - 2 + len) % len];
  const prev1 = values[(currentIdx - 1 + len) % len];
  const current = values[currentIdx];
  const next1 = values[(currentIdx + 1) % len];
  const next2 = values[(currentIdx + 2) % len];

  // Match real game text sizes
  const textBase = isOperator ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl';
  const textSmall = isOperator ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl';
  const textMain = isOperator ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl';

  return (
    <div className="relative w-12 sm:w-20">
      <div
        className="relative w-full rounded-lg border-2 border-slate-400"
        style={{
          boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5), inset 0 -4px 12px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {/* Single white reel body */}
        <div className="bg-white flex flex-col items-center rounded-md overflow-hidden">
          {/* Outer top */}
          <div
            className="h-4 sm:h-5 flex items-center justify-center w-full"
            style={{
              transform: 'perspective(200px) rotateX(50deg)',
              transformOrigin: 'bottom center',
            }}
          >
            <span className={`${textSmall} font-semibold text-nerdle-purple/40 select-none`}>
              {prev2}
            </span>
          </div>

          {/* Inner top */}
          <div
            className="h-8 sm:h-9 flex items-center justify-center w-full"
            style={{
              transform: 'perspective(200px) rotateX(30deg)',
              transformOrigin: 'bottom center',
              marginBottom: '5px',
            }}
          >
            <span className={`${textBase} font-semibold text-nerdle-purple/60 select-none`}>
              {prev1}
            </span>
          </div>

          {/* Center */}
          <div className="h-10 sm:h-16 flex items-center justify-center w-full">
            {overrideCenter ?? (
              <span className={`${textMain} font-bold text-nerdle-purple select-none`}>
                {current}
              </span>
            )}
          </div>

          {/* Inner bottom */}
          <div
            className="h-8 sm:h-9 flex items-center justify-center w-full"
            style={{
              transform: 'perspective(200px) rotateX(-30deg)',
              transformOrigin: 'top center',
              marginTop: '5px',
            }}
          >
            <span className={`${textBase} font-semibold text-nerdle-purple/60 select-none`}>
              {next1}
            </span>
          </div>

          {/* Outer bottom */}
          <div
            className="h-4 sm:h-5 flex items-center justify-center w-full"
            style={{
              transform: 'perspective(200px) rotateX(-50deg)',
              transformOrigin: 'top center',
            }}
          >
            <span className={`${textSmall} font-semibold text-nerdle-purple/40 select-none`}>
              {next2}
            </span>
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

/** Row of nudge buttons matching real NudgeButton chrome styling */
function MockNudgeRow({ direction }: { direction: 'up' | 'down' }) {
  // Reversed arrows: 'up' nudge shows down chevron, 'down' nudge shows up chevron
  const chevronPoints = direction === 'up' ? '6 9 12 15 18 9' : '18 15 12 9 6 15';
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="w-12 sm:w-20 flex justify-center">
          <div className="w-10 sm:w-18">
            <div className="w-full flex items-center justify-center rounded h-7 sm:h-8 bg-gradient-to-b from-chrome-light to-chrome-mid border border-chrome-dark"
              style={{ boxShadow: '0 0 10px rgba(0,255,136,0.3)' }}>
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                className="w-5 h-5 text-led-green"
                style={{ filter: 'drop-shadow(0 0 1px #1e293b) drop-shadow(0 0 1px #1e293b) drop-shadow(0 0 4px #00ff88)' }}
              >
                <polyline points={chevronPoints} />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Same emoji size as real game: text-3xl sm:text-5xl */
const LEMON = <span className="text-3xl sm:text-5xl select-none">🍋</span>;

function getCelebOverride(dialIndex: number): React.ReactNode | undefined {
  if (dialIndex === 2) return <CoinDisplay />;
  return LEMON;
}

/** Static light bulbs - celebration chase mode */
function MockLightBulbs() {
  const colors = ['#ff4444', '#ffcc00', '#44ff44', '#ff8800', '#ff44ff'];
  return (
    <div className="flex items-center justify-between px-1">
      {Array.from({ length: 9 }, (_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
          style={{
            backgroundColor: colors[i % colors.length],
            boxShadow: `0 0 6px 2px ${colors[i % colors.length]}80`,
            animation: `bulb-celebrate 0.6s ease-in-out ${i * 0.13}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/** Static NerdleLogo - front face only */
function MockLogo({ size = 36 }: { size?: number }) {
  const radius = size * 0.2;
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#820458',
      }}
    >
      <span className="font-title" style={{ color: 'white', fontSize: size * 0.95, fontWeight: 700, lineHeight: 1 }}>
        n
      </span>
    </div>
  );
}

/** Static LED panel showing win state */
function MockLedDisplay() {
  return (
    <div className="flex flex-col items-center justify-center bg-black/80 border border-nerdle-teal/60 rounded-md px-3 sm:px-6 py-0.5 sm:py-1 shadow-inner">
      <span className="text-xl sm:text-3xl font-bold font-mono text-led-green led-glow select-none tabular-nums whitespace-nowrap leading-tight">
        25 solved
      </span>
      <span className="text-[15px] sm:text-[21px] font-medium font-mono text-nerdle-teal select-none tabular-nums whitespace-nowrap leading-tight">
        3 moves = ñ5
      </span>
    </div>
  );
}

/** Static coin tray with sample coins */
function MockCoinTray() {
  const SLOTS = 16;
  const goldCount = 5;
  return (
    <div
      className="chrome-gradient border-t border-chrome-dark flex items-center justify-center gap-[3px] sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2"
      style={{ ['--coin-size' as string]: 'clamp(14px, 3.5vw, 22px)' }}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i}
          className="rounded-full flex items-center justify-center"
          style={{
            width: 'var(--coin-size)',
            height: 'var(--coin-size)',
            border: '1.5px solid',
            ...(i < goldCount
              ? {
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffec80 30%, #daa520 70%, #b8860b 100%)',
                  borderColor: '#996515',
                  boxShadow: '0 0 6px 1px rgba(255,215,0,0.5), inset 0 1px 2px rgba(255,255,255,0.5)',
                }
              : {
                  background: '#0a0a14',
                  borderColor: '#2a2a3a',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
                }),
          }}
        >
          {i < goldCount && (
            <span style={{ color: '#2a1500', fontWeight: 800, fontSize: 'calc(var(--coin-size) * 0.55)', fontFamily: 'monospace', lineHeight: 1 }}>
              ñ
            </span>
          )}
        </div>
      ))}

      {/* Center LED counter */}
      <div className="flex items-center justify-center bg-black/80 border border-chrome-dark rounded px-1.5 sm:px-2 py-0.5 mx-0.5 sm:mx-1 shadow-inner">
        <span className="text-xs sm:text-sm font-bold font-mono text-led-amber led-glow select-none tabular-nums">
          ñ5
        </span>
      </div>

      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={i + 8}
          className="rounded-full"
          style={{
            width: 'var(--coin-size)',
            height: 'var(--coin-size)',
            border: '1.5px solid',
            background: '#0a0a14',
            borderColor: '#2a2a3a',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
          }}
        />
      ))}
    </div>
  );
}

/** Static lever - pulled position */
function MockLever() {
  return (
    <div className="flex flex-col items-center">
      {/* Ball handle */}
      <div
        className="w-7 h-7 sm:w-10 sm:h-10 rounded-full shadow-lg relative z-20 bg-gradient-to-br from-red-500 to-red-700"
        style={{ boxShadow: '0 0 12px 3px rgba(239,68,68,0.6)' }}
      />
      {/* Arm shaft */}
      <div className="w-2.5 sm:w-3 h-28 sm:h-[10.5rem] chrome-gradient rounded-b -mt-4" />
    </div>
  );
}

export default function ReelMockup() {
  return (
    <div className="mt-6 flex flex-col items-center">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Mockup &mdash; proposed reel style</p>
      <div className="relative ml-10 sm:ml-14 mr-10 sm:mr-14">
        <div className="bg-gradient-to-b from-machine-panel via-machine-body to-machine-panel rounded-2xl border-2 border-chrome-dark shadow-2xl overflow-hidden">
          {/* Chrome top rail with lights */}
          <div className="chrome-gradient px-2 py-1 border-b border-chrome-dark">
            <MockLightBulbs />
          </div>

          {/* Header: title + LED marquee + logo */}
          <div className="relative flex items-center px-2 sm:px-3 py-2 sm:py-3">
            {/* Title - left */}
            <div className="font-title font-bold text-white select-none tracking-wide leading-none text-base sm:text-2xl shrink-0"
              style={{ textShadow: '0 0 20px rgba(130, 4, 88, 0.6)' }}>
              <span className="block">fruit</span>
              <span className="block">nerdle</span>
            </div>

            {/* LED marquee display - true center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <MockLedDisplay />
            </div>

            {/* Spacer + logo right */}
            <div className="flex-1" />
            <div className="shrink-0">
              <MockLogo size={36} />
            </div>
          </div>

          {/* Nudge up row - OUTSIDE glass window */}
          <div className="mx-2 sm:mx-3 mb-1">
            <MockNudgeRow direction="up" />
          </div>

          {/* Glass reel window with chrome frame */}
          <div className="relative w-fit mx-auto mb-1">
            {/* Chrome surround - simulates thick metal frame */}
            <div className="chrome-gradient rounded-lg" style={{ padding: '2px' }}>
              {/* Inner dark window */}
              <div className="relative rounded-[6px] bg-gradient-to-b from-slate-800 to-slate-900 py-1.5 sm:py-2 px-0.5 shadow-inner overflow-hidden"
                style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), inset 0 -2px 8px rgba(0,0,0,0.4)' }}
              >
                <div className="flex items-center justify-center gap-1 sm:gap-3">
                  {SAMPLE_VALUES.map((vals, i) => (
                    <MockDial
                      key={i}
                      values={vals}
                      currentIdx={CURRENT_INDICES[i]}
                      isOperator={i === 1 || i === 3}
                      dialIndex={i}
                      overrideCenter={getCelebOverride(i)}
                    />
                  ))}
                </div>

                {/* Payline - thin center line connecting arrows */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: '0',
                    right: '0',
                    top: '50%',
                    height: '1px',
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 4,
                  }}
                />

                {/* Left arrow - pointing right */}
                <div
                  className="absolute pointer-events-none flex items-center"
                  style={{ left: '-1px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}
                >
                  <div style={{
                    width: 0, height: 0,
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderLeft: '10px solid rgba(0,0,0,0.7)',
                  }} />
                </div>

                {/* Right arrow - pointing left */}
                <div
                  className="absolute pointer-events-none flex items-center"
                  style={{ right: '-1px', top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}
                >
                  <div style={{
                    width: 0, height: 0,
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '10px solid rgba(0,0,0,0.7)',
                  }} />
                </div>

                {/* Diagonal glass reflection */}
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden rounded-[6px]"
                  style={{ zIndex: 6 }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-20%',
                      left: '-10%',
                      width: '40%',
                      height: '140%',
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 55%, transparent 60%)',
                      transform: 'rotate(-15deg)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Marching color border overlay - absolute on top, mask only shows the border ring */}
            <div
              className="absolute payline-marching rounded-lg pointer-events-none"
              style={{ inset: '-3px', zIndex: 10 }}
            />
          </div>

          {/* Nudge down row - OUTSIDE glass window */}
          <div className="mx-2 sm:mx-3 mb-3">
            <MockNudgeRow direction="down" />
          </div>

          {/* Coin tray footer */}
          <MockCoinTray />
        </div>

        {/* Lever assembly - mounted to the right side */}
        <div className="absolute -right-10 sm:-right-14 top-[45%] -translate-y-1/2 flex items-end">
          {/* Horizontal mounting bracket */}
          <div className="w-6 sm:w-8 h-5 sm:h-6 chrome-gradient border border-chrome-dark border-l-0 rounded-r-sm shadow -mr-2 mb-1" />
          <div className="relative z-10">
            <MockLever />
          </div>
        </div>
      </div>
    </div>
  );
}
