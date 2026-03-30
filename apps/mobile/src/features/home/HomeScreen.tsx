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
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";

import type { Citation, InterventionPayload } from "@imaan/contracts";

import { trackScreenView } from "@/src/lib/analytics/track";
import { fontFamily, spacing, useTheme } from "@/src/theme";

import {
  DuaSourceIcon,
  HadithSourceIcon,
  QuranSourceIcon,
  SendArrowIcon,
} from "./home-icons";
import { HomeInterventionError, submitHomeIntervention } from "./submit-home-intervention";

type PromptStarter = {
  body: string;
  id: string;
  prompt: string;
  title: string;
};

const PROMPT_STARTERS: PromptStarter[] = [
  {
    id: "grounding",
    title: "I need grounding",
    body: "For the moment that feels too loud, too heavy, or too fast.",
    prompt: "I feel unsettled right now and need grounding in something true.",
  },
  {
    id: "clarity",
    title: "Help me make sense of this",
    body: "For confusion, friction, or something you cannot quite place yet.",
    prompt: "Help me make sense of what I am carrying right now.",
  },
];

const LOADING_COPY = [
  "Searching for something grounded in Quran and Hadith.",
  "Holding the moment long enough to answer it gently.",
  "Shaping the response into something you can actually return to.",
];

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

function getStarterCardColors(index: number, colors: ReturnType<typeof useTheme>["colors"]) {
  if (index === 0) {
    return {
      backgroundColor: colors.interactive.selectedBackground,
      borderColor: colors.brand.metallicGold,
      iconColor: colors.brand.metallicGold,
    };
  }

  return {
    backgroundColor: colors.surface.card,
    borderColor: colors.surface.borderElevated,
    iconColor: colors.brand.midnightBlue,
  };
}

function getCitationLabel(sourceKind: Citation["sourceKind"]) {
  switch (sourceKind) {
    case "quran":
      return "Quran";
    case "hadith":
      return "Hadith";
    case "seerah":
      return "Seerah";
    case "fiqh":
      return "Guidance";
    default:
      return "Source";
  }
}

function getLoadingRailWidth(width: number) {
  return Math.min(Math.max(width - 80, 180), 288);
}

async function triggerLightHaptic() {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    return;
  }
}

function QuoteCard({
  colors,
  citation,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  citation: Citation;
}) {
  const isQuran = citation.sourceKind === "quran";
  const accentColor = isQuran ? colors.brand.metallicGold : colors.brand.midnightBlue;

  return (
    <View
      style={[
        styles.quoteCard,
        {
          backgroundColor: colors.surface.background,
          borderColor: colors.surface.borderElevated,
        },
      ]}
    >
      <View style={styles.quoteHeader}>
        <View
          style={[
            styles.quoteIconWrap,
            {
              backgroundColor: isQuran ? colors.interactive.selectedBackground : colors.surface.card,
              borderColor: accentColor,
            },
          ]}
        >
          {isQuran ? (
            <QuranSourceIcon color={accentColor} size={18} />
          ) : (
            <HadithSourceIcon color={accentColor} size={18} />
          )}
        </View>

        <View style={styles.quoteMetaBlock}>
          <Text style={[styles.quoteEyebrow, { color: accentColor }]}>
            {getCitationLabel(citation.sourceKind)}
          </Text>
          <Text style={[styles.quoteReference, { color: colors.text.secondary }]}>
            {citation.title} · {citation.reference}
          </Text>
        </View>
      </View>

      <Text selectable style={[styles.quoteText, { color: colors.text.primary }]}>
        {citation.excerpt}
      </Text>
    </View>
  );
}

function ReferenceRow({
  colors,
  citation,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  citation: Citation;
}) {
  return (
    <View
      style={[
        styles.referenceRow,
        {
          borderColor: colors.surface.border,
        },
      ]}
    >
      <Text style={[styles.referenceLabel, { color: colors.text.primary }]}>
        {getCitationLabel(citation.sourceKind)}
      </Text>
      <Text style={[styles.referenceValue, { color: colors.text.secondary }]}>
        {citation.title} · {citation.reference}
      </Text>
    </View>
  );
}

function LoadingStage({
  colors,
  loadingCopy,
  railProgress,
  railWidth,
}: {
  colors: ReturnType<typeof useTheme>["colors"];
  loadingCopy: string;
  railProgress: Animated.Value;
  railWidth: number;
}) {
  const fillWidth = railProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [railWidth * 0.18, railWidth * 0.76],
  });

  return (
    <View style={styles.loadingStage}>
      <View style={styles.loadingHeader}>
        <Text style={[styles.loadingEyebrow, { color: colors.brand.metallicGold }]}>
          Gathering a grounded response
        </Text>
        <Text style={[styles.loadingBody, { color: colors.text.secondary }]}>
          {loadingCopy}
        </Text>
      </View>

      <View
        style={[
          styles.loadingRail,
          {
            backgroundColor: colors.surface.card,
            borderColor: colors.surface.borderElevated,
            width: railWidth,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loadingRailFill,
            {
              backgroundColor: colors.brand.metallicGold,
              width: fillWidth,
            },
          ]}
        />
      </View>

      <View style={styles.loadingLegend}>
        <View style={styles.loadingLegendItem}>
          <QuranSourceIcon color={colors.brand.metallicGold} size={16} />
          <Text style={[styles.loadingLegendLabel, { color: colors.text.tertiary }]}>Quran</Text>
        </View>

        <View style={styles.loadingLegendItem}>
          <HadithSourceIcon color={colors.brand.midnightBlue} size={16} />
          <Text style={[styles.loadingLegendLabel, { color: colors.text.tertiary }]}>Hadith</Text>
        </View>

        <View style={styles.loadingLegendItem}>
          <DuaSourceIcon color={colors.text.tertiary} size={16} />
          <Text style={[styles.loadingLegendLabel, { color: colors.text.tertiary }]}>Response</Text>
        </View>
      </View>
    </View>
  );
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
  const quoteCitations = payload.citations.filter(
    (citation) => citation.sourceKind === "quran" || citation.sourceKind === "hadith",
  );
  const supportingCitations = payload.citations.filter(
    (citation) => citation.sourceKind !== "quran" && citation.sourceKind !== "hadith",
  );

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.resultScrollContent}
    >
      <View style={styles.resultCanvas}>
        <Text style={[styles.resultEyebrow, { color: colors.brand.metallicGold }]}>A grounded return</Text>
        <Text style={[styles.resultTitle, { color: colors.text.primary }]}>{payload.title}</Text>
        <Text style={[styles.resultValidation, { color: colors.text.secondary }]}>
          {payload.validationCopy}
        </Text>
      </View>

      <View
        style={[
          styles.readingSheet,
          {
            backgroundColor: colors.surface.card,
            borderColor: colors.surface.borderElevated,
          },
        ]}
      >
        <Text selectable style={[styles.resultPrimaryText, { color: colors.text.primary }]}>
          {payload.primaryText}
        </Text>

        {(payload.dua || payload.repeatCount) ? (
          <View
            style={[
              styles.duaCard,
              {
                backgroundColor: colors.surface.background,
                borderColor: colors.surface.borderElevated,
              },
            ]}
          >
            <View style={styles.quoteHeader}>
              <View
                style={[
                  styles.quoteIconWrap,
                  {
                    backgroundColor: colors.interactive.selectedBackground,
                    borderColor: colors.brand.metallicGold,
                  },
                ]}
              >
                <DuaSourceIcon color={colors.brand.metallicGold} size={18} />
              </View>

              <View style={styles.quoteMetaBlock}>
                <Text style={[styles.quoteEyebrow, { color: colors.brand.metallicGold }]}>Dua</Text>
                <Text style={[styles.quoteReference, { color: colors.text.secondary }]}>
                  A prayerful return for this moment
                </Text>
              </View>

              {payload.repeatCount ? (
                <View
                  style={[
                    styles.repeatBadge,
                    {
                      backgroundColor: colors.interactive.selectedBackground,
                      borderColor: colors.brand.metallicGold,
                    },
                  ]}
                >
                  <Text style={[styles.repeatBadgeLabel, { color: colors.text.primary }]}>
                    Repeat {payload.repeatCount}x
                  </Text>
                </View>
              ) : null}
            </View>

            {payload.dua?.arabic ? (
              <Text selectable style={[styles.duaArabic, { color: colors.text.primary }]}>
                {payload.dua.arabic}
              </Text>
            ) : null}

            {payload.dua?.transliteration ? (
              <Text selectable style={[styles.duaTransliteration, { color: colors.text.secondary }]}>
                {payload.dua.transliteration}
              </Text>
            ) : null}

            {payload.dua?.translation ? (
              <Text selectable style={[styles.quoteText, { color: colors.text.primary }]}>
                {payload.dua.translation}
              </Text>
            ) : null}
          </View>
        ) : null}

        {quoteCitations.length ? (
          <View style={styles.citationsSection}>
            <Text style={[styles.citationsTitle, { color: colors.text.tertiary }]}>
              Direct anchors
            </Text>
            {quoteCitations.map((citation) => (
              <QuoteCard key={citation.id} colors={colors} citation={citation} />
            ))}
          </View>
        ) : null}

        {supportingCitations.length ? (
          <View style={styles.supportingReferences}>
            <Text style={[styles.citationsTitle, { color: colors.text.tertiary }]}>
              Supporting references
            </Text>
            {supportingCitations.map((citation) => (
              <ReferenceRow key={citation.id} colors={colors} citation={citation} />
            ))}
          </View>
        ) : null}

        <Text style={[styles.ledgerSummary, { color: colors.text.tertiary }]}>
          {payload.ledgerSummary}
        </Text>
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
  const [inputHeight, setInputHeight] = useState(24);
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [resolvedIntervention, setResolvedIntervention] = useState<InterventionPayload | null>(null);

  const composerRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const stageProgress = useRef(new Animated.Value(0)).current;
  const railProgress = useRef(new Animated.Value(0.24)).current;

  const { colors, isDark } = useTheme();
  const { height, width } = useWindowDimensions();

  const contextLine = useMemo(() => getDevotionalContextLine(), []);
  const trimmedInput = inputText.trim();
  const isComposeMode = isFocused || trimmedInput.length > 0 || isSubmitting;
  const railWidth = getLoadingRailWidth(width);
  const titleFontSize = width < 390 ? 46 : width < 768 ? 54 : 62;
  const titleLineHeight = width < 390 ? 48 : width < 768 ? 56 : 64;
  const loadingCopy = LOADING_COPY[loadingStepIndex];
  const useSplitStarterLayout = width >= 720;

  const heroOpacity = stageProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.42],
  });
  const heroTranslateY = stageProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -32],
  });
  const composerScale = stageProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  useFocusEffect(
    useCallback(() => {
      trackScreenView("home");
    }, []),
  );

  useEffect(() => {
    Animated.spring(stageProgress, {
      damping: 18,
      mass: 1,
      stiffness: 180,
      toValue: isComposeMode ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isComposeMode, stageProgress]);

  useEffect(() => {
    if (!isFocused || resolvedIntervention) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 220);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeoutId);
    };
  }, [isFocused, resolvedIntervention]);

  useEffect(() => {
    if (!isSubmitting) {
      railProgress.stopAnimation();
      railProgress.setValue(0.24);
      setLoadingStepIndex(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(railProgress, {
          duration: 960,
          easing: Easing.inOut(Easing.ease),
          toValue: 0.84,
          useNativeDriver: false,
        }),
        Animated.timing(railProgress, {
          duration: 920,
          easing: Easing.inOut(Easing.ease),
          toValue: 0.42,
          useNativeDriver: false,
        }),
      ]),
    );

    const intervalId = setInterval(() => {
      setLoadingStepIndex((currentIndex) => (currentIndex + 1) % LOADING_COPY.length);
    }, 1500);

    loop.start();

    return () => {
      clearInterval(intervalId);
      loop.stop();
      railProgress.setValue(0.24);
    };
  }, [isSubmitting, railProgress]);

  const applyPrompt = useCallback((prompt: string) => {
    void triggerLightHaptic();
    setErrorMessage(null);
    setInputText(prompt);

    requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!trimmedInput || isSubmitting) {
      if (!trimmedInput) {
        setErrorMessage("Write what is weighing on you first.");
      }
      return;
    }

    void triggerLightHaptic();
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
    setInputHeight(24);
    setResolvedIntervention(null);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
        style={styles.container}
      >
        {resolvedIntervention ? (
          <View style={styles.resultStage}>
            <ResultSurface colors={colors} onReset={handleReset} payload={resolvedIntervention} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.entryScrollContent,
              {
                minHeight: isComposeMode ? undefined : Math.max(height - 40, 640),
                paddingBottom: isComposeMode ? spacing["5xl"] : spacing["4xl"],
              },
            ]}
          >
            <View
              style={[
                styles.entryStage,
                isComposeMode ? styles.entryStageCompose : null,
              ]}
            >
              <Animated.View
                style={[
                  styles.heroStack,
                  {
                    opacity: heroOpacity,
                    transform: [{ translateY: heroTranslateY }],
                  },
                ]}
              >
                <View style={styles.copyBlock}>
                  <Text style={[styles.contextLine, { color: colors.text.tertiary }]}>
                    {contextLine}
                  </Text>
                  <Text
                    style={[
                      styles.heroTitle,
                      {
                        color: colors.text.primary,
                        fontSize: titleFontSize,
                        lineHeight: titleLineHeight,
                      },
                    ]}
                  >
                    Bring what is heavy.
                  </Text>
                </View>

                <View
                  style={[
                    styles.promptStarterStack,
                    useSplitStarterLayout ? styles.promptStarterStackSplit : null,
                  ]}
                >
                  {PROMPT_STARTERS.map((starter, index) => {
                    const starterColors = getStarterCardColors(index, colors);

                    return (
                      <Pressable
                        key={starter.id}
                        accessibilityRole="button"
                        onPress={() => applyPrompt(starter.prompt)}
                        style={[
                          styles.promptStarterCard,
                          useSplitStarterLayout ? styles.promptStarterCardSplit : null,
                          {
                            backgroundColor: starterColors.backgroundColor,
                            borderColor: starterColors.borderColor,
                          },
                        ]}
                      >
                        <Text style={[styles.promptStarterTitle, { color: colors.text.primary }]}>
                          {starter.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>

              {isSubmitting ? (
                <LoadingStage
                  colors={colors}
                  loadingCopy={loadingCopy}
                  railProgress={railProgress}
                  railWidth={railWidth}
                />
              ) : (
                <Animated.View
                  style={[
                    styles.composerStage,
                    isComposeMode ? styles.composerStageCompose : null,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.composerShell,
                      {
                        backgroundColor: colors.surface.card,
                        borderColor: isFocused
                          ? colors.brand.metallicGold
                          : colors.surface.borderElevated,
                        transform: [{ scale: composerScale }],
                      },
                    ]}
                  >
                    <TextInput
                      ref={composerRef}
                      multiline
                      onBlur={() => setIsFocused(false)}
                      onChangeText={(nextValue) => {
                        setInputText(nextValue);
                        if (errorMessage) {
                          setErrorMessage(null);
                        }
                      }}
                      onContentSizeChange={(event) => {
                        const nextHeight = Math.max(
                          24,
                          Math.min(108, Math.round(event.nativeEvent.contentSize.height)),
                        );
                        setInputHeight(nextHeight);
                      }}
                      onFocus={() => {
                        setIsFocused(true);
                      }}
                      placeholder="Write what is on your heart"
                      placeholderTextColor={colors.text.muted}
                      selectionColor={colors.brand.metallicGold}
                      style={[
                        styles.composerInput,
                        {
                          color: colors.text.primary,
                          height: inputHeight,
                        },
                      ]}
                      textAlignVertical="center"
                      value={inputText}
                    />

                    {trimmedInput ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={isSubmitting}
                        onPress={() => {
                          void handleSubmit();
                        }}
                        style={[
                          styles.sendButton,
                          {
                            backgroundColor: colors.brand.metallicGold,
                          },
                        ]}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color={colors.text.onAccent} size="small" />
                        ) : (
                          <SendArrowIcon color={colors.text.onAccent} size={16} />
                        )}
                      </Pressable>
                    ) : null}
                  </Animated.View>

                  {errorMessage ? (
                    <View style={styles.feedbackBlock}>
                      <Text style={[styles.errorText, { color: colors.text.error }]}>
                        {errorMessage}
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>
              )}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  citationsSection: {
    gap: spacing.sm,
  },
  composerInput: {
    flex: 1,
    fontFamily: fontFamily.appRegular,
    fontSize: 17,
    lineHeight: 22,
    maxHeight: 108,
    paddingVertical: 0,
  },
  composerShell: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  composerStage: {
    alignSelf: "center",
    marginTop: spacing["3xl"],
    maxWidth: 560,
    width: "100%",
  },
  composerStageCompose: {
    marginTop: spacing.xl,
  },
  container: {
    flex: 1,
  },
  contextLine: {
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 17,
  },
  copyBlock: {
    gap: spacing.md,
  },
  duaArabic: {
    fontFamily: fontFamily.appRegular,
    fontSize: 28,
    lineHeight: 48,
    textAlign: "right",
  },
  duaCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  duaTransliteration: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 24,
  },
  citationsTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  entryScrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["4xl"],
  },
  entryStage: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  entryStageCompose: {
    justifyContent: "flex-start",
    paddingTop: spacing["2xl"],
  },
  errorText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackBlock: {
    marginTop: spacing.lg,
    minHeight: 24,
    width: "100%",
  },
  heroStack: {
    alignSelf: "stretch",
    gap: spacing.xl,
    maxWidth: 560,
  },
  heroTitle: {
    fontFamily: fontFamily.appBold,
    maxWidth: 440,
  },
  ledgerSummary: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 21,
  },
  loadingBody: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 420,
    textAlign: "center",
  },
  loadingEyebrow: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  loadingHeader: {
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingLegend: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center",
  },
  loadingLegendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  loadingLegendLabel: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  loadingRail: {
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 14,
    overflow: "hidden",
    padding: 2,
  },
  loadingRailFill: {
    borderRadius: 999,
    height: "100%",
  },
  loadingStage: {
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing["4xl"],
    width: "100%",
  },
  promptStarterCard: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  promptStarterCardSplit: {
    flex: 1,
  },
  promptStarterStack: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  promptStarterStackSplit: {
    flexWrap: "nowrap",
  },
  promptStarterTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  quoteCard: {
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  quoteEyebrow: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  quoteHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  quoteIconWrap: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  quoteMetaBlock: {
    flex: 1,
    gap: 2,
  },
  quoteReference: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    lineHeight: 19,
  },
  quoteText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 18,
    lineHeight: 30,
  },
  resultPrimaryText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 18,
    lineHeight: 31,
  },
  readingSheet: {
    borderRadius: 32,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
  },
  referenceLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  referenceRow: {
    borderTopWidth: 1,
    gap: spacing.xxs,
    paddingTop: spacing.sm,
  },
  referenceValue: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 21,
  },
  repeatBadge: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  repeatBadgeLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  resultCanvas: {
    gap: spacing.sm,
    maxWidth: 520,
  },
  resultEyebrow: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  resultScrollContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 140,
  },
  resultStage: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    lineHeight: 40,
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
  sendButton: {
    alignItems: "center",
    borderRadius: 999,
    flexShrink: 0,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  supportingReferences: {
    gap: spacing.sm,
  },
});
