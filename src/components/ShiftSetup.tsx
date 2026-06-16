import { useState } from "react";
import { C, font } from "./stats.tokens";

/* ─── Known Session 1 shifts (April dates) ───────── */
export const SESSION1_SHIFTS: { key: string; label: string }[] = [
  { key: "15Apr2026_S1", label: "15 Apr · Session 1" },
  { key: "15Apr2026_S2", label: "15 Apr · Session 2" },
  { key: "16Apr2026_S1", label: "16 Apr · Session 1" },
  { key: "16Apr2026_S2", label: "16 Apr · Session 2" },
];

function formatShift(raw: string): string {
  if (!raw) return raw;
  const match = raw.match(/^(\d{1,2})([A-Za-z]+)(\d{4})(?:_S(\d))?/);
  if (match) {
    const [, day, month, year, session] = match;
    return `${day} ${month} ${year}${session ? ` · Session ${session}` : ""}`;
  }
  return raw.replace(/_/g, " · ");
}

interface Props {
  session2Shift: string | null;
  candidateName: string;
  onDone: (session1Shift: string) => Promise<boolean>;
}

export default function ShiftSetup({ session2Shift, candidateName, onDone }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function handleContinue() {
    if (!selected || saving) return;
    setSaving(true);
    setError(false);
    const ok = await onDone(selected);
    setSaving(false);
    if (!ok) setError(true);
    // On success the parent switches views away from this screen.
  }

  const primaryBtn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.85rem 2rem",
    borderRadius: "8px",
    border: "none",
    background: selected && !saving ? C.rust : C.borderMid,
    color: selected && !saving ? "#fff" : C.inkFaint,
    fontFamily: font.sans,
    fontWeight: 600,
    fontSize: "1rem",
    cursor: selected && !saving ? "pointer" : "not-allowed",
    width: "100%",
    transition: "background 0.15s, color 0.15s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: C.cream,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      fontFamily: font.sans,
    }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>

        {/* Header */}
        <p style={{
          fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase" as const, color: C.rust, margin: "0 0 0.75rem",
        }}>
          One more thing
        </p>
        <h1 style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          fontSize: "2rem", fontWeight: 400, color: C.ink,
          margin: "0 0 0.6rem", lineHeight: 1.2,
        }}>
          Which Session 1 shift did you sit?
        </h1>
        <p style={{ color: C.inkMid, fontSize: "0.93rem", lineHeight: 1.75, margin: "0 0 2rem" }}>
          {candidateName ? `${candidateName}, your` : "Your"} Session 2 shift was{" "}
          <strong style={{ color: C.ink }}>
            {session2Shift ? formatShift(session2Shift) : "—"}
          </strong>.
          {" "}The PDF doesn't include your Session 1 date, so we need you to tell us.
        </p>

        {/* Shift options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.75rem" }}>
          {SESSION1_SHIFTS.map(({ key, label }) => {
            const active = selected === key;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  padding: "1rem 1.25rem",
                  borderRadius: "10px",
                  border: active ? `1.5px solid ${C.rust}` : `1px solid ${C.borderMid}`,
                  background: active ? C.rustLight : "#fff",
                  cursor: "pointer",
                  textAlign: "left" as const,
                  transition: "border-color 0.12s, background 0.12s",
                }}
              >
                {/* Radio dot */}
                <div style={{
                  width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                  border: active ? `5px solid ${C.rust}` : `2px solid ${C.borderMid}`,
                  background: "#fff",
                  transition: "border 0.12s",
                }} />
                <span style={{
                  fontFamily: font.sans, fontSize: "0.95rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? C.ink : C.inkMid,
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <p style={{
            color: C.rustDark, fontSize: "0.85rem", margin: "0 0 0.85rem",
            background: C.rustLight, border: `1px solid ${C.rust}`,
            borderRadius: "8px", padding: "0.65rem 0.85rem",
          }}>
            Couldn't save that — please check your connection and try again.
          </p>
        )}

        <button
          style={primaryBtn}
          disabled={!selected || saving}
          onClick={handleContinue}
        >
          {saving ? "Saving…" : "Continue"}
        </button>

      </div>
    </div>
  );
}
