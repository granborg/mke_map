/** 0 = non-residential, 1 (lowest) … 5 (highest) */
export type Tier = 0 | 1 | 2 | 3 | 4 | 5;

export const TIER_LABELS: Record<Tier, string> = {
  0: "Park / non-residential",
  1: "Lowest — under ~25 per 1,000",
  2: "Lower — ~25–45 per 1,000",
  3: "Moderate — ~45–65 per 1,000",
  4: "High — ~65–100 per 1,000",
  5: "Highest — over ~100 per 1,000",
};

export const TIER_COLORS: Record<Tier, string> = {
  0: "#b4b2a9",
  1: "#fee5d9",
  2: "#fcae91",
  3: "#fb6a4a",
  4: "#de2d26",
  5: "#a50f15",
};

/** Reported Part I offenses per 1,000 residents/year → tier band. */
export function tierForRate(ratePer1000: number): Tier {
  if (ratePer1000 < 25) return 1;
  if (ratePer1000 < 45) return 2;
  if (ratePer1000 < 65) return 3;
  if (ratePer1000 < 100) return 4;
  return 5;
}
