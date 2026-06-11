import { useState, useRef } from "react";
import { BRANCHES, CAMPUSES, type Branch, type Campus } from "../data/cutoffs";

const C = {
  cream: "#faf9f5",
  rust: "#d77656",
  rustLight: "#f9ede7",
  rustDark: "#b85e3e",
  green: "#166534",
  greenLight: "#f0fdf4",
  greenBorder: "#bbf7d0",
  amber: "#92400e",
  amberLight: "#fffbeb",
  amberBorder: "#fde68a",
  red: "#991b1b",
  redLight: "#fff1f2",
  redBorder: "#fecdd3",
  ink: "#1C1612",
  inkMid: "#5A4E44",
  inkFaint: "#9A8E85",
  white: "#FFFFFF",
  border: "rgba(92,70,55,0.12)",
  borderMid: "rgba(92,70,55,0.20)",
  borderStrong: "rgba(92,70,55,0.35)",
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

type Status = "safe" | "close" | "reach" | null;

function getStatus(score: number | null, cutoff: number): Status {
  if (score === null) return null;
  const diff = score - cutoff;
  if (diff >= 5) return "safe";
  if (diff >= -4) return "close";
  return "reach";
}

const STATUS_CONFIG = {
  safe:  { label: "Likely",  bg: C.greenLight,  border: C.greenBorder,  text: C.green  },
  close: { label: "Close",   bg: C.amberLight,  border: C.amberBorder,  text: C.amber  },
  reach: { label: "Reach",   bg: C.redLight,    border: C.redBorder,    text: C.red    },
};

function branchKey(b: Branch) {
  return `${b.campus}|${b.degree}|${b.specialization}`;
}

interface Props {
  finalScore: number | null;
  savedPreferences: Branch[];
  onPreferencesChange: (prefs: Branch[]) => void;
}

export default function PreferenceList({ finalScore, savedPreferences, onPreferencesChange }: Props) {
  const [activeTab, setActiveTab] = useState<Campus>("Pilani");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  const preferences = savedPreferences;

  function update(next: Branch[]) {
    onPreferencesChange(next);
  }

  function handleAdd(branch: Branch) {
    if (preferences.some((p) => branchKey(p) === branchKey(branch))) return;
    update([...preferences, branch]);
  }

  function handleRemove(index: number) {
    update(preferences.filter((_, i) => i !== index));
  }

  // Drag-and-drop reordering in the preference list
  function handleDragStart(index: number) {
    dragItem.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === dropIndex) {
      setDragOverIndex(null);
      return;
    }
    const next = [...preferences];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(dropIndex, 0, moved);
    update(next);
    dragItem.current = null;
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    dragItem.current = null;
    setDragOverIndex(null);
  }

  const campusBranches = BRANCHES.filter((b) => b.campus === activeTab);
  const addedKeys = new Set(preferences.map(branchKey));

  // Group by degree for the catalogue
  const byDegree: Record<string, Branch[]> = {};
  for (const b of campusBranches) {
    if (!byDegree[b.degree]) byDegree[b.degree] = [];
    byDegree[b.degree].push(b);
  }
  for (const degree in byDegree) {
    byDegree[degree].sort((a, b) => b.predicted2026 - a.predicted2026);
  }

  return (
    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "3rem", marginBottom: "3rem" }}>

      {/* Header */}
      <p style={{ ...eyebrow, marginBottom: "0.75rem" }}>Branch preferences</p>
      <h2 style={{ fontFamily: font.serif, fontSize: "1.7rem", color: C.ink, fontWeight: 400, margin: "0 0 0.5rem" }}>
        How do your preferences look?
      </h2>
      <p style={{ color: C.inkFaint, fontSize: "0.88rem", fontFamily: font.sans, margin: "0 0 2.5rem" }}>
        Based on 2025 cutoffs — predicted 2026 figures coming soon. Tap a branch to add it to your list, then drag to reorder.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>

        {/* LEFT: Course catalogue */}
        <div>
          <p style={{ ...eyebrow, marginBottom: "1rem" }}>Course catalogue</p>

          {/* Campus tabs */}
          <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.25rem", background: C.rustLight, borderRadius: "10px", padding: "3px" }}>
            {CAMPUSES.map((campus) => (
              <button
                key={campus}
                onClick={() => setActiveTab(campus)}
                style={{
                  flex: 1,
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  background: activeTab === campus ? C.white : "transparent",
                  color: activeTab === campus ? C.ink : C.inkMid,
                  fontFamily: font.sans,
                  fontWeight: activeTab === campus ? 600 : 500,
                  fontSize: "0.83rem",
                  cursor: "pointer",
                  boxShadow: activeTab === campus ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {campus}
              </button>
            ))}
          </div>

          {/* Branch list by degree */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {Object.entries(byDegree).map(([degree, branches]) => (
              <div key={degree}>
                <p style={{ ...eyebrow, fontSize: "0.65rem", marginBottom: "0.5rem", color: C.inkFaint }}>{degree}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {branches.map((branch) => {
                    const already = addedKeys.has(branchKey(branch));
                    const status = getStatus(finalScore, branch.predicted2026);
                    const cfg = status ? STATUS_CONFIG[status] : null;
                    return (
                      <button
                        key={branchKey(branch)}
                        onClick={() => !already && handleAdd(branch)}
                        disabled={already}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          padding: "0.65rem 0.9rem",
                          borderRadius: "9px",
                          border: `1px solid ${already ? C.greenBorder : C.border}`,
                          background: already ? C.greenLight : C.white,
                          cursor: already ? "default" : "pointer",
                          textAlign: "left",
                          width: "100%",
                          transition: "border-color 0.12s, background 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          if (!already) (e.currentTarget as HTMLButtonElement).style.borderColor = C.rust;
                        }}
                        onMouseLeave={(e) => {
                          if (!already) (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                        }}
                      >
                        <span style={{ fontFamily: font.sans, fontSize: "0.87rem", fontWeight: 500, color: already ? C.green : C.ink, flex: 1 }}>
                          {branch.specialization}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                          {cfg && !already && (
                            <span style={{
                              padding: "0.18rem 0.5rem",
                              borderRadius: "20px",
                              background: cfg.bg,
                              color: cfg.text,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              fontFamily: font.sans,
                            }}>
                              {cfg.label}
                            </span>
                          )}
                          {already
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.rust} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                          }
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Preference list */}
        <div style={{ position: "sticky", top: "2rem" }}>
          <p style={{ ...eyebrow, marginBottom: "1rem" }}>
            Your list{preferences.length > 0 && <span style={{ color: C.inkFaint, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.78rem" }}> — drag to reorder</span>}
          </p>

          {preferences.length === 0 ? (
            <div style={{
              border: `1.5px dashed ${C.borderMid}`,
              borderRadius: "14px",
              padding: "3rem 2rem",
              textAlign: "center",
              color: C.inkFaint,
              fontFamily: font.sans,
              fontSize: "0.88rem",
              lineHeight: 1.7,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 1rem", display: "block" }}>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12h6M9 16h4"/>
              </svg>
              Tap any course on the left<br />to add it here.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {preferences.map((branch, i) => {
                const status = getStatus(finalScore, branch.predicted2026);
                const cfg = status ? STATUS_CONFIG[status] : null;
                const isDragOver = dragOverIndex === i;

                return (
                  <div
                    key={branchKey(branch)}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5rem 2rem 1fr auto auto",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.85rem 1rem",
                      borderRadius: "12px",
                      background: isDragOver ? C.rustLight : C.white,
                      border: `1px solid ${isDragOver ? C.rust : (cfg ? cfg.border : C.border)}`,
                      cursor: "grab",
                      transition: "border-color 0.1s, background 0.1s",
                      userSelect: "none",
                    }}
                  >
                    {/* Drag handle */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.inkFaint} strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.5 }}>
                      <line x1="4" y1="8" x2="20" y2="8"/>
                      <line x1="4" y1="16" x2="20" y2="16"/>
                    </svg>

                    {/* Rank */}
                    <span style={{ fontFamily: font.sans, fontSize: "0.75rem", fontWeight: 700, color: C.inkFaint, textAlign: "center" }}>
                      {i + 1}
                    </span>

                    {/* Branch info */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: font.sans, fontWeight: 600, fontSize: "0.87rem", color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {branch.campus} · {branch.specialization}
                      </p>
                      <p style={{ margin: "0.15rem 0 0", fontFamily: font.sans, fontSize: "0.76rem", color: C.inkFaint }}>
                        {branch.degree}
                      </p>
                    </div>

                    {/* Status badge */}
                    {cfg && (
                      <span style={{
                        padding: "0.2rem 0.55rem",
                        borderRadius: "20px",
                        background: cfg.bg,
                        color: cfg.text,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        fontFamily: font.sans,
                        whiteSpace: "nowrap" as const,
                      }}>
                        {cfg.label}
                      </span>
                    )}

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(i)}
                      title="Remove"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        border: `1px solid ${C.border}`,
                        background: "transparent",
                        color: "#BE123C",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {preferences.length > 0 && (
            <p style={{ color: C.inkFaint, fontSize: "0.78rem", fontFamily: font.sans, margin: "0.75rem 0 0", textAlign: "center" }}>
              {preferences.length} branch{preferences.length !== 1 ? "es" : ""} · Saved automatically
            </p>
          )}
        </div>
      </div>
    </div>
  );
}