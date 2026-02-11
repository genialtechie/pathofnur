import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";

const PRACTICE_OPTIONS = [
  {
    value: "beginner",
    label: "I am starting out",
    description: "Simple guidance and short sessions."
  },
  {
    value: "consistent",
    label: "I pray regularly",
    description: "Structured reminders and deeper tracks."
  },
  {
    value: "rebuilding",
    label: "I am rebuilding consistency",
    description: "Gentle accountability and reflective prompts."
  }
] as const;

export default function OnboardingPracticeRoute() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStepViewed("practice", 2);
  }, []);

  const continueToRhythm = () => {
    if (!selected) return;
    void trackOnboardingStepCompleted("practice", 2, startedAtRef.current);
    router.push({
      pathname: "/(onboarding)/rhythm",
      params: { practice: selected }
    });
  };

  return (
    <OnboardingFrame
      step={2}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="Tell us where you are today"
      subtitle="This helps us tune your reminders and first-day path."
      primaryLabel="Continue"
      primaryDisabled={!selected}
      backHref="/(onboarding)/welcome"
      onPrimaryPress={continueToRhythm}
    >
      {PRACTICE_OPTIONS.map((option) => (
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
