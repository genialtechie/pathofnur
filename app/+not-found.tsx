import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function NotFoundRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Return Home</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#070b14",
    padding: 24
  },
  title: {
    color: "#f3f5f7",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center"
  },
  button: {
    borderRadius: 999,
    backgroundColor: "#c5a021",
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  buttonText: {
    color: "#070b14",
    fontWeight: "700"
  }
});
