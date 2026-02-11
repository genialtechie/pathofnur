import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";

const FOCUS_OPTIONS = [
  {
    value: "consistency",
    label: "Consistency in salah",
    description: "Priority reminders around daily prayer windows."
  },
  {
    value: "quran",
    label: "Quran with ambiance",
    description: "Guided recitation and calm audio sessions."
  },
  {
    value: "calm",
    label: "Calm and resilience",
    description: "Reflective tracks for anxiety, sleep, and gratitude."
  }
] as const;

export default function OnboardingFocusRoute() {
  const router = useRouter();
  const { practice, rhythm } = useLocalSearchParams<{
    practice?: string;
    rhythm?: string;
  }>();
  const [selected, setSelected] = useState<string | null>(null);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStepViewed("focus", 4);
  }, []);

  const continueToComplete = () => {
    if (!selected) return;
    void trackOnboardingStepCompleted("focus", 4, startedAtRef.current);
    router.push({
      pathname: "/(onboarding)/complete",
      params: {
        practice: practice ?? "beginner",
        rhythm: rhythm ?? "daily-5",
        focus: selected
      }
    });
  };

  return (
    <OnboardingFrame
      step={4}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="What should we prioritize first?"
      subtitle="Your home feed and reminders will adapt to this preference."
      primaryLabel="Continue"
      primaryDisabled={!selected}
      backHref="/(onboarding)/rhythm"
      onPrimaryPress={continueToComplete}
    >
      {FOCUS_OPTIONS.map((option) => (
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
