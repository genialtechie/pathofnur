/**
 * Location Hook
 * 
 * Manages device location with permission handling and caching
 */

import { useState, useEffect, useCallback, useContext, createContext } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCalendars } from "expo-localization";

import type { LocationData, LocationStatus, Coordinates } from "./types";

const LOCATION_CACHE_KEY = "pon_location_cache";
const LOCATION_CACHE_TTL_HOURS = 24; // Refresh location after 24 hours

interface LocationContextValue {
  location: LocationData | null;
  status: LocationStatus;
  error: string | null;
  refresh: () => Promise<void>;
  setManualLocation: (city: string, country: string, coords: Coordinates) => Promise<void>;
}

const LocationContext = createContext<LocationContextValue | null>(null);

interface LocationProviderProps {
  children: React.ReactNode;
}

export function LocationProvider({ children }: LocationProviderProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [status, setStatus] = useState<LocationStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  // Load cached location on mount
  useEffect(() => {
    loadCachedLocation();
  }, []);

  const loadCachedLocation = async () => {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const locationData: LocationData = parsed.location || parsed;
        const cachedAt = parsed.cachedAt ? new Date(parsed.cachedAt) : null;
        
        setLocation(locationData);
        setStatus("granted");
        
        // Check if cache is stale (> 24 hours)
        if (cachedAt) {
          const hoursSinceCache = (Date.now() - cachedAt.getTime()) / (1000 * 60 * 60);
          if (hoursSinceCache > LOCATION_CACHE_TTL_HOURS) {
            console.log("Location cache is stale, refreshing...");
            // Silently refresh in background
            refresh();
          }
        } else {
          // No timestamp, refresh to get one
          refresh();
        }
      }
    } catch (err) {
      console.error("Failed to load cached location:", err);
    }
  };

  const cacheLocation = async (data: LocationData) => {
    try {
      await AsyncStorage.setItem(
        LOCATION_CACHE_KEY,
        JSON.stringify({
          location: data,
          cachedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      console.error("Failed to cache location:", err);
    }
  };

  const reverseGeocode = async (coords: Coordinates): Promise<{ city: string; country: string }> => {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        return {
          city: address.city || address.subregion || address.region || "Unknown City",
          country: address.country || "Unknown Country",
        };
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
    
    return { city: "Unknown City", country: "Unknown Country" };
  };

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      // Check permission
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (permissionStatus !== "granted") {
        setStatus("denied");
        setError("Location permission denied");
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Get timezone from expo-localization
      const calendars = getCalendars();
      const timezone = calendars[0]?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      // Reverse geocode
      const { city, country } = await reverseGeocode(coords);

      const locationData: LocationData = {
        coords,
        city,
        country,
        timezone,
      };

      setLocation(locationData);
      setStatus("granted");
      await cacheLocation(locationData);
    } catch (err) {
      console.error("Location error:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown location error");
    }
  }, []);

  const setManualLocation = useCallback(async (city: string, country: string, coords: Coordinates) => {
    const calendars = getCalendars();
    const timezone = calendars[0]?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const locationData: LocationData = {
      coords,
      city,
      country,
      timezone,
    };

    setLocation(locationData);
    setStatus("manual");
    await cacheLocation(locationData);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        status,
        error,
        refresh,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider");
  }
  return context;
}
