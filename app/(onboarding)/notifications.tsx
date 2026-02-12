import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import {
  ImageBackground,
  Platform,
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

    if (Platform.OS === "web") {
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        granted = result === "granted";
      }
    } else {
      granted = true;
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
    <ImageBackground
      source={require("@/assets/images/onboarding/notifications.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.content}>
        <View style={styles.spacer} />

        <Text style={styles.title} selectable>
          Never miss a prayer again
        </Text>
        <Text style={styles.subtitle} selectable>
          Get a gentle reminder before each prayer time, and start your day with
          Fajr.
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
            We'll only send prayer reminders — never spam.
          </Text>
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
    textAlign: "center"
  }
});
