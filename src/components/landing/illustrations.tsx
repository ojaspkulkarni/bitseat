import { C } from "../../styles/tokens";

export const LivePercentileIllustration = () => (
  <svg width="180" height="64" viewBox="0 0 180 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 54 Q30 54 50 40 Q70 26 90 14 Q110 26 130 40 Q150 54 170 54" stroke={C.rust} strokeWidth="1.8" fill="none" opacity="0.35" />
    <path d="M10 54 Q30 54 50 40 Q70 26 90 14 Q110 26 130 40 Q150 54 170 54 Z" fill={C.rust} opacity="0.08" />
    <line x1="124" y1="12" x2="124" y2="56" stroke={C.rust} strokeWidth="1.5" opacity="0.7" />
    <circle cx="124" cy="37" r="3.5" fill={C.rust} opacity="0.9" />
    <text x="128" y="13" fontSize="7.5" fill={C.rust} fontFamily="Inter, sans-serif" fontWeight="600" opacity="0.9">you</text>
    <text x="10" y="62" fontSize="7" fill={C.inkFaint} fontFamily="Inter, sans-serif">0</text>
    <text x="80" y="62" fontSize="7" fill={C.inkFaint} fontFamily="Inter, sans-serif">50th</text>
    <text x="158" y="62" fontSize="7" fill={C.inkFaint} fontFamily="Inter, sans-serif">100</text>
  </svg>
);

export const ScoreDistributionIllustration = () => {
  const bars = [4, 9, 18, 32, 44, 38, 28, 16, 8, 4];
  const max = 44;
  const barW = 13;
  const gap = 4;
  const chartH = 44;
  const startX = 14;
  return (
    <svg width="180" height="64" viewBox="0 0 180 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {bars.map((v, i) => {
        const bh = (v / max) * chartH;
        const x = startX + i * (barW + gap);
        const isYou = i === 7;
        return (
          <g key={i}>
            <rect x={x} y={52 - bh} width={barW} height={bh} rx="2" fill={C.rust} opacity={isYou ? 0.85 : 0.22} />
            {isYou && <text x={x + barW / 2} y={48 - bh} textAnchor="middle" fontSize="7" fill={C.rust} fontFamily="Inter, sans-serif" fontWeight="600">you</text>}
          </g>
        );
      })}
      <line x1="10" y1="53" x2="170" y2="53" stroke={C.border} strokeWidth="1" />
    </svg>
  );
};
