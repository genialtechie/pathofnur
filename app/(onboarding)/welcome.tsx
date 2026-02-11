import { useRouter } from "expo-router";
import { Text } from "react-native";

import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";

export default function OnboardingWelcomeRoute() {
  const router = useRouter();

  return (
    <OnboardingFrame
      step={1}
      totalSteps={5}
      title="Welcome to Path of Nur"
      subtitle="We will personalize your prayer journey in under two minutes."
      primaryLabel="Continue"
      onPrimaryPress={() => router.push("/(onboarding)/practice")}
    >
      <ChoiceOption
        label="Calm by design"
        description="Short, focused steps. No noise, no overload."
        onPress={() => router.push("/(onboarding)/practice")}
      />
      <Text
        style={{
          color: "#8fa0b7",
          fontFamily: "Lora_400Regular",
          fontSize: 14,
          lineHeight: 20
        }}
        selectable
      >
        You can change your preferences later from Journey settings.
      </Text>
    </OnboardingFrame>
  );
}
