import { BRANCHES, type Branch } from "../data/cutoffs";
import { C, font } from "./stats.tokens";

/* ─── Types ──────────────────────────────────────── */
export interface PrefUpset {
  favoured: Branch;
  over: Branch;
  count: number;
  clearedBy: number;
}

/* ─── Branch key helpers ─────────────────────────── */
function branchKey(b: Branch) {
  return `${b.campus}|${b.degree}|${b.specialization}`;
}
function keyToBranch(key: string): Branch | undefined {
  return BRANCHES.find((b) => branchKey(b) === key);
}

/* ─── Upset analysis ─────────────────────────────── */
// For each user, walk their ordered preference list.
// An "upset" is when a user ranks branch A above branch B, but B has a higher
// 2025 cutoff AND the user's score clears B — a genuine preference against convention.
export function computePrefUpsets(prefRows: any[], scoreRows: any[]): PrefUpset[] {
  const scoreMap = new Map<string, number>();
  for (const row of scoreRows) {
    if (row.user_id && typeof row.final_score === "number") {
      scoreMap.set(row.user_id, row.final_score);
    }
  }

  const pairMap = new Map<string, { favoured: Branch; over: Branch; count: number; clearedBy: number }>();

  for (const prefRow of prefRows) {
    const score = scoreMap.get(prefRow.user_id);
    if (score === undefined) continue;

    const branches = ((prefRow.branch_keys ?? []) as string[])
      .map(keyToBranch)
      .filter((b): b is Branch => b !== undefined);

    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        const higher = branches[i]; // ranked higher (lower index = more preferred)
        const lower = branches[j];  // ranked lower

        if (lower.baseline2025 > higher.baseline2025 && score >= lower.baseline2025) {
          const key = `${branchKey(higher)}__over__${branchKey(lower)}`;
          const existing = pairMap.get(key);
          if (existing) {
            existing.count++;
            existing.clearedBy++;
          } else {
            pairMap.set(key, { favoured: higher, over: lower, count: 1, clearedBy: 1 });
          }
        }
      }
    }
  }

  return Array.from(pairMap.values())
    .filter((p) => p.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/* ─── Component ──────────────────────────────────── */
export function HotBranches({ upsets, loading }: { upsets: PrefUpset[]; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: "48px", borderRadius: "8px", background: C.rustLight, opacity: 0.5 }} />
        ))}
      </div>
    );
  }

  if (upsets.length === 0) {
    return (
      <span style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint }}>
        Not enough preference data yet to surface trends.
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {upsets.map((u, i) => {
        const pct = Math.round((u.count / u.clearedBy) * 100);
        return (
          <div
            key={i}
            style={{
              background: C.rustLight,
              border: `1px solid rgba(215,118,86,0.2)`,
              borderRadius: "10px",
              padding: "0.65rem 0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: "120px" }}>
              <span style={{ fontFamily: font.sans, fontSize: "0.78rem", fontWeight: 700, color: C.rust }}>
                {u.favoured.campus} {u.favoured.specialization}
              </span>
              <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint, marginLeft: "0.3rem" }}>
                ({u.favoured.baseline2025})
              </span>
            </div>

            <span style={{ fontFamily: font.sans, fontSize: "0.8rem", color: C.inkFaint, flexShrink: 0 }}>
              over
            </span>

            <div style={{ flex: 1, minWidth: "120px" }}>
              <span style={{ fontFamily: font.sans, fontSize: "0.78rem", fontWeight: 600, color: C.inkMid }}>
                {u.over.campus} {u.over.specialization}
              </span>
              <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint, marginLeft: "0.3rem" }}>
                ({u.over.baseline2025})
              </span>
            </div>

            <div style={{
              background: C.white,
              border: `1px solid rgba(215,118,86,0.3)`,
              borderRadius: "20px",
              padding: "0.2rem 0.6rem",
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: font.sans, fontSize: "0.72rem", fontWeight: 700, color: C.rust }}>
                {pct}%
              </span>
              <span style={{ fontFamily: font.sans, fontSize: "0.68rem", color: C.inkFaint, marginLeft: "0.25rem" }}>
                of {u.clearedBy}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}