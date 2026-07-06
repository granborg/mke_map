# MKE Neighborhood Watch (mobile app)

Expo (React Native) app that shows the Milwaukee neighborhood crime-tier map, tracks which neighborhood you're currently in, and pops a warning when you enter a High or Highest tier neighborhood.

This is the foreground-only first version (steps 1–2 of the build plan): the map, live neighborhood detection, and in-app entry warnings. Background geofencing and push-style notifications are the next step.

## Run it

```sh
cd mobile
npm install
npx expo start
```

Then scan the QR code with the [Expo Go](https://expo.dev/go) app on your phone (App Store / Play Store). Grant location permission when prompted. To simulate movement without being in Milwaukee, use a simulator with a custom location (iOS Simulator: Features → Location → Custom Location).

## How it works

- [assets/data/milwaukee.json](assets/data/milwaukee.json) — the 190 neighborhood polygons (bundled, no network needed).
- [src/tiers.ts](src/tiers.ts) — tier assignments, labels, and colors, mirroring the web map.
- [src/neighborhoods.ts](src/neighborhoods.ts) — parses the GeoJSON and does point-in-polygon lookup (Turf.js).
- [App.tsx](App.tsx) — map with tier-colored polygons, a banner showing the current neighborhood, and the warning logic: a location watch (~50 m granularity), a 2-consecutive-fix debounce so GPS jitter at polygon boundaries doesn't cause flapping, and a 30-minute per-neighborhood re-warn cooldown.

## Roadmap

1. ~~Map with tier-colored neighborhoods~~ ✅
2. ~~Foreground location + current-neighborhood banner + entry warnings~~ ✅
3. Background location task (`expo-location` background updates + `expo-notifications` local notifications) so warnings fire with the app closed. Requires "Always allow" location permission and a dev build (not Expo Go).
4. Replace the hand-assigned tiers with rates computed from real incident data (WIBR dataset at [data.milwaukee.gov](https://data.milwaukee.gov)).

## Data caveat

Tiers are rounded, indicative bands anchored to Milwaukee's citywide crime rate — not exact published per-neighborhood figures. See the [repo README](../README.md) for details.
