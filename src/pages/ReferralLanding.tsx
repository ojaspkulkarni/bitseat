import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const C = {
  cream: "#faf9f5",
  inkFaint: "#9A8E85",
};

const font = {
  sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
};

/* ─── Referral landing ───────────────────────────── */
// Visiting /r/:userId credits the referrer with one "share click",
// then redirects to the homepage. The redirect happens immediately;
// the increment is fired in the background.
export default function ReferralLanding() {
  const { userId } = useParams<{ userId: string }>();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!userId) {
      setDone(true);
      return;
    }
    (async () => {
      try {
        await supabase.rpc("increment_share_clicks", { p_user_id: userId });
      } catch {
        // ignore — still redirect
      } finally {
        setDone(true);
      }
    })();
  }, [userId]);

  if (done) return <Navigate to="/" replace />;

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
      Redirecting…
    </div>
  );
}