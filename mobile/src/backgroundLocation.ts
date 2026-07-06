import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { AppState, Platform } from "react-native";
import { CITIES } from "./cities";
import { findNeighborhood, neighborhoodsFor } from "./neighborhoods";
import { loadSettings } from "./settings";
import { shouldWarn, warningText, warnKey } from "./warnings";

// Background entry warnings: a location task that runs with the app closed
// and fires a local notification on entry to a warn-tier neighborhood.
// Requires "Always" location permission and a development build — background
// location does not work in Expo Go.

export const LOCATION_TASK = "neighborhood-watch-location";
const LAST_HOOD_KEY = "bgLastNeighborhood.v1";
const CHANNEL_ID = "entry-warnings";

// Show notifications even if one fires while the app is foregrounded
// (shouldn't normally happen — the task defers to the in-app alert).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Must run at global scope (via the index.ts import) so the task exists when
// iOS/Android relaunches the app headless for a location update.
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  const loc = locations[locations.length - 1];
  if (!loc) return;
  // While the app is open, App.tsx already shows in-app alerts.
  if (AppState.currentState === "active") return;

  const settings = await loadSettings();
  const city = CITIES[settings.cityId];
  const hood = findNeighborhood(
    neighborhoodsFor(city),
    loc.coords.latitude,
    loc.coords.longitude
  );

  // Only notify on *entry*: remember where the last fix landed.
  const key = hood ? warnKey(city, hood) : "";
  const last = await AsyncStorage.getItem(LAST_HOOD_KEY);
  if (key === (last ?? "")) return;
  await AsyncStorage.setItem(LAST_HOOD_KEY, key);

  if (!hood || settings.warnTier === null || hood.tier < settings.warnTier) return;
  if (!(await shouldWarn(key))) return;

  const { title, body } = warningText(hood, city.name);
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: "default" },
    trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
  });
});

export async function startBackgroundAlerts(): Promise<{ ok: true } | { ok: false; reason: string }> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== "granted") {
    return { ok: false, reason: "Location permission is required." };
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") {
    return {
      ok: false,
      reason:
        'Background alerts need "Always" location access. Enable it for this app in system Settings.',
    };
  }
  const notif = await Notifications.requestPermissionsAsync();
  if (!notif.granted) {
    return {
      ok: false,
      reason: "Notification permission is required. Enable it for this app in system Settings.",
    };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Neighborhood entry warnings",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  if (!(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 100,
      pausesUpdatesAutomatically: true,
      activityType: Location.LocationActivityType.OtherNavigation,
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: "City Scout is on",
        notificationBody: "Watching for entry into higher-crime neighborhoods.",
      },
    });
  }
  return { ok: true };
}

export async function stopBackgroundAlerts(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
  AsyncStorage.removeItem(LAST_HOOD_KEY).catch(() => {});
}
