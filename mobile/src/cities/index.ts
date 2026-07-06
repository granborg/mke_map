import { CHICAGO } from "./chicago";
import { MILWAUKEE } from "./milwaukee";
import type { CityConfig, CityId } from "./types";

export type { CityConfig, CityId } from "./types";

export const CITIES: Record<CityId, CityConfig> = {
  milwaukee: MILWAUKEE,
  chicago: CHICAGO,
};

export const CITY_LIST: CityConfig[] = [MILWAUKEE, CHICAGO];
