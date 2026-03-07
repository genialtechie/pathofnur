import type { JourneyPractice } from "./journey-types";

export function getJourneyPracticeAccent(
  practice: JourneyPractice,
  colors: {
    brand: {
      metallicGold: string;
      deepForestGreen: string;
      midnightBlue: string;
    };
  }
) {
  switch (practice) {
    case "salah":
      return colors.brand.metallicGold;
    case "quran":
      return colors.brand.midnightBlue;
    case "fasting":
      return colors.brand.deepForestGreen;
    case "dhikr":
      return "#B9A6FF";
  }
}

export function getJourneyPracticeTone(practice: JourneyPractice) {
  switch (practice) {
    case "salah":
      return "gold" as const;
    case "quran":
      return "blue" as const;
    case "fasting":
      return "forest" as const;
    case "dhikr":
      return "neutral" as const;
  }
}

export function getJourneyPracticeActionCopy(practice: JourneyPractice) {
  switch (practice) {
    case "salah":
      return "Mark when you complete your daily salah.";
    case "quran":
      return "Mark when your Quran time is done.";
    case "fasting":
      return "Mark once the day's fast is complete.";
    case "dhikr":
      return "Mark when you finish your dhikr goal.";
  }
}
