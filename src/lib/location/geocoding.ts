/**
 * Geocoding Service
 * 
 * Uses OpenStreetMap Nominatim API for city search
 */

import type { GeocodingResult } from "./types";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

interface SearchCitiesOptions {
  query: string;
  limit?: number;
}

export async function searchCities({ query, limit = 10 }: SearchCitiesOptions): Promise<GeocodingResult[]> {
  if (!query.trim() || query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: limit.toString(),
    addressdetails: "1",
    featuretype: "city",
  });

  const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
    headers: {
      "Accept-Language": "en-US,en",
      "User-Agent": "PathOfNur/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const results: GeocodingResult[] = await response.json();
  
  // Filter to only include cities/towns/villages
  return results.filter(result => {
    const type = result.display_name.toLowerCase();
    return result.address && (
      result.address.city || 
      result.address.town || 
      result.address.village
    );
  });
}

export function formatCityName(result: GeocodingResult): string {
  const address = result.address;
  const city = address.city || address.town || address.village || "Unknown";
  const country = address.country || "";
  return country ? `${city}, ${country}` : city;
}
