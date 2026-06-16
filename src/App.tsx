import { useEffect, useRef, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { extractBitsatData } from "./lib/extractFinalScore";
import type { ExtractedBitsatData } from "./lib/extractFinalScore";
import { supabase } from "./lib/supabase";
import FoundersNote from "./pages/FoundersNote";
import ReferralLanding from "./pages/ReferralLanding";
import PreferenceSetup from "./components/PreferenceSetup";
import ShiftSetup from "./components/ShiftSetup";
import StatsSection from "./components/StatsSection";
import type { Branch } from "./data/cutoffs";
import { BRANCHES } from "./data/cutoffs";

/* ─── Design tokens ─────────────────────────────── */
const C = {
  cream: "#faf9f5",
  creamDark: "#f2ede6",
  rust: "#d77656",
  rustDark: "#b85e3e",
  rustLight: "#f9ede7",
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

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.75rem 1.6rem",
  borderRadius: "8px",
  border: "none",
  background: C.rust,
  color: C.white,
  fontFamily: font.sans,
  fontWeight: 600,
  fontSize: "0.95rem",
  cursor: "pointer",
  letterSpacing: "0.01em",
};

const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.75rem 1.6rem",
  borderRadius: "8px",
  border: `1px solid ${C.borderMid}`,
  background: "transparent",
  color: C.ink,
  fontFamily: font.sans,
  fontWeight: 500,
  fontSize: "0.95rem",
  cursor: "pointer",
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

/* ─── Helpers ───────────────────────────────────── */
function toTitleCase(str: string): string {
  if (!str) return str;
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatShift(raw: string): string {
  if (!raw) return raw;
  const match = raw.match(/^(\d{1,2})([A-Za-z]+)(\d{4})(?:_S(\d))?/);
  if (match) {
    const [, day, month, year, session] = match;
    const sessionPart = session ? ` · Session ${session}` : "";
    return `${day} ${month} ${year}${sessionPart}`;
  }
  return raw.replace(/_/g, " · ");
}

/* ─── Branch key helpers ─────────────────────────── */
function branchToKey(b: Branch): string {
  return `${b.campus}|${b.degree}|${b.specialization}`;
}

function keyToBranch(key: string): Branch | undefined {
  return BRANCHES.find((b) => branchToKey(b) === key);
}

/* ─── App ───────────────────────────────────────── */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/founders-note" element={<FoundersNote />} />
      <Route path="/r/:userId" element={<ReferralLanding />} />
    </Routes>
  );
}

type AppView = "loading" | "landing" | "shift-setup" | "preference-setup" | "results";

type ScoreRow = {
  id: string;
  candidate_name: string | null;
  application_number: string;
  session1_shift: string | null;
  session2_shift: string | null;
  center: string | null;
  session1_score: number | null;
  session2_score: number | null;
  final_score: number | null;
  created_at: string;
};

function scoreRowToData(row: ScoreRow): ExtractedBitsatData {
  return {
    candidateName: row.candidate_name,
    applicationNumber: row.application_number,
    session2Shift: row.session2_shift,
    center: row.center,
    session1Score: row.session1_score,
    session2Score: row.session2_score,
    finalScore: row.final_score,
    rawText: "",
  };
}

function Home() {
  const [data, setData] = useState<ExtractedBitsatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  // All scorecards linked to this user (most recent first)
  const [myScores, setMyScores] = useState<ScoreRow[]>([]);
  // id of the scorecard currently shown on the results page
  const [activeScoreId, setActiveScoreId] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<Branch[]>([]);
  // Whether the user has explicitly confirmed their preferences (seen the setup screen)
  const [prefConfirmed, setPrefConfirmed] = useState(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Derive shift confirmation directly from the active score row in myScores.
  // This is the single source of truth — never a separate boolean that can drift.
  const activeRow = myScores.find((r) => r.id === activeScoreId) ?? null;
  const shiftConfirmed = !!activeRow?.session1_shift;

  const view: AppView = loading
    ? "loading"
    : !user || !data
    ? "landing"
    : !shiftConfirmed
    ? "shift-setup"
    : !prefConfirmed
    ? "preference-setup"
    : "results";

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // onAuthStateChange always fires immediately with the current session state
    // (INITIAL_SESSION event), so we don't need a separate getUser() call.
    // Having both would race and call loadExistingScore twice for signed-in users.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadExistingScore(currentUser);
        } else {
          setLoading(false);
        }
      }
    );

    const channel = supabase
      .channel("app-scores-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scores" },
        async () => {
          const { data: authData } = await supabase.auth.getUser();
          const currentUser = authData.user;
          if (currentUser) await loadExistingScore(currentUser, true);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadExistingScore(currentUser: any, isRealtimeRefresh = false) {
    try {
      const { data: links, error: fetchError } = await supabase
        .from("score_users")
        .select("created_at, scores(*)")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Score load error:", fetchError);
        setLoading(false);
        return;
      }

      const rows: ScoreRow[] = (links ?? [])
        .map((l: any) => l.scores)
        .filter((s: any): s is ScoreRow => !!s);

      setMyScores(rows);

      if (rows.length > 0) {
        const latest = rows[0];
        setActiveScoreId(latest.id);
        setData(scoreRowToData(latest));
        // shiftConfirmed is derived from activeRow.session1_shift — no setter needed.
        // Only restore prefConfirmed on non-realtime loads (initial auth / explicit upload).
        if (!isRealtimeRefresh) {
          const loaded = await loadPreferences(currentUser.id);
          if (loaded && loaded.length > 0) {
            setPrefConfirmed(true);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function selectScore(row: ScoreRow) {
    setActiveScoreId(row.id);
    setData(scoreRowToData(row));
    // shiftConfirmed derives from myScores + activeScoreId — no setter needed
    setStatsRefreshKey((k) => k + 1);
  }

  async function loadPreferences(userId: string): Promise<Branch[]> {
    try {
      const { data: row } = await supabase
        .from("preferences")
        .select("branch_keys")
        .eq("user_id", userId)
        .maybeSingle();

      if (row?.branch_keys) {
        const branches = (row.branch_keys as string[])
          .map(keyToBranch)
          .filter((b): b is Branch => b !== undefined);
        setPreferences(branches);
        return branches;
      }
      return [];
    } finally {
    }
  }

  async function savePreferences(prefs: Branch[]) {
    if (!user) return;
    const keys = prefs.map(branchToKey);
    await supabase
      .from("preferences")
      .upsert({ user_id: user.id, branch_keys: keys }, { onConflict: "user_id" });
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  async function signOut() {
    await supabase.auth.signOut();
    setData(null);
    setPreferences([]);
    setPrefConfirmed(false);
    setMyScores([]);
    setActiveScoreId(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const parsed = await extractBitsatData(file);
      if (!parsed.applicationNumber) throw new Error("Could not detect application number.");

      const { data: existing, error: fetchError } = await supabase
        .from("scores").select("*")
        .eq("application_number", parsed.applicationNumber).maybeSingle();
      if (fetchError) throw fetchError;

      let scoreRow: ScoreRow;

      if (existing) {
        // Use the authoritative DB row, not the freshly-parsed PDF, so data is never stale
        scoreRow = existing as ScoreRow;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("scores")
          .insert({
            application_number: parsed.applicationNumber,
            candidate_name: parsed.candidateName,
            session2_shift: parsed.session2Shift,
            center: parsed.center,
            session1_score: parsed.session1Score,
            session2_score: parsed.session2Score,
            final_score: parsed.finalScore,
            // session1_shift is null until the user picks it in ShiftSetup
          })
          .select("*")
          .single();
        if (insertError) throw insertError;
        scoreRow = inserted as ScoreRow;
      }

      // Link this scorecard to the signed-in account (no-op if already linked)
      const { error: linkError } = await supabase
        .from("score_users")
        .upsert({ user_id: user.id, score_id: scoreRow.id }, { onConflict: "user_id,score_id" });
      if (linkError) throw linkError;

      // Refresh the list of linked scorecards for this user
      await loadExistingScore(user);
      selectScore(scoreRow);

      if (existing) {
        const loaded = await loadPreferences(user.id);
        if (loaded && loaded.length > 0) setPrefConfirmed(true);
        // shiftConfirmed derives from myScores row — no setter needed
      } else {
        // New scorecard → show preference setup after shift setup completes
        setPrefConfirmed(false);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown parsing error.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSession1Shift(scoreId: string, session1Shift: string) {
    const { error } = await supabase
      .from("scores")
      .update({ session1_shift: session1Shift })
      .eq("id", scoreId);
    if (error) console.error("Failed to save session1_shift:", error);
    else {
      // Update local state so stats reflect the new shift immediately
      setData((d) => d ? { ...d } : d);
      setMyScores((rows) =>
        rows.map((r) => r.id === scoreId ? { ...r, session1_shift: session1Shift } : r)
      );
    }
  }

  /* ── Initial loading ──────────────────────────── */
  if (view === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.cream,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.sans,
        color: C.inkFaint,
        fontSize: "0.9rem",
      }}>
        <div style={{ textAlign: "center" }}>
          <img src="/logo/Bitseat logo.png" alt="Bitseat" className="loading-logo" />
          Loading…
        </div>
      </div>
    );
  }

  /* ── Shift setup screen ───────────────────────── */
  if (view === "shift-setup" && data) {
    return (
      <ShiftSetup
        session2Shift={data.session2Shift}
        candidateName={data.candidateName ? toTitleCase(data.candidateName) : ""}
        onDone={async (session1Shift) => {
          if (activeScoreId) await saveSession1Shift(activeScoreId, session1Shift);
          // shiftConfirmed derives from myScores — updated by saveSession1Shift
        }}
      />
    );
  }

  /* ── Preference setup screen ──────────────────── */
  if (view === "preference-setup" && data) {
    return (
      <PreferenceSetup
        finalScore={data.finalScore}
        candidateName={data.candidateName ?? ""}
        initialPreferences={preferences}
        onDone={async (prefs) => {
          setPreferences(prefs);
          await savePreferences(prefs);
          setPrefConfirmed(true);
        }}
        onSkip={() => setPrefConfirmed(true)}
      />
    );
  }

  /* ── Results page ─────────────────────────────── */
  if (view === "results" && data) {
    return (
      <div style={{ minHeight: "100vh", background: C.cream, fontFamily: font.sans }}>
        <nav className="site-nav">
          <div className="site-nav__inner">
            <Link to="/" style={{ display: "inline-block", lineHeight: 0 }}>
              <img src="/logo/Bitseat logo.png" alt="Bitseat" style={{ height: "32px" }} />
            </Link>
            <div className="site-nav__actions">
              <ResultsNavMenu
                onEditPrefs={() => setPrefConfirmed(false)}
                onSignOut={signOut}
                handleFileChange={handleFileChange}
                scores={myScores}
                activeScoreId={activeScoreId}
                onSelect={selectScore}
              />
            </div>
          </div>
        </nav>

        <div className="results-content">

          <StatsSection
            finalScore={data.finalScore}
            session1Score={data.session1Score}
            session2Score={data.session2Score}
            session1Shift={myScores.find((r) => r.id === activeScoreId)?.session1_shift ?? null}
            session2Shift={data.session2Shift}
            center={data.center}
            preferences={preferences}
            userId={user?.id ?? null}
            refreshKey={statsRefreshKey}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "4rem" }}>
            <ScoreCard label="Session 1" value={data.session1Score} />
            <ScoreCard label="Session 2" value={data.session2Score} />
            <ScoreCard label="Final Score" value={data.finalScore} highlight />
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "3rem", marginBottom: "3rem" }}>
            <p style={{ ...eyebrow, marginBottom: "0.75rem" }}>Branch preferences</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <h2 style={{ fontFamily: font.serif, fontSize: "1.7rem", color: C.ink, fontWeight: 400, margin: 0 }}>
                {preferences.length > 0
                  ? `${preferences.length} branch${preferences.length === 1 ? "" : "es"} saved`
                  : "No preferences saved yet"}
              </h2>
            </div>
          </div>

          {/* ── Candidate metadata — very end ─────────── */}
          {(data.candidateName || data.session2Shift || data.center) && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "2rem", display: "flex", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
              {data.candidateName && (
                <p style={{ fontFamily: font.serif, fontSize: "1rem", color: C.inkFaint, fontWeight: 400, margin: 0 }}>
                  {toTitleCase(data.candidateName)}
                </p>
              )}
              <p style={{ color: C.inkFaint, fontSize: "0.82rem", margin: 0, display: "flex", alignItems: "center", gap: "0.6rem" }}>
                {data.session2Shift && <span>{formatShift(data.session2Shift)}</span>}
                {data.center && <span style={{ paddingLeft: "0.6rem", borderLeft: `1px solid ${C.border}` }}>{data.center}</span>}
              </p>
            </div>
          )}

        </div>
      </div>
    );
  }

  /* ── Landing page ─────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: font.sans }}>

      <nav className="site-nav">
        <div className="site-nav__inner">
          <img src="/logo/Bitseat logo.png" alt="Bitseat" style={{ height: "32px" }} />
          {user
            ? <button onClick={signOut} style={ghostBtn}>Sign out</button>
            : <button onClick={signInWithGoogle} style={ghostBtn}>Sign in</button>
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
              <CtaCard onSignIn={signInWithGoogle} />
            ) : (
              <UploadZone user={user} loading={loading} error={error} onFileChange={handleFileChange} />
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
            <button onClick={signInWithGoogle} style={{ ...primaryBtn, background: C.white, color: C.rust, fontSize: "1rem", padding: "0.9rem 2rem", gap: "0.75rem" }}>
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

/* ─── CTA card ──────────────────────────────────── */
function CtaCard({ onSignIn }: { onSignIn: () => void }) {
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

/* ─── Upload zone ───────────────────────────────── */
function UploadZone({ user, loading, error, onFileChange }: { user: any; loading: boolean; error: string; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
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

/* ─── Results nav overflow menu ─────────────────── */
function ResultsNavMenu({
  onEditPrefs,
  onSignOut,
  handleFileChange,
  scores,
  activeScoreId,
  onSelect,
}: {
  onEditPrefs: () => void;
  onSignOut: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scores: ScoreRow[];
  activeScoreId: string | null;
  onSelect: (row: ScoreRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.65rem",
    width: "100%",
    textAlign: "left",
    padding: "0.65rem 0.9rem",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: font.sans,
    fontSize: "0.88rem",
    color: C.ink,
    fontWeight: 500,
  };

  const divider: React.CSSProperties = {
    height: "1px",
    background: C.border,
    margin: "0.3rem 0",
  };

  return (
    <div ref={ref} style={{ position: "relative" as const }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        style={{ ...ghostBtn, padding: "0.75rem 0.9rem" }}
      >
        {/* Hamburger icon */}
        <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="1" y1="2" x2="15" y2="2"/>
          <line x1="1" y1="7" x2="15" y2="7"/>
          <line x1="1" y1="12" x2="15" y2="12"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute" as const,
          top: "calc(100% + 0.5rem)",
          right: 0,
          width: "min(22rem, 90vw)",
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(28,22,18,0.1)",
          padding: "0.5rem",
          zIndex: 50,
        }}>

          {/* Upload new PDF */}
          <label style={{ ...menuItemStyle, cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload new PDF
            <input ref={fileRef} type="file" accept=".pdf" onChange={(e) => { handleFileChange(e); setOpen(false); }} style={{ display: "none" }} />
          </label>

          {/* Edit preferences */}
          <button style={menuItemStyle} onClick={() => { onEditPrefs(); setOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit preferences
          </button>

          <div style={divider} />

          {/* Founders note */}
          <Link
            to="/founders-note"
            style={{ ...menuItemStyle, textDecoration: "none" }}
            onClick={() => setOpen(false)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.inkMid} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
            Note from the founders
          </Link>

          <div style={divider} />

          {/* Scorecard switcher (only if multiple) */}
          {scores.length > 1 && (
            <>
              <p style={{ fontFamily: font.sans, fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: C.inkFaint, margin: "0.4rem 0.9rem 0.3rem" }}>
                Your scorecards
              </p>
              <div style={{ maxHeight: "14rem", overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: "0.25rem" }}>
                {scores.map((row) => {
                  const isActive = row.id === activeScoreId;
                  return (
                    <button
                      key={row.id}
                      onClick={() => { onSelect(row); setOpen(false); }}
                      style={{
                        ...menuItemStyle,
                        justifyContent: "space-between",
                        background: isActive ? C.rustLight : "transparent",
                        border: isActive ? `1px solid ${C.rust}` : "1px solid transparent",
                      }}
                    >
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontWeight: 600, color: C.ink, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                          {row.candidate_name ? toTitleCase(row.candidate_name) : `App ${row.application_number}`}
                        </span>
                        <span style={{ display: "block", color: C.inkFaint, fontSize: "0.72rem", marginTop: "0.1rem" }}>
                          {row.session2_shift ? formatShift(row.session2_shift) : ""}
                        </span>
                      </span>
                      <span style={{ fontFamily: font.serif, fontSize: "1.1rem", color: C.rust, flexShrink: 0 }}>
                        {row.final_score ?? "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={divider} />
            </>
          )}

          {/* Sign out */}
          <button style={{ ...menuItemStyle, color: "#991b1b" }} onClick={() => { onSignOut(); setOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Score card ────────────────────────────────── */
function ScoreCard({ label, value, highlight = false }: { label: string; value: number | null; highlight?: boolean }) {
  return (
    <div style={{ background: highlight ? C.rust : C.white, color: highlight ? C.white : C.ink, borderRadius: "14px", padding: "2rem 1.75rem", border: highlight ? "none" : `1px solid ${C.border}`, textAlign: "left" }}>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, opacity: 0.65 }}>{label}</p>
      <p style={{ margin: 0, fontFamily: font.serif, fontSize: "3.6rem", fontWeight: 400, lineHeight: 1 }}>{value ?? "—"}</p>
    </div>
  );
}

/* ─── Trust card ────────────────────────────────── */
function TrustCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
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

/* ─── Analytics card ────────────────────────────── */
function AnalyticsCard({ title, subtitle, illustration }: { title: string; subtitle: string; illustration: React.ReactNode }) {
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

const LivePercentileIllustration = () => (
  <svg width="180" height="64" viewBox="0 0 180 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 54 Q30 54 50 40 Q70 26 90 14 Q110 26 130 40 Q150 54 170 54" stroke={C.rust} strokeWidth="1.8" fill="none" opacity="0.35" />
    <path d="M10 54 Q30 54 50 40 Q70 26 90 14 Q110 26 130 40 Q150 54 170 54 Z" fill={C.rust} opacity="0.08" />
    <line x1="124" y1="12" x2="124" y2="56" stroke={C.rust} strokeWidth="1.5" opacity="0.7" />
    <circle cx="124" cy="37" r="3.5" fill={C.rust} opacity="0.9" />
    <text x="128" y="13" fontSize="7.5" fill={C.rust} fontFamily="Inter, sans-serif" fontWeight="600" opacity="0.9">you</text>
    <text x="10" y="62" fontSize="7" fill={C.inkFaint} fontFamily="Inter, sans-serif">0</text>
    <text x="80" y="62" fontSize="7" fill={C.inkFaint} fontFamily="Inter, sans-serif">50th</text>
    <text x="158" y="62" fontSize="7" fill={C.inkFaint} fontFamily="Inter, sans-serif">100</text>
  </svg>
);

const ScoreDistributionIllustration = () => {
  const bars = [4, 9, 18, 32, 44, 38, 28, 16, 8, 4];
  const max = 44;
  const barW = 13;
  const gap = 4;
  const chartH = 44;
  const startX = 14;
  return (
    <svg width="180" height="64" viewBox="0 0 180 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {bars.map((v, i) => {
        const bh = (v / max) * chartH;
        const x = startX + i * (barW + gap);
        const isYou = i === 7;
        return (
          <g key={i}>
            <rect x={x} y={52 - bh} width={barW} height={bh} rx="2" fill={C.rust} opacity={isYou ? 0.85 : 0.22} />
            {isYou && <text x={x + barW / 2} y={48 - bh} textAnchor="middle" fontSize="7" fill={C.rust} fontFamily="Inter, sans-serif" fontWeight="600">you</text>}
          </g>
        );
      })}
      <line x1="10" y1="53" x2="170" y2="53" stroke={C.border} strokeWidth="1" />
    </svg>
  );
};