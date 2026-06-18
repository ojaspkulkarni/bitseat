import type { Branch } from "../data/cutoffs";
import { BRANCHES } from "../data/cutoffs";
import type { ExtractedBitsatData } from "../lib/extractFinalScore";
import type { ScoreRow } from "./types";

export function toTitleCase(str: string): string {
  if (!str) return str;
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatShift(raw: string): string {
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
export function branchToKey(b: Branch): string {
  return `${b.campus}|${b.degree}|${b.specialization}`;
}

export function keyToBranch(key: string): Branch | undefined {
  return BRANCHES.find((b) => branchToKey(b) === key);
}

export function scoreRowToData(row: ScoreRow): ExtractedBitsatData {
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
