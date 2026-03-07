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
  trackOnboardingStarted,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { OnboardingImageBackground } from "@/src/features/donate/onboarding-image-background";
import { onboardingImages } from "@/src/features/donate/onboarding-images";
import { fontFamily } from "@/src/components/navigation/typography";

const STEP = 1;

export default function WelcomeScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStarted();
    void trackOnboardingStepViewed("welcome", STEP);
  }, []);

  const onContinue = () => {
    void trackOnboardingStepCompleted("welcome", STEP, startedAtRef.current);
    router.push("/(onboarding)/intent");
  };

  return (
    <OnboardingImageBackground
      source={onboardingImages.bismillah}
      style={styles.bg}
      overlayOpacity={0.55}
    >
      <View style={styles.content}>
        <View style={styles.spacer} />

        <Text style={styles.arabic} selectable>
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </Text>
        <Text style={styles.translation} selectable>
          In the name of God, the Most Gracious, the Most Merciful.
        </Text>
        <Text style={styles.body} selectable>
          Path of Nur is your gentle companion for prayer, Quran, and spiritual
          growth. We'll set up your personal path in under 2 minutes.
        </Text>

        <View style={styles.footer}>
          <Pressable style={styles.primaryButton} onPress={onContinue}>
            <Text style={styles.primaryLabel}>Begin</Text>
          </Pressable>
          <Text style={styles.privacy}>
            Your preferences stay on your device.
          </Text>
        </View>
      </View>
    </OnboardingImageBackground>
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
  arabic: {
    color: "#f3f5f7",
    fontFamily: fontFamily.arabicBold,
    fontSize: 32,
    textAlign: "center",
    lineHeight: 48,
    marginBottom: 8
  },
  translation: {
    color: "#c5a021",
    fontFamily: fontFamily.scriptureRegular,
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 24,
    marginBottom: 16
  },
  body: {
    color: "#dce3ed",
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 32
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
  privacy: {
    color: "#5d6d84",
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    textAlign: "center"
  }
});
