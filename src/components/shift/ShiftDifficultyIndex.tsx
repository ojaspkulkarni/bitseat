import { useState } from "react";
import { C, font } from "../../styles/tokens";
import { Skeleton } from "../stats/primitives";
import { MIN_SAMPLE, type ShiftDifficultyRow } from "./shiftDifficulty.helpers";

function difficultyLabel(index: number | null): { label: string; color: string; bg: string; border: string } {
  if (index === null) return { label: "—", color: C.inkFaint, bg: C.cream, border: C.border };
  if (index >= 103) return { label: "Harder", color: "#991b1b", bg: "#fff1f2", border: "#fecdd3" };
  if (index <= 97)  return { label: "Easier", color: C.green, bg: C.greenLight, border: C.greenBorder };
  return { label: "Average", color: C.inkMid, bg: C.cream, border: C.border };
}

function barColor(index: number | null): string {
  if (index === null) return C.border;
  if (index >= 100) return "#c2410c";
  return "#15803d";
}

interface Props {
  rows: ShiftDifficultyRow[];
  loading: boolean;
}

export function ShiftDifficultyIndex({ rows, loading }: Props) {
  const session1Rows = rows.filter((r) => r.session === 1);
  const session2Rows = rows.filter((r) => r.session === 2);
  const eligibleCount = rows.filter((r) => r.count >= MIN_SAMPLE).length;

  // Default to whichever session the user belongs to, else Session 1
  const defaultSession = rows.find((r) => r.isYours && r.session === 2) ? 2 : 1;
  const [activeSession, setActiveSession] = useState<1 | 2>(defaultSession);

  const sessionRows = activeSession === 1 ? session1Rows : session2Rows;

  // Default selected shift: user's own shift if in this session, else first with data
  const defaultShift =
    sessionRows.find((r) => r.isYours)?.key ??
    sessionRows.find((r) => r.index !== null)?.key ??
    sessionRows[0]?.key;
  const [selectedKey, setSelectedKey] = useState<string | undefined>(defaultShift);

  // If selectedKey is stale (rows just loaded after initial render), resolve to a valid key
  const resolvedKey = selectedKey && sessionRows.some((r) => r.key === selectedKey)
    ? selectedKey
    : sessionRows.find((r) => r.isYours)?.key
      ?? sessionRows.find((r) => r.index !== null)?.key
      ?? sessionRows[0]?.key;

  const selectedRow = sessionRows.find((r) => r.key === resolvedKey) ?? null;

  // When switching sessions, reset selected shift
  function switchSession(s: 1 | 2) {
    setActiveSession(s);
    const nextRows = s === 1 ? session1Rows : session2Rows;
    const next =
      nextRows.find((r) => r.isYours)?.key ??
      nextRows.find((r) => r.index !== null)?.key ??
      nextRows[0]?.key;
    setSelectedKey(next);
  }

  const maxAbsDelta = Math.max(
    6,
    ...rows.map((r) => (r.index !== null ? Math.abs(r.index - 100) : 0))
  );

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

  const hasData = selectedRow !== null && selectedRow.index !== null;
  const diff = difficultyLabel(selectedRow?.index ?? null);
  const delta = hasData ? (selectedRow!.index! - 100) : 0;
  const barPct = hasData ? (Math.abs(delta) / maxAbsDelta) * 50 : 0;
  const isHarder = delta >= 0;
  const color = barColor(selectedRow?.index ?? null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

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
            onClick={() => switchSession(s)}
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

      {/* Shift pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {sessionRows.map((r) => {
          const isSelected = r.key === resolvedKey;
          return (
            <button
              key={r.key}
              onClick={() => setSelectedKey(r.key)}
              style={{
                fontFamily: font.sans,
                fontSize: "0.75rem",
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? (r.isYours ? C.rust : C.ink) : C.inkMid,
                background: isSelected ? (r.isYours ? C.rustLight : "#fff") : "transparent",
                border: isSelected
                  ? `1.5px solid ${r.isYours ? C.rust : C.borderMid}`
                  : `1px solid ${C.border}`,
                borderRadius: "999px",
                padding: "0.25rem 0.75rem",
                cursor: "pointer",
                transition: "all 0.12s",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              {r.isYours && (
                <svg width="6" height="6" viewBox="0 0 8 8" style={{ flexShrink: 0 }}>
                  <circle cx="4" cy="4" r="4" fill={C.rust} />
                </svg>
              )}
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Meter panel */}
      {selectedRow && (
        <div style={{
          padding: "1.1rem 1.25rem",
          borderRadius: "12px",
          border: selectedRow.isYours ? `1.5px solid ${C.rust}` : `1px solid ${C.border}`,
          background: selectedRow.isYours ? C.rustLight : C.cream,
        }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <div>
              <span style={{ fontFamily: font.sans, fontSize: "0.95rem", fontWeight: 600, color: C.ink }}>
                {selectedRow.label}
              </span>
              {selectedRow.isYours && (
                <span style={{ marginLeft: "0.5rem", fontFamily: font.sans, fontSize: "0.65rem", fontWeight: 700, color: C.rust, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                  your shift
                </span>
              )}
            </div>
            {hasData && (
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "1.5rem", color: C.ink, fontWeight: 500 }}>
                  {selectedRow.index}
                </span>
                <span style={{
                  fontFamily: font.sans, fontSize: "0.7rem", fontWeight: 700,
                  color: diff.color, background: diff.bg,
                  border: `1px solid ${diff.border}`,
                  borderRadius: "5px", padding: "0.15rem 0.45rem",
                }}>
                  {diff.label}
                </span>
              </div>
            )}
          </div>

          {/* Meter */}
          {hasData ? (
            <div>
              <div style={{ position: "relative", height: "10px", borderRadius: "999px", background: C.creamDark, overflow: "hidden" }}>
                {/* Center marker */}
                <div style={{
                  position: "absolute", left: "50%", top: 0, bottom: 0,
                  width: "2px", background: C.borderMid, transform: "translateX(-50%)",
                }} />
                {/* Filled bar */}
                <div style={{
                  position: "absolute",
                  top: 0, bottom: 0,
                  borderRadius: "999px",
                  background: color,
                  opacity: 0.75,
                  left: isHarder ? "50%" : `${50 - barPct}%`,
                  width: `${Math.max(barPct, 1.5)}%`,
                  transition: "width 0.35s ease, left 0.35s ease",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
                <span style={{ fontFamily: font.sans, fontSize: "0.65rem", color: C.inkFaint }}>← Easier</span>
                <span style={{ fontFamily: font.sans, fontSize: "0.65rem", color: C.inkFaint, opacity: 0.6 }}>avg</span>
                <span style={{ fontFamily: font.sans, fontSize: "0.65rem", color: C.inkFaint }}>Harder →</span>
              </div>
              <p style={{ fontFamily: font.sans, fontSize: "0.72rem", color: C.inkFaint, margin: "0.6rem 0 0", lineHeight: 1.5 }}>
                Based on {selectedRow.count} submission{selectedRow.count !== 1 ? "s" : ""}. Index of 100 = session average; higher means candidates scored lower on this shift.
              </p>
            </div>
          ) : (
            <p style={{ fontFamily: font.sans, fontSize: "0.8rem", color: C.inkFaint, margin: 0 }}>
              Awaiting submissions — {selectedRow.count}/{MIN_SAMPLE} needed to compute difficulty.
            </p>
          )}
        </div>
      )}
    </div>
  );
}