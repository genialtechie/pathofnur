/**
 * Location Types
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  coords: Coordinates;
  city: string;
  country: string;
  timezone: string;
}

export type LocationStatus = 
  | "loading"
  | "granted"
  | "denied"
  | "error"
  | "manual";

export interface GeocodingResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    country_code?: string;
  };
}
