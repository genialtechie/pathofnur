import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "welcome"
};

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#070b14" }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="practice" />
      <Stack.Screen name="rhythm" />
      <Stack.Screen name="focus" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}
