import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { BRANCHES, type Branch, estimatedRank, estimatedPercentile } from "../data/cutoffs";

/* ─── Design tokens (mirrored from App) ─────────── */
const C = {
  cream: "#faf9f5",
  rust: "#d77656",
  rustLight: "#f9ede7",
  rustDark: "#b85e3e",
  green: "#166534",
  greenLight: "#f0fdf4",
  greenBorder: "#bbf7d0",
  ink: "#1C1612",
  inkMid: "#5A4E44",
  inkFaint: "#9A8E85",
  white: "#FFFFFF",
  border: "rgba(92,70,55,0.12)",
  borderMid: "rgba(92,70,55,0.20)",
};

const font = {
  serif: "'EB Garamond', 'Garamond', 'Georgia', serif",
  sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
};

const eyebrow: React.CSSProperties = {
  fontFamily: font.sans,
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color: C.rust,
  margin: 0,
};

/* ─── Shift label formatter (mirrors App.tsx) ───────*/
function formatShift(raw: string): string {
  if (!raw) return raw;
  const match = raw.match(/^(\d{1,2})([A-Za-z]+)(\d{4})(?:_S(\d))?/);
  if (match) {
    const [, day, month, year, session] = match;
    const sessionPart = session ? ` · Session ${session}` : "";
    return `${day} ${month} ${year}${sessionPart}`;
  }
  return raw.replace(/_/g, " · ");
}

/* ─── Percentile math ────────────────────────────── */
// "What fraction of scores is strictly below mine?"
// Using the standard definition: percentile = (below / total) * 100
function computePercentile(myScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 0;
  const below = allScores.filter((s) => s < myScore).length;
  return Math.round((below / allScores.length) * 100);
}

/* ─── College prediction ─────────────────────────── */
// Walk preferences first (in order), then fall back to highest cutoff
// branch the user clears from all branches.
function predictCollege(
  score: number,
  preferences: Branch[]
): Branch | null {
  // Try preferences in order
  for (const pref of preferences) {
    if (score >= pref.baseline2025) return pref;
  }
  // Fall back: highest cutoff branch the score clears
  const cleared = BRANCHES.filter((b) => score >= b.baseline2025).sort(
    (a, b) => b.baseline2025 - a.baseline2025
  );
  return cleared[0] ?? null;
}

/* ─── Stat card shell ────────────────────────────── */
function StatCard({
  eyebrowText,
  title,
  children,
  footer,
}: {
  eyebrowText: string;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        padding: "2.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <p style={{ ...eyebrow, marginBottom: 0 }}>{eyebrowText}</p>
      <p
        style={{
          fontFamily: font.sans,
          fontSize: "0.82rem",
          fontWeight: 600,
          color: C.inkMid,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </p>
      <div style={{ flex: 1 }}>{children}</div>
      {footer && (
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            paddingTop: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

/* ─── Big number display ─────────────────────────── */
function BigStat({
  value,
  suffix,
  sub,
}: {
  value: string | number;
  suffix?: string;
  sub?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
      <span
        style={{
          fontFamily: font.serif,
          fontSize: "3.2rem",
          fontWeight: 400,
          color: C.ink,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {suffix && (
        <span
          style={{
            fontFamily: font.serif,
            fontSize: "1.5rem",
            color: C.inkMid,
            lineHeight: 1,
          }}
        >
          {suffix}
        </span>
      )}
      {sub && (
        <span
          style={{
            fontFamily: font.sans,
            fontSize: "0.8rem",
            color: C.inkFaint,
            marginLeft: "0.5rem",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

//nice code, eh?
/* ─── Skeleton shimmer ───────────────────────────── */
function Skeleton() {
  return (
    <div
      style={{
        height: "3.2rem",
        width: "8rem",
        borderRadius: "8px",
        background: `linear-gradient(90deg, ${C.rustLight} 0%, #f2ede6 50%, ${C.rustLight} 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

/* ─── Insufficient data notice ───────────────────── */
function ThinDataNote({ count, context }: { count: number; context: string }) {
  return (
    <p
      style={{
        fontFamily: font.sans,
        fontSize: "0.78rem",
        color: C.inkFaint,
        margin: 0,
        lineHeight: 1.6,
      }}
    >
      Based on {count} submission{count !== 1 ? "s" : ""} {context}. Will
      sharpen as more people upload.
    </p>
  );
}

/* ─── Rank alert footer ──────────────────────────── */
function RankAlert() {
  return (
    <p
      style={{
        fontFamily: font.sans,
        fontSize: "0.78rem",
        color: C.inkMid,
        margin: 0,
        lineHeight: 1.6,
        display: "flex",
        gap: "0.4rem",
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: C.rust, fontWeight: 700, flexShrink: 0 }}>↗</span>
      Once enough data accumulates, this will show your estimated BITS rank
      directly.
    </p>
  );
}

/* ─── Props ──────────────────────────────────────── */
interface Props {
  finalScore: number | null;
  testDate: string | null;
  center: string | null;
  preferences: Branch[];
}

interface StatsState {
  loading: boolean;
  allScores: number[];
  shiftScores: number[];
  centerScores: number[];
}

/* ─── Main component ─────────────────────────────── */
export default function StatsSection({
  finalScore,
  testDate,
  center,
  preferences,
}: Props) {
  const [stats, setStats] = useState<StatsState>({
    loading: true,
    allScores: [],
    shiftScores: [],
    centerScores: [],
  });

  useEffect(() => {
    if (finalScore === null) return;
    loadStats();
  }, [finalScore, testDate, center]);

  async function loadStats() {
    setStats((s) => ({ ...s, loading: true }));

    // Fetch all final scores (no PII, just the number + metadata for grouping)
    const { data: rows, error } = await supabase
      .from("scores")
      .select("final_score, test_date, center");

    if (error || !rows) {
      setStats({ loading: false, allScores: [], shiftScores: [], centerScores: [] });
      return;
    }

    const allScores = rows
      .map((r: any) => r.final_score as number)
      .filter((s) => typeof s === "number");

    // Shift match: same test_date string
    const shiftScores = rows
      .filter((r: any) => testDate && r.test_date === testDate)
      .map((r: any) => r.final_score as number)
      .filter((s) => typeof s === "number");

    // Center match: same center string (case-insensitive trim)
    const normalise = (s: string | null) => (s ?? "").trim().toLowerCase();
    const centerScores = rows
      .filter(
        (r: any) =>
          center && normalise(r.center) === normalise(center)
      )
      .map((r: any) => r.final_score as number)
      .filter((s) => typeof s === "number");

    setStats({ loading: false, allScores, shiftScores, centerScores });
  }

  const score = finalScore ?? 0;
  const college = finalScore !== null ? predictCollege(finalScore, preferences) : null;

  const popRank = finalScore !== null ? estimatedRank(finalScore) : null;
  const popPct  = finalScore !== null ? estimatedPercentile(finalScore) : null;
  const shiftPct = computePercentile(score, stats.shiftScores);
  const centerPct = computePercentile(score, stats.centerScores);

  // Decide label for the "your best match" college card
  const usedPreference =
    college && preferences.some((p) => p.campus === college.campus && p.specialization === college.specialization);

  return (
    <div
      style={{
        borderTop: `1px solid ${C.border}`,
        paddingTop: "3rem",
        marginBottom: "3rem",
      }}
    >
      {/* Inject shimmer keyframes once */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <p style={{ ...eyebrow, marginBottom: "0.75rem" }}>Your numbers</p>
      <h2
        style={{
          fontFamily: font.serif,
          fontSize: "1.7rem",
          color: C.ink,
          fontWeight: 400,
          margin: "0 0 2rem",
        }}
      >
        How you stack up
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "1.25rem",
        }}
      >
        {/* ── College ───────────────────────────────── */}
        <StatCard
          eyebrowText="College"
          title="Best match right now"
          footer={
            <p
              style={{
                fontFamily: font.sans,
                fontSize: "0.78rem",
                color: C.inkFaint,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {usedPreference
                ? "From your saved preferences"
                : "Highest branch you clear"}
            </p>
          }
        >
          {finalScore === null ? (
            <Skeleton />
          ) : college ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <span
                style={{
                  fontFamily: font.serif,
                  fontSize: "1.65rem",
                  color: C.ink,
                  lineHeight: 1.15,
                }}
              >
                BITS {college.campus}
              </span>
              <span
                style={{
                  fontFamily: font.sans,
                  fontSize: "0.88rem",
                  color: C.inkMid,
                  lineHeight: 1.4,
                }}
              >
                {college.degree} · {college.specialization}
              </span>
              {(() => {
                const diff = finalScore! - college.baseline2025;
                const likelihood =
                  diff >= 5 ? { label: "Likely", bg: C.greenLight, border: C.greenBorder, text: C.green } :
                  diff >= -4 ? { label: "Close", bg: "#fffbeb", border: "#fde68a", text: "#92400e" } :
                  { label: "Reach", bg: "#fff1f2", border: "#fecdd3", text: "#991b1b" };
                return (
                  <div style={{ display: "inline-flex", alignItems: "center", marginTop: "0.25rem", background: likelihood.bg, border: `1px solid ${likelihood.border}`, borderRadius: "6px", padding: "0.2rem 0.6rem", alignSelf: "flex-start" }}>
                    <span style={{ fontFamily: font.sans, fontSize: "0.75rem", color: likelihood.text, fontWeight: 600 }}>
                      {likelihood.label}
                    </span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <span
                style={{
                  fontFamily: font.serif,
                  fontSize: "1.65rem",
                  color: C.inkMid,
                  lineHeight: 1.15,
                }}
              >
                No match yet
              </span>
              <span
                style={{
                  fontFamily: font.sans,
                  fontSize: "0.85rem",
                  color: C.inkFaint,
                }}
              >
                Your score is below all current cutoffs. Cutoffs may shift for 2026.
              </span>
            </div>
          )}
        </StatCard>

        {/* ── Estimated Rank ────────────────────────── */}
        <StatCard
          eyebrowText="Estimated Rank"
          title="Across all BITSAT candidates"
          footer={
            <span style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint }}>
              Modelled from 2022-2025 official rank data
            </span>
          }
        >
          {popRank === null ? (
            <Skeleton />
          ) : (
            <BigStat
              value={popRank}
              suffix=""
              sub={`top ${popPct}% of ~2.3L candidates`}
            />
          )}
        </StatCard>

        {/* ── Shift Percentile ──────────────────────── */}
        <StatCard
          eyebrowText="Shift Percentile"
          title={testDate ? formatShift(testDate) : "Your shift"}
          footer={
            stats.loading ? null : stats.shiftScores.length >= 2 ? (
              <ThinDataNote
                count={stats.shiftScores.length}
                context="in your shift"
              />
            ) : null
          }
        >
          {stats.loading ? (
            <Skeleton />
          ) : stats.shiftScores.length < 2 ? (
            <span
              style={{
                fontFamily: font.sans,
                fontSize: "0.9rem",
                color: C.inkFaint,
              }}
            >
              {stats.shiftScores.length <= 1
                ? "Not enough submissions from your shift yet."
                : "Calculating…"}
            </span>
          ) : (
            <BigStat
              value={shiftPct}
              suffix="th"
              sub={`of ${stats.shiftScores.length} in shift`}
            />
          )}
        </StatCard>

        {/* ── Center Percentile ─────────────────────── */}
        <StatCard
          eyebrowText="Center Percentile"
          title={center ? center : "Your exam center"}
          footer={
            stats.loading ? null : stats.centerScores.length >= 2 ? (
              <ThinDataNote
                count={stats.centerScores.length}
                context="from your center"
              />
            ) : null
          }
        >
          {stats.loading ? (
            <Skeleton />
          ) : stats.centerScores.length < 2 ? (
            <span
              style={{
                fontFamily: font.sans,
                fontSize: "0.9rem",
                color: C.inkFaint,
              }}
            >
              {stats.centerScores.length <= 1
                ? "Not enough submissions from your center yet."
                : "Calculating…"}
            </span>
          ) : (
            <BigStat
              value={centerPct}
              suffix="th"
              sub={`of ${stats.centerScores.length} at center`}
            />
          )}
        </StatCard>
      </div>
    </div>
  );
}