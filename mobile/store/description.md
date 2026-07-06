# App Store listing — City Scout

Source of truth for the App Store Connect metadata. Paste these into
App Store Connect (appstoreconnect.apple.com → the app → version page /
App Information) whenever they change. Character limits noted per field.

## Name (max 30 chars)

City Scout

## Subtitle (max 30 chars)

Crime-rate map & entry alerts

(The full tagline "neighborhood crime-rate map & alerts" is 37 chars —
over the subtitle limit — so it lives in the description instead.)

## Promotional text (max 170 chars — editable without a new build)

See your city's neighborhood crime tiers at a glance, and get an alert
when you cross into a higher-crime area — even while the app is closed.

## Description (max 4,000 chars)

City Scout is a neighborhood crime-rate map with alerts. Pick your city —
Milwaukee (190 neighborhoods) or Chicago (77 community areas) — and every
neighborhood is shaded into five crime-rate tiers, from Lowest to Highest,
like the zone map of a well-scouted open world.

WHAT IT DOES

- Full-city map with every neighborhood shaded by its crime-rate tier
- Live banner showing the neighborhood you're currently in and its tier
- Entry alerts when you cross into a higher-crime neighborhood, with a
  threshold you choose (Moderate and above, High and above, Highest only,
  or never)
- Optional background alerts: with "Always" location access, City Scout
  keeps watch and sends a notification even while the app is closed
- Chicago's tiers are recomputed from the city's official open-data crime
  feed and refresh automatically; all map data is bundled, so the map
  itself works offline

HOW THE TIERS WORK

Tiers are indicative bands of reported Part I offenses per 1,000 residents
per year. Milwaukee's are anchored to the citywide average; Chicago's are
computed from the Chicago Data Portal's incident data and ACS population
estimates. They are a rough orientation aid, not a precise safety score.
Crime statistics reflect reported incidents only, per-resident rates can
mislead in areas with large daytime populations (Chicago's Loop, for
example), and many things that make a place good or bad to be aren't
measured by any statistic.

PRIVACY

Your location is used only on your device to determine the current
neighborhood — it is never uploaded, tracked, or shared. The only network
request the app makes is downloading citywide crime statistics.

Open-source licenses: https://granborg.github.io/mke_map/licenses.html

## Keywords (max 100 chars, comma-separated, no spaces needed)

milwaukee,chicago,crime,map,safety,neighborhood,alert,tier,scout,travel

## URLs

- Support URL: https://github.com/granborg/mke_map
- Marketing URL: https://granborg.github.io/mke_map/
- Privacy Policy URL: (required before submission — TODO)

## Category

- Primary: Navigation
- Secondary: Travel

## Notes for review (App Review "Notes" field)

The app displays public crime statistics by neighborhood as rounded,
clearly-labeled tiers with an in-description methodology disclaimer.
Foreground location shows the user's current neighborhood. Background
("Always") location is optional, off by default, enabled by an explicit
in-app toggle, and used solely to deliver the user-requested entry
alerts; no location data leaves the device.
