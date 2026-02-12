import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";

const STEP = 6;

const OPTIONS = [
  { label: "I don't currently", value: "none" },
  { label: "A few times a month", value: "monthly" },
  { label: "A few minutes daily", value: "daily_short" },
  { label: "10–30 minutes daily", value: "daily_medium" },
  { label: "More than 30 minutes daily", value: "daily_long" }
] as const;

export default function QuranTimeScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());
  const [selected, setSelected] = useState("");

  useEffect(() => {
    void trackOnboardingStepViewed("quran_time", STEP);
  }, []);

  const onContinue = async () => {
    await updatePreferences({ quranTime: selected });
    void trackOnboardingStepCompleted("quran_time", STEP, startedAtRef.current);
    router.push("/(onboarding)/plan-intro");
  };

  return (
    <OnboardingFrame
      step={STEP}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="How much time do you spend with Quran?"
      subtitle=""
      primaryLabel="Continue"
      onPrimaryPress={onContinue}
      primaryDisabled={!selected}
      backHref="/(onboarding)/prayer-life"
    >
      {OPTIONS.map((opt) => (
        <ChoiceOption
          key={opt.value}
          label={opt.label}
          description=""
          selected={selected === opt.value}
          onPress={() => setSelected(opt.value)}
        />
      ))}
    </OnboardingFrame>
  );
}
