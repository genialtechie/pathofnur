import Ionicons from "@expo/vector-icons/Ionicons";

type TabBarIconProps = {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
};

export function TabBarIcon({ name, color }: TabBarIconProps) {
  return <Ionicons size={22} name={name} color={color} style={{ marginBottom: -2 }} />;
}
