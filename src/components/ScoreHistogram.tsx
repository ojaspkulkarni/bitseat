import { useState } from "react";
import { C, font } from "./stats.tokens";
import { Skeleton } from "./stats.primitives";

/* ─── Shared histogram renderer ─────────────────── */
function HistogramChart({
  allScores,
  myScore,
  label,
}: {
  allScores: number[];
  myScore: number | null;
  label: string;
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
  const myBucketIdx =
    myScore !== null ? Math.floor((myScore - MIN_SCORE) / BUCKET) : -1;

  const chartH = 72;
  const barW = 6;
  const gap = 1;
  const totalW = NUM_BUCKETS * (barW + gap) - gap;

  if (allScores.length < 1) {
    return (
      <span style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint }}>
        Not enough submissions to plot a distribution yet.
      </span>
    );
  }

  const activeBucket = activeIdx !== null ? buckets[activeIdx] : null;
  const tooltipX =
    activeIdx !== null ? activeIdx * (barW + gap) + barW / 2 : 0;
  const tooltipAnchor =
    activeIdx !== null && activeIdx > NUM_BUCKETS * 0.75 ? "right" : "left";

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${totalW} ${chartH + 20}`}
        style={{ width: "100%", minWidth: `${totalW}px`, display: "block", cursor: "default" }}
        aria-label={`${label} score distribution histogram`}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {buckets.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={i * (barW + gap)}
            y={0}
            width={barW + gap}
            height={chartH}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredIdx(i)}
            onClick={() => setPinnedIdx(pinnedIdx === i ? null : i)}
          />
        ))}

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

        {myScore !== null && myBucketIdx >= 0 && (() => {
          const x = myBucketIdx * (barW + gap) + barW / 2;
          const barH = Math.max(
            1,
            Math.round(((buckets[myBucketIdx]?.count ?? 0) / maxCount) * chartH)
          );
          return (
            <g style={{ pointerEvents: "none" }}>
              <line
                x1={x} y1={chartH - barH - 2}
                x2={x} y2={chartH - barH - 6}
                stroke={C.rust} strokeWidth={1.5}
              />
              <text
                x={x} y={chartH - barH - 8}
                fontFamily={font.sans} fontSize={3.5} fontWeight={700}
                fill={C.rust} textAnchor="middle"
              >
                {myScore}
              </text>
            </g>
          );
        })()}

        {activeBucket && activeIdx !== null && (
          <g style={{ pointerEvents: "none" }}>
            <line
              x1={tooltipX} y1={0} x2={tooltipX} y2={chartH}
              stroke={C.inkFaint} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4}
            />
            {(() => {
              const boxW = 52;
              const boxH = 22;
              const boxY = 4;
              const boxX =
                tooltipAnchor === "right"
                  ? tooltipX - boxW - 4
                  : tooltipX + 4;
              return (
                <g>
                  <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={3}
                    fill={C.ink} opacity={0.88} />
                  <text
                    x={boxX + boxW / 2} y={boxY + 9}
                    fontFamily={font.sans} fontSize={3.5}
                    fill={C.white} textAnchor="middle" opacity={0.7}
                  >
                    {activeBucket.lo}–{activeBucket.hi}
                  </text>
                  <text
                    x={boxX + boxW / 2} y={boxY + 17}
                    fontFamily={font.sans} fontSize={4.5} fontWeight={700}
                    fill={C.white} textAnchor="middle"
                  >
                    {activeBucket.count} submission{activeBucket.count !== 1 ? "s" : ""}
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {[150, 200, 250, 300, 350].map((s) => (
          <text
            key={s}
            x={((s - MIN_SCORE) / BUCKET) * (barW + gap)}
            y={chartH + 10}
            fontFamily={font.sans} fontSize={4} fill={C.inkFaint}
          >
            {s}
          </text>
        ))}
      </svg>

      <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: C.rust }} />
          <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkMid }}>
            Your score band
          </span>
        </div>
        <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint, marginLeft: "auto" }}>
          {allScores.length} submission{allScores.length !== 1 ? "s" : ""} · 10-point bands
        </span>
      </div>
    </div>
  );
}

/* ─── Lock icon ──────────────────────────────────── */
function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={C.inkFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

/* ─── Share gate overlay ─────────────────────────── */
function ShareGate({
  shareClicks,
  shareUrl,
  copied,
  onCopy,
}: {
  shareClicks: number;
  shareUrl: string;
  copied: boolean;
  onCopy: () => void;
}) {
  const needed = 3;
  const remaining = Math.max(0, needed - shareClicks);

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Bitseat — BITSAT scores & cutoffs",
          text: "Check where you stand after BITSAT. Upload your scorecard and see live score distributions.",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        onCopy();
      }
    } catch {
      // user cancelled — fine
    }
  }

  return (
    <div style={{
      position: "absolute", inset: 0,
      borderRadius: "12px",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      background: "rgba(250,249,245,0.75)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "1rem",
      padding: "2rem",
      textAlign: "center",
      zIndex: 2,
    }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "50%",
        background: C.rustLight,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={C.rust} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <div>
        <p style={{ fontFamily: font.sans, fontWeight: 700, fontSize: "0.95rem", color: C.ink, margin: "0 0 0.35rem" }}>
          Share with {remaining} more friend{remaining !== 1 ? "s" : ""} to unlock
        </p>
        <p style={{ fontFamily: font.sans, fontSize: "0.8rem", color: C.inkFaint, margin: 0, lineHeight: 1.6, maxWidth: "280px" }}>
          Cross-shift data is only useful if enough people contribute. Each time someone clicks your link, it counts.
        </p>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {Array.from({ length: needed }).map((_, i) => (
          <div key={i} style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: i < shareClicks ? C.rust : C.border,
            transition: "background 0.2s",
          }} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", width: "100%", maxWidth: "260px" }}>
        <button
          onClick={handleShare}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.65rem 1.4rem", width: "100%", justifyContent: "center",
            borderRadius: "8px", border: "none",
            background: C.rust, color: "#fff",
            fontFamily: font.sans, fontWeight: 600, fontSize: "0.88rem",
            cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          Share your link
        </button>

        {/* Copy fallback — always shown */}
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(shareUrl);
            onCopy();
          }}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.55rem 1.4rem", width: "100%", justifyContent: "center",
            borderRadius: "8px", border: `1px solid ${C.borderMid}`,
            background: "transparent", color: C.inkMid,
            fontFamily: font.sans, fontWeight: 500, fontSize: "0.82rem",
            cursor: "pointer",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <p style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint, margin: 0 }}>
        {shareClicks} of {needed} clicks recorded
      </p>
    </div>
  );
}

/* ─── Main export ────────────────────────────────── */
export function ScoreHistogram({
  allScores,
  shiftScores,
  otherShiftScoresByShift,
  myScore,
  loading,
  shareClicks,
  shareUrl,
}: {
  allScores: number[];
  shiftScores: number[];
  otherShiftScoresByShift: Record<string, number[]>;
  myScore: number | null;
  loading: boolean;
  shareClicks: number;
  shareUrl: string;
}) {
  const [tab, setTab] = useState<"all" | "shift" | "other">("all");
  const [selectedOtherShift, setSelectedOtherShift] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const unlocked = shareClicks >= 3;

  const otherShifts = Object.keys(otherShiftScoresByShift).sort();
  const activeOtherShift = selectedOtherShift ?? otherShifts[0] ?? null;

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div style={{ height: "110px", display: "flex", alignItems: "center" }}>
        <Skeleton />
      </div>
    );
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: font.sans,
    fontSize: "0.78rem",
    fontWeight: 600,
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: active ? C.rust : "transparent",
    color: active ? "#fff" : C.inkMid,
    transition: "background 0.15s, color 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  });

  return (
    <div style={{ width: "100%" }}>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: "0.25rem",
        background: C.rustLight,
        borderRadius: "8px",
        padding: "0.25rem",
        width: "fit-content",
        marginBottom: "1.25rem",
      }}>
        <button style={tabStyle(tab === "all")} onClick={() => setTab("all")}>
          All submissions
        </button>
        <button style={tabStyle(tab === "shift")} onClick={() => setTab("shift")}>
          Your shift
        </button>
        <button style={tabStyle(tab === "other")} onClick={() => setTab("other")}>
          {!unlocked && <LockIcon />}
          Other shifts
        </button>
      </div>

      {tab === "all" && (
        <HistogramChart allScores={allScores} myScore={myScore} label="All submissions" />
      )}

      {tab === "shift" && (
        <HistogramChart allScores={shiftScores} myScore={myScore} label="Your shift" />
      )}

      {tab === "other" && (
        <div style={{ position: "relative" }}>
          {/* Shift selector + chart — always rendered so blur looks right */}
          <div style={{
            filter: unlocked ? "none" : "blur(4px)",
            pointerEvents: unlocked ? "auto" : "none",
            userSelect: unlocked ? "auto" : "none",
          }}>
            {otherShifts.length > 0 ? (
              <>
                {/* Shift picker */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  {otherShifts.map((shift) => (
                    <button
                      key={shift}
                      onClick={() => setSelectedOtherShift(shift)}
                      style={{
                        fontFamily: font.sans,
                        fontSize: "0.75rem",
                        fontWeight: activeOtherShift === shift ? 600 : 400,
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        border: `1px solid ${activeOtherShift === shift ? C.rust : C.borderMid}`,
                        background: activeOtherShift === shift ? C.rustLight : "transparent",
                        color: activeOtherShift === shift ? C.rust : C.inkMid,
                        cursor: "pointer",
                      }}
                    >
                      {shift}
                    </button>
                  ))}
                </div>
                <HistogramChart
                  allScores={activeOtherShift ? (otherShiftScoresByShift[activeOtherShift] ?? []) : []}
                  myScore={null}
                  label={`Shift ${activeOtherShift}`}
                />
              </>
            ) : (
              <span style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint }}>
                No other shift data yet.
              </span>
            )}
          </div>

          {!unlocked && (
            <ShareGate
              shareClicks={shareClicks}
              shareUrl={shareUrl}
              copied={copied}
              onCopy={handleCopy}
            />
          )}
        </div>
      )}
    </div>
  );
}