import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";

const STEP = 3;

const OPTIONS = [
  {
    label: "I'm just starting out",
    description: "Learning the basics of my faith",
    value: "beginning"
  },
  {
    label: "I'm rebuilding",
    description: "Coming back after some time away",
    value: "rebuilding"
  },
  {
    label: "I'm growing steadily",
    description: "Looking to deepen my practice",
    value: "growing"
  },
  {
    label: "It's the heart of who I am",
    description: "Want more structure and depth",
    value: "devoted"
  }
] as const;

export default function JourneyScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());
  const [selected, setSelected] = useState("");

  useEffect(() => {
    void trackOnboardingStepViewed("journey", STEP);
  }, []);

  const onContinue = async () => {
    await updatePreferences({ journeyStage: selected });
    void trackOnboardingStepCompleted("journey", STEP, startedAtRef.current);
    router.push("/(onboarding)/quran-break");
  };

  return (
    <OnboardingFrame
      step={STEP}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="How would you describe your spiritual life right now?"
      subtitle=""
      primaryLabel="Continue"
      onPrimaryPress={onContinue}
      primaryDisabled={!selected}
      backHref="/(onboarding)/intent"
    >
      {OPTIONS.map((opt) => (
        <ChoiceOption
          key={opt.value}
          label={opt.label}
          description={opt.description}
          selected={selected === opt.value}
          onPress={() => setSelected(opt.value)}
        />
      ))}
    </OnboardingFrame>
  );
}
