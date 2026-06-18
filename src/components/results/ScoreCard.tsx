import { C, font } from "../../styles/tokens";

export function ScoreCard({ label, value, highlight = false }: { label: string; value: number | null; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? C.rust : C.white, color: highlight ? C.white : C.ink, borderRadius: "14px", padding: "2rem 1.75rem", border: highlight ? "none" : `1px solid ${C.border}`, textAlign: "left" }}>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, opacity: 0.65 }}>{label}</p>
      <p style={{ margin: 0, fontFamily: font.serif, fontSize: "3.6rem", fontWeight: 400, lineHeight: 1 }}>{value ?? "—"}</p>
    </div>
  );
}
