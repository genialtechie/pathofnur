import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";

const RHYTHM_OPTIONS = [
  {
    value: "daily-5",
    label: "Daily 5-minute path",
    description: "A short daily invitation to keep momentum."
  },
  {
    value: "daily-15",
    label: "Daily 15-minute path",
    description: "Balanced routine with Quran, dhikr, and reflection."
  },
  {
    value: "weekend",
    label: "Weekend deep sessions",
    description: "Long-form guidance with lighter weekdays."
  }
] as const;

export default function OnboardingRhythmRoute() {
  const router = useRouter();
  const { practice } = useLocalSearchParams<{ practice?: string }>();
  const [selected, setSelected] = useState<string | null>(null);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStepViewed("rhythm", 3);
  }, []);

  const continueToFocus = () => {
    if (!selected) return;
    void trackOnboardingStepCompleted("rhythm", 3, startedAtRef.current);
    router.push({
      pathname: "/(onboarding)/focus",
      params: {
        practice: practice ?? "beginner",
        rhythm: selected
      }
    });
  };

  return (
    <OnboardingFrame
      step={3}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="Choose your rhythm"
      subtitle="Pick a plan that feels sustainable now. You can switch anytime."
      primaryLabel="Continue"
      primaryDisabled={!selected}
      backHref="/(onboarding)/practice"
      onPrimaryPress={continueToFocus}
    >
      {RHYTHM_OPTIONS.map((option) => (
        <ChoiceOption
          key={option.value}
          label={option.label}
          description={option.description}
          selected={selected === option.value}
          onPress={() => setSelected(option.value)}
        />
      ))}
    </OnboardingFrame>
  );
}
