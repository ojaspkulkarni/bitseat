import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { C, font, ghostBtn } from "../../styles/tokens";
import { toTitleCase, formatShift } from "../../app/home.helpers";
import type { ScoreRow } from "../../app/types";

export function ResultsNavMenu({
  onEditPrefs,
  onSignOut,
  handleFileChange,
  scores,
  activeScoreId,
  onSelect,
}: {
  onEditPrefs: () => void;
  onSignOut: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scores: ScoreRow[];
  activeScoreId: string | null;
  onSelect: (row: ScoreRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    width: "100%",
    textAlign: "left",
    padding: "0.65rem 0.9rem",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: font.sans,
    fontSize: "0.88rem",
    color: C.ink,
    fontWeight: 500,
  };

  const divider: React.CSSProperties = {
    height: "1px",
    background: C.border,
    margin: "0.3rem 0",
  };

  return (
    <div ref={ref} style={{ position: "relative" as const }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        style={{ ...ghostBtn, padding: "0.75rem 0.9rem" }}
      >
        {/* Hamburger icon */}
        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="1" y1="2" x2="15" y2="2"/>
          <line x1="1" y1="7" x2="15" y2="7"/>
          <line x1="1" y1="12" x2="15" y2="12"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute" as const,
          top: "calc(100% + 0.5rem)",
          right: 0,
          width: "min(22rem, 90vw)",
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(28,22,18,0.1)",
          padding: "0.5rem",
          zIndex: 50,
        }}>

          {/* Upload new PDF */}
          <label style={{ ...menuItemStyle, cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload new PDF
            <input ref={fileRef} type="file" accept=".pdf" onChange={(e) => { handleFileChange(e); setOpen(false); }} style={{ display: "none" }} />
          </label>

          {/* Edit preferences */}
          <button style={menuItemStyle} onClick={() => { onEditPrefs(); setOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit preferences
          </button>

          <div style={divider} />

          {/* Founders note */}
          <Link
            to="/founders-note"
            style={{ ...menuItemStyle, textDecoration: "none" }}
            onClick={() => setOpen(false)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
            Note from the founders
          </Link>

          <div style={divider} />

          {/* Scorecard switcher (only if multiple) */}
          {scores.length > 1 && (
            <>
              <p style={{ fontFamily: font.sans, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.inkFaint, margin: "0.4rem 0.9rem 0.3rem" }}>
                Your scorecards
              </p>
              <div style={{ maxHeight: "14rem", overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: "0.25rem" }}>
                {scores.map((row) => {
                  const isActive = row.id === activeScoreId;
                  return (
                    <button
                      key={row.id}
                      onClick={() => { onSelect(row); setOpen(false); }}
                      style={{
                        ...menuItemStyle,
                        justifyContent: "space-between",
                        background: isActive ? C.rustLight : "transparent",
                        border: isActive ? `1px solid ${C.rust}` : "1px solid transparent",
                      }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontWeight: 600, color: C.ink, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                          {row.candidate_name ? toTitleCase(row.candidate_name) : `App ${row.application_number}`}
                        </span>
                        <span style={{ display: "block", color: C.inkFaint, fontSize: "0.72rem", marginTop: "0.1rem" }}>
                          {row.session2_shift ? formatShift(row.session2_shift) : ""}
                        </span>
                      </span>
                      <span style={{ fontFamily: font.serif, fontSize: "1.1rem", color: C.rust, flexShrink: 0 }}>
                        {row.final_score ?? "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={divider} />
            </>
          )}

          {/* Sign out */}
          <button style={{ ...menuItemStyle, color: "#991b1b" }} onClick={() => { onSignOut(); setOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
