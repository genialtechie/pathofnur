import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import * as Haptics from "expo-haptics";

import type { MomentArtifact, MomentMessage } from "@imaan/contracts";

import {
  appendMomentMessage,
  BackendApiError,
  createMoment,
} from "@/src/lib/backend/client";
import { getAuthenticatedBackendActor } from "@/src/lib/session/session-cache";
import { trackScreenView } from "@/src/lib/analytics/track";
import { fontFamily, spacing, useTheme } from "@/src/theme";

import { SendArrowIcon } from "./home-icons";

function getErrorMessage(error: unknown) {
  if (error instanceof BackendApiError) {
    return error.status >= 500
      ? "The response could not be gathered right now. Try again in a moment."
      : error.message;
  }

  return error instanceof Error
    ? error.message
    : "Something interrupted this moment. Try again.";
}

function getSourceLabel(artifact: MomentArtifact) {
  return artifact.reference?.trim() || artifact.title.trim();
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

export function HomeScreen() {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState("");
  const [momentId, setMomentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MomentMessage[]>([]);
  const [artifacts, setArtifacts] = useState<MomentArtifact[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryText, setRetryText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void trackScreenView("home");
    }, [])
  );

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 180);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearTimeout(timeoutId);
    };
  }, [artifacts.length, isSubmitting, messages.length]);

  const submit = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? inputText).trim();
      if (!text || isSubmitting) {
        return;
      }

      await triggerLightHaptic();
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: MomentMessage = {
        id: optimisticId,
        momentId: momentId ?? "pending",
        role: "user",
        text,
        createdAtUtc: new Date().toISOString(),
      };

      setMessages((current) => [...current, optimisticMessage]);
      setInputText("");
      setIsSubmitting(true);
      setErrorMessage(null);
      setRetryText(null);

      try {
        const actor = await getAuthenticatedBackendActor();
        const entrySource =
          actor?.kind === "development"
            ? "home_development_bypass"
            : actor
              ? "home_authenticated"
              : "home_anonymous";

        if (momentId) {
          const response = await appendMomentMessage(
            momentId,
            {
              text,
              locale: "en",
              entrySource,
            },
            actor?.accessToken ?? null
          );
          setMessages((current) =>
            current.flatMap((message) =>
              message.id === optimisticId ? response.messages : [message]
            )
          );
          setArtifacts(response.artifacts);
        } else {
          const response = await createMoment(
            {
              text,
              locale: "en",
              entrySource,
            },
            actor?.accessToken ?? null
          );
          setMomentId(response.moment.id);
          setMessages(response.messages);
          setArtifacts(response.artifacts);
        }

      } catch (error) {
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticId)
        );
        setInputText(text);
        setRetryText(text);
        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsSubmitting(false);
      }
    },
    [inputText, isSubmitting, momentId]
  );

  const canSubmit = inputText.trim().length > 0 && !isSubmitting;
  const hasThread = messages.length > 0;
  const sourceSummary =
    artifacts.length > 0
      ? `Sources: ${artifacts.map(getSourceLabel).join(", ")}`
      : null;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface.background }]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          ref={scrollRef}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            hasThread ? styles.threadScrollContent : null,
          ]}
        >
          {!hasThread ? (
            <View style={styles.hero}>
              <Text style={[styles.heroTitle, { color: colors.text.primary }]}>
                What is on your mind?
              </Text>
            </View>
          ) : (
            <View style={styles.thread}>
              {messages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <View
                    key={message.id}
                    style={[
                      isUser ? styles.userBubble : styles.assistantBlock,
                      isUser
                        ? {
                            backgroundColor: colors.surface.card,
                            borderColor: colors.surface.borderElevated,
                          }
                        : null,
                    ]}
                  >
                    <Text
                      selectable
                      style={[
                        isUser ? styles.bubbleText : styles.assistantText,
                        { color: colors.text.primary },
                      ]}
                    >
                      {message.text}
                    </Text>
                  </View>
                );
              })}

              {isSubmitting ? (
                <View style={styles.assistantBlock}>
                  <Text style={[styles.pendingText, { color: colors.text.secondary }]}>
                    Thinking...
                  </Text>
                </View>
              ) : null}

              {sourceSummary ? (
                <Text
                  selectable
                  style={[styles.sourceText, { color: colors.text.secondary }]}
                >
                  {sourceSummary}
                </Text>
              ) : null}
            </View>
          )}

          {errorMessage ? (
            <View style={styles.errorBlock}>
              <Text selectable style={[styles.errorText, { color: colors.text.error }]}>
                {errorMessage}
              </Text>
              {retryText ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => void submit(retryText)}
                >
                  <Text style={[styles.retryText, { color: colors.text.primary }]}>
                    Try again
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.composerShell,
            {
              backgroundColor: colors.surface.background,
              borderColor: colors.surface.border,
            },
          ]}
        >
          <TextInput
            multiline
            onChangeText={setInputText}
            onSubmitEditing={() => void submit()}
            placeholder={hasThread ? "Continue this moment" : "Start a conversation"}
            placeholderTextColor={colors.text.muted}
            returnKeyType="send"
            style={[styles.input, { color: colors.text.primary }]}
            value={inputText}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={() => void submit()}
            style={[
              styles.sendButton,
              {
                backgroundColor: canSubmit
                  ? colors.brand.metallicGold
                  : colors.surface.borderElevated,
                opacity: canSubmit ? 1 : 0.6,
              },
            ]}
          >
            <SendArrowIcon color={colors.text.onAccent} size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  assistantBlock: {
    alignSelf: "stretch",
    paddingHorizontal: spacing.sm,
  },
  assistantText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 18,
    lineHeight: 28,
  },
  bubbleText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 23,
  },
  composerShell: {
    alignItems: "flex-end",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: 112,
    marginHorizontal: spacing.lg,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  errorBlock: {
    gap: spacing.sm,
  },
  errorText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  heroTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 38,
    lineHeight: 44,
    textAlign: "center",
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.appRegular,
    fontSize: 17,
    lineHeight: 23,
    maxHeight: 110,
    minHeight: 38,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  pendingText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 24,
  },
  retryText: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  keyboardView: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.xl,
    paddingBottom: 180,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sendButton: {
    alignItems: "center",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  sourceText: {
    fontFamily: fontFamily.appRegular,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: spacing.sm,
  },
  thread: {
    gap: spacing.lg,
  },
  threadScrollContent: {
    justifyContent: "flex-end",
  },
  userBubble: {
    alignSelf: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: "84%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
