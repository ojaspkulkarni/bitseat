import { C, font, eyebrow } from "../../styles/tokens";

export function CtaCard({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: "20px", padding: "2.5rem" }}>
      <p style={{ ...eyebrow, marginBottom: "1rem" }}>Get started</p>
      <h2 style={{ fontFamily: font.serif, fontSize: "1.9rem", fontWeight: 400, color: C.ink, margin: "0 0 0.75rem", lineHeight: 1.2 }}>
        Upload your PDF.<br />Know your rank.
      </h2>
      <p style={{ color: C.inkMid, fontSize: "0.93rem", lineHeight: 1.75, margin: "0 0 2rem" }}>
        Sign in once so we can keep submissions honest. Your email is never shown to anyone.
      </p>
      <button onClick={onSignIn} style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", padding: "0.9rem 1.75rem", borderRadius: "8px", border: `1px solid ${C.borderMid}`, background: C.white, color: C.ink, fontFamily: font.sans, fontWeight: 600, fontSize: "1rem", cursor: "pointer", width: "100%", justifyContent: "center" }}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: "20px", height: "20px" }} />
        Continue with Google
      </button>
    </div>
  );
}
