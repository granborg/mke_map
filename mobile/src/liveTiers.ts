import AsyncStorage from "@react-native-async-storage/async-storage";
import stats from "./cities/chicago-stats.json";
import { Tier, tierForRate } from "./tiers";

// Recomputes Chicago's tiers on-device from the Data Portal's live crime
// feed (Part I offenses for the last complete calendar year, per community
// area) and the bundled ACS population estimates. Results are cached for a
// week; any failure falls back to the tiers baked in at build time.

const CACHE_KEY = "chicagoLiveTiers.v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Homicide, criminal sexual assault, robbery, aggravated assault/battery,
// burglary, theft, motor vehicle theft, arson.
const PART_I_FBI_CODES = ["01A", "02", "03", "04A", "04B", "05", "06", "07", "09"];

const STATS = stats as Record<string, { area: number; population: number; tier: number }>;

export async function fetchChicagoTiers(): Promise<Map<string, Tier>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw) as { at: number; tiers: Record<string, Tier> };
      if (Date.now() - cached.at < CACHE_TTL_MS) {
        return new Map(Object.entries(cached.tiers));
      }
    }
  } catch {}

  const year = new Date().getFullYear() - 1;
  const where = `year=${year} AND fbi_code in(${PART_I_FBI_CODES.map((c) => `'${c}'`).join(",")})`;
  // Built by hand: React Native's URLSearchParams support is incomplete.
  const url =
    "https://data.cityofchicago.org/resource/ijzp-q8t2.json" +
    `?$select=${encodeURIComponent("community_area,count(*) as n")}` +
    `&$where=${encodeURIComponent(where)}` +
    "&$group=community_area&$limit=100";

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Chicago data portal: ${res.status}`);
  const rows = (await res.json()) as { community_area: string; n: string }[];
  const countByArea = new Map(rows.map((r) => [Number(r.community_area), Number(r.n)]));

  const tiers = new Map<string, Tier>();
  for (const [name, s] of Object.entries(STATS)) {
    const count = countByArea.get(s.area) ?? 0;
    tiers.set(name, tierForRate((count / s.population) * 1000));
  }

  AsyncStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ at: Date.now(), tiers: Object.fromEntries(tiers) })
  ).catch(() => {});
  return tiers;
}
