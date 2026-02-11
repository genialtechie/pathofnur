import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Text } from "react-native";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";

export default function OnboardingWelcomeRoute() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStarted();
    void trackOnboardingStepViewed("welcome", 1);
  }, []);

  const continueToPractice = () => {
    void trackOnboardingStepCompleted("welcome", 1, startedAtRef.current);
    router.push("/(onboarding)/practice");
  };

  return (
    <OnboardingFrame
      step={1}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="Welcome to Path of Nur"
      subtitle="We will personalize your prayer journey in under two minutes."
      primaryLabel="Continue"
      onPrimaryPress={continueToPractice}
    >
      <ChoiceOption
        label="Calm by design"
        description="Short, focused steps. No noise, no overload."
        onPress={continueToPractice}
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
