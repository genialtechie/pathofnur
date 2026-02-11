import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { fontFamily } from "@/src/components/navigation/typography";
import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingCompleted,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { OnboardingFrame } from "@/src/features/donate/onboarding-frame";

const LABELS = {
  beginner: "Starting out",
  consistent: "Regular prayer cadence",
  rebuilding: "Rebuilding consistency",
  "daily-5": "Daily 5-minute path",
  "daily-15": "Daily 15-minute path",
  weekend: "Weekend deep sessions",
  consistency: "Salah consistency",
  quran: "Quran and ambiance",
  calm: "Calm and resilience"
} as const;

function toLabel(value?: string) {
  return LABELS[value as keyof typeof LABELS] ?? "Personalized";
}

export default function OnboardingCompleteRoute() {
  const router = useRouter();
  const { practice, rhythm, focus } = useLocalSearchParams<{
    practice?: string;
    rhythm?: string;
    focus?: string;
  }>();
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStepViewed("complete", 5);
  }, []);

  const finalizeToDonate = () => {
    void trackOnboardingStepCompleted("complete", 5, startedAtRef.current);
    void trackOnboardingCompleted();
    router.push({
      pathname: "/donate",
      params: { source: "onboarding_complete" }
    });
  };

  const finalizeToHome = () => {
    void trackOnboardingStepCompleted("complete", 5, startedAtRef.current);
    void trackOnboardingCompleted();
    router.replace("/(tabs)/home");
  };

  return (
    <OnboardingFrame
      step={5}
      totalSteps={TOTAL_ONBOARDING_STEPS}
      title="Your first path is ready"
      subtitle="Before we begin, you can help keep Path of Nur free for more people."
      primaryLabel="Support Path of Nur"
      secondaryLabel="Skip for now"
      backHref="/(onboarding)/focus"
      onPrimaryPress={finalizeToDonate}
      onSecondaryPress={finalizeToHome}
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryHeading}>Your setup</Text>
        <Text style={styles.summaryRow} selectable>
          Practice: {toLabel(practice)}
        </Text>
        <Text style={styles.summaryRow} selectable>
          Rhythm: {toLabel(rhythm)}
        </Text>
        <Text style={styles.summaryRow} selectable>
          Focus: {toLabel(focus)}
        </Text>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1a2639",
    backgroundColor: "#0b1220",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8
  },
  summaryHeading: {
    color: "#eff2f7",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16
  },
  summaryRow: {
    color: "#b4c0d1",
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22
  }
});
