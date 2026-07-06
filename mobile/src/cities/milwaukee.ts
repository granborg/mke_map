import type { FeatureCollection, MultiPolygon } from "geojson";
import raw from "../../assets/data/milwaukee.json";
import type { Tier } from "../tiers";
import type { CityConfig } from "./types";

// Tier assignments mirror the web map (crime-rate-map.html): approximate
// Part I offenses per 1,000 residents/year relative to the citywide average.
// Unlisted residential neighborhoods default to tier 2.

const TIER_5 = ["Metcalfe Park", "Franklin Heights", "North Division", "Garden Homes", "Old North Milwaukee", "Harambee", "Borchert Field", "Park West", "Arlington Heights", "Midtown", "Walnut Hill", "Washington Park", "Sherman Park", "Lincoln Creek", "Hillside", "Triangle", "Triangle North"];
const TIER_4 = ["Uptown", "Grasslyn Manor", "Roosevelt Grove", "Thurston Woods", "Silver Spring", "Havenwoods", "Northridge", "Northridge Lakes", "Capitol Heights", "Grover Heights", "Williamsburg", "Rufus King", "King Park", "Halyard Park", "Clarke Square", "Historic Mitchell Street", "Muskego Way", "Silver City", "Burnham Park", "Concordia", "Cold Spring Park", "Merrill Park", "Avenues West", "Wahl Park"];
const TIER_3 = ["Lincoln Village", "Polonia", "Layton Park", "Mitchell Park", "National Park", "Riverwest", "Haymarket", "Marquette", "Martin Drive", "Miller Valley", "The Valley / Pigsville", "Kilbourn Town", "Walker's Point", "Southgate", "Graceland", "Lindsay Park", "Hampton Heights", "Long View", "Maple Tree", "Melody View", "Granville Station", "Mill Valley", "Silver Swan"];
const TIER_1 = ["Bay View", "Fernwood", "Saveland Park", "Tippecanoe", "Alcott Park", "Alverno", "College Heights", "Clayton Crest", "Red Oak Heights", "Lake Park", "Downer Woods", "Northpoint", "Murray Hill", "Upper East Side", "Yankee Hill", "Historic Third Ward", "Story Hill", "Bluemound Heights", "Washington Heights", "Enderis Park", "Cooper Park", "Jackson Park", "Nash Park", "Lyons Park", "Honey Creek Parkway", "Johnson's Woods", "Morgan Heights", "Mount Mary", "Brynwood", "Servite Woods", "Golden Valley", "Whispering Hills", "Fairview", "Harbor View"];
const NON_RESIDENTIAL = ["Zoo", "Timmerman Airport", "Land Bank", "Jones' Island", "Veterans Affairs", "Mitchell Field", "Dretzka Park", "Brown Deer Park", "Mc Govern Park", "Lincoln Park", "Estabrook Park", "Menomonee River Valley", "Menomonee River Parkway", "Little Menomonee Parkway", "Wick Field"];

const tierByName = new Map<string, Tier>();
TIER_5.forEach((n) => tierByName.set(n, 5));
TIER_4.forEach((n) => tierByName.set(n, 4));
TIER_3.forEach((n) => tierByName.set(n, 3));
TIER_1.forEach((n) => tierByName.set(n, 1));
NON_RESIDENTIAL.forEach((n) => tierByName.set(n, 0));

export const MILWAUKEE: CityConfig = {
  id: "milwaukee",
  name: "Milwaukee",
  region: {
    latitude: 43.06,
    longitude: -87.97,
    latitudeDelta: 0.32,
    longitudeDelta: 0.28,
  },
  collection: raw as FeatureCollection<MultiPolygon, { name: string }>,
  tierFor: (name) => tierByName.get(name) ?? 2,
};
