import { StyleSheet, Text, View } from "react-native";

import { fontFamily } from "@/src/components/navigation/typography";
import { useTheme } from "@/src/theme";

type TabSkeletonScreenProps = {
  title: string;
  description: string;
};

export function TabSkeletonScreen({ title, description }: TabSkeletonScreenProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface.background }]}>
      <View style={[styles.card, { borderColor: colors.surface.border, backgroundColor: colors.surface.card }]}>
        <Text style={[styles.kicker, { color: colors.text.tertiary }]}>Path of Nur</Text>
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.text.secondary }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 12
  },
  kicker: {
    fontSize: 12,
    fontFamily: fontFamily.appSemiBold,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.appBold
  },
  description: {
    fontSize: 16,
    fontFamily: fontFamily.appRegular,
    lineHeight: 24
  }
});
