import { C, font } from "./stats.tokens";
import { Skeleton } from "./stats.primitives";

/* ─── Known 2026 shifts ──────────────────────────── */
// test_date format from scorecards: "DDMonYYYY_S#" e.g. "25May2026_S2"
const KNOWN_SHIFTS: { key: string; label: string }[] = [
  { key: "15Apr2026_S1", label: "15 Apr · Shift 1" },
  { key: "15Apr2026_S2", label: "15 Apr · Shift 2" },
  { key: "16Apr2026_S1", label: "16 Apr · Shift 1" },
  { key: "16Apr2026_S2", label: "16 Apr · Shift 2" },
  { key: "25May2026_S1", label: "25 May · Shift 1" },
  { key: "25May2026_S2", label: "25 May · Shift 2" },
  { key: "26May2026_S1", label: "26 May · Shift 1" },
  { key: "26May2026_S2", label: "26 May · Shift 2" },
  { key: "27May2026_S1", label: "27 May · Shift 1" },
];

const MIN_SAMPLE = 3;

export interface ShiftDifficultyRow {
  key: string;
  label: string;
  count: number;
  avg: number | null;
  index: number | null; // 100 = average difficulty across shifts with enough data
  isYours: boolean;
}

// Derive the paired shift key: 25May2026_S1 <-> 25May2026_S2
function pairedShift(key: string): string | null {
  if (key.endsWith("_S1")) return key.slice(0, -3) + "_S2";
  if (key.endsWith("_S2")) return key.slice(0, -3) + "_S1";
  return null;
}

export function computeShiftDifficulty(
  rows: { test_date: string | null; session1_score: number | null; session2_score: number | null; final_score: number | null }[],
  myShift: string | null
): ShiftDifficultyRow[] {
  const scoresByShift: Record<string, number[]> = {};

  for (const r of rows) {
    // Session 1 score → test_date shift
    if (r.test_date && typeof r.session1_score === "number") {
      if (!scoresByShift[r.test_date]) scoresByShift[r.test_date] = [];
      scoresByShift[r.test_date].push(r.session1_score);
    }
    // Session 2 score → paired shift (same day, other session)
    if (r.test_date && typeof r.session2_score === "number") {
      const s2key = pairedShift(r.test_date);
      if (s2key) {
        if (!scoresByShift[s2key]) scoresByShift[s2key] = [];
        scoresByShift[s2key].push(r.session2_score);
      }
    }
  }

  const avgOf = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const result: ShiftDifficultyRow[] = KNOWN_SHIFTS.map(({ key, label }) => {
    const scores = scoresByShift[key] ?? [];
    const count = scores.length;
    const avg = count > 0 ? avgOf(scores) : null;
    return { key, label, count, avg, index: null, isYours: key === myShift };
  });

  // Overall average across shifts that meet the minimum sample size
  const eligible = result.filter((r) => r.count >= MIN_SAMPLE && r.avg !== null);
  if (eligible.length > 0) {
    const overallAvg = avgOf(eligible.map((r) => r.avg as number));
    for (const r of result) {
      if (r.count >= MIN_SAMPLE && r.avg !== null && overallAvg > 0) {
        // Higher index = candidates scored LOWER relative to other shifts,
        // i.e. the paper was comparatively harder.
        // We use (overallAvg / shiftAvg) * 100 so harder shifts score > 100.
        r.index = Math.round((overallAvg / r.avg) * 100);
      }
    }
  }

  return result;
}

function difficultyLabel(index: number | null): { label: string; color: string; bg: string; border: string } {
  if (index === null) return { label: "—", color: C.inkFaint, bg: C.cream, border: C.border };
  if (index >= 103) return { label: "Harder", color: "#991b1b", bg: "#fff1f2", border: "#fecdd3" };
  if (index <= 97)  return { label: "Easier", color: C.green, bg: C.greenLight, border: C.greenBorder };
  return { label: "Average", color: C.inkMid, bg: C.cream, border: C.border };
}

interface Props {
  rows: ShiftDifficultyRow[];
  loading: boolean;
}

export function ShiftDifficultyIndex({ rows, loading }: Props) {
  const eligibleCount = rows.filter((r) => r.count >= MIN_SAMPLE).length;
  const maxIndex = Math.max(100, ...rows.map((r) => r.index ?? 100));
  const minIndex = Math.min(100, ...rows.map((r) => r.index ?? 100));
  const range = Math.max(maxIndex - minIndex, 1);

  return (
    <div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : eligibleCount === 0 ? (
        <p style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint, margin: 0 }}>
          Not enough submissions yet to compare shift difficulty. This will fill in as more scorecards are uploaded.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {rows.map((r) => {
            const hasData = r.index !== null;
            const diff = difficultyLabel(r.index);
            // Position the bar so 100 sits roughly in the middle
            const pct = hasData ? ((r.index! - minIndex) / range) * 100 : 0;
            return (
              <div
                key={r.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 1.1rem",
                  borderRadius: "10px",
                  border: r.isYours ? `1px solid ${C.rust}` : `1px solid ${C.border}`,
                  background: r.isYours ? C.rustLight : C.white,
                }}
              >
                <div style={{ width: "9.5rem", flexShrink: 0 }}>
                  <span style={{ fontFamily: font.sans, fontSize: "0.85rem", fontWeight: r.isYours ? 600 : 500, color: C.ink }}>
                    {r.label}
                  </span>
                  {r.isYours && (
                    <span style={{ display: "block", fontFamily: font.sans, fontSize: "0.7rem", color: C.rust, fontWeight: 600, marginTop: "0.1rem" }}>
                      Your shift
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {hasData ? (
                    <div style={{ position: "relative", height: "6px", borderRadius: "3px", background: C.cream }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${Math.max(pct, 4)}%`,
                          borderRadius: "3px",
                          background: r.isYours ? C.rust : C.inkFaint,
                          opacity: r.isYours ? 1 : 0.45,
                        }}
                      />
                    </div>
                  ) : (
                    <span style={{ fontFamily: font.sans, fontSize: "0.78rem", color: C.inkFaint }}>
                      Awaiting more submissions ({r.count}/{MIN_SAMPLE})
                    </span>
                  )}
                </div>

                {hasData && (
                  <>
                    <div style={{ textAlign: "right", flexShrink: 0, width: "4rem" }}>
                      <span style={{ fontFamily: font.serif, fontSize: "1.15rem", color: C.ink }}>{r.index}</span>
                    </div>
                    <div style={{ flexShrink: 0, width: "4.5rem", textAlign: "right" }}>
                      <span style={{
                        display: "inline-block",
                        fontFamily: font.sans,
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: diff.color,
                        background: diff.bg,
                        border: `1px solid ${diff.border}`,
                        borderRadius: "5px",
                        padding: "0.15rem 0.5rem",
                      }}>
                        {diff.label}
                      </span>
                    </div>
                    <div style={{ flexShrink: 0, width: "3.5rem", textAlign: "right" }}>
                      <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint }}>n={r.count}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          <p style={{ fontFamily: font.sans, fontSize: "0.75rem", color: C.inkFaint, margin: "0.5rem 0 0", lineHeight: 1.6 }}>
            Index of 100 = average difficulty across shifts with at least {MIN_SAMPLE} submissions. Higher means candidates in that shift scored lower on average — typically a harder paper. Shifts below the threshold are excluded until more data comes in.
          </p>
        </div>
      )}
    </div>
  );
}