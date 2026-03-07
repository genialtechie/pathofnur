import { useEffect } from "react";
import { Stack } from "expo-router";
import { Asset } from "expo-asset";

import { onboardingImageModules } from "@/src/features/donate/onboarding-images";

export const unstable_settings = {
  initialRouteName: "welcome"
};

export default function OnboardingLayout() {
  useEffect(() => {
    void Asset.loadAsync(onboardingImageModules);
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#070b14" },
        animation: "slide_from_right",
        gestureEnabled: false,
        fullScreenGestureEnabled: false
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="intent" />
      <Stack.Screen name="journey" />
      <Stack.Screen name="quran-break" />
      <Stack.Screen name="prayer-life" />
      <Stack.Screen name="quran-time" />
      <Stack.Screen name="plan-intro" />
      <Stack.Screen name="plan-builder" />
      <Stack.Screen name="plan-time" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="location" />
      <Stack.Screen name="ready" />
    </Stack>
  );
}
