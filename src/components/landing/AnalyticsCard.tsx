import { C, eyebrow } from "../../styles/tokens";

export function AnalyticsCard({ title, subtitle, illustration }: { title: string; subtitle: string; illustration: React.ReactNode }) {
  return (
    <div style={{ background: C.white, borderRadius: "14px", padding: "1.75rem", border: `1px solid ${C.border}` }}>
      <div style={{ height: "100px", borderRadius: "10px", background: C.rustLight, marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {illustration}
      </div>
      <p style={{ ...eyebrow, marginBottom: "0.4rem" }}>{title}</p>
      <p style={{ color: C.inkMid, lineHeight: 1.65, margin: "0.5rem 0 0", fontSize: "0.92rem" }}>{subtitle}</p>
    </div>
  );
}
