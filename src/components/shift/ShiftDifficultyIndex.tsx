import { useState } from "react";
import { C, font } from "../../styles/tokens";
import { Skeleton } from "../stats/primitives";
import { MIN_SAMPLE, type ShiftDifficultyRow } from "./shiftDifficulty.helpers";

const GOLD = "#c9922a";
const GOLD_EMPTY = "#e8d5b0";

function computeStars(rows: ShiftDifficultyRow[]): Map<string, number> {
  const eligible = rows.filter((r) => r.index !== null);
  const map = new Map<string, number>();
  if (eligible.length === 0) return map;

  const deviations = eligible.map((r) => r.index! - 100);
  const maxDev = Math.max(...deviations.map(Math.abs));

  eligible.forEach((r) => {
    const deviation = r.index! - 100;
    // Scale so that the largest deviation = 5 stars, 0 deviation = 3 stars
    const raw = maxDev === 0 ? 3 : Math.round((deviation / maxDev) * 2) + 3;
    map.set(r.key, Math.max(1, Math.min(5, raw)));
  });
  return map;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={22} height={22} viewBox="0 0 24 24">
          <polygon
            points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
            fill={i < stars ? GOLD : GOLD_EMPTY}
            stroke={i < stars ? GOLD : GOLD_EMPTY}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

function starLabel(stars: number): { text: string; color: string } {
  if (stars === 1) return { text: "Easiest", color: C.green };
  if (stars === 2) return { text: "Easier", color: "#3a7d5a" };
  if (stars === 3) return { text: "Average", color: C.inkMid };
  if (stars === 4) return { text: "Harder", color: "#b84c1a" };
  return { text: "Hardest", color: "#991b1b" };
}

interface Props {
  rows: ShiftDifficultyRow[];
  loading: boolean;
}

export function ShiftDifficultyIndex({ rows, loading }: Props) {
  const session1Rows = rows.filter((r) => r.session === 1);
  const session2Rows = rows.filter((r) => r.session === 2);
  const eligibleCount = rows.filter((r) => r.count >= MIN_SAMPLE).length;
  const starsMap = computeStars(rows);

  const defaultSession = rows.find((r) => r.isYours && r.session === 2) ? 2 : 1;
  const [activeSession, setActiveSession] = useState<1 | 2>(defaultSession);

  const sessionRows = activeSession === 1 ? session1Rows : session2Rows;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (eligibleCount === 0) {
    return (
      <p style={{ fontFamily: font.sans, fontSize: "0.9rem", color: C.inkFaint, margin: 0 }}>
        Not enough submissions yet to compare shift difficulty. This will fill in as more scorecards are uploaded.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

      {/* Session tabs */}
      <div style={{
        display: "inline-flex",
        background: C.creamDark,
        borderRadius: "10px",
        padding: "3px",
        gap: "2px",
        alignSelf: "flex-start",
      }}>
        {([1, 2] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSession(s)}
            style={{
              fontFamily: font.sans,
              fontSize: "0.78rem",
              fontWeight: activeSession === s ? 600 : 500,
              color: activeSession === s ? C.ink : C.inkFaint,
              background: activeSession === s ? "#fff" : "transparent",
              border: activeSession === s ? `1px solid ${C.border}` : "1px solid transparent",
              borderRadius: "7px",
              padding: "0.3rem 0.9rem",
              cursor: "pointer",
              boxShadow: activeSession === s ? "0 1px 3px rgba(0,0,0,0.07)" : "none",
              transition: "all 0.15s",
            }}
          >
            Session {s} · {s === 1 ? "April" : "May"}
          </button>
        ))}
      </div>

      {/* All shifts for this session as cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {sessionRows.map((r) => {
          const stars = starsMap.get(r.key) ?? null;
          const hasData = r.index !== null && stars !== null;
          const lbl = hasData ? starLabel(stars!) : null;

          return (
            <div
              key={r.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.85rem 1.1rem",
                borderRadius: "12px",
                border: r.isYours ? `1.5px solid ${C.rust}` : `1px solid ${C.border}`,
                background: r.isYours ? C.rustLight : "#fff",
              }}
            >
              {/* Left: shift name */}
              <div style={{ minWidth: "9rem", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  {r.isYours && (
                    <svg width="7" height="7" viewBox="0 0 8 8">
                      <circle cx="4" cy="4" r="4" fill={C.rust} />
                    </svg>
                  )}
                  <span style={{
                    fontFamily: font.sans,
                    fontSize: "0.85rem",
                    fontWeight: r.isYours ? 700 : 500,
                    color: C.ink,
                  }}>
                    {r.label}
                  </span>
                </div>
                {r.isYours && (
                  <span style={{
                    fontFamily: font.sans, fontSize: "0.62rem", fontWeight: 700,
                    color: C.rust, letterSpacing: "0.07em",
                    textTransform: "uppercase" as const,
                  }}>
                    your shift
                  </span>
                )}
              </div>

              {/* Stars */}
              <div style={{ flex: 1 }}>
                {hasData ? (
                  <StarRating stars={stars!} />
                ) : (
                  <span style={{ fontFamily: font.sans, fontSize: "0.75rem", color: C.inkFaint }}>
                    Awaiting data ({r.count}/{MIN_SAMPLE})
                  </span>
                )}
              </div>

              {/* Right: label + index */}
              {hasData && lbl && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: font.sans, fontSize: "0.8rem", fontWeight: 700, color: lbl.color }}>
                    {lbl.text}
                  </div>
                  <div style={{ fontFamily: font.sans, fontSize: "0.68rem", color: C.inkFaint }}>
                    index {r.index}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint, margin: 0, lineHeight: 1.5 }}>
        Stars reflect global rank across all {eligibleCount} shifts with enough data. 1★ = easiest, 5★ = hardest.
      </p>
    </div>
  );
}