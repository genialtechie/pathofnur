import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fontFamily, useTheme } from "@/src/theme";

export default function NotFoundRoute() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={[styles.container, { backgroundColor: colors.surface.background }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>This screen does not exist.</Text>
        <Link href="/" asChild>
          <Pressable style={[styles.button, { backgroundColor: colors.brand.metallicGold }]}>
            <Text style={[styles.buttonText, { color: colors.text.onAccent }]}>Return Home</Text>
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
    padding: 24
  },
  title: {
    fontSize: 18,
    fontFamily: fontFamily.appSemiBold,
    marginBottom: 16,
    textAlign: "center"
  },
  button: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  buttonText: {
    fontFamily: fontFamily.appBold,
  }
});
