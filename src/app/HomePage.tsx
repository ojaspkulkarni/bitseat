import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { extractBitsatData } from "../lib/extractFinalScore";
import type { ExtractedBitsatData } from "../lib/extractFinalScore";
import { supabase } from "../lib/supabase";
import PreferenceSetup from "../components/preferences/PreferenceSetup";
import ShiftSetup from "../components/shift/ShiftSetup";
import { LandingPage } from "../components/landing/LandingPage";
import { ResultsPage } from "../components/results/ResultsPage";
import type { Branch } from "../data/cutoffs";
import { C, font } from "../styles/tokens";
import type { AppView, ScoreRow } from "./types";
import { scoreRowToData, branchToKey, keyToBranch, toTitleCase } from "./home.helpers";

export function HomePage() {
  const [data, setData] = useState<ExtractedBitsatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // All scorecards linked to this user (most recent first)
  const [myScores, setMyScores] = useState<ScoreRow[]>([]);
  // id of the scorecard currently shown on the results page
  const [activeScoreId, setActiveScoreId] = useState<string | null>(null);
  // Mirrors activeScoreId for use inside the realtime callback below, which
  // is wired up once on mount and would otherwise see a stale (always-null)
  // value of activeScoreId via closure.
  const activeScoreIdRef = useRef<string | null>(null);
  useEffect(() => { activeScoreIdRef.current = activeScoreId; }, [activeScoreId]);

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
    //
    // IMPORTANT: Supabase also re-fires this listener on events that aren't a
    // real sign-in — e.g. TOKEN_REFRESHED (hourly) and a re-sent SIGNED_IN /
    // INITIAL_SESSION whenever the browser tab regains focus, even though the
    // user never signed out. If we treated every one of those as a fresh load,
    // we'd snap the user back to their latest scorecard and recompute
    // prefConfirmed from scratch — kicking them out of whatever screen
    // (edit-preferences, a different scorecard) they were looking at, just
    // because they alt-tabbed. So we only do a full reload for events that
    // represent an actual identity change.
    let lastUserId: string | null = null;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;

        if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          // Session housekeeping only — not a real sign-in, don't reload.
          return;
        }

        if (currentUser && currentUser.id === lastUserId) {
          // Same user as before (e.g. duplicate SIGNED_IN/INITIAL_SESSION on
          // tab refocus) — nothing actually changed, skip the reload.
          return;
        }
        lastUserId = currentUser?.id ?? null;

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
    // loadExistingScore is intentionally omitted: it's redeclared every
    // render, so listing it here would tear down and resubscribe both the
    // auth listener and the realtime channel on every render instead of
    // just once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadExistingScore(currentUser: User, isRealtimeRefresh = false) {
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
        .map((l: { scores: ScoreRow[] | ScoreRow | null }) =>
          Array.isArray(l.scores) ? l.scores[0] ?? null : l.scores
        )
        .filter((s): s is ScoreRow => !!s);

      setMyScores(rows);

      if (rows.length > 0) {
        // On a realtime refresh, keep whatever scorecard the user is already
        // looking at — don't snap them back to "latest" just because some
        // unrelated insert happened elsewhere on the site. (activeScoreIdRef
        // is used here, not the `activeScoreId` state value, because this
        // function is invoked from a realtime callback wired up once on
        // mount — reading the state variable directly would be stale.)
        const currentId = activeScoreIdRef.current;
        const stillExists = isRealtimeRefresh && currentId && rows.some((r) => r.id === currentId);
        const nextActive = stillExists ? rows.find((r) => r.id === currentId)! : rows[0];

        setActiveScoreId(nextActive.id);
        setData(scoreRowToData(nextActive));

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
    if (!user) {
      setError("Please sign in before uploading your scorecard.");
      return;
    }
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

  // Ask → write to Supabase → verify it's actually there → only then stop
  // asking. Returns true only if Supabase confirms the row now has the
  // value (handles RLS silently blocking the write: 0 rows updated, no
  // thrown error — `.update()` alone won't catch that, `.select()` will).
  async function saveSession1Shift(scoreId: string, session1Shift: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("scores")
      .update({ session1_shift: session1Shift })
      .eq("id", scoreId)
      .select("id, session1_shift");

    if (error || !data || data.length === 0) {
      console.error(
        "session1_shift was not saved to Supabase:",
        error ?? "update affected 0 rows — check the RLS UPDATE policy on `scores`"
      );
      return false;
    }

    setMyScores((rows) =>
      rows.map((r) => (r.id === scoreId ? { ...r, session1_shift: data[0].session1_shift } : r))
    );
    return true;
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
          if (!activeScoreId) return false;
          return await saveSession1Shift(activeScoreId, session1Shift);
          // shiftConfirmed derives from myScores — updated by saveSession1Shift,
          // but only once Supabase has actually confirmed the write.
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
      <ResultsPage
        data={data}
        myScores={myScores}
        activeScoreId={activeScoreId}
        preferences={preferences}
        userId={user?.id ?? null}
        statsRefreshKey={statsRefreshKey}
        onEditPrefs={() => setPrefConfirmed(false)}
        onSignOut={signOut}
        handleFileChange={handleFileChange}
        onSelectScore={selectScore}
      />
    );
  }

  /* ── Landing page ─────────────────────────────── */
  return (
    <LandingPage
      user={user}
      loading={loading}
      error={error}
      onFileChange={handleFileChange}
      onSignIn={signInWithGoogle}
      onSignOut={signOut}
    />
  );
}
