import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { ChoiceOption, OnboardingFrame } from "@/src/features/donate/onboarding-frame";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";

const STEP = 5;

const OPTIONS = [
  { label: "I rarely pray", value: "rarely" },
  { label: "A few times a week", value: "few_weekly" },
  { label: "Daily, but I miss some", value: "daily_inconsistent" },
  { label: "All five, most days", value: "daily_consistent" },
  { label: "All five, never miss", value: "five_daily" }
] as const;

export default function PrayerLifeScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());
  const [selected, setSelected] = useState("");

  useEffect(() => {
    void trackOnboardingStepViewed("prayer_life", STEP);
  }, []);

  const onContinue = async () => {
    await updatePreferences({ prayerConsistency: selected });
    void trackOnboardingStepCompleted("prayer_life", STEP, startedAtRef.current);
    router.push("/(onboarding)/quran-time");
  };

  return (
    <OnboardingFrame
      step={STEP}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="How consistent is your salah right now?"
      subtitle="No judgment — this helps us meet you where you are."
      primaryLabel="Continue"
      onPrimaryPress={onContinue}
      primaryDisabled={!selected}
      backHref="/(onboarding)/quran-break"
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
