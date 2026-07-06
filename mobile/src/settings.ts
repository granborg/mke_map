import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CityId } from "./cities";
import type { Tier } from "./tiers";

export interface Settings {
  cityId: CityId;
  /** Warn when entering a neighborhood at or above this tier; null = never. */
  warnTier: Tier | null;
  /** Notify via background location task when the app is closed. */
  backgroundAlerts: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  cityId: "milwaukee",
  warnTier: 4,
  backgroundAlerts: false,
};

const KEY = "settings.v1";

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {});
}
