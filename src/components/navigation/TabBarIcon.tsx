import { MinimalTabIcon, type MinimalTabIconName } from "@/src/components/icons/MinimalTabIcon";

type TabBarIconProps = {
  name: MinimalTabIconName;
  focused: boolean;
  color: string;
};

export function TabBarIcon({ name, focused, color }: TabBarIconProps) {
  return <MinimalTabIcon name={name} focused={focused} color={color} size={22} />;
}
