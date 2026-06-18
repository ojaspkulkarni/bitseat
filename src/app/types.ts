export type AppView = "loading" | "landing" | "shift-setup" | "preference-setup" | "results";

export type ScoreRow = {
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
