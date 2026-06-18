import { C, eyebrow } from "../../styles/tokens";

export function TrustCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ background: C.white, borderRadius: "14px", padding: "2rem", border: `1px solid ${C.border}` }}>
      <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: C.rustLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
        {icon}
      </div>
      <p style={{ ...eyebrow, marginBottom: "0.6rem" }}>{title}</p>
      <p style={{ color: C.inkMid, lineHeight: 1.75, margin: "0.6rem 0 0", fontSize: "0.93rem" }}>{text}</p>
    </div>
  );
}
