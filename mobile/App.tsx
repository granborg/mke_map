import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Polygon } from "react-native-maps";
import { startBackgroundAlerts, stopBackgroundAlerts } from "./src/backgroundLocation";
import { CITIES } from "./src/cities";
import { findNeighborhood, Neighborhood, neighborhoodsFor } from "./src/neighborhoods";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from "./src/settings";
import SettingsScreen from "./src/SettingsScreen";
import { Tier, TIER_COLORS, TIER_LABELS } from "./src/tiers";
import { shouldWarn, warningText, warnKey } from "./src/warnings";

// Consecutive location fixes that must agree before we commit a neighborhood
// change — absorbs GPS jitter along polygon boundaries.
const CONFIRM_FIXES = 2;
// A fix farther than this from the previous one can't be boundary jitter
// (drives arrive in ~50 m steps), so commit it immediately. Without this,
// a teleported location (simulator, or GPS reacquiring after a tunnel)
// yields a single fix that the debounce would swallow forever.
const JUMP_METERS = 500;

function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const dLat = (b.latitude - a.latitude) * 111320;
  const dLng = (b.longitude - a.longitude) * 111320 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

function hexWithAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

// Light tier colors (Lowest/Lower pinks, non-residential gray) need dark text.
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.45;
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [current, setCurrent] = useState<Neighborhood | null>(null);
  const [located, setLocated] = useState(false);
  const [liveTiers, setLiveTiers] = useState<Map<string, Tier> | null>(null);

  const city = CITIES[settings.cityId];
  const neighborhoods = useMemo(() => neighborhoodsFor(city, liveTiers), [city, liveTiers]);

  const pending = useRef<{ name: string | null; count: number }>({ name: null, count: 0 });
  const currentRef = useRef<Neighborhood | null>(null);
  const lastFix = useRef<{ latitude: number; longitude: number } | null>(null);
  // The location callback outlives renders; refs keep it reading fresh values
  // without resubscribing on every settings change.
  const neighborhoodsRef = useRef(neighborhoods);
  neighborhoodsRef.current = neighborhoods;
  const warnTierRef = useRef(settings.warnTier);
  warnTierRef.current = settings.warnTier;
  const cityRef = useRef(city);
  cityRef.current = city;

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  // Keep the background task in sync with the settings toggle. Runs on every
  // startup too: start/stop are idempotent, and this re-verifies permissions.
  useEffect(() => {
    if (settings.backgroundAlerts) {
      startBackgroundAlerts().then((result) => {
        if (!result.ok) {
          Alert.alert("Background alerts unavailable", result.reason);
          setSettings((s) => {
            const next = { ...s, backgroundAlerts: false };
            saveSettings(next);
            return next;
          });
        }
      });
    } else {
      stopBackgroundAlerts().catch(() => {});
    }
  }, [settings.backgroundAlerts]);

  // Refresh tiers from the city's open-data API; offline keeps bundled tiers.
  useEffect(() => {
    let cancelled = false;
    setLiveTiers(null);
    if (!city.fetchLiveTiers) return;
    city
      .fetchLiveTiers()
      .then((tiers) => {
        if (!cancelled) setLiveTiers(tiers);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [city]);

  useEffect(() => {
    // Switching city invalidates everything derived from the old polygons.
    pending.current = { name: null, count: 0 };
    currentRef.current = null;
    lastFix.current = null;
    setCurrent(null);

    let sub: Location.LocationSubscription | undefined;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
        (loc) => {
          setLocated(true);
          const fix = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          const jumped =
            lastFix.current !== null && distanceMeters(lastFix.current, fix) > JUMP_METERS;
          lastFix.current = fix;

          const hood = findNeighborhood(neighborhoodsRef.current, fix.latitude, fix.longitude);
          const name = hood?.name ?? null;

          if (name === (currentRef.current?.name ?? null)) {
            pending.current = { name: null, count: 0 };
            return;
          }
          if (pending.current.name === name) {
            pending.current.count += 1;
          } else {
            pending.current = { name, count: 1 };
          }
          // Debounce only plausible boundary jitter: a first-ever fix or a
          // long jump is authoritative — there may never be a second fix if
          // the device is stationary.
          const confirmed =
            pending.current.count >= CONFIRM_FIXES || currentRef.current === null || jumped;
          if (!confirmed) return;

          pending.current = { name: null, count: 0 };
          currentRef.current = hood;
          setCurrent(hood);

          const warnTier = warnTierRef.current;
          if (hood && warnTier !== null && hood.tier >= warnTier) {
            // Cooldown is persisted and shared with the background task, so
            // a background notification suppresses the in-app re-alert.
            const { title, body } = warningText(hood, cityRef.current.name);
            shouldWarn(warnKey(cityRef.current, hood)).then((yes) => {
              if (yes) Alert.alert(title, body);
            });
          }
        }
      );
    })();
    return () => sub?.remove();
  }, [settings.cityId]);

  // Live tiers can land after `current` was set; show the fresh tier.
  const currentTier = current
    ? neighborhoods.find((n) => n.name === current.name)?.tier ?? current.tier
    : null;

  const banner = permissionDenied
    ? { color: "#555555", title: "Location permission denied", subtitle: "Enable location access to see your current neighborhood." }
    : !located
      ? { color: "#555555", title: "Locating…", subtitle: "Waiting for a GPS fix." }
      : current && currentTier !== null
        ? { color: TIER_COLORS[currentTier], title: current.name, subtitle: TIER_LABELS[currentTier] }
        : { color: "#555555", title: `Outside ${city.name}`, subtitle: "No neighborhood data for this location." };

  return (
    <View style={styles.container}>
      <MapView key={city.id} style={styles.map} initialRegion={city.region} showsUserLocation>
        {neighborhoods.map((n) =>
          n.polygons.map((p, i) => (
            <Polygon
              key={`${n.name}-${i}`}
              coordinates={p.outer}
              holes={p.holes.length ? p.holes : undefined}
              fillColor={hexWithAlpha(TIER_COLORS[n.tier], n.name === current?.name ? 0.85 : 0.55)}
              strokeColor="rgba(255,255,255,0.8)"
              strokeWidth={1}
            />
          ))
        )}
      </MapView>
      <View style={[styles.banner, { backgroundColor: banner.color }]}>
        <Text style={[styles.bannerTitle, isLightColor(banner.color) && styles.bannerTitleDark]}>
          {banner.title}
        </Text>
        <Text style={[styles.bannerSubtitle, isLightColor(banner.color) && styles.bannerSubtitleDark]}>
          {banner.subtitle}
        </Text>
      </View>
      <Pressable
        style={styles.settingsButton}
        hitSlop={8}
        onPress={() => setShowSettings(true)}
        accessibilityLabel="Settings"
      >
        <Text style={styles.settingsButtonText}>⚙︎</Text>
      </Pressable>
      <SettingsScreen
        visible={showSettings}
        settings={settings}
        onChange={(next) => {
          setSettings(next);
          saveSettings(next);
        }}
        onClose={() => setShowSettings(false)}
      />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  banner: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bannerTitle: { color: "#fff", fontSize: 17, fontWeight: "600" },
  bannerSubtitle: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginTop: 2 },
  bannerTitleDark: { color: "#3b241c" },
  bannerSubtitleDark: { color: "rgba(59,36,28,0.75)" },
  settingsButton: {
    position: "absolute",
    bottom: 32,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButtonText: { color: "#fff", fontSize: 22, lineHeight: 26 },
});
