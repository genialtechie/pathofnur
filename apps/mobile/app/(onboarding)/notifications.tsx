import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import * as Notifications from "expo-notifications";

import {
  TOTAL_ONBOARDING_STEPS,
  trackOnboardingStepCompleted,
  trackOnboardingStepViewed
} from "@/src/features/donate/onboarding-analytics";
import { OnboardingImageBackground } from "@/src/features/donate/onboarding-image-background";
import { onboardingImages } from "@/src/features/donate/onboarding-images";
import { updatePreferences } from "@/src/lib/preferences/preferences-store";
import { fontFamily } from "@/src/components/navigation/typography";

const STEP = 10;

export default function NotificationsScreen() {
  const router = useRouter();
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    void trackOnboardingStepViewed("notifications", STEP);
  }, []);

  const requestNotificationPermission = async () => {
    let granted = false;

    if (process.env.EXPO_OS === "web") {
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        granted = result === "granted";
      }
    } else {
      const current = await Notifications.getPermissionsAsync();
      if (
        current.granted ||
        current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
      ) {
        granted = true;
      } else {
        const requested = await Notifications.requestPermissionsAsync();
        granted =
          requested.granted ||
          requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      }
    }

    await updatePreferences({ notificationsEnabled: granted });
    void trackOnboardingStepCompleted("notifications", STEP, startedAtRef.current);
    router.push("/(onboarding)/location");
  };

  const skip = () => {
    void updatePreferences({ notificationsEnabled: false });
    void trackOnboardingStepCompleted("notifications", STEP, startedAtRef.current);
    router.push("/(onboarding)/location");
  };

  return (
    <OnboardingImageBackground
      source={onboardingImages.notifications}
      style={styles.bg}
      overlayOpacity={0.5}
    >
      <View style={styles.content}>
        <View style={styles.spacer} />

        <Text style={styles.title} selectable>
          Let Path of Nur bring you back gently
        </Text>
        <Text style={styles.subtitle} selectable>
          We'll remind you before each prayer and follow up softly after, so your daily salah can stay visible.
        </Text>

        <View style={styles.footer}>
          <Pressable
            style={styles.primaryButton}
            onPress={requestNotificationPermission}
          >
            <Text style={styles.primaryLabel}>Enable reminders</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={skip}>
            <Text style={styles.secondaryLabel}>Not now</Text>
          </Pressable>
          <Text style={styles.note}>
            Only prayer reminders and check-ins. Nothing noisy.
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
  title: {
    color: "#f3f5f7",
    fontFamily: fontFamily.appBold,
    fontSize: 28,
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 12
  },
  subtitle: {
    color: "#dce3ed",
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
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
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40
  },
  secondaryLabel: {
    color: "#d6deea",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15
  },
  note: {
    color: "#5d6d84",
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center"
  }
});
