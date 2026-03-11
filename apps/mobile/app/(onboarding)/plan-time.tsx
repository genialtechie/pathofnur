import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";

const STEP = 9;

const OPTIONS = [
  { label: "5 minutes or less", value: "5min" },
  { label: "10 minutes", value: "10min" },
  { label: "15 minutes", value: "15min" },
  { label: "20 minutes", value: "20min" },
  { label: "30+ minutes", value: "30min" }
] as const;

export default function PlanTimeScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());
  const [selected, setSelected] = useState("");

  useEffect(() => {
    void trackOnboardingStepViewed("plan_time", STEP);
  }, []);

  const onContinue = async () => {
    await updatePreferences({ dailyMinutes: selected });
    void trackOnboardingStepCompleted("plan_time", STEP, startedAtRef.current);
    router.push("/(onboarding)/notifications");
  };

  return (
    <OnboardingFrame
      step={STEP}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="How much time would you like to spend each day?"
      subtitle="Start small — you can always adjust."
      primaryLabel="Continue"
      onPrimaryPress={onContinue}
      primaryDisabled={!selected}
      backHref="/(onboarding)/plan-builder"
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
