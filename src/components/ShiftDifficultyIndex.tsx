import { C, font } from "./stats.tokens";
import { Skeleton } from "./stats.primitives";

/* ─── Known 2026 shifts ──────────────────────────── */
// Session 1 shifts: April dates
// Session 2 shifts: May dates
// session1_shift and session2_shift are stored separately in the DB.
// session1_score is attributed directly to session1_shift,
// session2_score is attributed directly to session2_shift.
export const KNOWN_SHIFTS: { key: string; label: string; session: 1 | 2 }[] = [
  { key: "15Apr2026_S1", label: "15 Apr · Session 1", session: 1 },
  { key: "15Apr2026_S2", label: "15 Apr · Session 2", session: 1 },
  { key: "16Apr2026_S1", label: "16 Apr · Session 1", session: 1 },
  { key: "16Apr2026_S2", label: "16 Apr · Session 2", session: 1 },
  { key: "25May2026_S1", label: "25 May · Session 1", session: 2 },
  { key: "25May2026_S2", label: "25 May · Session 2", session: 2 },
  { key: "26May2026_S1", label: "26 May · Session 1", session: 2 },
  { key: "26May2026_S2", label: "26 May · Session 2", session: 2 },
  { key: "27May2026_S1", label: "27 May · Session 1", session: 2 },
];

const MIN_SAMPLE = 3;

export interface ShiftDifficultyRow {
  key: string;
  label: string;
  session: 1 | 2;
  count: number;
  avg: number | null;
  index: number | null; // 100 = average difficulty; higher = harder paper
  isYours: boolean;
}

export function computeShiftDifficulty(
  rows: {
    session1_shift: string | null;
    session2_shift: string | null;
    session1_score: number | null;
    session2_score: number | null;
  }[],
  mySession1Shift: string | null,
  mySession2Shift: string | null,
): ShiftDifficultyRow[] {
  const scoresByShift: Record<string, number[]> = {};

  for (const r of rows) {
    // Session 1 score goes directly to session1_shift
    if (r.session1_shift && typeof r.session1_score === "number") {
      if (!scoresByShift[r.session1_shift]) scoresByShift[r.session1_shift] = [];
      scoresByShift[r.session1_shift].push(r.session1_score);
    }
    // Session 2 score goes directly to session2_shift
    if (r.session2_shift && typeof r.session2_score === "number") {
      if (!scoresByShift[r.session2_shift]) scoresByShift[r.session2_shift] = [];
      scoresByShift[r.session2_shift].push(r.session2_score);
    }
  }

  const avgOf = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const result: ShiftDifficultyRow[] = KNOWN_SHIFTS.map(({ key, label, session }) => {
    const scores = scoresByShift[key] ?? [];
    const count = scores.length;
    const avg = count > 0 ? avgOf(scores) : null;
    const isYours = key === mySession1Shift || key === mySession2Shift;
    return { key, label, session, count, avg, index: null, isYours };
  });

  // Compute difficulty index within each session group separately
  // (Session 1 shifts and Session 2 shifts have different score distributions
  //  so comparing across sessions doesn't make sense)
  for (const sessionNum of [1, 2] as const) {
    const group = result.filter((r) => r.session === sessionNum);
    const eligible = group.filter((r) => r.count >= MIN_SAMPLE && r.avg !== null);
    if (eligible.length > 0) {
      const overallAvg = avgOf(eligible.map((r) => r.avg as number));
      for (const r of group) {
        if (r.count >= MIN_SAMPLE && r.avg !== null && overallAvg > 0) {
          // Higher index = candidates scored lower relative to other shifts = harder paper
          r.index = Math.round((overallAvg / r.avg) * 100);
        }
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
  const session1Rows = rows.filter((r) => r.session === 1);
  const session2Rows = rows.filter((r) => r.session === 2);
  const eligibleCount = rows.filter((r) => r.count >= MIN_SAMPLE).length;

  const maxIndex = Math.max(100, ...rows.map((r) => r.index ?? 100));
  const minIndex = Math.min(100, ...rows.map((r) => r.index ?? 100));
  const range = Math.max(maxIndex - minIndex, 1);

  function renderGroup(groupRows: ShiftDifficultyRow[], title: string) {
    // Rank the shifts that have enough data, hardest (highest index) first;
    // shifts still awaiting submissions stay in chronological order at the end.
    const eligible = groupRows.filter((r) => r.index !== null).sort((a, b) => b.index! - a.index!);
    const pending = groupRows.filter((r) => r.index === null);
    const ranked = [...eligible, ...pending];
    const rankOf = new Map(eligible.map((r, i) => [r.key, i + 1]));

    return (
      <div>
        <p style={{
          fontFamily: font.sans, fontSize: "0.72rem", fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase" as const,
          color: C.inkFaint, margin: "0 0 0.5rem",
        }}>
          {title}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {ranked.map((r) => {
            const hasData = r.index !== null;
            const diff = difficultyLabel(r.index);
            const pct = hasData ? ((r.index! - minIndex) / range) * 100 : 0;
            const rank = rankOf.get(r.key);
            return (
              <div
                key={r.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: r.isYours ? `1px solid ${C.rust}` : `1px solid ${C.border}`,
                  background: r.isYours ? C.rustLight : "#fff",
                }}
              >
                {hasData && (
                  <div style={{ width: "1.6rem", flexShrink: 0, textAlign: "center" }}>
                    <span style={{ fontFamily: font.sans, fontSize: "0.78rem", fontWeight: 700, color: C.inkFaint }}>
                      #{rank}
                    </span>
                  </div>
                )}
                <div style={{ width: "9rem", flexShrink: 0 }}>
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
                      <div style={{
                        position: "absolute", left: 0, top: 0, height: "100%",
                        width: `${Math.max(pct, 4)}%`, borderRadius: "3px",
                        background: r.isYours ? C.rust : C.inkFaint,
                        opacity: r.isYours ? 1 : 0.45,
                      }} />
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
                      <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "1.15rem", color: C.ink }}>{r.index}</span>
                    </div>
                    <div style={{ flexShrink: 0, width: "4.5rem", textAlign: "right" }}>
                      <span style={{
                        display: "inline-block", fontFamily: font.sans,
                        fontSize: "0.72rem", fontWeight: 600,
                        color: diff.color, background: diff.bg,
                        border: `1px solid ${diff.border}`,
                        borderRadius: "5px", padding: "0.15rem 0.5rem",
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
        </div>
      </div>
    );
  }

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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {renderGroup(session1Rows, "Session 1 shifts (April)")}
          {renderGroup(session2Rows, "Session 2 shifts (May)")}
          <p style={{ fontFamily: font.sans, fontSize: "0.75rem", color: C.inkFaint, margin: 0, lineHeight: 1.6 }}>
            Index of 100 = average difficulty within each session group, for shifts with at least {MIN_SAMPLE} submissions. Higher means candidates scored lower on average — typically a harder paper.
          </p>
        </div>
      )}
    </div>
  );
}