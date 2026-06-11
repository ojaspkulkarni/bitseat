import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://llhkofrobyfkmsjvbutg.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsaGtvZnJvYnlma21zanZidXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMTAxMDIsImV4cCI6MjA5NjY4NjEwMn0.rdARAbffPCCPF62ZHJfDjsEPZ_b8J0624bkd4NXM-mY";

export const supabase =
  createClient(
    supabaseUrl,
    supabaseAnonKey
  );