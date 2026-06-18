import type { User } from "@supabase/supabase-js";
import { C, font, eyebrow } from "../../styles/tokens";

export function UploadZone({ user, loading, error, onFileChange }: { user: User; loading: boolean; error: string; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "2.5rem" }}>
      <p style={{ ...eyebrow, marginBottom: "1rem" }}>Ready to upload</p>
      <h2 style={{ fontFamily: font.serif, fontSize: "1.9rem", fontWeight: 400, color: C.ink, margin: "0 0 0.75rem", lineHeight: 1.2 }}>
        Upload your PDF.<br />Know your rank.
      </h2>
      <p style={{ color: C.inkMid, fontSize: "0.93rem", lineHeight: 1.75, margin: "0 0 2rem" }}>
        Signed in as <span style={{ color: C.ink, fontWeight: 500 }}>{user.email}</span>
      </p>
      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", width: "100%", padding: "0.9rem", borderRadius: "8px", background: C.rust, color: C.white, fontFamily: font.sans, fontWeight: 600, fontSize: "1rem", cursor: "pointer", boxSizing: "border-box" as const }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Choose PDF
        <input type="file" accept=".pdf" onChange={onFileChange} style={{ display: "none" }} />
      </label>
      {loading && <p style={{ marginTop: "1.25rem", color: C.rust, fontWeight: 600, fontSize: "0.9rem", textAlign: "center" }}>Parsing PDF…</p>}
      {error && <div style={{ marginTop: "1rem", padding: "0.9rem 1.1rem", borderRadius: "10px", background: "#FFF1F2", color: "#BE123C", fontWeight: 500, fontSize: "0.9rem" }}>{error}</div>}
    </div>
  );
}
