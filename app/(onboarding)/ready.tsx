import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingCompleted,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { OnboardingImageBackground } from "@/src/features/donate/onboarding-image-background";
import { onboardingImages } from "@/src/features/donate/onboarding-images";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";
import { usePreferences } from "@/src/lib/preferences/use-preferences";
import { fontFamily } from "@/src/components/navigation/typography";

const STEP = 12;

const TIME_LABELS: Record<string, string> = {
  "5min": "5 minutes",
  "10min": "10 minutes",
  "15min": "15 minutes",
  "20min": "20 minutes",
  "30min": "30+ minutes"
};

const GOAL_LABELS: Record<string, string> = {
  salah: "Salah",
  fasting: "Fasting",
  quran: "Quran",
  duas: "Duas & Dhikr",
  calm: "Sleep & Calm",
  ramadan: "Ramadan"
};

export default function ReadyScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());
  const { prefs, isLoading } = usePreferences();

  useEffect(() => {
    void trackOnboardingStepViewed("ready", STEP);
  }, []);

  const startJourney = async () => {
    await updatePreferences({ completedOnboarding: true });
    void trackOnboardingStepCompleted("ready", STEP, startedAtRef.current);
    void trackOnboardingCompleted();
    router.replace("/(tabs)/home" as never);
  };

  const goToDonate = async () => {
    await updatePreferences({ completedOnboarding: true });
    void trackOnboardingCompleted();
    router.replace("/donate?source=onboarding" as never);
  };

  const focusLabels = prefs.planGoals
    .map((g) => GOAL_LABELS[g] || g)
    .join(", ");
  const timeLabel = TIME_LABELS[prefs.dailyMinutes] || prefs.dailyMinutes;
  const cityLabel = prefs.city || "Location pending";

  if (isLoading) return null;

  return (
    <OnboardingImageBackground
      source={onboardingImages.ready}
      style={styles.bg}
      overlayOpacity={0.55}
    >
      <View style={styles.content}>
        <View style={styles.spacer} />

        <Text style={styles.title} selectable>
          Your path is ready
        </Text>

        <View style={styles.summaryCard}>
          {prefs.city ? (
            <SummaryRow emoji="📍" label="Location" value={cityLabel} />
          ) : null}
          {focusLabels ? (
            <SummaryRow emoji="📖" label="Focus" value={focusLabels} />
          ) : null}
          {timeLabel ? (
            <SummaryRow emoji="⏱" label="Daily goal" value={timeLabel} />
          ) : null}
          {prefs.notificationsEnabled ? (
            <SummaryRow emoji="🔔" label="Reminders" value="Enabled" />
          ) : null}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={startJourney}>
            <Text style={styles.primaryLabel}>Start my journey</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={goToDonate}>
            <Text style={styles.secondaryLabel}>Support Path of Nur</Text>
          </Pressable>
        </View>
      </View>
    </OnboardingImageBackground>
  );
}

function SummaryRow({
  emoji,
  label,
  value
}: {
  emoji: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#070b14"
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 40
  },
  spacer: { flex: 1 },
  title: {
    color: "#f3f5f7",
    fontFamily: fontFamily.appBold,
    fontSize: 32,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 20
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(11,18,32,0.85)",
    padding: 16,
    gap: 14,
    marginBottom: 28
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  rowEmoji: {
    fontSize: 22
  },
  rowText: {
    flex: 1,
    gap: 2
  },
  rowLabel: {
    color: "#8fa0b7",
    fontFamily: fontFamily.appRegular,
    fontSize: 13
  },
  rowValue: {
    color: "#eff2f7",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16
  },
  footer: {
    gap: 12,
    alignItems: "center"
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#c5a021",
    minHeight: 54,
    paddingHorizontal: 24,
    alignSelf: "stretch"
  },
  primaryLabel: {
    color: "#070b14",
    fontFamily: fontFamily.appBold,
    fontSize: 17
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40
  },
  secondaryLabel: {
    color: "#d6deea",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15
  }
});
