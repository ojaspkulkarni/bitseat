import { useState } from "react";
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
  if (diff >= 10) return "safe";
  if (diff >= -9) return "close";
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
  candidateName: string;
  initialPreferences: Branch[];
  onDone: (prefs: Branch[]) => void;
  onSkip: () => void;
}

export default function PreferenceSetup({ finalScore, candidateName, initialPreferences, onDone, onSkip }: Props) {
  const [activeTab, setActiveTab] = useState<Campus>("Pilani");
  const [preferences, setPreferences] = useState<Branch[]>(initialPreferences);

  function firstName(name: string) {
    if (!name) return "there";
    return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).split(" ")[0];
  }

  function handleAdd(branch: Branch) {
    if (preferences.some((p) => branchKey(p) === branchKey(branch))) return;
    setPreferences([...preferences, branch]);
  }

  function handleRemove(key: string) {
    setPreferences(preferences.filter((p) => branchKey(p) !== key));
  }

  const campusBranches = BRANCHES.filter((b) => b.campus === activeTab);
  const byDegree: Record<string, Branch[]> = {};
  for (const b of campusBranches) {
    if (!byDegree[b.degree]) byDegree[b.degree] = [];
    byDegree[b.degree].push(b);
  }
  const addedKeys = new Set(preferences.map(branchKey));

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: font.sans }}>
      {/* Nav */}
      <nav className="site-nav">
        <div className="site-nav__inner">
          <img src="/logo/Bitseat logo.png" alt="Bitseat" style={{ height: "32px" }} />
          <button
            onClick={onSkip}
            style={{
              background: "transparent",
              border: "none",
              color: C.inkFaint,
              fontFamily: font.sans,
              fontSize: "0.88rem",
              cursor: "pointer",
              padding: "0.4rem 0.75rem",
            }}
          >
            Skip for now →
          </button>
        </div>
      </nav>

      <div className="page-container" style={{ paddingTop: "clamp(2rem, 5vw, 3.5rem)", paddingBottom: "3rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem", maxWidth: "600px" }}>
          <p style={{ ...eyebrow, marginBottom: "0.75rem" }}>Step 2 of 2</p>
          <h1 style={{
            fontFamily: font.serif,
            fontSize: "clamp(2rem, 4vw, 2.8rem)",
            color: C.ink,
            fontWeight: 400,
            lineHeight: 1.15,
            margin: "0 0 0.75rem",
          }}>
            Which branches are you eyeing, {firstName(candidateName)}?
          </h1>
          <p style={{ color: C.inkMid, fontSize: "0.95rem", lineHeight: 1.75, margin: 0 }}>
            Select the branches you're considering. We'll show you how your score stacks up against each cutoff.
            You can always edit this later.
          </p>
        </div>

        <div className="pref-grid pref-scroll-content">

          {/* LEFT: Catalogue */}
          <div>
            <p style={{ ...eyebrow, marginBottom: "1rem" }}>All courses</p>

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
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    boxShadow: activeTab === campus ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {campus}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {Object.entries(byDegree).map(([degree, branches]) => (
                <div key={degree}>
                  <p style={{ ...eyebrow, fontSize: "0.65rem", marginBottom: "0.5rem", color: C.inkFaint }}>{degree}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {branches.map((branch) => {
                      const already = addedKeys.has(branchKey(branch));
                      const status = getStatus(finalScore, branch.predicted2026);
                      const cfg = status ? STATUS_CONFIG[status] : null;
                      const diff = finalScore !== null ? finalScore - branch.predicted2026 : null;
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
                            padding: "0.7rem 1rem",
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
                          <span style={{ fontFamily: font.sans, fontSize: "0.9rem", fontWeight: 500, color: already ? C.green : C.ink, flex: 1 }}>
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
                            <span style={{ fontFamily: font.sans, fontSize: "0.78rem", color: C.inkFaint }}>
                              {branch.predicted2026}
                              {diff !== null && !already && (
                                <span style={{ marginLeft: "0.3rem", color: diff >= 0 ? C.green : C.red, fontWeight: 600 }}>
                                  {diff >= 0 ? `+${diff}` : diff}
                                </span>
                              )}
                            </span>
                            {already
                              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.rust} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
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

          {/* RIGHT: Selected list + confirm */}
          <div className="pref-right-panel">
            <p style={{ ...eyebrow, marginBottom: "1rem" }}>
              Your selection
              {preferences.length > 0 && <span style={{ color: C.inkFaint, fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: "0.78rem" }}> ({preferences.length})</span>}
            </p>

            {preferences.length === 0 ? (
              <div style={{
                border: `1.5px dashed ${C.borderMid}`,
                borderRadius: "14px",
                padding: "2.5rem 2rem",
                textAlign: "center",
                color: C.inkFaint,
                fontFamily: font.sans,
                fontSize: "0.88rem",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.borderMid} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 0.75rem", display: "block" }}>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                </svg>
                Tap any course to add it here.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "1.5rem" }}>
                {preferences.map((branch, i) => {
                  const status = getStatus(finalScore, branch.predicted2026);
                  const cfg = status ? STATUS_CONFIG[status] : null;
                  return (
                    <div
                      key={branchKey(branch)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.75rem 0.9rem",
                        borderRadius: "10px",
                        background: C.white,
                        border: `1px solid ${cfg ? cfg.border : C.border}`,
                      }}
                    >
                      <span style={{ fontFamily: font.sans, fontSize: "0.72rem", fontWeight: 700, color: C.inkFaint, minWidth: "1.1rem", textAlign: "center" }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontFamily: font.sans, fontWeight: 600, fontSize: "0.85rem", color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {branch.campus} · {branch.specialization}
                        </p>
                        <p style={{ margin: "0.1rem 0 0", fontFamily: font.sans, fontSize: "0.73rem", color: C.inkFaint }}>{branch.degree}</p>
                      </div>
                      {cfg && (
                        <span style={{ padding: "0.15rem 0.5rem", borderRadius: "20px", background: cfg.bg, color: cfg.text, fontSize: "0.67rem", fontWeight: 700, fontFamily: font.sans, whiteSpace: "nowrap" as const }}>
                          {cfg.label}
                        </span>
                      )}
                      <button
                        onClick={() => handleRemove(branchKey(branch))}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "5px", border: `1px solid ${C.border}`, background: "transparent", color: "#BE123C", cursor: "pointer", padding: 0, flexShrink: 0 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => onDone(preferences)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.9rem 1.5rem",
                borderRadius: "10px",
                border: "none",
                background: C.rust,
                color: C.white,
                fontFamily: font.sans,
                fontWeight: 600,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              {preferences.length === 0 ? "Continue without preferences" : `See my results →`}
            </button>

            {preferences.length > 0 && (
              <p style={{ color: C.inkFaint, fontSize: "0.78rem", fontFamily: font.sans, margin: "0.75rem 0 0", textAlign: "center" }}>
                You can edit these anytime from the results page.
              </p>
            )}
          </div>
        </div>

        {/* Mobile-only fixed bottom confirm bar */}
        <div className="pref-mobile-confirm">
          <button
            onClick={() => onDone(preferences)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "0.5rem", width: "100%", padding: "0.85rem 1.5rem",
              borderRadius: "10px", border: "none",
              background: C.rust, color: C.white,
              fontFamily: font.sans, fontWeight: 600, fontSize: "1rem", cursor: "pointer",
            }}
          >
            {preferences.length === 0 ? "Continue without preferences" : `Save ${preferences.length} branch${preferences.length === 1 ? "" : "es"} →`}
          </button>
        </div>

      </div>
    </div>
  );
}
