// Builds Chicago's bundled data from open sources:
//   assets/data/chicago.json      — 77 community area MultiPolygons ({name})
//   src/cities/chicago-stats.json — { [name]: { area, population, tier } }
//     `tier` is the offline fallback; the app refetches current-year counts
//     at runtime (src/liveTiers.ts) and recomputes tiers on-device.
//     `area` is the official community area number, used to join the
//     runtime crime counts. `population` is the ACS 5-year estimate.
//
// Rates are reported Part I offenses per 1,000 residents per year:
//   crime:      Chicago Data Portal "Crimes - 2001 to Present" (ijzp-q8t2),
//               filtered to Part I FBI codes for CRIME_YEAR
//   population: Chicago Health Atlas ACS 5-year estimates per community area
//   boundaries: Chicago Data Portal "Boundaries - Community Areas" (igwz-8jzy)
//
// Tier bands match src/tiers.ts / the Milwaukee web map:
//   1: <25   2: 25-45   3: 45-65   4: 65-100   5: >100  per 1,000/yr
//
// Run: npm run generate-chicago-data
const fs = require("fs");
const path = require("path");

const CRIME_YEAR = 2025;
const POP_PERIOD = "2019-2023";
// Homicide, criminal sexual assault, robbery, aggravated assault/battery,
// burglary, theft, motor vehicle theft, arson.
const PART_I_FBI_CODES = ["01A", "02", "03", "04A", "04B", "05", "06", "07", "09"];

// Community names arrive UPPERCASED; words that plain title-casing gets wrong.
const NAME_FIXES = { OHARE: "O'Hare", MCKINLEY: "McKinley" };
const titleCase = (s) =>
  s
    .split(" ")
    .map((w) =>
      NAME_FIXES[w] ??
      w
        .split("-")
        .map((p) => p.charAt(0) + p.slice(1).toLowerCase())
        .join("-")
    )
    .join(" ");

const round5 = (n) => Math.round(n * 1e5) / 1e5;

// Ramer-Douglas-Peucker. The source boundaries are surveyor-resolution
// (~1 MB citywide); ~11 m tolerance keeps them visually exact at map zoom.
const SIMPLIFY_TOLERANCE = 0.0001;
function rdp(points, epsilon) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const dist = len === 0
      ? Math.hypot(px - ax, py - ay)
      : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }
  if (maxDist <= epsilon) return [points[0], points[points.length - 1]];
  return [
    ...rdp(points.slice(0, index + 1), epsilon).slice(0, -1),
    ...rdp(points.slice(index), epsilon),
  ];
}

function simplifyRing(ring) {
  // Open the closed ring, simplify, re-close.
  const open = ring.slice(0, -1);
  const simplified = rdp(open, SIMPLIFY_TOLERANCE).map(([lng, lat]) => [round5(lng), round5(lat)]);
  if (simplified.length < 3) return null; // degenerate sliver
  return [...simplified, simplified[0]];
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

(async () => {
  const where = `year=${CRIME_YEAR} AND fbi_code in(${PART_I_FBI_CODES.map((c) => `'${c}'`).join(",")})`;
  const [boundaries, crimes, popData] = await Promise.all([
    getJson("https://data.cityofchicago.org/resource/igwz-8jzy.geojson?$limit=100"),
    getJson(
      "https://data.cityofchicago.org/resource/ijzp-q8t2.json?" +
        new URLSearchParams({
          $select: "community_area,count(*) as n",
          $where: where,
          $group: "community_area",
          $limit: "100",
        })
    ),
    getJson(
      "https://chicagohealthatlas.org/api/v1/data/?topic=POP&population=&period=" + POP_PERIOD
    ),
  ]);

  const crimeByArea = new Map(crimes.map((r) => [r.community_area, Number(r.n)]));
  // Health Atlas geo codes for community areas look like "1714000-35".
  const popByArea = new Map(
    popData.results
      .filter((r) => r.l === "neighborhood")
      .map((r) => [r.g.split("-")[1], r.v])
  );

  const tierBands = [
    [25, 1],
    [45, 2],
    [65, 3],
    [100, 4],
    [Infinity, 5],
  ];

  const features = [];
  const stats = {};
  const report = [];
  for (const f of boundaries.features) {
    const areaNum = String(Number(f.properties.area_numbe));
    const name = titleCase(f.properties.community);
    const pop = popByArea.get(areaNum);
    const count = crimeByArea.get(areaNum) ?? 0;
    if (!pop) throw new Error(`No population for community area ${areaNum} (${name})`);
    const rate = (count / pop) * 1000;
    const tier = tierBands.find(([max]) => rate < max)[1];
    stats[name] = { area: Number(areaNum), population: Math.round(pop), tier };
    report.push({ name, pop: Math.round(pop), count, rate, tier });
    features.push({
      type: "Feature",
      properties: { name },
      geometry: {
        type: "MultiPolygon",
        coordinates: f.geometry.coordinates
          .map((polygon) => polygon.map(simplifyRing).filter(Boolean))
          .filter((polygon) => polygon.length > 0),
      },
    });
  }

  features.sort((a, b) => a.properties.name.localeCompare(b.properties.name));
  const sortedStats = Object.fromEntries(
    Object.entries(stats).sort(([a], [b]) => a.localeCompare(b))
  );

  const root = path.join(__dirname, "..");
  fs.writeFileSync(
    path.join(root, "assets", "data", "chicago.json"),
    JSON.stringify({ type: "FeatureCollection", features })
  );
  fs.writeFileSync(
    path.join(root, "src", "cities", "chicago-stats.json"),
    JSON.stringify(sortedStats, null, 2) + "\n"
  );

  report.sort((a, b) => b.rate - a.rate);
  const totalPop = report.reduce((s, r) => s + r.pop, 0);
  const totalCrime = report.reduce((s, r) => s + r.count, 0);
  console.log(`${report.length} community areas, ${CRIME_YEAR} Part I offenses`);
  console.log(
    `citywide: ${totalCrime} offenses / ${totalPop} residents = ${((totalCrime / totalPop) * 1000).toFixed(1)} per 1,000`
  );
  for (const r of report) {
    console.log(
      `  tier ${r.tier}  ${r.rate.toFixed(1).padStart(6)}/1k  ${r.name} (${r.count} / ${r.pop})`
    );
  }
})();
