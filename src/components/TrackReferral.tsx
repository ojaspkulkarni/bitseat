import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://bitseat.in";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");

  // Always redirect to app — even if ref is missing or invalid
  const redirectUrl = new URL(APP_URL);

  if (!ref) {
    return Response.redirect(redirectUrl.toString(), 302);
  }

  try {
    // Use service role so we can upsert without RLS restrictions
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upsert: create row if first click, increment otherwise
    const { error } = await supabase.rpc("increment_share_clicks", {
      p_user_id: ref,
    });

    if (error) {
      console.error("increment_share_clicks error:", error);
    }
  } catch (e) {
    console.error("track-referral error:", e);
  }

  // Redirect to the app — no ref param so it doesn't loop
  return Response.redirect(redirectUrl.toString(), 302);
});