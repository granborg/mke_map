import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, FeatureCollection, MultiPolygon } from "geojson";
import type { LatLng } from "react-native-maps";
import raw from "../assets/data/milwaukee.json";
import { Tier, tierFor } from "./tiers";

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

const collection = raw as FeatureCollection<MultiPolygon, { name: string }>;

const toLatLng = (ring: number[][]): LatLng[] =>
  ring.map(([longitude, latitude]) => ({ latitude, longitude }));

export const NEIGHBORHOODS: Neighborhood[] = collection.features.map((feature) => ({
  name: feature.properties.name,
  tier: tierFor(feature.properties.name),
  feature,
  polygons: feature.geometry.coordinates.map((rings) => ({
    outer: toLatLng(rings[0]),
    holes: rings.slice(1).map(toLatLng),
  })),
}));

export function findNeighborhood(latitude: number, longitude: number): Neighborhood | null {
  const pt = point([longitude, latitude]);
  return NEIGHBORHOODS.find((n) => booleanPointInPolygon(pt, n.feature)) ?? null;
}
