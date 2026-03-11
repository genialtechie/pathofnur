import { useEffect, useRef } from "react";

import { trackJourneyStreakMilestone } from "./journey-analytics";
import type { JourneyPractice } from "./journey-types";

const MILESTONES = [3, 7, 14, 30] as const;

type JourneyStreakMap = {
  salah: number;
  quran: number;
  fasting: number;
  dhikr: number;
};

export function useJourneyMilestones(streaks: JourneyStreakMap) {
  const streakRef = useRef(streaks);

  useEffect(() => {
    const previous = streakRef.current;

    (Object.keys(streaks) as JourneyPractice[]).forEach((habit) => {
      const nextValue = streaks[habit];
      const previousValue = previous[habit];

      if (
        nextValue !== previousValue &&
        MILESTONES.includes(nextValue as (typeof MILESTONES)[number])
      ) {
        void trackJourneyStreakMilestone(nextValue, habit);
      }
    });

    streakRef.current = streaks;
  }, [streaks]);
}
