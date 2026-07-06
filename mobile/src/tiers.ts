// Tier assignments mirror the web map (crime-rate-map.html): approximate
// Part I offenses per 1,000 residents/year relative to the citywide average.
// Unlisted residential neighborhoods default to tier 2.

const TIER_5 = ["Metcalfe Park", "Franklin Heights", "North Division", "Garden Homes", "Old North Milwaukee", "Harambee", "Borchert Field", "Park West", "Arlington Heights", "Midtown", "Walnut Hill", "Washington Park", "Sherman Park", "Lincoln Creek", "Hillside", "Triangle", "Triangle North"];
const TIER_4 = ["Uptown", "Grasslyn Manor", "Roosevelt Grove", "Thurston Woods", "Silver Spring", "Havenwoods", "Northridge", "Northridge Lakes", "Capitol Heights", "Grover Heights", "Williamsburg", "Rufus King", "King Park", "Halyard Park", "Clarke Square", "Historic Mitchell Street", "Muskego Way", "Silver City", "Burnham Park", "Concordia", "Cold Spring Park", "Merrill Park", "Avenues West", "Wahl Park"];
const TIER_3 = ["Lincoln Village", "Polonia", "Layton Park", "Mitchell Park", "National Park", "Riverwest", "Haymarket", "Marquette", "Martin Drive", "Miller Valley", "The Valley / Pigsville", "Kilbourn Town", "Walker's Point", "Southgate", "Graceland", "Lindsay Park", "Hampton Heights", "Long View", "Maple Tree", "Melody View", "Granville Station", "Mill Valley", "Silver Swan"];
const TIER_1 = ["Bay View", "Fernwood", "Saveland Park", "Tippecanoe", "Alcott Park", "Alverno", "College Heights", "Clayton Crest", "Red Oak Heights", "Lake Park", "Downer Woods", "Northpoint", "Murray Hill", "Upper East Side", "Yankee Hill", "Historic Third Ward", "Story Hill", "Bluemound Heights", "Washington Heights", "Enderis Park", "Cooper Park", "Jackson Park", "Nash Park", "Lyons Park", "Honey Creek Parkway", "Johnson's Woods", "Morgan Heights", "Mount Mary", "Brynwood", "Servite Woods", "Golden Valley", "Whispering Hills", "Fairview", "Harbor View"];
const NON_RESIDENTIAL = ["Zoo", "Timmerman Airport", "Land Bank", "Jones' Island", "Veterans Affairs", "Mitchell Field", "Dretzka Park", "Brown Deer Park", "Mc Govern Park", "Lincoln Park", "Estabrook Park", "Menomonee River Valley", "Menomonee River Parkway", "Little Menomonee Parkway", "Wick Field"];

/** 0 = non-residential, 1 (lowest) … 5 (highest) */
export type Tier = 0 | 1 | 2 | 3 | 4 | 5;

/** Tiers at or above this trigger an entry warning. */
export const WARN_TIER: Tier = 4;

export const TIER_LABELS: Record<Tier, string> = {
  0: "Park / non-residential",
  1: "Lowest — under ~25 per 1,000",
  2: "Lower — ~25–45 per 1,000",
  3: "Moderate — ~45–65 per 1,000",
  4: "High — ~65–100 per 1,000",
  5: "Highest — over ~100 per 1,000",
};

export const TIER_COLORS: Record<Tier, string> = {
  0: "#b4b2a9",
  1: "#fee5d9",
  2: "#fcae91",
  3: "#fb6a4a",
  4: "#de2d26",
  5: "#a50f15",
};

const tierByName = new Map<string, Tier>();
TIER_5.forEach((n) => tierByName.set(n, 5));
TIER_4.forEach((n) => tierByName.set(n, 4));
TIER_3.forEach((n) => tierByName.set(n, 3));
TIER_1.forEach((n) => tierByName.set(n, 1));
NON_RESIDENTIAL.forEach((n) => tierByName.set(n, 0));

export function tierFor(name: string): Tier {
  return tierByName.get(name) ?? 2;
}
