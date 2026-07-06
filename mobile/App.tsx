import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import MapView, { Polygon } from "react-native-maps";
import { findNeighborhood, Neighborhood, NEIGHBORHOODS } from "./src/neighborhoods";
import { TIER_COLORS, TIER_LABELS, WARN_TIER } from "./src/tiers";

const MILWAUKEE_REGION = {
  latitude: 43.06,
  longitude: -87.97,
  latitudeDelta: 0.32,
  longitudeDelta: 0.28,
};

// Suppress repeat warnings for the same neighborhood within this window.
const REWARN_MS = 30 * 60 * 1000;
// Consecutive location fixes that must agree before we commit a neighborhood
// change — absorbs GPS jitter along polygon boundaries.
const CONFIRM_FIXES = 2;

function hexWithAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

export default function App() {
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [current, setCurrent] = useState<Neighborhood | null>(null);
  const [located, setLocated] = useState(false);

  const pending = useRef<{ name: string | null; count: number }>({ name: null, count: 0 });
  const lastWarned = useRef(new Map<string, number>());
  const currentRef = useRef<Neighborhood | null>(null);

  useEffect(() => {
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
          const hood = findNeighborhood(loc.coords.latitude, loc.coords.longitude);
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
          if (pending.current.count < CONFIRM_FIXES) return;

          pending.current = { name: null, count: 0 };
          currentRef.current = hood;
          setCurrent(hood);

          if (hood && hood.tier >= WARN_TIER) {
            const warned = lastWarned.current.get(hood.name) ?? 0;
            if (Date.now() - warned > REWARN_MS) {
              lastWarned.current.set(hood.name, Date.now());
              Alert.alert(
                `Entering ${hood.name}`,
                `Reported crime rate is ${hood.tier === 5 ? "well above" : "above"} the Milwaukee citywide average (${TIER_LABELS[hood.tier]}).`
              );
            }
          }
        }
      );
    })();
    return () => sub?.remove();
  }, []);

  const banner = permissionDenied
    ? { color: "#555555", title: "Location permission denied", subtitle: "Enable location access to see your current neighborhood." }
    : !located
      ? { color: "#555555", title: "Locating…", subtitle: "Waiting for a GPS fix." }
      : current
        ? { color: TIER_COLORS[current.tier], title: current.name, subtitle: TIER_LABELS[current.tier] }
        : { color: "#555555", title: "Outside Milwaukee", subtitle: "No neighborhood data for this location." };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={MILWAUKEE_REGION} showsUserLocation>
        {NEIGHBORHOODS.map((n) =>
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
        <Text style={styles.bannerTitle}>{banner.title}</Text>
        <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
      </View>
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
});
