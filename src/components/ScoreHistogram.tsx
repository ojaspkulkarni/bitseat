import { C, font } from "./stats.tokens";
import { Skeleton } from "./stats.primitives";

export function ScoreHistogram({
  allScores,
  myScore,
  loading,
}: {
  allScores: number[];
  myScore: number | null;
  loading: boolean;
}) {
  const BUCKET = 5;
  const MIN_SCORE = 100;
  const MAX_SCORE = 390;
  const NUM_BUCKETS = Math.ceil((MAX_SCORE - MIN_SCORE) / BUCKET);

  const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => ({
    lo: MIN_SCORE + i * BUCKET,
    hi: MIN_SCORE + (i + 1) * BUCKET,
    count: 0,
  }));

  for (const s of allScores) {
    const idx = Math.floor((s - MIN_SCORE) / BUCKET);
    if (idx >= 0 && idx < NUM_BUCKETS) buckets[idx].count++;
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const myBucketIdx = myScore !== null ? Math.floor((myScore - MIN_SCORE) / BUCKET) : -1;

  const chartH = 72;
  const barW = 6;
  const gap = 1;
  const totalW = NUM_BUCKETS * (barW + gap) - gap;

  const cutoffLines = [
    { score: 270, label: "HYD CSE", color: C.inkFaint },
    { score: 285, label: "PIL ECE", color: C.inkFaint },
    { score: 295, label: "PIL MnC", color: C.inkMid },
    { score: 304, label: "PIL CSE", color: C.rustDark },
  ];

  if (loading) {
    return (
      <div style={{ height: "110px", display: "flex", alignItems: "center" }}>
        <Skeleton />
      </div>
    );
  }

  if (allScores.length < 5) {
    return (
      <span style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint }}>
        Not enough submissions to plot a distribution yet.
      </span>
    );
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${totalW} ${chartH + 20}`}
        style={{ width: "100%", minWidth: `${totalW}px`, display: "block" }}
        aria-label="Score distribution histogram"
      >
        {/* Bars */}
        {buckets.map((b, i) => {
          const barH = Math.max(1, Math.round((b.count / maxCount) * chartH));
          const x = i * (barW + gap);
          const y = chartH - barH;
          return (
            <rect
              key={i}
              x={x} y={y} width={barW} height={barH}
              fill={i === myBucketIdx ? C.rust : C.borderMid}
              rx={1}
              opacity={b.count === 0 ? 0.2 : 1}
            />
          );
        })}

        {/* Cutoff lines */}
        {cutoffLines.map((cl) => {
          const x = ((cl.score - MIN_SCORE) / BUCKET) * (barW + gap) + barW / 2;
          return (
            <g key={cl.score}>
              <line
                x1={x} y1={0} x2={x} y2={chartH}
                stroke={cl.color} strokeWidth={1} strokeDasharray="3 2" opacity={0.5}
              />
              <text x={x + 2} y={8} fontFamily={font.sans} fontSize={5} fill={cl.color} opacity={0.7}>
                {cl.label}
              </text>
            </g>
          );
        })}

        {/* My score marker */}
        {myScore !== null && myBucketIdx >= 0 && (() => {
          const x = myBucketIdx * (barW + gap) + barW / 2;
          const barH = Math.max(1, Math.round(((buckets[myBucketIdx]?.count ?? 0) / maxCount) * chartH));
          return (
            <g>
              <line x1={x} y1={chartH - barH - 2} x2={x} y2={chartH - barH - 8} stroke={C.rust} strokeWidth={1.5} />
              <text x={x} y={chartH - barH - 10} fontFamily={font.sans} fontSize={5.5} fontWeight={700} fill={C.rust} textAnchor="middle">
                {myScore}
              </text>
            </g>
          );
        })()}

        {/* X-axis labels */}
        {[150, 200, 250, 300, 350].map((s) => (
          <text key={s} x={((s - MIN_SCORE) / BUCKET) * (barW + gap)} y={chartH + 12}
            fontFamily={font.sans} fontSize={6} fill={C.inkFaint}>
            {s}
          </text>
        ))}
      </svg>

      <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: C.rust }} />
          <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkMid }}>Your score band</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: "10px", height: "2px", background: C.inkFaint, opacity: 0.5, borderTop: `1px dashed ${C.inkFaint}` }} />
          <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkMid }}>Branch cutoffs</span>
        </div>
        <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint, marginLeft: "auto" }}>
          {allScores.length} submissions · 5-point bands
        </span>
      </div>
    </div>
  );
}
