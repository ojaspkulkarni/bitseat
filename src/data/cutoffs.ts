export type Campus = "Pilani" | "Goa" | "Hyderabad";
export type Degree = "B.E." | "B. Pharm" | "M.Sc.";

export interface Branch {
  campus: Campus;
  degree: Degree;
  specialization: string;
  baseline2025: number;
  predicted2026: number;
  /** Estimated rank (# of BITSAT candidates with score ≥ this cutoff)
   *  derived from a skew-normal fit to 2022 rank-score data and a linear
   *  regression mapping 2025 Pilani cutoffs → equivalent 2022 scores.
   *  Goa/Hyderabad ranks are interpolated via the same regression. */
  cutoffRank2025: number;
}

// ── Rank lookup table ──────────────────────────────────────────────────────
// Index = integer score_2025 (0–390), value = estimated rank in full population.
// Generated from: skew-normal fit to 2022 BITSAT rank data (N≈232 680),
// then linear mapping score_2022 = 1.45353 × score_2025 − 122.635
// (fitted on 14 paired Pilani 2022/2025 cutoffs).
export const RANK_TABLE: number[] = [
  151023, 150523, 150021, 149517, 149012, 148504, 147994, 147483, 146969, 146454, 145936, 145417, 144896,
  144373, 143848, 143321, 142792, 142262, 141729, 141194, 140658, 140120, 139580, 139038, 138494, 137948,
  137400, 136850, 136299, 135746, 135190, 134633, 134074, 133513, 132951, 132386, 131820, 131252, 130682,
  130110, 129536, 128961, 128383, 127804, 127223, 126641, 126056, 125470, 124882, 124292, 123700, 123107,
  122511, 121914, 121316, 120715, 120113, 119509, 118903, 118296, 117687, 117076, 116464, 115849, 115233,
  114616, 113997, 113376, 112753, 112129, 111503, 110876, 110247, 109616, 108984, 108350, 107715, 107078,
  106440, 105800, 105158, 104515, 103871, 103225, 102577, 101928, 101278, 100626, 99973, 99319, 98663,
  98005, 97347, 96687, 96025, 95363, 94699, 94034, 93368, 92700, 92031, 91361, 90690, 90018,
  89345, 88671, 87995, 87319, 86642, 85963, 85284, 84604, 83923, 83241, 82558, 81875, 81191,
  80506, 79820, 79134, 78447, 77760, 77072, 76384, 75695, 75006, 74316, 73626, 72936, 72246,
  71555, 70865, 70174, 69483, 68793, 68102, 67412, 66722, 66032, 65342, 64653, 63964, 63276,
  62588, 61901, 61215, 60529, 59844, 59160, 58477, 57795, 57114, 56435, 55756, 55079, 54404,
  53730, 53057, 52386, 51717, 51049, 50384, 49720, 49058, 48399, 47742, 47087, 46434, 45784,
  45136, 44491, 43849, 43209, 42573, 41939, 41308, 40681, 40057, 39436, 38818, 38204, 37594,
  36987, 36384, 35784, 35189, 34598, 34010, 33427, 32848, 32274, 31703, 31138, 30576, 30020,
  29468, 28921, 28378, 27841, 27308, 26781, 26259, 25742, 25230, 24723, 24222, 23726, 23235,
  22750, 22271, 21797, 21328, 20866, 20409, 19958, 19512, 19073, 18639, 18211, 17790, 17374,
  16964, 16559, 16161, 15769, 15383, 15003, 14629, 14261, 13899, 13543, 13193, 12848, 12510,
  12178, 11852, 11532, 11217, 10909, 10606, 10309, 10018, 9733, 9454, 9180, 8912, 8649,
  8392, 8141, 7895, 7654, 7419, 7190, 6965, 6746, 6532, 6323, 6119, 5920, 5726,
  5536, 5352, 5172, 4997, 4827, 4661, 4499, 4342, 4189, 4041, 3896, 3756, 3620,
  3487, 3359, 3234, 3113, 2996, 2882, 2772, 2665, 2562, 2462, 2365, 2271, 2181,
  2093, 2008, 1926, 1847, 1771, 1697, 1626, 1557, 1491, 1427, 1366, 1306, 1249,
  1194, 1141, 1090, 1041, 994, 949, 906, 864, 824, 785, 749, 713, 679,
  647, 616, 586, 557, 530, 504, 479, 455, 432, 410, 389, 369, 350,
  332, 315, 298, 282, 267, 253, 239, 226, 214, 202, 191, 181, 171,
  161, 152, 143, 135, 128, 120, 113, 107, 100, 95, 89, 84, 79,
  74, 69, 65, 61, 58, 54, 51, 47, 44, 42, 39, 37, 34,
  32, 30, 28, 26, 24, 23, 21, 20, 19, 17, 16, 15, 14,
  13, 12, 11, 11, 10, 9, 8, 8, 7, 7, 6, 6, 5,
  5,
];

export const TOTAL_CANDIDATES = 232680;

/** Estimated rank: how many BITSAT candidates scored ≥ score2025. */
export function estimatedRank(score2025: number): number {
  const s = Math.max(0, Math.min(390, Math.round(score2025)));
  return RANK_TABLE[s];
}

/** Estimated percentile across the full BITSAT population (0–100).
 *  Answers: "what fraction of all candidates scored strictly below me?" */
export function estimatedPercentile(score2025: number): number {
  const rank = estimatedRank(score2025);
  return +Math.min(100, Math.max(0, (1 - rank / TOTAL_CANDIDATES) * 100)).toFixed(1);
}

export const BRANCHES: Branch[] = [
  // ── Pilani B.E. ──────────────────────────────────────────────────────────
  { campus: "Pilani", degree: "B.E.", specialization: "Computer Science",                   baseline2025: 304, predicted2026: 304, cutoffRank2025:   949 },
  { campus: "Pilani", degree: "B.E.", specialization: "Mathematics and Computing",           baseline2025: 295, predicted2026: 295, cutoffRank2025:  1427 },
  { campus: "Pilani", degree: "B.E.", specialization: "Electronics & Communication",         baseline2025: 285, predicted2026: 285, cutoffRank2025:  2181 },
  { campus: "Pilani", degree: "B.E.", specialization: "Electrical & Electronics",            baseline2025: 260, predicted2026: 260, cutoffRank2025:  5536 },
  { campus: "Pilani", degree: "B.E.", specialization: "Electronics & Instrumentation",       baseline2025: 250, predicted2026: 250, cutoffRank2025:  7654 },
  { campus: "Pilani", degree: "B.E.", specialization: "Mechanical",                          baseline2025: 235, predicted2026: 235, cutoffRank2025: 11852 },
  { campus: "Pilani", degree: "B.E.", specialization: "Manufacturing",                       baseline2025: 211, predicted2026: 211, cutoffRank2025: 21328 },
  { campus: "Pilani", degree: "B.E.", specialization: "Chemical",                            baseline2025: 210, predicted2026: 210, cutoffRank2025: 21796 },
  { campus: "Pilani", degree: "B.E.", specialization: "Civil",                               baseline2025: 206, predicted2026: 206, cutoffRank2025: 23725 },
  { campus: "Pilani", degree: "B.E.", specialization: "Environmental and Sustainability",    baseline2025: 203, predicted2026: 203, cutoffRank2025: 25229 },

  // ── Pilani B. Pharm ──────────────────────────────────────────────────────
  { campus: "Pilani", degree: "B. Pharm", specialization: "Pharmaceutical",                 baseline2025: 168, predicted2026: 168, cutoffRank2025: 45783 },

  // ── Pilani M.Sc. ─────────────────────────────────────────────────────────
  { campus: "Pilani", degree: "M.Sc.", specialization: "Economics",                         baseline2025: 251, predicted2026: 251, cutoffRank2025:  7419 },
  { campus: "Pilani", degree: "M.Sc.", specialization: "Semiconductor and Nanoscience",     baseline2025: 239, predicted2026: 239, cutoffRank2025: 10606 },
  { campus: "Pilani", degree: "M.Sc.", specialization: "Mathematics",                       baseline2025: 229, predicted2026: 229, cutoffRank2025: 13899 },
  { campus: "Pilani", degree: "M.Sc.", specialization: "Physics",                           baseline2025: 223, predicted2026: 223, cutoffRank2025: 16161 },
  { campus: "Pilani", degree: "M.Sc.", specialization: "Chemistry",                         baseline2025: 212, predicted2026: 212, cutoffRank2025: 20866 },
  { campus: "Pilani", degree: "M.Sc.", specialization: "Biological Sciences",               baseline2025: 208, predicted2026: 208, cutoffRank2025: 22750 },

  // ── Goa B.E. ─────────────────────────────────────────────────────────────
  { campus: "Goa", degree: "B.E.", specialization: "Computer Science",                      baseline2025: 274, predicted2026: 274, cutoffRank2025:  3359 },
  { campus: "Goa", degree: "B.E.", specialization: "Mathematics and Computing",             baseline2025: 268, predicted2026: 268, cutoffRank2025:  4189 },
  { campus: "Goa", degree: "B.E.", specialization: "Electronics and Computer",              baseline2025: 262, predicted2026: 262, cutoffRank2025:  5172 },
  { campus: "Goa", degree: "B.E.", specialization: "Electronics & Communication",           baseline2025: 255, predicted2026: 255, cutoffRank2025:  6531 },
  { campus: "Goa", degree: "B.E.", specialization: "Electrical & Electronics",              baseline2025: 243, predicted2026: 243, cutoffRank2025:  9454 },
  { campus: "Goa", degree: "B.E.", specialization: "Electronics & Instrumentation",         baseline2025: 234, predicted2026: 234, cutoffRank2025: 12178 },
  { campus: "Goa", degree: "B.E.", specialization: "Mechanical",                            baseline2025: 223, predicted2026: 223, cutoffRank2025: 16161 },
  { campus: "Goa", degree: "B.E.", specialization: "Chemical",                              baseline2025: 206, predicted2026: 206, cutoffRank2025: 23725 },
  { campus: "Goa", degree: "B.E.", specialization: "Environmental and Sustainability",      baseline2025: 189, predicted2026: 189, cutoffRank2025: 32848 },

  // ── Goa M.Sc. ────────────────────────────────────────────────────────────
  { campus: "Goa", degree: "M.Sc.", specialization: "Economics",                            baseline2025: 237, predicted2026: 237, cutoffRank2025: 11217 },
  { campus: "Goa", degree: "M.Sc.", specialization: "Semiconductor and Nanoscience",        baseline2025: 225, predicted2026: 225, cutoffRank2025: 15383 },
  { campus: "Goa", degree: "M.Sc.", specialization: "Mathematics",                          baseline2025: 216, predicted2026: 216, cutoffRank2025: 19073 },
  { campus: "Goa", degree: "M.Sc.", specialization: "Physics",                              baseline2025: 212, predicted2026: 212, cutoffRank2025: 20866 },
  { campus: "Goa", degree: "M.Sc.", specialization: "Chemistry",                            baseline2025: 205, predicted2026: 205, cutoffRank2025: 24221 },
  { campus: "Goa", degree: "M.Sc.", specialization: "Biological Sciences",                  baseline2025: 203, predicted2026: 203, cutoffRank2025: 25229 },

  // ── Hyderabad B.E. ───────────────────────────────────────────────────────
  { campus: "Hyderabad", degree: "B.E.", specialization: "Computer Science",                baseline2025: 270, predicted2026: 270, cutoffRank2025:  3896 },
  { campus: "Hyderabad", degree: "B.E.", specialization: "Mathematics and Computing",       baseline2025: 266, predicted2026: 266, cutoffRank2025:  4499 },
  { campus: "Hyderabad", degree: "B.E.", specialization: "Electronics & Communication",     baseline2025: 256, predicted2026: 256, cutoffRank2025:  6322 },
  { campus: "Hyderabad", degree: "B.E.", specialization: "Electrical & Electronics",        baseline2025: 239, predicted2026: 239, cutoffRank2025: 10606 },
  { campus: "Hyderabad", degree: "B.E.", specialization: "Electronics & Instrumentation",   baseline2025: 232, predicted2026: 232, cutoffRank2025: 12848 },
  { campus: "Hyderabad", degree: "B.E.", specialization: "Mechanical",                      baseline2025: 214, predicted2026: 214, cutoffRank2025: 19958 },
  { campus: "Hyderabad", degree: "B.E.", specialization: "Chemical",                        baseline2025: 205, predicted2026: 205, cutoffRank2025: 24221 },
  { campus: "Hyderabad", degree: "B.E.", specialization: "Civil",                           baseline2025: 203, predicted2026: 203, cutoffRank2025: 25229 },
  { campus: "Hyderabad", degree: "B.E.", specialization: "Environmental and Sustainability",baseline2025: 181, predicted2026: 181, cutoffRank2025: 37593 },

  // ── Hyderabad B. Pharm ───────────────────────────────────────────────────
  { campus: "Hyderabad", degree: "B. Pharm", specialization: "Pharmaceutical",              baseline2025: 151, predicted2026: 151, cutoffRank2025: 57114 },

  // ── Hyderabad M.Sc. ──────────────────────────────────────────────────────
  { campus: "Hyderabad", degree: "M.Sc.", specialization: "Economics",                      baseline2025: 231, predicted2026: 231, cutoffRank2025: 13192 },
  { campus: "Hyderabad", degree: "M.Sc.", specialization: "Semiconductor and Nanoscience",  baseline2025: 225, predicted2026: 225, cutoffRank2025: 15383 },
  { campus: "Hyderabad", degree: "M.Sc.", specialization: "Mathematics",                    baseline2025: 212, predicted2026: 212, cutoffRank2025: 20866 },
  { campus: "Hyderabad", degree: "M.Sc.", specialization: "Physics",                        baseline2025: 209, predicted2026: 209, cutoffRank2025: 22270 },
  { campus: "Hyderabad", degree: "M.Sc.", specialization: "Biological Sciences",            baseline2025: 203, predicted2026: 203, cutoffRank2025: 25229 },
  { campus: "Hyderabad", degree: "M.Sc.", specialization: "Chemistry",                      baseline2025: 203, predicted2026: 203, cutoffRank2025: 25229 },
];

export const CUTOFF_MAP = new Map<string, Branch>(
  BRANCHES.map((b) => [`${b.campus}|${b.degree}|${b.specialization}`, b])
);

export const CAMPUSES: Campus[] = ["Pilani", "Goa", "Hyderabad"];
export const DEGREES: Degree[]  = ["B.E.", "B. Pharm", "M.Sc."];