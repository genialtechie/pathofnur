import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Welcome to Path of Nur</Text>
        <Text style={styles.subtitle}>
          A gentle, premium prayer companion for your daily journey.
        </Text>
      </View>

      <Pressable
        style={styles.button}
        accessibilityRole="button"
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Text style={styles.buttonText}>Begin Path</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "#070b14",
    paddingHorizontal: 24,
    paddingVertical: 48
  },
  hero: {
    gap: 16,
    marginTop: 32
  },
  title: {
    color: "#f3f5f7",
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42
  },
  subtitle: {
    color: "#a7b3c6",
    fontSize: 18,
    lineHeight: 28
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#c5a021",
    paddingVertical: 16
  },
  buttonText: {
    color: "#070b14",
    fontSize: 17,
    fontWeight: "700"
  }
});
