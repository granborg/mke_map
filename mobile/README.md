# City Scout (mobile app)

Expo (React Native) app that shows a neighborhood crime-tier map for Milwaukee (190 neighborhoods) or Chicago (77 community areas), tracks which neighborhood you're currently in, and pops a warning when you enter a higher-crime area. The city and the warning threshold are configurable in Settings (⚙︎ button on the map).

Warnings work two ways: an in-app alert while the app is open, and — with the "Background alerts" toggle in Settings — a local notification when the app is closed, via a background location task. Background alerts require "Always" location permission and a development build (`npx expo run:ios` / `run:android`, or an EAS build); background location does not work in Expo Go, so in Expo Go the toggle will fail gracefully when permissions can't be obtained.

## Run it

```sh
cd mobile
npm install
npx expo start
```

Then scan the QR code with the [Expo Go](https://expo.dev/go) app on your phone (App Store / Play Store). Grant location permission when prompted. To simulate movement without being in Milwaukee, use a simulator with a custom location (iOS Simulator: Features → Location → Custom Location) — or better, use `xcrun simctl location`: [LOCATIONS.md](LOCATIONS.md) has a copy-paste teleport command for every neighborhood plus ready-made good-area-into-bad-area drive routes, for both cities.

## How it works

- [src/cities/](src/cities/) — one config per city (map region, polygon data, tier source). Milwaukee's tiers are the hand-assigned lists mirroring the web map; Chicago's are computed from real incident data.
- [assets/data/milwaukee.json](assets/data/milwaukee.json) / [assets/data/chicago.json](assets/data/chicago.json) — the neighborhood polygons (bundled, no network needed).
- [src/tiers.ts](src/tiers.ts) — the tier bands, labels, and colors shared by both cities.
- [src/liveTiers.ts](src/liveTiers.ts) — recomputes Chicago's tiers on-device from the Chicago Data Portal's live crime feed (last complete year, Part I offenses per 1,000 residents), cached for a week; offline it falls back to the tiers baked in by [scripts/generate-chicago-data.js](scripts/generate-chicago-data.js). Regenerate the baked snapshot with `npm run generate-chicago-data`.
- [src/neighborhoods.ts](src/neighborhoods.ts) — parses the GeoJSON and does point-in-polygon lookup (Turf.js).
- [src/SettingsScreen.tsx](src/SettingsScreen.tsx) / [src/settings.ts](src/settings.ts) — city picker, warn-threshold picker (Moderate+/High+/Highest/Never), and the background-alerts toggle, persisted with AsyncStorage.
- [src/backgroundLocation.ts](src/backgroundLocation.ts) — the `expo-task-manager` background location task (registered at global scope from [index.ts](index.ts)): resolves each fix to a neighborhood, notifies via `expo-notifications` on entry to a warn-tier area, and skips when the app is foregrounded (the in-app alert handles that).
- [src/warnings.ts](src/warnings.ts) — warning text plus the 30-minute per-neighborhood cooldown, persisted in AsyncStorage and shared by both warning paths so you don't get an alert and a notification for the same entry. Cooldown keys are scoped by city because both cities have a Washington Park.
- [App.tsx](App.tsx) — map with tier-colored polygons, a banner showing the current neighborhood, and the foreground warning logic: a location watch (~50 m granularity) and a 2-consecutive-fix debounce so GPS jitter at polygon boundaries doesn't cause flapping (first fixes and >500 m jumps commit immediately — a stationary device may never produce a confirming second fix).
- Open-source license notices are hosted at [licenses.html](../licenses.html) (served via GitHub Pages at `https://granborg.github.io/mke_map/licenses.html`) rather than bundled in the app — link it from the App Store listing. Regenerate after adding or upgrading dependencies with `npm run generate-licenses`.
- [store/description.md](store/description.md) — source of truth for the App Store Connect listing (name, subtitle, description, keywords, URLs). Paste into App Store Connect when it changes.

## Roadmap

1. ~~Map with tier-colored neighborhoods~~ ✅
2. ~~Foreground location + current-neighborhood banner + entry warnings~~ ✅
3. ~~Background location task + local notifications so warnings fire with the app closed~~ ✅ (requires "Always allow" location permission and a dev build — not Expo Go)
4. Replace the hand-assigned tiers with rates computed from real incident data — ~~Chicago~~ ✅ (live from the Data Portal); Milwaukee still pending (WIBR dataset at [data.milwaukee.gov](https://data.milwaukee.gov)).

## Data caveats

- Milwaukee tiers are rounded, indicative bands anchored to the citywide crime rate — not exact published per-neighborhood figures. See the [repo README](../README.md) for details.
- Chicago tiers are computed (reported Part I offenses ÷ ACS population, per 1,000/yr) but per-resident rates mislead where daytime population dwarfs residents: the Loop ranks "Highest" mostly because few people live there relative to how many pass through. Fuller Park's tiny population (~2,200) makes its rate noisy too.
