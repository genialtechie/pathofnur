import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { OnboardingFrame } from "@/src/features/donate/onboarding-frame";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";
import { fontFamily } from "@/src/components/navigation/typography";

const STEP = 8;

const GOALS = [
  { label: "Daily Salah", emoji: "🕌", value: "salah" },
  { label: "Fasting", emoji: "🌙", value: "fasting" },
  { label: "Quran & Recitation", emoji: "📖", value: "quran" },
  { label: "Duas & Dhikr", emoji: "📿", value: "duas" },
  { label: "Sleep & Calm", emoji: "🌊", value: "calm" },
  { label: "Ramadan Journey", emoji: "⭐", value: "ramadan" }
] as const;

export default function PlanBuilderScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    void trackOnboardingStepViewed("plan_builder", STEP);
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
    await updatePreferences({ planGoals: Array.from(selected) });
    void trackOnboardingStepCompleted("plan_builder", STEP, startedAtRef.current);
    router.push("/(onboarding)/plan-time");
  };

  return (
    <OnboardingFrame
      step={STEP}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="What do you want to focus on?"
      subtitle="Select all that apply — you can change these anytime."
      primaryLabel="Continue"
      onPrimaryPress={onContinue}
      primaryDisabled={selected.size === 0}
      backHref="/(onboarding)/plan-intro"
    >
      <View style={styles.grid}>
        {GOALS.map((goal) => {
          const isSelected = selected.has(goal.value);
          return (
            <Pressable
              key={goal.value}
              style={[styles.card, isSelected && styles.cardSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => toggle(goal.value)}
            >
              <Text style={styles.emoji}>{goal.emoji}</Text>
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                {goal.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center"
  },
  card: {
    width: "47%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1a2639",
    backgroundColor: "#0b1220",
    paddingVertical: 20,
    gap: 8
  },
  cardSelected: {
    borderColor: "#c5a021",
    backgroundColor: "#101a2b"
  },
  emoji: {
    fontSize: 32
  },
  cardLabel: {
    color: "#eff2f7",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
    textAlign: "center"
  },
  cardLabelSelected: {
    color: "#c5a021"
  }
});
