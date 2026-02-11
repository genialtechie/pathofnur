import type { ReactNode } from "react";
import type { Href } from "expo-router";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { fontFamily } from "@/src/components/navigation/typography";

type OnboardingFrameProps = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  backHref?: Href;
  children?: ReactNode;
};

export function OnboardingFrame({
  step,
  totalSteps,
  title,
  subtitle,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
  secondaryLabel,
  onSecondaryPress,
  backHref,
  children
}: OnboardingFrameProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
      >
        <View style={styles.topRow}>
          {backHref ? (
            <Pressable
              style={styles.backButton}
              accessibilityRole="button"
              onPress={() => router.push(backHref)}
            >
              <Text style={styles.backButtonLabel}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
          <Text style={styles.stepLabel}>{`Step ${step} of ${totalSteps}`}</Text>
        </View>

        <ProgressPills step={step} totalSteps={totalSteps} />

        <Text style={styles.title} selectable>
          {title}
        </Text>
        <Text style={styles.subtitle} selectable>
          {subtitle}
        </Text>

        <View style={styles.body}>{children}</View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.primaryButton,
            primaryDisabled ? styles.primaryButtonDisabled : undefined
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!primaryDisabled }}
          disabled={primaryDisabled}
          onPress={onPrimaryPress}
        >
          <Text style={styles.primaryButtonLabel}>{primaryLabel}</Text>
        </Pressable>
        {secondaryLabel && onSecondaryPress ? (
          <Pressable
            style={styles.secondaryButton}
            accessibilityRole="button"
            onPress={onSecondaryPress}
          >
            <Text style={styles.secondaryButtonLabel}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type ProgressPillsProps = {
  step: number;
  totalSteps: number;
};

function ProgressPills({ step, totalSteps }: ProgressPillsProps) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const pillStep = index + 1;
        const isActive = pillStep <= step;
        return (
          <View
            key={pillStep}
            style={[styles.progressPill, isActive ? styles.progressPillActive : null]}
          />
        );
      })}
    </View>
  );
}

type ChoiceOptionProps = {
  label: string;
  description: string;
  selected?: boolean;
  onPress: () => void;
};

export function ChoiceOption({
  label,
  description,
  selected,
  onPress
}: ChoiceOptionProps) {
  return (
    <Pressable
      style={[styles.choiceOption, selected ? styles.choiceOptionSelected : null]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      <Text style={styles.choiceDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070b14"
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  backButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#223146",
    backgroundColor: "#0b1220",
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  backButtonPlaceholder: {
    width: 64
  },
  backButtonLabel: {
    color: "#d6deea",
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 12
  },
  stepLabel: {
    color: "#93a1b5",
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 12
  },
  progressRow: {
    flexDirection: "row",
    gap: 8
  },
  progressPill: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#253246"
  },
  progressPillActive: {
    backgroundColor: "#c5a021"
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
  body: {
    gap: 12,
    marginTop: 8
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#111a2a",
    backgroundColor: "#070b14",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
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
  primaryButtonDisabled: {
    backgroundColor: "#7f6d2f"
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
  },
  choiceOption: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#1a2639",
    backgroundColor: "#0b1220",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6
  },
  choiceOptionSelected: {
    borderColor: "#c5a021",
    backgroundColor: "#101a2b"
  },
  choiceLabel: {
    color: "#eff2f7",
    fontFamily: fontFamily.uiSemiBold,
    fontSize: 16
  },
  choiceDescription: {
    color: "#9babc1",
    fontFamily: fontFamily.bodyRegular,
    fontSize: 14,
    lineHeight: 20
  }
});
