import "react-native-gesture-handler";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useMemo } from "react";
import { StyleSheet, useColorScheme, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import { Lora_400Regular, Lora_600SemiBold } from "@expo-google-fonts/lora";
import { PlayfairDisplay_600SemiBold } from "@expo-google-fonts/playfair-display";
import {
  ZalandoSans_400Regular,
  ZalandoSans_600SemiBold,
  ZalandoSans_700Bold
} from "@expo-google-fonts/zalando-sans";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";


import { LocationProvider } from "@/src/lib/location";
import { darkColors, lightColors } from "@/src/theme/tokens";

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

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const appColors = isDark ? darkColors : lightColors;
  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        primary: appColors.brand.metallicGold,
        background: appColors.surface.background,
        card: appColors.surface.card,
        border: appColors.surface.border,
        text: appColors.text.primary,
        notification: appColors.brand.metallicGold,
      },
    };
  }, [appColors, isDark]);

  const backgroundColor = appColors.surface.background;

  useEffect(() => {
    if (Platform.OS === "android") {
      const NavigationBar = require("expo-navigation-bar");
      NavigationBar.setPositionAsync("absolute");
      NavigationBar.setBackgroundColorAsync("transparent");
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      const NavigationBar = require("expo-navigation-bar");
      NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
    }
  }, [isDark]);

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
      <StatusBar style={isDark ? "light" : "dark"} translucent />
      <LocationProvider>
        <ThemeProvider value={navigationTheme}>
          <GestureHandlerRootView style={[styles.container, { backgroundColor }]}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor }
              }}
            >
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </GestureHandlerRootView>
        </ThemeProvider>
      </LocationProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
