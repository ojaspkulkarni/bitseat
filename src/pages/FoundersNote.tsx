import { useEffect } from "react";
import { Link } from "react-router-dom";
import { C, font } from "../styles/tokens";

export default function FoundersNote() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: font.sans }}>

      {/* Nav */}
      <nav className="site-nav">
        <div className="site-nav__inner">
          <Link to="/" style={{ display: "inline-block", lineHeight: 0 }}>
            <img src="/logo/Bitseat logo.png" alt="Bitseat" style={{ height: "32px" }} />
          </Link>
          <Link to="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.88rem",
            fontWeight: 500,
            color: C.inkMid,
            textDecoration: "none",
            fontFamily: font.sans,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </Link>
        </div>
      </nav>

      {/* Letter */}
      <main className="prose page-container" style={{ paddingTop: "clamp(3rem, 6vw, 5rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}>

        <p style={{
          fontFamily: font.sans,
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase" as const,
          color: C.rust,
          margin: "0 0 2rem",
        }}>
          A note from the founders
        </p>

        <h1 style={{
          fontFamily: font.serif,
          fontSize: "clamp(2.2rem, 4vw, 3.2rem)",
          fontWeight: 400,
          color: C.ink,
          lineHeight: 1.15,
          margin: "0 0 3rem",
        }}>
          We know what this wait feels like.
        </h1>

        <div style={{ width: "40px", height: "2px", background: C.rust, opacity: 0.4, marginBottom: "3rem" }} />

        <div style={{
          fontFamily: font.serif,
          fontSize: "1.2rem",
          lineHeight: 1.85,
          color: C.inkMid,
          display: "flex",
          flexDirection: "column" as const,
          gap: "1.6rem",
        }}>
          <p style={{ margin: 0 }}>
            BITSAT is a different kind of pressure. A handful of marks separates the branch you've been working toward from one you never planned for — and the gap closes or opens faster than most competitive exams. Last year's cutoffs give you a number to hold onto, but they can't tell you what this year's competition actually looks like.
          </p>

          <p style={{ margin: 0 }}>
            That bothered us. So we started building something that could do better. Bitseat uses the 2025 and 2026 BITSAT results alongside JEE Advanced cutoff trends to model branch-wise predictions for 2026 — because JEE data reflects how the country values each programme, and that signal doesn't lie. The math is real, the inputs are verified, and the predictions will sharpen as more scorecards come in.
          </p>

          <p style={{ margin: 0 }}>
            More than the tool, though — we built this because we remember sitting exactly where you are. Waiting. Refreshing. Running numbers in your head at midnight. It's an uncomfortable kind of hope, and you deserve something better to hold onto than a spreadsheet from three cycles ago.
          </p>

          <p style={{ margin: 0 }}>
            Bitseat won't take the uncertainty away. But it'll give you an honest picture of where you stand — and that, we think, is worth something.
          </p>
        </div>

        {/* Signature */}
        <div style={{ marginTop: "4rem", paddingTop: "3rem", borderTop: `1px solid ${C.border}` }}>
          <p style={{
            fontFamily: font.serif,
            fontSize: "1.05rem",
            fontStyle: "italic",
            color: C.inkMid,
            margin: "0 0 0.5rem",
          }}>
            Sincerely,
          </p>
          <p style={{
            fontFamily: font.serif,
            fontSize: "1.25rem",
            color: C.ink,
            margin: "0 0 0.25rem",
            fontWeight: 400,
          }}>
            Ojas Kulkarni &amp; Jagrat Gupta
          </p>
          <p style={{
            fontFamily: font.sans,
            fontSize: "0.82rem",
            color: C.inkFaint,
            margin: 0,
            letterSpacing: "0.04em",
          }}>
            Founders, Bitseat · 2026
          </p>
        </div>

      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p style={{ color: C.inkFaint, fontSize: "0.85rem", margin: 0, fontFamily: font.sans }}>
            © 2026 Bitseat · Built for BITSAT aspirants
          </p>
        </div>
      </footer>
    </div>
  );
}