import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";

const STEP = 2;

const OPTIONS = [
  { label: "Grow closer to Allah", value: "closer_to_allah" },
  { label: "Build a prayer habit", value: "prayer_habit" },
  { label: "Prepare for Ramadan", value: "ramadan_prep" },
  { label: "Find peace and calm", value: "peace_calm" },
  { label: "Learn more Quran", value: "learn_quran" },
  { label: "Reconnect with my faith", value: "reconnect" }
] as const;

export default function IntentScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    void trackOnboardingStepViewed("intent", STEP);
  }, []);

  const toggle = (value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const onContinue = async () => {
    await updatePreferences({ intent: Array.from(selected) });
    void trackOnboardingStepCompleted("intent", STEP, startedAtRef.current);
    router.push("/(onboarding)/journey");
  };

  return (
    <OnboardingFrame
      step={STEP}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="What brings you to Path of Nur?"
      subtitle="Select all that apply"
      primaryLabel="Continue"
      onPrimaryPress={onContinue}
      primaryDisabled={selected.size === 0}
      backHref="/(onboarding)/welcome"
    >
      {OPTIONS.map((opt) => (
        <ChoiceOption
          key={opt.value}
          label={opt.label}
          description=""
          selected={selected.has(opt.value)}
          onPress={() => toggle(opt.value)}
        />
      ))}
    </OnboardingFrame>
  );
}
