import { useState } from "react";
import { useRouter } from "expo-router";

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

  return (
    <OnboardingFrame
      step={2}
      totalSteps={5}
      title="Tell us where you are today"
      subtitle="This helps us tune your reminders and first-day path."
      primaryLabel="Continue"
      primaryDisabled={!selected}
      backHref="/(onboarding)/welcome"
      onPrimaryPress={() =>
        router.push({
          pathname: "/(onboarding)/rhythm",
          params: { practice: selected ?? "beginner" }
        })
      }
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
