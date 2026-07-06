import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, MultiPolygon } from "geojson";
import type { LatLng } from "react-native-maps";
import type { CityConfig, CityId } from "./cities";
import type { Tier } from "./tiers";

export interface NeighborhoodPolygon {
  outer: LatLng[];
  holes: LatLng[][];
}

export interface Neighborhood {
  name: string;
  tier: Tier;
  feature: Feature<MultiPolygon>;
  polygons: NeighborhoodPolygon[];
}

const toLatLng = (ring: number[][]): LatLng[] =>
  ring.map(([longitude, latitude]) => ({ latitude, longitude }));

const cache = new Map<CityId, Neighborhood[]>();

export function neighborhoodsFor(
  city: CityConfig,
  liveTiers?: Map<string, Tier> | null
): Neighborhood[] {
  let base = cache.get(city.id);
  if (!base) {
    base = city.collection.features.map((feature) => ({
      name: feature.properties.name,
      tier: city.tierFor(feature.properties.name),
      feature,
      polygons: feature.geometry.coordinates.map((rings) => ({
        outer: toLatLng(rings[0]),
        holes: rings.slice(1).map(toLatLng),
      })),
    }));
    cache.set(city.id, base);
  }
  if (!liveTiers) return base;
  return base.map((n) => {
    const tier = liveTiers.get(n.name);
    return tier !== undefined && tier !== n.tier ? { ...n, tier } : n;
  });
}

export function findNeighborhood(
  neighborhoods: Neighborhood[],
  latitude: number,
  longitude: number
): Neighborhood | null {
  const pt = point([longitude, latitude]);
  return neighborhoods.find((n) => booleanPointInPolygon(pt, n.feature)) ?? null;
}
