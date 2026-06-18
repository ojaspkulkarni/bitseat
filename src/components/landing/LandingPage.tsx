import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { C, font, primaryBtn, ghostBtn, eyebrow } from "../../styles/tokens";
import { CtaCard } from "./CtaCard";
import { UploadZone } from "./UploadZone";
import { TrustCard } from "./TrustCard";
import { AnalyticsCard } from "./AnalyticsCard";
import { LivePercentileIllustration, ScoreDistributionIllustration } from "./illustrations";

interface Props {
  user: User | null;
  loading: boolean;
  error: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function LandingPage({ user, loading, error, onFileChange, onSignIn, onSignOut }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: font.sans }}>

      <nav className="site-nav">
        <div className="site-nav__inner">
          <img src="/logo/Bitseat logo.png" alt="Bitseat" style={{ height: "32px" }} />
          {user
            ? <button onClick={onSignOut} style={ghostBtn}>Sign out</button>
            : <button onClick={onSignIn} style={ghostBtn}>Sign in</button>
          }
        </div>
      </nav>

      <section className="page-container" style={{ paddingTop: "clamp(3rem, 8vw, 6rem)", paddingBottom: "clamp(3rem, 6vw, 5rem)" }}>
        <div className="hero-grid">
          <div>
            <img src="/logo/Bitseat logo.png" alt="Bitseat" style={{ width: "100%", maxWidth: "420px", display: "block", marginBottom: "2rem" }} />
            <h1 style={{ fontFamily: font.serif, fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", color: C.inkMid, fontWeight: 400, lineHeight: 1.25, margin: "0 0 1.75rem" }}>
              Verified scorecards.<br />Real cutoffs.
            </h1>
            <p style={{ fontSize: "1.05rem", color: C.inkMid, lineHeight: 1.8, margin: 0, maxWidth: "400px" }}>
              You studied for months. Your score deserves more than a number — it deserves context. Where you really stand, without the noise.
            </p>
          </div>

          <div>
            {!user ? (
              <CtaCard onSignIn={onSignIn} />
            ) : (
              <UploadZone user={user} loading={loading} error={error} onFileChange={onFileChange} />
            )}
          </div>
        </div>
      </section>

      <section style={{ background: C.creamDark, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "clamp(3rem, 6vw, 5rem) 0" }}>
        <div className="page-container">
          <p style={{ ...eyebrow, marginBottom: "2.5rem" }}>Why Bitseat</p>
          <div className="grid-auto">
            <TrustCard
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.rust} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              title="Your name stays out of it"
              text="We know how much this score means to you and your family. It never gets attached to your name, your email, or anything that leads back to you."
            />
            <TrustCard
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.rust} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.66 0 3.22.45 4.56 1.24"/><path d="M16 5l3 3-3 3"/></svg>}
              title="Every score is the real thing"
              text="We only accept official BITSAT scorecards — the PDF you actually downloaded from the portal. If it's on Bitseat, it came from the exam."
            />
            <TrustCard
              icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.rust} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              title="Built by people who sat the exam"
              text="We built this the summer after our own BITSAT, because nothing like it existed. The people behind this site know exactly what that waiting period feels like."
            />
          </div>
        </div>
      </section>

      <section className="page-container" style={{ paddingTop: "clamp(3rem, 6vw, 5rem)", paddingBottom: "clamp(3rem, 6vw, 5rem)" }}>
        <p style={{ ...eyebrow, marginBottom: "1rem" }}>Coming soon</p>
        <h2 style={{ fontFamily: font.serif, fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 400, color: C.ink, margin: "0 0 3rem" }}>
          Live analytics are on the way.
        </h2>
        <div className="grid-auto">
          <AnalyticsCard title="Score Distribution" subtitle="Visualize how students are scoring across shifts." illustration={<ScoreDistributionIllustration />} />
          <AnalyticsCard title="Percentile Estimates" subtitle="Dynamic predictions powered by live submissions." illustration={<LivePercentileIllustration />} />
        </div>
      </section>

      {!user && (
        <section className="cta-section">
          <div className="page-container">
            <h2 style={{ fontFamily: font.serif, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 400, color: C.white, margin: "0 0 1rem", lineHeight: 1.15 }}>
              Upload your scorecard.<br />See where you stand.
            </h2>
            <p style={{ color: "rgba(255,255,255,0.75)", margin: "0 0 2.5rem", fontSize: "1.05rem", lineHeight: 1.7 }}>
              Free. Takes 30 seconds. Your data stays anonymous, always.
            </p>
            <button onClick={onSignIn} style={{ ...primaryBtn, background: C.white, color: C.rust, fontSize: "1rem", padding: "0.9rem 2rem", gap: "0.75rem" }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: "20px", height: "20px" }} />
              Get started
            </button>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p style={{ color: C.inkFaint, fontSize: "0.85rem", margin: 0 }}>© 2026 Bitseat · Built for BITSAT aspirants</p>
          <Link to="/founders-note" style={{ color: C.inkMid, fontSize: "0.85rem", textDecoration: "none", fontFamily: font.sans, borderBottom: `1px solid ${C.borderMid}`, paddingBottom: "1px" }}>
            A note from the founders →
          </Link>
        </div>
      </footer>
    </div>
  );
}
