/**
 * Qiblah Hook
 * 
 * Calculates Qiblah direction (bearing to Kaaba)
 */

import { useMemo } from "react";

// Kaaba coordinates (Makkah)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

interface UseQiblahReturn {
  bearing: number | null;
  isLoading: boolean;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate Qiblah bearing using the great circle formula
 * Formula: bearing = atan2(sin(Δλ) * cos(φ2), cos(φ1) * sin(φ2) − sin(φ1) * cos(φ2) * cos(Δλ))
 * Where φ1,λ1 is user location and φ2,λ2 is Kaaba
 */
function calculateQiblahBearing(
  userLat: number,
  userLng: number
): number {
  const lat1 = toRadians(userLat);
  const lat2 = toRadians(KAABA_LAT);
  const lngDiff = toRadians(KAABA_LNG - userLng);

  const y = Math.sin(lngDiff) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDiff);

  let bearing = toDegrees(Math.atan2(y, x));

  // Normalize to 0-360 degrees
  bearing = (bearing + 360) % 360;

  return bearing;
}

export function useQiblah(
  latitude: number | undefined,
  longitude: number | undefined
): UseQiblahReturn {
  const bearing = useMemo(() => {
    if (latitude === undefined || longitude === undefined) {
      return null;
    }

    return calculateQiblahBearing(latitude, longitude);
  }, [latitude, longitude]);

  const isLoading = latitude === undefined || longitude === undefined;

  return {
    bearing,
    isLoading,
  };
}

// Also export the calculate function for direct use
export { calculateQiblahBearing, KAABA_LAT, KAABA_LNG };
