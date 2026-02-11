import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import { Lora_400Regular, Lora_600SemiBold } from "@expo-google-fonts/lora";
import { PlayfairDisplay_600SemiBold } from "@expo-google-fonts/playfair-display";
import {
  ZalandoSans_400Regular,
  ZalandoSans_600SemiBold,
  ZalandoSans_700Bold
} from "@expo-google-fonts/zalando-sans";

export const unstable_settings = {
  initialRouteName: "(onboarding)"
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ZalandoSans_400Regular,
    ZalandoSans_600SemiBold,
    ZalandoSans_700Bold,
    Lora_400Regular,
    Lora_600SemiBold,
    PlayfairDisplay_600SemiBold,
    Amiri_400Regular,
    Amiri_700Bold
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#070b14" }
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
