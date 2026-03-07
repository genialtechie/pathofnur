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
          d="M12 4L4.8 9.3V18.6C4.8 19.7 5.7 20.6 6.8 20.6H10V15.8C10 14.6 10.9 13.7 12 13.7C13.1 13.7 14 14.6 14 15.8V20.6H17.2C18.3 20.6 19.2 19.7 19.2 18.6V9.3L12 4Z"
          fill={color}
        />
      </Svg>
    ) : (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3.8 10.2L12 4.2L20.2 10.2"
          stroke={color}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M5.5 9.8V18.4C5.5 19.4 6.3 20.2 7.3 20.2H16.7C17.7 20.2 18.5 19.4 18.5 18.4V9.8"
          stroke={color}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M10 20.2V15.8C10 14.9 10.7 14.2 11.6 14.2H12.4C13.3 14.2 14 14.9 14 15.8V20.2"
          stroke={color}
          strokeWidth="1.9"
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
          d="M6.5 4H17.5C18.6 4 19.5 4.9 19.5 6V20.1C19.5 20.8 18.7 21.2 18.1 20.8L12 16.8L5.9 20.8C5.3 21.2 4.5 20.8 4.5 20.1V6C4.5 4.9 5.4 4 6.5 4Z"
          fill={color}
        />
      </Svg>
    ) : (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="5"
          y="4.5"
          width="14"
          height="16"
          rx="2"
          stroke={color}
          strokeWidth="1.9"
        />
        <Path
          d="M9 4.5V15.3L12 13.4L15 15.3V4.5"
          stroke={color}
          strokeWidth="1.9"
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
          d="M12 2.8L15.4 7.9L12 6.3L8.6 7.9L12 2.8ZM4.9 8.8L12 5.2L19.1 8.8V16.1L12 19.8L4.9 16.1V8.8ZM6.85 9.75L12 12.45L17.15 9.75V11.38L12 14.12L6.85 11.38V9.75ZM7.95 12.65L12 14.76L16.05 12.65V14.05L12 16.16L7.95 14.05V12.65Z"
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </Svg>
    ) : (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2.9L15.45 8.05L12 6.35L8.55 8.05L12 2.9Z"
          stroke={color}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M4.9 8.8L12 5.2L19.1 8.8V16.1L12 19.8L4.9 16.1V8.8Z"
          stroke={color}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M4.9 8.8L12 12.45L19.1 8.8"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M7.95 12.65L12 14.76L16.05 12.65"
          stroke={color}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return focused ? (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.2 3.1C12.2 5.55 11.28 7.25 9.72 8.78C8.08 10.38 7.18 12.04 7.18 13.82C7.18 16.72 9.32 18.86 12.22 18.86C15.14 18.86 17.26 16.7 17.26 13.82C17.26 11.52 16.04 9.58 14.36 7.84C13.94 8.54 13.52 9.18 12.86 9.64C13.18 7.12 12.98 4.98 12.2 3.1ZM12.17 8.92C13.08 9.98 13.48 11 13.48 12.08C13.48 13.54 12.46 14.66 11.08 14.94C11.42 15.08 11.78 15.16 12.18 15.16C13.94 15.16 15.34 13.78 15.34 12.08C15.34 10.64 14.3 9.42 12.17 8.92Z"
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </Svg>
  ) : (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.2 3.1C12.2 5.55 11.28 7.25 9.72 8.78C8.08 10.38 7.18 12.04 7.18 13.82C7.18 16.72 9.32 18.86 12.22 18.86C15.14 18.86 17.26 16.7 17.26 13.82C17.26 11.52 16.04 9.58 14.36 7.84C13.94 8.54 13.52 9.18 12.86 9.64C13.18 7.12 12.98 4.98 12.2 3.1Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.18 9.14C13.54 10.1 14.22 11.08 14.22 12.25C14.22 13.38 13.54 14.34 12.48 14.8"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
