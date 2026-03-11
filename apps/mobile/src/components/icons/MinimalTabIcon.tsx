import Svg, { Path, Rect } from "react-native-svg";

export type MinimalTabIconName = "home" | "library" | "tools" | "journey";

type MinimalTabIconProps = {
  name: MinimalTabIconName;
  focused: boolean;
  color: string;
  size?: number;
};

export function MinimalTabIcon({ name, focused, color, size = 24 }: MinimalTabIconProps) {
  if (name === "home") {
    return focused ? (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 4.15L18.55 9.05V19.55H14.08V15.48C14.08 14.28 13.16 13.36 12 13.36C10.84 13.36 9.92 14.28 9.92 15.48V19.55H5.45V9.05L12 4.15ZM7.35 9.85V17.65H8.02V15.48C8.02 13.22 9.75 11.46 12 11.46C14.25 11.46 15.98 13.22 15.98 15.48V17.65H16.65V9.85L12 6.38L7.35 9.85Z"
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </Svg>
    ) : (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5.25 10.05L12 4.95L18.75 10.05"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M6.3 9.4V18.15C6.3 19.06 7.04 19.8 7.95 19.8H16.05C16.96 19.8 17.7 19.06 17.7 18.15V9.4"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M10.15 19.8V15.7C10.15 14.7 10.95 13.9 11.95 13.9C12.95 13.9 13.75 14.7 13.75 15.7V19.8"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "library") {
    return focused ? (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M6.15 4.45H17.85C18.76 4.45 19.5 5.19 19.5 6.1V19.82C19.5 20.58 18.67 21.05 18.01 20.66L12.82 17.58C12.3 17.27 11.66 17.27 11.14 17.58L5.99 20.64C5.33 21.03 4.5 20.56 4.5 19.8V6.1C4.5 5.19 5.24 4.45 6.15 4.45ZM6.4 6.35V18.17L10.17 15.94C11.29 15.28 12.67 15.28 13.79 15.94L17.6 18.2V6.35H13.02V11.2L12 10.49L10.98 11.2V6.35H6.4Z"
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </Svg>
    ) : (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="5.15"
          y="4.75"
          width="13.7"
          height="14.9"
          rx="1.8"
          stroke={color}
          strokeWidth="1.8"
        />
        <Path
          d="M10.2 4.95V10.95L12 9.72L13.8 10.95V4.95"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === "tools") {
    return focused ? (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3.4L14.95 7.8L12 6.42L9.05 7.8L12 3.4ZM5.65 9.05L12 5.82L18.35 9.05V15.42L12 18.68L5.65 15.42V9.05ZM7.42 9.9L12 12.3L16.58 9.9V11.34L12 13.79L7.42 11.34V9.9ZM8.42 12.48L12 14.35L15.58 12.48V13.72L12 15.59L8.42 13.72V12.48Z"
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </Svg>
    ) : (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3.55L14.95 7.96L12 6.51L9.05 7.96L12 3.55Z"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M5.65 9.05L12 5.82L18.35 9.05V15.42L12 18.68L5.65 15.42V9.05Z"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M5.65 9.05L12 12.3L18.35 9.05"
          stroke={color}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M8.42 12.48L12 14.35L15.58 12.48"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return focused ? (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.1 3.55C12.1 5.75 11.26 7.24 9.84 8.6C8.32 10.05 7.5 11.55 7.5 13.18C7.5 15.95 9.54 18 12.28 18C15.03 18 17.03 15.95 17.03 13.18C17.03 11.06 15.97 9.28 14.47 7.68C14.07 8.27 13.66 8.83 13.02 9.21C13.35 7.02 13.04 5.1 12.1 3.55ZM12.38 9.44C13.39 10.36 13.88 11.26 13.88 12.28C13.88 13.21 13.49 14.01 12.74 14.62C13.94 14.44 14.85 13.44 14.85 12.24C14.85 11.04 14 10.03 12.38 9.44Z"
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ) : (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.1 3.55C12.1 5.75 11.26 7.24 9.84 8.6C8.32 10.05 7.5 11.55 7.5 13.18C7.5 15.95 9.54 18 12.28 18C15.03 18 17.03 15.95 17.03 13.18C17.03 11.06 15.97 9.28 14.47 7.68C14.07 8.27 13.66 8.83 13.02 9.21C13.35 7.02 13.04 5.1 12.1 3.55Z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.36 9.5C13.4 10.34 13.94 11.22 13.94 12.22C13.94 13.12 13.5 13.93 12.68 14.46"
        stroke={color}
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
