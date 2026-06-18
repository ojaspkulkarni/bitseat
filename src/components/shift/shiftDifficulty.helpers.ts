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

export const MIN_SAMPLE = 3;

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
