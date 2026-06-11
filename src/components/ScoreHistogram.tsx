import { useState } from "react";
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
  const BUCKET = 10;
  const MIN_SCORE = 100;
  const MAX_SCORE = 390;
  const NUM_BUCKETS = Math.ceil((MAX_SCORE - MIN_SCORE) / BUCKET);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pinnedIdx, setPinnedIdx] = useState<number | null>(null);

  const activeIdx = pinnedIdx ?? hoveredIdx;

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

  if (loading) {
    return (
      <div style={{ height: "110px", display: "flex", alignItems: "center" }}>
        <Skeleton />
      </div>
    );
  }

  if (allScores.length < 1) {
    return (
      <span style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint }}>
        Not enough submissions to plot a distribution yet.
      </span>
    );
  }

  const activeBucket = activeIdx !== null ? buckets[activeIdx] : null;
  const tooltipX = activeIdx !== null ? activeIdx * (barW + gap) + barW / 2 : 0;
  // flip tooltip to left side if too close to right edge
  const tooltipAnchor = activeIdx !== null && activeIdx > NUM_BUCKETS * 0.75 ? "right" : "left";

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${totalW} ${chartH + 20}`}
        style={{ width: "100%", minWidth: `${totalW}px`, display: "block", cursor: "default" }}
        aria-label="Score distribution histogram"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Invisible wide hit targets per bucket */}
        {buckets.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={i * (barW + gap)} y={0}
            width={barW + gap} height={chartH}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredIdx(i)}
            onClick={() => setPinnedIdx(pinnedIdx === i ? null : i)}
          />
        ))}

        {/* Bars */}
        {buckets.map((b, i) => {
          const barH = Math.max(1, Math.round((b.count / maxCount) * chartH));
          const x = i * (barW + gap);
          const y = chartH - barH;
          const isMe = i === myBucketIdx;
          const isActive = i === activeIdx;
          return (
            <rect
              key={i}
              x={x} y={y} width={barW} height={barH}
              fill={isMe ? C.rust : C.borderMid}
              rx={1}
              opacity={b.count === 0 ? 0.2 : isActive ? 1 : 0.85}
              style={{ transition: "opacity 0.1s" }}
              stroke={isActive ? (isMe ? C.rustDark : C.inkMid) : "none"}
              strokeWidth={isActive ? 1 : 0}
            />
          );
        })}

        {/* My score marker */}
        {myScore !== null && myBucketIdx >= 0 && (() => {
          const x = myBucketIdx * (barW + gap) + barW / 2;
          const barH = Math.max(1, Math.round(((buckets[myBucketIdx]?.count ?? 0) / maxCount) * chartH));
          return (
            <g style={{ pointerEvents: "none" }}>
              <line x1={x} y1={chartH - barH - 2} x2={x} y2={chartH - barH - 6} stroke={C.rust} strokeWidth={1.5} />
              <text x={x} y={chartH - barH - 8} fontFamily={font.sans} fontSize={3.5} fontWeight={700} fill={C.rust} textAnchor="middle">
                {myScore}
              </text>
            </g>
          );
        })()}

        {/* Tooltip */}
        {activeBucket && activeIdx !== null && (
          <g style={{ pointerEvents: "none" }}>
            {/* Vertical guide line */}
            <line
              x1={tooltipX} y1={0} x2={tooltipX} y2={chartH}
              stroke={C.inkFaint} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4}
            />
            {/* Tooltip box */}
            {(() => {
              const boxW = 52;
              const boxH = 22;
              const boxY = 4;
              const boxX = tooltipAnchor === "right"
                ? tooltipX - boxW - 4
                : tooltipX + 4;
              return (
                <g>
                  <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={3}
                    fill={C.ink} opacity={0.88} />
                  <text x={boxX + boxW / 2} y={boxY + 9}
                    fontFamily={font.sans} fontSize={3.5} fill={C.white} textAnchor="middle" opacity={0.7}>
                    {activeBucket.lo}–{activeBucket.hi}
                  </text>
                  <text x={boxX + boxW / 2} y={boxY + 17}
                    fontFamily={font.sans} fontSize={4.5} fontWeight={700} fill={C.white} textAnchor="middle">
                    {activeBucket.count} submission{activeBucket.count !== 1 ? "s" : ""}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* X-axis labels */}
        {[150, 200, 250, 300, 350].map((s) => (
          <text key={s} x={((s - MIN_SCORE) / BUCKET) * (barW + gap)} y={chartH + 10}
            fontFamily={font.sans} fontSize={4} fill={C.inkFaint}>
            {s}
          </text>
        ))}
      </svg>

      <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: C.rust }} />
          <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkMid }}>Your score band</span>
        </div>
        <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint, marginLeft: "auto" }}>
          {allScores.length} submission{allScores.length !== 1 ? "s" : ""} · 10-point bands
        </span>
      </div>
    </div>
  );
}