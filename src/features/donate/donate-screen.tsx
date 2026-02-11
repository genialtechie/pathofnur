import { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { fontFamily } from "@/src/components/navigation/typography";

const PRESET_AMOUNTS = [5, 15, 30, 75] as const;
const STRIPE_DONATION_URL = "https://pathofnur.com/donate";

export function DonateScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const [amount, setAmount] = useState<number>(15);

  const sourceLabel = useMemo(() => {
    if (source === "onboarding_complete") return "Onboarding";
    if (source) return source;
    return "General";
  }, [source]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.kicker} selectable>
          Support Path of Nur
        </Text>
        <Text style={styles.title} selectable>
          Keep it free for the Ummah
        </Text>
        <Text style={styles.subtitle} selectable>
          Your donation helps fund recitation licensing, infrastructure, and product
          development for Ramadan 2026.
        </Text>

        <View style={styles.sourceCard}>
          <Text style={styles.sourceLabel} selectable>
            Entry point
          </Text>
          <Text style={styles.sourceValue} selectable>
            {sourceLabel}
          </Text>
        </View>

        <View style={styles.amountGrid}>
          {PRESET_AMOUNTS.map((preset) => {
            const selected = amount === preset;
            return (
              <Pressable
                key={preset}
                style={[styles.amountButton, selected ? styles.amountButtonSelected : null]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setAmount(preset)}
              >
                <Text style={styles.amountText}>{`$${preset}`}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          accessibilityRole="button"
          onPress={() => Linking.openURL(`${STRIPE_DONATION_URL}?amount=${amount}`)}
        >
          <Text style={styles.primaryButtonLabel}>{`Donate $${amount} via Stripe`}</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          accessibilityRole="button"
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Text style={styles.secondaryButtonLabel}>Continue to Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070b14"
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 16
  },
  kicker: {
    color: "#93a1b5",
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    color: "#f3f5f7",
    fontFamily: fontFamily.uiBold,
    fontSize: 34,
    lineHeight: 38
  },
  subtitle: {
    color: "#b4c0d1",
    fontFamily: fontFamily.bodyRegular,
    fontSize: 17,
    lineHeight: 25
  },
  sourceCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1a2639",
    backgroundColor: "#0b1220",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6
  },
  sourceLabel: {
    color: "#93a1b5",
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 12,
    textTransform: "uppercase"
  },
  sourceValue: {
    color: "#f3f5f7",
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 18
  },
  amountGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  amountButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 74,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#223146",
    backgroundColor: "#0b1220",
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  amountButtonSelected: {
    borderColor: "#c5a021",
    backgroundColor: "#101a2b"
  },
  amountText: {
    color: "#f3f5f7",
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 16
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#111a2a",
    backgroundColor: "#070b14",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 10
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    minHeight: 54,
    backgroundColor: "#c5a021",
    paddingHorizontal: 24
  },
  primaryButtonLabel: {
    color: "#070b14",
    fontFamily: fontFamily.uiBold,
    fontSize: 17
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40
  },
  secondaryButtonLabel: {
    color: "#d6deea",
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 15
  }
});
