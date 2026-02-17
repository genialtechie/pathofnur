import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { UtilityCard } from "@/src/components/cards";
import { fontFamily, spacing, useTheme } from "@/src/theme";

// Import images
const TASBIH_COVER = require("@/public/images/_source/tools-tasbih-focus-v01.webp");
const QIBLAH_COVER = require("@/public/images/_source/tools-qiblah-backdrop-v01.webp");

export default function ToolsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.text.tertiary }]}>Utility</Text>
          <Text style={[styles.title, { color: colors.text.primary }]}>Tools</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Practical resources to support your daily worship.
          </Text>
        </View>

        <View style={styles.grid}>
          <UtilityCard
            title="Tasbih"
            icon="finger-print" 
            subtitle="Digital prayer beads"
            imageSource={TASBIH_COVER}
            aspectRatio={1} // Square
            onPress={() => router.push("/tools/tasbih")}
            style={styles.card}
          />
          
          <UtilityCard
            title="Qiblah"
            icon="compass"
            subtitle="Find the Kaaba direction"
            imageSource={QIBLAH_COVER}
            aspectRatio={1} // Square
            onPress={() => router.push("/tools/qiblah")}
            style={styles.card}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xl,
    paddingBottom: spacing["5xl"],
  },
  header: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  kicker: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontFamily: fontFamily.appBold,
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 22,
  },
  grid: {
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    width: "48%", // Two columns
    flexGrow: 1,
  },
});
