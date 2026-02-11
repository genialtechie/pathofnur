import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

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

  return (
    <OnboardingFrame
      step={4}
      totalSteps={5}
      title="What should we prioritize first?"
      subtitle="Your home feed and reminders will adapt to this preference."
      primaryLabel="Continue"
      primaryDisabled={!selected}
      backHref="/(onboarding)/rhythm"
      onPrimaryPress={() =>
        router.push({
          pathname: "/(onboarding)/complete",
          params: {
            practice: practice ?? "beginner",
            rhythm: rhythm ?? "daily-5",
            focus: selected ?? "consistency"
          }
        })
      }
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
