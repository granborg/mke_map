import type { FeatureCollection, MultiPolygon } from "geojson";
import type { Region } from "react-native-maps";
import type { Tier } from "../tiers";

export type CityId = "milwaukee" | "chicago";

export interface CityConfig {
  id: CityId;
  name: string;
  /** Initial map region framing the whole city. */
  region: Region;
  collection: FeatureCollection<MultiPolygon, { name: string }>;
  /** Bundled tier assignment — the offline fallback where live data exists. */
  tierFor: (name: string) => Tier;
  /** Recomputes tiers from the city's open-data API, when it has one. */
  fetchLiveTiers?: () => Promise<Map<string, Tier>>;
}
