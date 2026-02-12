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

const STEP = 4;

export default function QuranBreakScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStepViewed("quran_break", STEP);
  }, []);

  const onContinue = () => {
    void trackOnboardingStepCompleted("quran_break", STEP, startedAtRef.current);
    router.push("/(onboarding)/prayer-life");
  };

  return (
    <ImageBackground
      source={require("@/assets/images/onboarding/quran-break.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.spacer} />

        <Text style={styles.quote} selectable>
          "Verily, with hardship{"\n"}comes ease."
        </Text>
        <Text style={styles.source} selectable>
          Quran 94:6 — Surah Ash-Sharh
        </Text>

        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={onContinue}>
            <Text style={styles.primaryLabel}>Continue</Text>
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
    backgroundColor: "rgba(7,11,20,0.45)"
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingBottom: 40
  },
  spacer: { flex: 1 },
  quote: {
    color: "#f3f5f7",
    fontFamily: fontFamily.scriptureRegular,
    fontSize: 30,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 44,
    marginBottom: 12
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
