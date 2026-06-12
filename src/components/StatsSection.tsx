import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { type Branch, estimatedRank, estimatedPercentile } from "../data/cutoffs";
import { C, font, eyebrow } from "./stats.tokens";
import { StatCard, BigStat, Skeleton, ThinDataNote, RankTooltip, PercentileTooltip } from "./stats.primitives";
import { ScoreHistogram } from "./ScoreHistogram";
import { ShiftDifficultyIndex, computeShiftDifficulty, type ShiftDifficultyRow } from "./ShiftDifficultyIndex";

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

function computePercentile(myScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 0;
  const below = allScores.filter((s) => s < myScore).length;
  const raw = Math.round((below / allScores.length) * 100);
  // With very few submissions it's possible to score "0th" (everyone ties or you're last).
  // Show at least 1st so the display isn't meaninglessly confusing.
  return Math.max(raw, 1);
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
  testDate: string | null;
  center: string | null;
  preferences: Branch[];
  userId: string | null;
  refreshKey?: number;
}

interface StatsState {
  loading: boolean;
  allScores: number[];
  shiftScores: number[];
  centerScores: number[];
  referralCount: number;
  otherShiftScoresByShift: Record<string, number[]>;
  shiftDifficulty: ShiftDifficultyRow[];
}

/* ─── Main component ─────────────────────────────── */
export default function StatsSection({ finalScore, testDate, center, preferences, userId, refreshKey = 0 }: Props) {
  const [stats, setStats] = useState<StatsState>({
    loading: true,
    allScores: [],
    shiftScores: [],
    centerScores: [],
    referralCount: 0,
    otherShiftScoresByShift: {},
    shiftDifficulty: [],
  });

  useEffect(() => {
    if (finalScore === null) return;
    loadStats();

    const channel = supabase
      .channel("stats-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scores" },
        () => { loadStats(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [finalScore, testDate, center, refreshKey]);

  async function loadStats() {
    setStats((s) => ({ ...s, loading: true }));

    const [scoresRes, referralsRes] = await Promise.all([
      supabase.from("scores").select("final_score, session1_score, session2_score, test_date, center, user_id"),
      supabase.from("referrals").select("share_clicks").eq("user_id", userId ?? "").maybeSingle(),
    ]);

    const rows = scoresRes.data;
    if (scoresRes.error || !rows) {
      setStats({ loading: false, allScores: [], shiftScores: [], centerScores: [], referralCount: 0, otherShiftScoresByShift: {}, shiftDifficulty: [] });
      return;
    }

    const allScores = rows
      .map((r: any) => r.final_score as number)
      .filter((s) => typeof s === "number");

    const shiftScores = rows
      .filter((r: any) => testDate && r.test_date === testDate)
      .map((r: any) => r.final_score as number)
      .filter((s) => typeof s === "number");

    const normalise = (s: string | null) => (s ?? "").trim().toLowerCase();
    const centerScores = rows
      .filter((r: any) => center && normalise(r.center) === normalise(center))
      .map((r: any) => r.final_score as number)
      .filter((s) => typeof s === "number");

    // Build per-shift map excluding the user's own shift
    const otherShiftScoresByShift: Record<string, number[]> = {};
    for (const r of rows) {
      if (!r.test_date || r.test_date === testDate) continue;
      if (typeof r.final_score !== "number") continue;
      if (!otherShiftScoresByShift[r.test_date]) {
        otherShiftScoresByShift[r.test_date] = [];
      }
      otherShiftScoresByShift[r.test_date].push(r.final_score);
    }

    const referralCount = referralsRes.data?.share_clicks ?? 0;
    const shiftDifficulty = computeShiftDifficulty(rows as any, testDate ?? null);

    setStats({ loading: false, allScores, shiftScores, centerScores, referralCount, otherShiftScoresByShift, shiftDifficulty });
  }

  const score = finalScore ?? 0;
  const college = finalScore !== null ? predictCollege(finalScore, preferences) : null;
  const popRank = finalScore !== null ? estimatedRank(finalScore) : null;
  const popPct  = finalScore !== null ? estimatedPercentile(finalScore) : null;
  const shiftPct = computePercentile(score, stats.shiftScores);
  const centerPct = computePercentile(score, stats.centerScores);
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
                  <span style={{ fontFamily: font.serif, fontSize: "clamp(1.9rem, 3vw, 2.6rem)", color: C.ink, lineHeight: 1.1 }}>
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
                  <span style={{ fontFamily: font.serif, fontSize: "clamp(1.9rem, 3vw, 2.6rem)", color: C.inkMid, lineHeight: 1.1 }}>
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
                  <p style={{ fontFamily: font.serif, fontSize: "1.6rem", color: C.ink, margin: 0, lineHeight: 1 }}>{college.baseline2025}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: font.sans, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.inkFaint, margin: "0 0 0.2rem" }}>Your score</p>
                  <p style={{ fontFamily: font.serif, fontSize: "1.6rem", color: C.rust, margin: 0, lineHeight: 1 }}>{finalScore}</p>
                </div>
                <p style={{ fontFamily: font.sans, fontSize: "0.75rem", color: C.inkFaint, margin: 0, textAlign: "right" }}>
                  {usedPreference ? "From your saved preferences" : "Highest branch you clear"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2×2 stat grid ────────────────────────── */}
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
          eyebrowText="Shift Percentile"
          title={testDate ? formatShift(testDate) : "Your shift"}
          footer={
            !stats.loading && stats.shiftScores.length >= 2
              ? <ThinDataNote count={stats.shiftScores.length} context="in your shift" />
              : null
          }
        >
          {stats.loading ? <Skeleton /> : stats.shiftScores.length < 2 ? (
            <span style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint }}>
              Not enough submissions from your shift yet.
            </span>
          ) : (
            <BigStat value={shiftPct} suffix="th" sub={`of ${stats.shiftScores.length} in shift`} />
          )}
        </StatCard>

        <StatCard
          eyebrowText="Center Percentile"
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
            <BigStat value={centerPct} suffix="th" sub={`of ${stats.centerScores.length} at center`} />
          )}
        </StatCard>
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
            shiftScores={stats.shiftScores}
            otherShiftScoresByShift={stats.otherShiftScoresByShift}
            myScore={finalScore}
            loading={stats.loading}
            shareClicks={stats.referralCount}
            shareUrl={`${window.location.origin}/r/${userId ?? ""}`}
          />
        </div>
      </div>

      {/* ── Shift Difficulty Index ────────────────── */}
      <div style={{ marginTop: "1.25rem" }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "2.25rem" }}>
          <p style={{ ...eyebrow, marginBottom: "0.35rem" }}>Shift Difficulty Index</p>
          <p style={{ fontFamily: font.sans, fontSize: "0.82rem", fontWeight: 600, color: C.inkMid, margin: "0 0 0.35rem", textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>
            How each 2026 shift compares
          </p>
          <p style={{ fontFamily: font.sans, fontSize: "0.78rem", color: C.inkFaint, margin: "0 0 1.25rem", lineHeight: 1.6 }}>
            Each submission contributes two data points — one per session sat. Scores are matched to their respective shift using the session dates on your scorecard.
          </p>
          <ShiftDifficultyIndex rows={stats.shiftDifficulty} loading={stats.loading} />
        </div>
      </div>
    </div>
  );
}