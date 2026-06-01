// ESRA partner cities and approximate fastest train times between them (hours).
// Used to recommend hardware that a club can pick up and return same-day (<= 6h).
export const CITIES = ["Munich", "Zurich", "Lausanne", "Milan", "Vienna", "Poznan", "Aachen", "Delft", "Paris"] as const;
export type City = (typeof CITIES)[number];

// symmetric pair times (hours), fastest reasonable rail connection
const T: Record<string, number> = {
  "Munich|Zurich": 3.5, "Munich|Lausanne": 5.0, "Munich|Milan": 6.8, "Munich|Vienna": 4.0,
  "Munich|Poznan": 8.5, "Munich|Aachen": 5.0, "Munich|Delft": 7.0, "Munich|Paris": 5.8,
  "Zurich|Lausanne": 2.2, "Zurich|Milan": 3.3, "Zurich|Vienna": 7.5, "Zurich|Poznan": 11,
  "Zurich|Aachen": 5.0, "Zurich|Delft": 7.0, "Zurich|Paris": 4.0,
  "Lausanne|Milan": 4.0, "Lausanne|Vienna": 8.5, "Lausanne|Poznan": 12, "Lausanne|Aachen": 6.5,
  "Lausanne|Delft": 7.5, "Lausanne|Paris": 3.7,
  "Milan|Vienna": 11, "Milan|Poznan": 13, "Milan|Aachen": 9, "Milan|Delft": 10, "Milan|Paris": 7.0,
  "Vienna|Poznan": 7.5, "Vienna|Aachen": 8, "Vienna|Delft": 9.5, "Vienna|Paris": 8.5,
  "Poznan|Aachen": 8, "Poznan|Delft": 9, "Poznan|Paris": 10,
  "Aachen|Delft": 3.0, "Aachen|Paris": 3.0,
  "Delft|Paris": 3.2,
};

export function travelHours(a: string, b: string): number | null {
  if (a === b) return 0;
  return T[`${a}|${b}`] ?? T[`${b}|${a}`] ?? null;
}

export const NEAR_THRESHOLD = 6;

export function isNearby(from: string, to: string): boolean {
  const h = travelHours(from, to);
  return h !== null && h <= NEAR_THRESHOLD;
}

// ESRA member clubs/universities, each tied to its city (drives proximity recommendations).
export const OTHER_CLUB = "Other (not listed)";
export const CLUBS: { name: string; city: City | "" }[] = [
  { name: "ETH Robotics Club (Zurich)", city: "Zurich" },
  { name: "TUM (Munich)", city: "Munich" },
  { name: "EPFL (Lausanne)", city: "Lausanne" },
  { name: "Politecnico di Milano (Milan)", city: "Milan" },
  { name: "TU Wien (Vienna)", city: "Vienna" },
  { name: "Poznań University of Technology", city: "Poznan" },
  { name: "RWTH Aachen", city: "Aachen" },
  { name: "TU Delft", city: "Delft" },
  { name: "Paris", city: "Paris" },
  { name: OTHER_CLUB, city: "" },
];
export function cityOfClub(name: string): string {
  return CLUBS.find((c) => c.name === name)?.city ?? "";
}
