import { useMemo } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

const SETTINGS_LINKS = [
  {
    description: "Continue your dhikr practice in a focused counter.",
    href: "/tools/tasbih" as const,
    icon: "radio-button-on-outline" as const,
    title: "Tasbih",
  },
  {
    description: "Open the compass and align toward the Kaaba.",
    href: "/tools/qiblah" as const,
    icon: "navigate-outline" as const,
    title: "Qiblah",
  },
];

export default function SettingsRoute() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.note}>
          Utilities live here for now. Broader settings will follow in a later pass.
        </Text>
      </View>

      <View style={styles.list}>
        {SETTINGS_LINKS.map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            onPress={() => router.push(item.href)}
            style={({ pressed }) => [
              styles.row,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={styles.rowLeading}>
              <View style={styles.iconWrap}>
                <Ionicons color={colors.brand.metallicGold} name={item.icon} size={20} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDescription}>{item.description}</Text>
              </View>
            </View>
            <Ionicons color={colors.text.tertiary} name="chevron-forward" size={18} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    content: {
      gap: spacing.xl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      paddingBottom: 140,
    },
    header: {
      gap: spacing.sm,
    },
    iconWrap: {
      alignItems: "center",
      backgroundColor: colors.interactive.selectedBackground,
      borderColor: colors.surface.borderElevated,
      borderRadius: radii.pill,
      borderWidth: 1,
      height: 42,
      justifyContent: "center",
      width: 42,
    },
    list: {
      gap: spacing.md,
    },
    note: {
      color: colors.text.secondary,
      fontFamily: fontFamily.appRegular,
      fontSize: 15,
      lineHeight: 24,
      maxWidth: 420,
    },
    row: {
      alignItems: "center",
      backgroundColor: colors.surface.card,
      borderColor: colors.surface.borderElevated,
      borderRadius: radii.xl,
      borderWidth: 1,
      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.12)",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    rowCopy: {
      flex: 1,
      gap: spacing.xxs,
    },
    rowDescription: {
      color: colors.text.secondary,
      fontFamily: fontFamily.appRegular,
      fontSize: 14,
      lineHeight: 21,
    },
    rowLeading: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.md,
    },
    rowPressed: {
      opacity: 0.85,
    },
    rowTitle: {
      color: colors.text.primary,
      fontFamily: fontFamily.appSemiBold,
      fontSize: 16,
      lineHeight: 20,
    },
    screen: {
      backgroundColor: colors.surface.background,
      flex: 1,
    },
    title: {
      color: colors.text.primary,
      fontFamily: fontFamily.appBold,
      fontSize: 34,
      lineHeight: 40,
    },
  });
}
