import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { type Branch, estimatedRank, estimatedPercentile } from "../../data/cutoffs";
import { C, font, eyebrow } from "../../styles/tokens";
import { StatCard, BigStat, Skeleton, ThinDataNote, RankTooltip, PercentileTooltip } from "./primitives";
import { ScoreHistogram } from "./ScoreHistogram";
import { ShiftDifficultyIndex } from "../shift/ShiftDifficultyIndex";
import { computeShiftDifficulty, type ShiftDifficultyRow } from "../shift/shiftDifficulty.helpers";

// Shape of a row from `supabase.from("scores").select(...)` as used in this
// file's stats query — the client has no generated DB types, so without
// this the rows would otherwise come back as `any`.
type ScoreStatsRow = {
  final_score: number | null;
  session1_score: number | null;
  session2_score: number | null;
  session1_shift: string | null;
  session2_shift: string | null;
  center: string | null;
};

/* ─── Helpers ────────────────────────────────────── */
function formatShift(raw: string): string {
  if (!raw) return raw;
  const match = raw.match(/^(\d{1,2})([A-Za-z]+)(\d{4})(?:_S(\d))?/);
  if (match) {
    const [, day, month, year, session] = match;
    return `${day} ${month} ${year}${session ? ` · Session ${session}` : ""}`;
  }
  return raw.replace(/_/g, " · ");
}

/** Competition ranking: rank 1 = highest score, ties share the same rank
 *  (i.e. rank = 1 + count of scores strictly greater than yours). Used for
 *  small samples (e.g. a single exam center) where a percentile is
 *  statistically noisy and easy to misread as a rank anyway — "1st" out of
 *  4 reads very differently depending on whether it's a rank or percentile,
 *  so for small groups we just show the literal rank instead. */
function computeRank(myScore: number, allScores: number[]): { rank: number; total: number } {
  const total = allScores.length;
  if (total === 0) return { rank: 0, total: 0 };
  const ahead = allScores.filter((s) => s > myScore).length;
  return { rank: ahead + 1, total };
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

function predictCollege(score: number, preferences: Branch[]): Branch | null {
  for (const pref of preferences) {
    if (score >= pref.baseline2025) return pref;
  }
  return null;
}

/* ─── Types ──────────────────────────────────────── */
interface Props {
  finalScore: number | null;
  session1Score: number | null;
  session2Score: number | null;
  session1Shift: string | null;
  session2Shift: string | null;
  center: string | null;
  preferences: Branch[];
  userId: string | null;
  refreshKey?: number;
}

interface StatsState {
  loading: boolean;
  allScores: number[];
  // Scores from people who share the same S1 or S2 shift as this user
  session1ShiftScores: number[];
  session2ShiftScores: number[];
  centerScores: number[];
  referralCount: number;
  // For the "Other shifts" tab: all shift→scores except the user's own two shifts
  otherShiftScoresByShift: Record<string, number[]>;
  shiftDifficulty: ShiftDifficultyRow[];
}

/* ─── Main component ─────────────────────────────── */
/* Alias iDZ Ramtekdi 2 and iDZ Ramtekdi 3 to the same centre */
function normaliseCenter(raw: string | null): string {
  if (!raw) return "";
  return raw
    .trim()
    .toLowerCase()
    .replace(/idz ramtekdi [23]/i, "idz ramtekdi");
}

export default function StatsSection({
  finalScore,
  session1Score,
  session2Score,
  session1Shift,
  session2Shift,
  center,
  preferences,
  userId,
  refreshKey = 0,
}: Props) {
  const [stats, setStats] = useState<StatsState>({
    loading: true,
    allScores: [],
    session1ShiftScores: [],
    session2ShiftScores: [],
    centerScores: [],
    referralCount: 0,
    otherShiftScoresByShift: {},
    shiftDifficulty: [],
  });

  useEffect(() => {
    if (finalScore === null) return;

    // Guards against a stale response (e.g. from before the user switched
    // scorecards, or from this effect's own teardown) overwriting fresher
    // data that already landed. Without this, two overlapping loadStats()
    // calls can resolve out of order and the histogram appears to change
    // unpredictably when switching between scorecards.
    let isCurrent = true;

    // Define loadStats INSIDE the effect so it always closes over the
    // current prop values (session1Shift, session2Shift, center, userId).
    // This prevents stale-closure bugs where the realtime callback would
    // filter with outdated shift values.
    async function loadStats() {
      setStats((s) => ({ ...s, loading: true }));

      const [scoresRes, referralsRes] = await Promise.all([
        supabase.from("scores").select("final_score, session1_score, session2_score, session1_shift, session2_shift, center"),
        supabase.from("referrals").select("share_clicks").eq("user_id", userId ?? "").maybeSingle(),
      ]);

      if (!isCurrent) return; // a newer request already started; drop this result

      const rows = scoresRes.data;
      if (scoresRes.error || !rows) {
        setStats({
          loading: false, allScores: [], session1ShiftScores: [],
          session2ShiftScores: [], centerScores: [], referralCount: 0,
          otherShiftScoresByShift: {}, shiftDifficulty: [],
        });
        return;
      }

      // Filter helpers — reject anything that isn't a real finite number
      const toNum = (v: unknown): number | null =>
        typeof v === "number" && Number.isFinite(v) ? v : null;

      const allScores: number[] = rows
        .map((r: ScoreStatsRow) => toNum(r.final_score))
        .filter((s): s is number => s !== null);

      // S1 shift: collect session1_score from everyone on the same S1 shift
      const session1ShiftScores: number[] = session1Shift
        ? rows
            .filter((r: ScoreStatsRow) => r.session1_shift === session1Shift)
            .map((r: ScoreStatsRow) => toNum(r.session1_score))
            .filter((s): s is number => s !== null)
        : [];

      // S2 shift: collect session2_score from everyone on the same S2 shift
      const session2ShiftScores: number[] = session2Shift
        ? rows
            .filter((r: ScoreStatsRow) => r.session2_shift === session2Shift)
            .map((r: ScoreStatsRow) => toNum(r.session2_score))
            .filter((s): s is number => s !== null)
        : [];

      const myCenterKey = normaliseCenter(center);
      const centerScores: number[] = myCenterKey
        ? rows
            .filter((r: ScoreStatsRow) => normaliseCenter(r.center) === myCenterKey)
            .map((r: ScoreStatsRow) => toNum(r.final_score))
            .filter((s): s is number => s !== null)
        : [];

      // "Other shifts" — final scores by S2 shift key, excluding user's own two shifts
      const myShifts = new Set([session1Shift, session2Shift].filter(Boolean) as string[]);
      const otherShiftScoresByShift: Record<string, number[]> = {};
      for (const r of rows) {
        const shiftKey: string | null = r.session2_shift;
        if (!shiftKey || myShifts.has(shiftKey)) continue;
        const score = toNum(r.final_score);
        if (score === null) continue;
        if (!otherShiftScoresByShift[shiftKey]) otherShiftScoresByShift[shiftKey] = [];
        otherShiftScoresByShift[shiftKey].push(score);
      }

      const referralCount = referralsRes.data?.share_clicks ?? 0;

      const shiftDifficulty = computeShiftDifficulty(rows, session1Shift, session2Shift);

      setStats({
        loading: false, allScores, session1ShiftScores, session2ShiftScores,
        centerScores, referralCount, otherShiftScoresByShift, shiftDifficulty,
      });
    }

    loadStats();

    const channel = supabase
      .channel("stats-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scores" },
        () => { loadStats(); }
      )
      .subscribe();

    return () => {
      isCurrent = false;
      supabase.removeChannel(channel);
    };
  }, [finalScore, session1Shift, session2Shift, center, userId, refreshKey]);

  const score = finalScore ?? 0;
  const college = finalScore !== null ? predictCollege(finalScore, preferences) : null;
  const popRank = finalScore !== null ? estimatedRank(finalScore) : null;
  const popPct  = finalScore !== null ? estimatedPercentile(finalScore) : null;

  const centerRank = computeRank(score, stats.centerScores);
  const usedPreference = college && preferences.some(
    (p) => p.campus === college.campus && p.specialization === college.specialization
  );

  return (
    <div style={{ paddingTop: "0", marginBottom: "3rem" }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Best match ────────────────────────────── */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{
          background: C.white, border: `1px solid ${C.border}`,
          borderRadius: "16px", padding: "2.25rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ ...eyebrow, marginBottom: "0.5rem" }}>Best match right now</p>
              {finalScore === null ? (
                <Skeleton />
              ) : college ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(1.9rem, 3vw, 2.6rem)", color: C.ink, lineHeight: 1.1 }}>
                    BITS {college.campus}
                  </span>
                  <span style={{ fontFamily: font.sans, fontSize: "1rem", color: C.inkMid, lineHeight: 1.4 }}>
                    {college.degree} · {college.specialization}
                  </span>
                  {(() => {
                    const diff = finalScore! - college.baseline2025;
                    const likelihood =
                      diff >= 5  ? { label: "Likely", bg: C.greenLight, border: C.greenBorder, text: C.green } :
                      diff >= -4 ? { label: "Close",  bg: "#fffbeb",    border: "#fde68a",      text: "#92400e" } :
                                   { label: "Reach",  bg: "#fff1f2",    border: "#fecdd3",      text: "#991b1b" };
                    return (
                      <div style={{ display: "inline-flex", alignItems: "center", marginTop: "0.25rem", background: likelihood.bg, border: `1px solid ${likelihood.border}`, borderRadius: "6px", padding: "0.25rem 0.75rem", alignSelf: "flex-start" }}>
                        <span style={{ fontFamily: font.sans, fontSize: "0.8rem", color: likelihood.text, fontWeight: 600 }}>
                          {likelihood.label}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "clamp(1.9rem, 3vw, 2.6rem)", color: C.inkMid, lineHeight: 1.1 }}>
                    No match yet
                  </span>
                  <span style={{ fontFamily: font.sans, fontSize: "0.92rem", color: C.inkFaint }}>
                    None of your saved preferences are cleared at this score. Update your preferences or check back as cutoffs shift for 2026.
                  </span>
                </div>
              )}
            </div>

            {college && finalScore !== null && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-end", flexShrink: 0 }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: font.sans, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.inkFaint, margin: "0 0 0.2rem" }}>2025 cutoff</p>
                  <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "1.6rem", color: C.ink, margin: 0, lineHeight: 1 }}>{college.baseline2025}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: font.sans, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.inkFaint, margin: "0 0 0.2rem" }}>Your score</p>
                  <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "1.6rem", color: C.rust, margin: 0, lineHeight: 1 }}>{finalScore}</p>
                </div>
                <p style={{ fontFamily: font.sans, fontSize: "0.75rem", color: C.inkFaint, margin: 0, textAlign: "right" }}>
                  {usedPreference ? "From your saved preferences" : "Highest branch you clear"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat grid ─────────────────────────────── */}
      <div className="stats-2col">
        <StatCard
          eyebrowText="Estimated Rank"
          title="Across all BITSAT candidates"
          footer={
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint }}>
                Modelled from 2022–2025 official rank data
              </span>
              <RankTooltip />
            </div>
          }
        >
          {popRank === null ? <Skeleton /> : (
            <BigStat value={popRank.toLocaleString("en-IN")} suffix="" sub="estimated rank" />
          )}
        </StatCard>

        <StatCard
          eyebrowText="Overall Percentile"
          title="Across all BITSAT candidates"
          footer={
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint }}>
                Fraction of candidates who scored below you
              </span>
              <PercentileTooltip />
            </div>
          }
        >
          {popPct === null ? <Skeleton /> : (
            <BigStat value={popPct} suffix="th" sub="percentile" />
          )}
        </StatCard>

        <StatCard
          eyebrowText="Center Rank"
          title={center ?? "Your exam center"}
          footer={
            !stats.loading && stats.centerScores.length >= 2
              ? <ThinDataNote count={stats.centerScores.length} context="from your center" />
              : null
          }
        >
          {stats.loading ? <Skeleton /> : stats.centerScores.length < 2 ? (
            <span style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint }}>
              Not enough submissions from your center yet.
            </span>
          ) : (
            <BigStat
              value={centerRank.rank}
              suffix={ordinalSuffix(centerRank.rank)}
              sub={`of ${centerRank.total} at center`}
            />
          )}
        </StatCard>
      </div>

      {/* ── Shift Difficulty ──────────────────────── */}
      <div style={{ marginTop: "1.25rem" }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "2.25rem" }}>
          <p style={{ ...eyebrow, marginBottom: "0.35rem" }}>Shift Difficulty</p>
          <p style={{ fontFamily: font.sans, fontSize: "0.82rem", fontWeight: 600, color: C.inkMid, margin: "0 0 1.25rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
            How your shift compares to others
          </p>
          <ShiftDifficultyIndex rows={stats.shiftDifficulty} loading={stats.loading} />
        </div>
      </div>

      {/* ── Score Distribution ────────────────────── */}
      <div style={{ marginTop: "1.25rem" }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "2.25rem" }}>
          <p style={{ ...eyebrow, marginBottom: "0.35rem" }}>Score Distribution</p>
          <p style={{ fontFamily: font.sans, fontSize: "0.82rem", fontWeight: 600, color: C.inkMid, margin: "0 0 1.25rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
            Where Bitseat users scored
          </p>
          <ScoreHistogram
            allScores={stats.allScores}
            session1ShiftLabel={session1Shift ? formatShift(session1Shift) : null}
            session2ShiftLabel={session2Shift ? formatShift(session2Shift) : null}
            session1ShiftScores={stats.session1ShiftScores}
            session2ShiftScores={stats.session2ShiftScores}
            otherShiftScoresByShift={stats.otherShiftScoresByShift}
            myScore={finalScore}
            mySession1Score={session1Score}
            mySession2Score={session2Score}
            loading={stats.loading}
            shareClicks={stats.referralCount}
            shareUrl={`${window.location.origin}/r/${userId ?? ""}`}
          />
        </div>
      </div>
    </div>
  );
}