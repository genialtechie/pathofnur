import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { EventName, track, trackScreenView } from "@/src/lib/analytics/track";
import { colors, fontFamily, radii, spacing } from "@/src/theme";

const STORAGE_KEY = "tasbih_count";

export default function TasbihScreen() {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    void trackScreenView("tools_tasbih");
    // Load persisted count
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        setCount(parseInt(val, 10));
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, count.toString());
    }
  }, [count, isLoaded]);

  const handleTap = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCount((prev) => prev + 1);
    if (count === 0) {
      void track(EventName.TOOLS_TASBIH_STARTED, {}, "tools_tasbih");
    }
    // Track milestones? maybe every 33 or 100
    if ((count + 1) % 33 === 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [count]);

  const handleReset = useCallback(() => {
    Alert.alert(
      "Reset Counter",
      "Are you sure you want to reset your count to zero?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            void track(
              EventName.TOOLS_TASBIH_COMPLETED,
              { count, dhikr_type: "generic" }, // log final count before reset
              "tools_tasbih"
            );
            void track(EventName.TOOLS_TASBIH_RESET, {}, "tools_tasbih");
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setCount(0);
          },
        },
      ]
    );
  }, [count]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={20}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>Tasbih</Text>
        <Pressable onPress={handleReset} style={styles.resetButton} hitSlop={20}>
          <Ionicons name="refresh" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Tap Area */}
      <Pressable
        style={styles.tapArea}
        onPress={handleTap}
        android_ripple={{ color: "rgba(255,255,255,0.1)" }}
      >
        <View style={styles.counterContainer}>
          <Text style={styles.countText}>{count}</Text>
          <Text style={styles.tapHint}>Tap anywhere to count</Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a", // Deep dark background for focus
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 10,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamily.appSemiBold,
    fontSize: 18,
  },
  resetButton: {
    padding: spacing.xs,
  },
  tapArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  counterContainer: {
    alignItems: "center",
    gap: spacing.md,
  },
  countText: {
    color: colors.text.primary,
    fontFamily: fontFamily.appBold,
    fontSize: 96, // Very large
    fontVariant: ["tabular-nums"],
  },
  tapHint: {
    color: colors.text.tertiary,
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    opacity: 0.7,
  },
});
