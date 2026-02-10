interface NerdleLogoProps {
  isSpinning: boolean;
  size?: number;
}

export default function NerdleLogo({ isSpinning, size = 36 }: NerdleLogoProps) {
  const half = size / 2;
  const radius = size * 0.2;

  const faceBase: React.CSSProperties = {
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: radius,
    backfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const symbolStyle: React.CSSProperties = {
    color: 'white',
    fontSize: size * 0.8,
    fontWeight: 700,
    lineHeight: 1,
  };

  return (
    <div
      style={{
        width: size,
        height: size,
        perspective: size * 4,
      }}
    >
      <div
        className={isSpinning ? 'logo-cube-spin' : ''}
        style={{
          width: size,
          height: size,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: isSpinning ? 'none' : 'transform 0.6s ease-out',
          transform: isSpinning ? undefined : 'rotateX(0deg)',
        }}
      >
        {/* Front - nerdle pink with 'n' */}
        <div
          style={{
            ...faceBase,
            backgroundColor: '#820458',
            transform: `translateZ(${half}px)`,
          }}
        >
          <span className="font-title" style={{ color: 'white', fontSize: size * 0.95, fontWeight: 700, lineHeight: 1 }}>
            n
          </span>
        </div>

        {/* Back - nerdle pink */}
        <div
          style={{
            ...faceBase,
            backgroundColor: '#820458',
            transform: `rotateY(180deg) translateZ(${half}px)`,
          }}
        />

        {/* Top - nerdle green with '+' */}
        <div
          style={{
            ...faceBase,
            backgroundColor: '#398874',
            transform: `rotateX(90deg) translateZ(${half}px)`,
          }}
        >
          <span className="font-title" style={symbolStyle}>+</span>
        </div>

        {/* Bottom - grey with '=' */}
        <div
          style={{
            ...faceBase,
            backgroundColor: '#989484',
            transform: `rotateX(-90deg) translateZ(${half}px)`,
          }}
        >
          <span className="font-title" style={symbolStyle}>=</span>
        </div>

        {/* Left - grey */}
        <div
          style={{
            ...faceBase,
            backgroundColor: '#989484',
            transform: `rotateY(-90deg) translateZ(${half}px)`,
          }}
        />

        {/* Right - grey */}
        <div
          style={{
            ...faceBase,
            backgroundColor: '#989484',
            transform: `rotateY(90deg) translateZ(${half}px)`,
          }}
        />
      </div>
    </div>
  );
}
