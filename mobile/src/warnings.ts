import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CityConfig } from "./cities";
import type { Neighborhood } from "./neighborhoods";
import { TIER_LABELS } from "./tiers";

// Warning cooldown shared by the foreground alert path (App.tsx) and the
// background notification task (backgroundLocation.ts), persisted so it
// survives app restarts and headless task launches.

const KEY = "warnCooldown.v1";
const REWARN_MS = 30 * 60 * 1000;

/** Cooldown key. Neighborhood names collide across cities (both Milwaukee
 * and Chicago have a Washington Park), so scope by city. */
export const warnKey = (city: CityConfig, hood: Neighborhood) => `${city.id}:${hood.name}`;

/** True if this neighborhood hasn't warned within the cooldown window;
 * records the warning time when it returns true. */
export async function shouldWarn(key: string): Promise<boolean> {
  let map: Record<string, number> = {};
  try {
    map = JSON.parse((await AsyncStorage.getItem(KEY)) ?? "{}");
  } catch {}
  const now = Date.now();
  if (now - (map[key] ?? 0) <= REWARN_MS) return false;
  for (const k of Object.keys(map)) {
    if (now - map[k] > REWARN_MS) delete map[k];
  }
  map[key] = now;
  AsyncStorage.setItem(KEY, JSON.stringify(map)).catch(() => {});
  return true;
}

export function warningText(
  hood: Neighborhood,
  cityName: string
): { title: string; body: string } {
  const rel = hood.tier >= 5 ? "well above" : hood.tier >= 4 ? "above" : "near";
  return {
    title: `Entering ${hood.name}`,
    body: `Reported crime rate is ${rel} the ${cityName} citywide average (${TIER_LABELS[hood.tier]}).`,
  };
}
