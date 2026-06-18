import { C, font } from "../../styles/tokens";
import { Skeleton } from "../stats/primitives";
import { MIN_SAMPLE, type ShiftDifficultyRow } from "./shiftDifficulty.helpers";

function difficultyLabel(index: number | null): { label: string; color: string; bg: string; border: string } {
  if (index === null) return { label: "—", color: C.inkFaint, bg: C.cream, border: C.border };
  if (index >= 103) return { label: "Harder", color: "#991b1b", bg: "#fff1f2", border: "#fecdd3" };
  if (index <= 97)  return { label: "Easier", color: C.green, bg: C.greenLight, border: C.greenBorder };
  return { label: "Average", color: C.inkMid, bg: C.cream, border: C.border };
}

// Color for the diverging bar itself — a continuous ramp rather than a
// 3-bucket badge, so a shift that's only slightly harder reads differently
// from one that's a lot harder.
function barColor(index: number | null): string {
  if (index === null) return C.border;
  if (index >= 100) return "#c2410c"; // harder → deeper rust/red
  return "#15803d"; // easier → green
}

interface Props {
  rows: ShiftDifficultyRow[];
  loading: boolean;
}

export function ShiftDifficultyIndex({ rows, loading }: Props) {
  const session1Rows = rows.filter((r) => r.session === 1);
  const session2Rows = rows.filter((r) => r.session === 2);
  const eligibleCount = rows.filter((r) => r.count >= MIN_SAMPLE).length;

  // Symmetric scale around 100 so the centerline is always the true zero
  // point, and a +6 shift looks the same distance from center as a −6 one.
  const maxAbsDelta = Math.max(
    6,
    ...rows.map((r) => (r.index !== null ? Math.abs(r.index - 100) : 0))
  );

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
          color: C.inkFaint, margin: "0 0 0.75rem",
        }}>
          {title}
        </p>

        {/* Centerline scale labels */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.4rem", paddingLeft: "9.5rem" }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", fontFamily: font.sans, fontSize: "0.65rem", color: C.inkFaint, fontWeight: 600 }}>
            <span>← Easier</span>
            <span style={{ opacity: 0.6 }}>avg</span>
            <span>Harder →</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          {ranked.map((r) => {
            const hasData = r.index !== null;
            const diff = difficultyLabel(r.index);
            const rank = rankOf.get(r.key);
            const delta = hasData ? r.index! - 100 : 0;
            const barPct = hasData ? (Math.abs(delta) / maxAbsDelta) * 50 : 0; // % of half-width
            const isHarder = delta >= 0;
            const color = barColor(r.index);

            return (
              <div
                key={r.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  padding: r.isYours ? "0.7rem 0.9rem" : "0.55rem 0.9rem",
                  borderRadius: "10px",
                  border: r.isYours ? `1.5px solid ${C.rust}` : `1px solid ${C.border}`,
                  background: r.isYours ? C.rustLight : "#fff",
                  boxShadow: r.isYours ? "0 2px 10px rgba(215,118,86,0.18)" : "none",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {/* Label column */}
                <div style={{ width: "8.5rem", flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                    {hasData && (
                      <span style={{ fontFamily: font.sans, fontSize: "0.68rem", fontWeight: 700, color: C.inkFaint }}>
                        #{rank}
                      </span>
                    )}
                    <span style={{ fontFamily: font.sans, fontSize: "0.83rem", fontWeight: r.isYours ? 700 : 500, color: C.ink, lineHeight: 1.25 }}>
                      {r.label}
                    </span>
                  </div>
                  {r.isYours && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontFamily: font.sans, fontSize: "0.66rem", color: C.rust, fontWeight: 700, marginTop: "0.15rem" }}>
                      <svg width="7" height="7" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill={C.rust} /></svg>
                      YOUR SHIFT
                    </span>
                  )}
                </div>

                {/* Diverging bar */}
                <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                  {hasData ? (
                    <div style={{ position: "relative", height: "20px" }}>
                      {/* Track */}
                      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: C.border, transform: "translateY(-50%)" }} />
                      {/* Centerline tick */}
                      <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1.5px", background: C.borderMid, transform: "translateX(-50%)" }} />
                      {/* Bar — grows left for easier, right for harder */}
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          height: r.isYours ? "12px" : "9px",
                          transform: "translateY(-50%)",
                          borderRadius: "5px",
                          background: color,
                          opacity: r.isYours ? 0.95 : 0.55,
                          left: isHarder ? "50%" : `${50 - barPct}%`,
                          width: `${Math.max(barPct, 2.5)}%`,
                          boxShadow: r.isYours ? `0 0 0 2.5px ${color}33` : "none",
                          transition: "width 0.3s ease, left 0.3s ease",
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ position: "relative", height: "20px", display: "flex", alignItems: "center" }}>
                      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: "1px", background: C.border, transform: "translateY(-50%)" }} />
                      <span style={{ position: "relative", margin: "0 auto", background: C.cream, padding: "0 0.6rem", fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint }}>
                        Awaiting submissions ({r.count}/{MIN_SAMPLE})
                      </span>
                    </div>
                  )}
                </div>

                {hasData && (
                  <>
                    <div style={{ textAlign: "right", flexShrink: 0, width: "3.4rem" }}>
                      <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "1.2rem", color: C.ink, fontWeight: 500 }}>{r.index}</span>
                    </div>
                    <div style={{ flexShrink: 0, width: "4.4rem", textAlign: "right" }}>
                      <span style={{
                        display: "inline-block", fontFamily: font.sans,
                        fontSize: "0.7rem", fontWeight: 700,
                        color: diff.color, background: diff.bg,
                        border: `1px solid ${diff.border}`,
                        borderRadius: "5px", padding: "0.15rem 0.5rem",
                      }}>
                        {diff.label}
                      </span>
                    </div>
                    <div style={{ flexShrink: 0, width: "3rem", textAlign: "right" }}>
                      <span style={{ fontFamily: font.sans, fontSize: "0.7rem", color: C.inkFaint }}>n={r.count}</span>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {renderGroup(session1Rows, "Session 1 shifts (April)")}
          {renderGroup(session2Rows, "Session 2 shifts (May)")}
          <p style={{ fontFamily: font.sans, fontSize: "0.75rem", color: C.inkFaint, margin: 0, lineHeight: 1.6 }}>
            Bars branch out from the average (100) within each session group, for shifts with at least {MIN_SAMPLE} submissions. The further right, the harder candidates found that shift relative to others in the same session.
          </p>
        </div>
      )}
    </div>
  );
}