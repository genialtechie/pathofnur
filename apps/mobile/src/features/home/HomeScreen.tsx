import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import type { InterventionPayload } from "@imaan/contracts";

import { trackScreenView } from "@/src/lib/analytics/track";
import { fontFamily, spacing, useTheme } from "@/src/theme";

import { HomeInterventionError, submitHomeIntervention } from "./submit-home-intervention";

function getDevotionalContextLine(date = new Date()) {
  const hour = date.getHours();

  if (hour < 11) {
    return "Begin with what the heart is carrying.";
  }

  if (hour < 17) {
    return "Return gently with what is heavy.";
  }

  if (hour < 21) {
    return "Let the day soften into remembrance.";
  }

  return "A quiet place to bring the night back to Allah.";
}

function getGuidanceCopy(status: "idle" | "submitting" | "resolved") {
  if (status === "submitting") {
    return "Stay here for a moment. We are gathering something grounded and calm.";
  }

  if (status === "resolved") {
    return "Take what you need from this moment, then continue when you are ready.";
  }

  return "Write it as it is: a fear, a question, a sharp moment, or something you cannot quite name yet.";
}

function getErrorMessage(error: unknown) {
  if (error instanceof HomeInterventionError) {
    if (error.status >= 500) {
      return "The response could not be gathered right now. Please try again in a moment.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something interrupted this moment. Please try again.";
}

function ResultSurface({
  colors,
  onReset,
  payload,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  onReset: () => void;
  payload: InterventionPayload;
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.resultScrollContent}
    >
      <View style={styles.resultHeader}>
        <Text style={[styles.resultEyebrow, { color: colors.brand.metallicGold }]}>A grounded return</Text>
        <Text style={[styles.resultTitle, { color: colors.text.primary }]}>{payload.title}</Text>
        <Text style={[styles.resultValidation, { color: colors.text.secondary }]}>
          {payload.validationCopy}
        </Text>
      </View>

      <View
        style={[
          styles.resultBody,
          {
            backgroundColor: colors.surface.card,
            borderColor: colors.surface.borderElevated,
          },
        ]}
      >
        <Text style={[styles.resultPrimaryText, { color: colors.text.primary }]}>
          {payload.primaryText}
        </Text>
      </View>

      <View style={styles.citationsSection}>
        <Text style={[styles.citationsTitle, { color: colors.text.tertiary }]}>Grounded in</Text>
        {payload.citations.map((citation) => (
          <View
            key={citation.id}
            style={[
              styles.citationCard,
              {
                backgroundColor: colors.surface.card,
                borderColor: colors.surface.border,
              },
            ]}
          >
            <Text style={[styles.citationReference, { color: colors.text.primary }]}>
              {citation.title} · {citation.reference}
            </Text>
            <Text style={[styles.citationExcerpt, { color: colors.text.secondary }]}>
              {citation.excerpt}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onReset}
        style={[
          styles.secondaryAction,
          {
            borderColor: colors.surface.borderElevated,
          },
        ]}
      >
        <Text style={[styles.secondaryActionLabel, { color: colors.text.primary }]}>
          Ask about something else
        </Text>
      </Pressable>
    </ScrollView>
  );
}

export function HomeScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedIntervention, setResolvedIntervention] = useState<InterventionPayload | null>(null);

  const { colors, isDark } = useTheme();
  const auraOpacity = useRef(new Animated.Value(0.42)).current;
  const auraScale = useRef(new Animated.Value(1)).current;
  const accentOpacity = useRef(new Animated.Value(0.28)).current;

  const contextLine = useMemo(() => getDevotionalContextLine(), []);
  const stageStatus = resolvedIntervention ? "resolved" : isSubmitting ? "submitting" : "idle";
  const trimmedInput = inputText.trim();

  useFocusEffect(
    useCallback(() => {
      trackScreenView("home");
    }, []),
  );

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(auraOpacity, {
            duration: 4200,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.62,
            useNativeDriver: true,
          }),
          Animated.timing(auraScale, {
            duration: 4200,
            easing: Easing.inOut(Easing.ease),
            toValue: 1.08,
            useNativeDriver: true,
          }),
          Animated.timing(accentOpacity, {
            duration: 4200,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.4,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(auraOpacity, {
            duration: 4200,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.4,
            useNativeDriver: true,
          }),
          Animated.timing(auraScale, {
            duration: 4200,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.98,
            useNativeDriver: true,
          }),
          Animated.timing(accentOpacity, {
            duration: 4200,
            easing: Easing.inOut(Easing.ease),
            toValue: 0.22,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [accentOpacity, auraOpacity, auraScale]);

  const handleSubmit = useCallback(async () => {
    if (!trimmedInput || isSubmitting) {
      if (!trimmedInput) {
        setErrorMessage("Write what is weighing on you first.");
      }
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = await submitHomeIntervention(trimmedInput);
      setResolvedIntervention(payload);
      setInputText("");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, trimmedInput]);

  const handleReset = useCallback(() => {
    setErrorMessage(null);
    setResolvedIntervention(null);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.container}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.aura,
              styles.auraPrimary,
              {
                backgroundColor: colors.brand.metallicGold,
                opacity: auraOpacity,
                transform: [{ scale: auraScale }],
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.aura,
              styles.auraAccent,
              {
                backgroundColor: colors.brand.midnightBlue,
                opacity: accentOpacity,
              },
            ]}
          />

          <View style={styles.chrome}>
            <Text style={[styles.contextLine, { color: colors.text.tertiary }]}>{contextLine}</Text>
          </View>

          {resolvedIntervention ? (
            <View style={styles.resultStage}>
              <ResultSurface colors={colors} onReset={handleReset} payload={resolvedIntervention} />
            </View>
          ) : (
            <View style={styles.entryStage}>
              <View style={styles.copyBlock}>
                <Text style={[styles.promptLabel, { color: colors.brand.metallicGold }]}>
                  Home
                </Text>
                <Text style={[styles.promptTitle, { color: colors.text.primary }]}>
                  What is weighing on you right now?
                </Text>
                <Text style={[styles.promptBody, { color: colors.text.secondary }]}>
                  {getGuidanceCopy(stageStatus)}
                </Text>
              </View>

              <View
                style={[
                  styles.composerShell,
                  {
                    backgroundColor: colors.surface.card,
                    borderColor: isFocused
                      ? colors.brand.metallicGold
                      : colors.surface.borderElevated,
                  },
                ]}
              >
                <TextInput
                  multiline
                  onBlur={() => setIsFocused(false)}
                  onChangeText={(nextValue) => {
                    setInputText(nextValue);
                    if (errorMessage) {
                      setErrorMessage(null);
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  placeholder="A fear. A question. A moment that feels hard to carry."
                  placeholderTextColor={colors.text.muted}
                  selectionColor={colors.brand.metallicGold}
                  style={[styles.composerInput, { color: colors.text.primary }]}
                  textAlignVertical="top"
                  value={inputText}
                />

                <View style={styles.composerFooter}>
                  <Text style={[styles.composerHint, { color: colors.text.tertiary }]}>
                    No need to word it perfectly.
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    onPress={() => {
                      void handleSubmit();
                    }}
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: trimmedInput
                          ? colors.brand.metallicGold
                          : colors.surface.borderInteractive,
                        opacity: isSubmitting ? 0.76 : 1,
                      },
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={colors.text.onAccent} size="small" />
                    ) : (
                      <Text style={[styles.submitLabel, { color: colors.text.onAccent }]}>
                        Enter
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>

              <View style={styles.feedbackBlock}>
                {errorMessage ? (
                  <Text style={[styles.errorText, { color: colors.text.error }]}>{errorMessage}</Text>
                ) : (
                  <Text style={[styles.statusText, { color: colors.text.tertiary }]}>
                    {isSubmitting
                      ? "Receiving something grounded..."
                      : "This space is for what needs grounding, clarity, or a steadier return."}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  aura: {
    borderRadius: 999,
    position: "absolute",
  },
  auraAccent: {
    height: 260,
    left: -48,
    top: "38%",
    width: 260,
  },
  auraPrimary: {
    height: 320,
    right: -84,
    top: 104,
    width: 320,
  },
  chrome: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  composerFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  composerHint: {
    flex: 1,
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    lineHeight: 18,
    paddingRight: spacing.md,
  },
  composerInput: {
    fontFamily: fontFamily.appRegular,
    fontSize: 18,
    lineHeight: 28,
    minHeight: 176,
  },
  composerShell: {
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  container: {
    flex: 1,
  },
  contextLine: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    letterSpacing: 0.08,
    lineHeight: 18,
  },
  citationCard: {
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  citationExcerpt: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 22,
  },
  citationReference: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  citationsSection: {
    gap: spacing.sm,
  },
  citationsTitle: {
    color: "#93a1b5",
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  copyBlock: {
    gap: spacing.md,
  },
  entryStage: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["4xl"],
    paddingTop: spacing["3xl"],
  },
  errorText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackBlock: {
    marginTop: spacing.lg,
    minHeight: 24,
  },
  promptBody: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 27,
    maxWidth: 420,
  },
  promptLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  promptTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 42,
    lineHeight: 46,
    maxWidth: 340,
  },
  resultBody: {
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.xl,
  },
  resultEyebrow: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  resultHeader: {
    gap: spacing.sm,
  },
  resultPrimaryText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 17,
    lineHeight: 29,
  },
  resultScrollContent: {
    gap: spacing.lg,
    paddingBottom: 140,
  },
  resultStage: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["2xl"],
    paddingTop: spacing["2xl"],
  },
  resultTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    lineHeight: 38,
  },
  resultValidation: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 420,
  },
  secondaryAction: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: spacing.xl,
    alignSelf: "flex-start",
  },
  secondaryActionLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
  statusText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    alignItems: "center",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 104,
    paddingHorizontal: spacing.lg,
  },
  submitLabel: {
    fontFamily: fontFamily.appBold,
    fontSize: 15,
  },
});
