# Milwaukee Neighborhood Crime Rate Map

**Live map: https://granborg.github.io/mke_map/**

An interactive choropleth map of Milwaukee's ~190 neighborhoods, shaded by approximate relative crime rate. Hover over any neighborhood to see its name and tier.

## How the tiers are measured

Tiers reflect reported **Part I offenses** — violent crimes (homicide, robbery, aggravated assault) plus property crimes (burglary, theft, vehicle theft) — per 1,000 residents per year, benchmarked against the Milwaukee citywide average:

| Tier | Approximate rate (per 1,000 residents/year) |
|---|---|
| Lowest | Under ~25 (less than half the citywide rate) |
| Lower | ~25–45 (below the citywide rate) |
| Moderate | ~45–65 (near the citywide rate) |
| High | ~65–100 (above the citywide rate) |
| Highest | Over ~100 (well above the citywide rate) |
| Non-residential (gray) | Parks, airport, and industrial land — no resident population to rate |

## The broad pattern

The deepest shading covers the near north side (Metcalfe Park, Franklin Heights, Sherman Park, Harambee, and neighbors), with elevated levels extending to the far northwest side and parts of the near south side around Clarke Square and Historic Mitchell Street. The lightest areas run along the lakefront (East Side, Third Ward, Bay View) and the far southwest and south neighborhoods.

## Important caveats

The tier ranges are rounded, indicative bands anchored to Milwaukee's overall crime rate — **not** exact published per-neighborhood figures, which is why each is prefaced with "roughly." Figures are approximations based on Milwaukee Police Department reporting patterns through early 2026, and patterns can shift.

If you need defensible, up-to-date numbers — for a report or a housing decision — pull the real counts from:

- The Milwaukee Police Department's interactive crime map
- Milwaukee's open data portal: [data.milwaukee.gov](https://data.milwaukee.gov)

## Mobile app

[mobile/](mobile/) contains an Expo (React Native) app that renders the same map, detects which neighborhood you're currently in, and warns when you enter a High/Highest tier neighborhood. See [mobile/README.md](mobile/README.md) for setup and roadmap.

## Implementation

A single static page ([index.html](index.html)) built with [D3.js](https://d3js.org/). Neighborhood boundaries are loaded from the [blackmad/neighborhoods](https://github.com/blackmad/neighborhoods) GeoJSON collection. Served via GitHub Pages (deploy from branch: `main`, root). `crime-rate-map.html` is the original source fragment; `index.html` is the standalone version with the theme styles it needs.
