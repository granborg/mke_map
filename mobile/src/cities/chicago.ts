import type { FeatureCollection, MultiPolygon } from "geojson";
import raw from "../../assets/data/chicago.json";
import { fetchChicagoTiers } from "../liveTiers";
import type { Tier } from "../tiers";
import stats from "./chicago-stats.json";
import type { CityConfig } from "./types";

// Tiers are computed from real data (Part I offenses per 1,000 residents/yr;
// see scripts/generate-chicago-data.js) and refreshed at runtime from the
// Chicago Data Portal via fetchLiveTiers. chicago-stats.json is the
// build-time snapshot used offline.

const STATS = stats as Record<string, { area: number; population: number; tier: Tier }>;

export const CHICAGO: CityConfig = {
  id: "chicago",
  name: "Chicago",
  region: {
    latitude: 41.83,
    longitude: -87.73,
    latitudeDelta: 0.46,
    longitudeDelta: 0.36,
  },
  collection: raw as FeatureCollection<MultiPolygon, { name: string }>,
  tierFor: (name) => STATS[name]?.tier ?? 2,
  fetchLiveTiers: fetchChicagoTiers,
};
