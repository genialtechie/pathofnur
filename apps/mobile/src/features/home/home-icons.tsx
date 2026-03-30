import Svg, { Circle, Path, Rect } from "react-native-svg";

type HomeIconProps = {
  color: string;
  size?: number;
};

export function GuideSparkIcon({ color, size = 20 }: HomeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.75L13.82 8.18L19.25 10L13.82 11.82L12 17.25L10.18 11.82L4.75 10L10.18 8.18L12 2.75Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Circle cx="18.6" cy="5.4" r="1.2" fill={color} />
    </Svg>
  );
}

export function SendArrowIcon({ color, size = 20 }: HomeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 17.6V6.4"
        stroke={color}
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.7 10.7L12 6.4L16.3 10.7"
        stroke={color}
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function QuranSourceIcon({ color, size = 20 }: HomeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5.1L18.45 7.65V17.6L12 15.05L5.55 17.6V7.65L12 5.1Z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <Path
        d="M12 5.1V15.05"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <Path
        d="M8.1 9.55H10.55"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M13.45 9.55H15.9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function HadithSourceIcon({ color, size = 20 }: HomeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="6.2"
        y="4.8"
        width="11.6"
        height="14.4"
        rx="3.2"
        stroke={color}
        strokeWidth="1.75"
      />
      <Path
        d="M9 9.1H15"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M9 12.1H13.8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M7.4 16.2H16.6"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function DuaSourceIcon({ color, size = 20 }: HomeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.2 15.8C8.2 13.55 9.55 12.1 12 12.1C14.45 12.1 15.8 13.55 15.8 15.8"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <Path
        d="M9.35 11.7L8.55 7.1"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <Path
        d="M14.65 11.7L15.45 7.1"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <Path
        d="M7 18.6H17"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="5.2" r="1.1" fill={color} />
    </Svg>
  );
}
