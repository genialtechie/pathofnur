import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { fontFamily } from "@/src/components/navigation/typography";

const STEP = 7;

export default function PlanIntroScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStepViewed("plan_intro", STEP);
  }, []);

  const onContinue = () => {
    void trackOnboardingStepCompleted("plan_intro", STEP, startedAtRef.current);
    router.push("/(onboarding)/plan-builder");
  };

  return (
    <ImageBackground
      source={require("@/assets/images/onboarding/plan-break.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.spacer} />

        <Text style={styles.headline} selectable>
          Let's build your personal{"\n"}prayer plan.
        </Text>
        <Text style={styles.hadith} selectable>
          "The most beloved of deeds to Allah are those that are most consistent,
          even if small."
        </Text>
        <Text style={styles.source}>Sahih al-Bukhari</Text>

        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={onContinue}>
            <Text style={styles.primaryLabel}>Let's go</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: "#070b14"
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7,11,20,0.50)"
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 40
  },
  spacer: { flex: 1 },
  headline: {
    color: "#f3f5f7",
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 16
  },
  hadith: {
    color: "#dce3ed",
    fontFamily: fontFamily.scriptureRegular,
    fontSize: 17,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 26,
    paddingHorizontal: 8,
    marginBottom: 8
  },
  source: {
    color: "#c5a021",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 40
  },
  footer: {
    gap: 12
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#c5a021",
    minHeight: 54,
    paddingHorizontal: 24
  },
  primaryLabel: {
    color: "#070b14",
    fontFamily: fontFamily.appBold,
    fontSize: 17
  }
});
