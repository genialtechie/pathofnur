/**
 * City Picker Modal
 * 
 * Search and select cities via OpenStreetMap API
 */

import { useState, useCallback, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";

import { searchCities, formatCityName } from "./geocoding";
import { useLocation } from "./location-provider";
import type { GeocodingResult } from "./types";
import { colors, spacing, radii } from "@/src/theme/tokens";
import { fontFamily } from "@/src/theme";

interface CityPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CityPickerModal({ visible, onClose }: CityPickerModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { setManualLocation } = useLocation();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const cities = await searchCities({ query: searchQuery, limit: 10 });
      setResults(cities);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search cities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectCity = useCallback(async (result: GeocodingResult) => {
    const city = result.address.city || result.address.town || result.address.village || "";
    const country = result.address.country || "";
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    await setManualLocation(city, country, { latitude: lat, longitude: lon });
    
    // Reset and close
    setQuery("");
    setResults([]);
    Keyboard.dismiss();
    onClose();
  }, [setManualLocation, onClose]);

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setError(null);
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select City</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a city..."
            placeholderTextColor={colors.text.muted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCorrect={false}
          />
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={colors.interactive.active} />
          </View>
        )}

        {/* Error */}
        {error && !isLoading && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {!isLoading && !error && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={styles.cityItem}
                onPress={() => handleSelectCity(item)}
              >
                <Text style={styles.cityName}>{formatCityName(item)}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              query.length >= 2 ? (
                <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>No cities found</Text>
                </View>
              ) : (
                <View style={styles.centerContainer}>
                  <Text style={styles.hintText}>
                    Type at least 2 characters to search
                  </Text>
                </View>
              )
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  title: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 18,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    color: colors.interactive.active,
  },
  searchContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  searchInput: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    color: colors.text.primary,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  cityItem: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
  },
  cityName: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    color: colors.text.primary,
  },
  centerContainer: {
    padding: spacing["3xl"],
    alignItems: "center",
  },
  errorText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
  },
  emptyText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    color: colors.text.secondary,
  },
  hintText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});
