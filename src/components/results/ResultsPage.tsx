import { Link } from "react-router-dom";
import { C, font, eyebrow } from "../../styles/tokens";
import type { Branch } from "../../data/cutoffs";
import type { ExtractedBitsatData } from "../../lib/extractFinalScore";
import type { ScoreRow } from "../../app/types";
import { toTitleCase, formatShift } from "../../app/home.helpers";
import StatsSection from "../stats/StatsSection";
import { ResultsNavMenu } from "./ResultsNavMenu";
import { ScoreCard } from "./ScoreCard";

interface Props {
  data: ExtractedBitsatData;
  myScores: ScoreRow[];
  activeScoreId: string | null;
  preferences: Branch[];
  userId: string | null;
  statsRefreshKey: number;
  onEditPrefs: () => void;
  onSignOut: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectScore: (row: ScoreRow) => void;
}

export function ResultsPage({
  data,
  myScores,
  activeScoreId,
  preferences,
  userId,
  statsRefreshKey,
  onEditPrefs,
  onSignOut,
  handleFileChange,
  onSelectScore,
}: Props) {
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: font.sans }}>
      <nav className="site-nav">
        <div className="site-nav__inner">
          <Link to="/" style={{ display: "inline-block", lineHeight: 0 }}>
            <img src="/logo/Bitseat logo.png" alt="Bitseat" style={{ height: "32px" }} />
          </Link>
          <div className="site-nav__actions">
            <ResultsNavMenu
              onEditPrefs={onEditPrefs}
              onSignOut={onSignOut}
              handleFileChange={handleFileChange}
              scores={myScores}
              activeScoreId={activeScoreId}
              onSelect={onSelectScore}
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
          userId={userId}
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
