import { StyleSheet, Text, View } from "react-native";

import { fontFamily } from "@/src/components/navigation/typography";

type TabSkeletonScreenProps = {
  title: string;
  description: string;
};

export function TabSkeletonScreen({ title, description }: TabSkeletonScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Path of Nur</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070b14",
    justifyContent: "center",
    padding: 24
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#111a2a",
    backgroundColor: "#0b1220",
    padding: 24,
    gap: 12
  },
  kicker: {
    color: "#93a1b5",
    fontSize: 12,
    fontFamily: fontFamily.appSemiBold,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  title: {
    color: "#f3f5f7",
    fontSize: 28,
    fontFamily: fontFamily.appBold
  },
  description: {
    color: "#c0cad8",
    fontSize: 16,
    fontFamily: fontFamily.appRegular,
    lineHeight: 24
  }
});
