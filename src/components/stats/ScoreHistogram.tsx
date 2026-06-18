import { useState } from "react";
import { C, font } from "../../styles/tokens";
import { Skeleton } from "./primitives";

/* ─── Constants ──────────────────────────────────── */
const BUCKET = 10;
const MIN_SCORE = 100;
const MAX_SCORE = 400; // exclusive upper bound — covers score of 390 in bucket [390,400)
const NUM_BUCKETS = (MAX_SCORE - MIN_SCORE) / BUCKET; // 30, all integers

/** Place a score into its bucket index. Returns -1 if out of range. */
function bucketIdx(score: number): number {
  if (score < MIN_SCORE || score >= MAX_SCORE) return -1;
  return Math.floor((score - MIN_SCORE) / BUCKET);
}

/* ─── Histogram renderer ─────────────────────────── */
function HistogramChart({
  allScores,
  myScore,
  label,
}: {
  allScores: number[];
  myScore: number | null;
  label: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [pinnedIdx, setPinnedIdx] = useState<number | null>(null);
  const activeIdx = pinnedIdx ?? hoveredIdx;

  // Build buckets — only count valid numbers
  const buckets = Array.from({ length: NUM_BUCKETS }, (_, i) => ({
    lo: MIN_SCORE + i * BUCKET,
    hi: MIN_SCORE + (i + 1) * BUCKET,
    count: 0,
  }));
  for (const s of allScores) {
    if (typeof s !== "number" || !Number.isFinite(s)) continue;
    const idx = bucketIdx(s);
    if (idx >= 0) buckets[idx].count++;
  }

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const myBucketIdx = myScore !== null && typeof myScore === "number"
    ? bucketIdx(myScore)
    : -1;

  const chartH = 72;
  const barW = 6;
  const gap = 1;
  const totalW = NUM_BUCKETS * (barW + gap) - gap;
  // Reserve fixed headroom above the chart for the "your score" label, so it
  // never has to compete for space with a tall bar. Previously the label sat
  // inside chartH and got clamped/overlapped whenever the bar was near max
  // height — exactly the case that matters most, since that's usually the
  // most common score band.
  const topPad = 14;

  if (allScores.filter((s) => typeof s === "number" && Number.isFinite(s)).length < 1) {
    return (
      <span style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint }}>
        Not enough submissions to plot a distribution yet.
      </span>
    );
  }

  const activeBucket = activeIdx !== null ? buckets[activeIdx] : null;
  const tooltipX = activeIdx !== null ? activeIdx * (barW + gap) + barW / 2 : 0;
  const tooltipAnchor = activeIdx !== null && activeIdx > NUM_BUCKETS * 0.75 ? "right" : "left";

  const validSubmissions = allScores.filter((s) => typeof s === "number" && Number.isFinite(s));

  return (
    <div className="histogram-svg-wrapper">
      <svg
        viewBox={`0 0 ${totalW} ${topPad + chartH + 20}`}
        style={{ width: "100%", minWidth: `${totalW}px`, display: "block", cursor: "default" }}
        aria-label={`${label} score distribution histogram`}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Hit targets — full-height invisible rects for hover/click */}
        {buckets.map((_, i) => (
          <rect
            key={`hit-${i}`}
            x={i * (barW + gap)}
            y={topPad}
            width={barW + gap}
            height={chartH}
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
          const y = topPad + chartH - barH;
          const isMe = i === myBucketIdx;
          const isActive = i === activeIdx;
          return (
            <rect
              key={i}
              x={x} y={y} width={barW} height={barH}
              fill={isMe ? C.rust : C.borderMid}
              rx={1}
              opacity={b.count === 0 ? 0.15 : isActive ? 1 : 0.85}
              style={{ transition: "opacity 0.1s" }}
              stroke={isActive ? (isMe ? C.rustDark : C.inkMid) : "none"}
              strokeWidth={isActive ? 1 : 0}
            />
          );
        })}

        {/* "Your score" marker removed */}

        {/* Hover tooltip */}
        {activeBucket && activeIdx !== null && (
          <g style={{ pointerEvents: "none" }}>
            <line
              x1={tooltipX} y1={topPad} x2={tooltipX} y2={topPad + chartH}
              stroke={C.inkFaint} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.4}
            />
            {(() => {
              const boxW = 52;
              const boxH = 22;
              const boxY = topPad + 4;
              const boxX = tooltipAnchor === "right"
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

        {/* X-axis labels */}
        {[150, 200, 250, 300, 350].map((s) => (
          <text
            key={s}
            x={bucketIdx(s) * (barW + gap)}
            y={topPad + chartH + 10}
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
          {validSubmissions.length} submission{validSubmissions.length !== 1 ? "s" : ""} · 10-point bands
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
  session1ShiftScores,
  session2ShiftScores,
  session1ShiftLabel,
  session2ShiftLabel,
  otherShiftScoresByShift,
  myScore,
  mySession1Score,
  mySession2Score,
  loading,
  shareClicks,
  shareUrl,
}: {
  allScores: number[];
  session1ShiftScores: number[];
  session2ShiftScores: number[];
  session1ShiftLabel: string | null;
  session2ShiftLabel: string | null;
  otherShiftScoresByShift: Record<string, number[]>;
  myScore: number | null;
  mySession1Score: number | null;
  mySession2Score: number | null;
  loading: boolean;
  shareClicks: number;
  shareUrl: string;
}) {
  type Tab = "all" | "s1" | "s2" | "other";
  const [tab, setTab] = useState<Tab>("all");
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
    padding: "0.4rem 0.85rem",
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
      <div className="histogram-tabs">
        <button style={tabStyle(tab === "all")} onClick={() => setTab("all")}>
          All submissions
        </button>
        <button style={tabStyle(tab === "s1")} onClick={() => setTab("s1")}>
          {session1ShiftLabel ?? "Session 1"}
        </button>
        <button style={tabStyle(tab === "s2")} onClick={() => setTab("s2")}>
          {session2ShiftLabel ?? "Session 2"}
        </button>
        <button style={tabStyle(tab === "other")} onClick={() => setTab("other")}>
          {!unlocked && <LockIcon />}
          Other shifts
        </button>
      </div>

      {/* All submissions — marker is final score */}
      {tab === "all" && (
        <HistogramChart
          allScores={allScores}
          myScore={myScore}
          label="All submissions"
        />
      )}

      {/* Session 1 shift — population is S1 scores, marker is S1 score only */}
      {tab === "s1" && (
        <HistogramChart
          allScores={session1ShiftScores}
          myScore={mySession1Score}
          label={session1ShiftLabel ?? "Session 1"}
        />
      )}

      {/* Session 2 shift — population is S2 scores, marker is S2 score only */}
      {tab === "s2" && (
        <HistogramChart
          allScores={session2ShiftScores}
          myScore={mySession2Score}
          label={session2ShiftLabel ?? "Session 2"}
        />
      )}

      {tab === "other" && (
        <div style={{ position: "relative" }}>
          <div style={{
            filter: unlocked ? "none" : "blur(4px)",
            pointerEvents: unlocked ? "auto" : "none",
            userSelect: unlocked ? "auto" : "none",
          }}>
            {otherShifts.length > 0 ? (
              <>
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