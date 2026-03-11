import { useCallback } from "react";
import { Share } from "react-native";
import * as Linking from "expo-linking";

import { trackJourneyShareCardCreated } from "./journey-analytics";

type UseJourneyShareActionParams = {
  shareMessage: string;
  markShareCreated: () => void;
};

export function useJourneyShareAction({
  shareMessage,
  markShareCreated,
}: UseJourneyShareActionParams) {
  return useCallback(async () => {
    try {
      void trackJourneyShareCardCreated("summary_share");
      markShareCreated();

      if (
        process.env.EXPO_OS === "web" &&
        typeof navigator !== "undefined" &&
        "share" in navigator
      ) {
        await navigator.share({
          title: "Path of Nur",
          text: shareMessage,
          url: "https://pathofnur.com",
        });
        return;
      }

      if (process.env.EXPO_OS === "web") {
        await Linking.openURL(
          `mailto:?subject=${encodeURIComponent("Path of Nur journey update")}&body=${encodeURIComponent(shareMessage)}`
        );
        return;
      }

      await Share.share({
        title: "Path of Nur",
        message: shareMessage,
      });
    } catch (error) {
      console.error("Journey share failed:", error);
    }
  }, [markShareCreated, shareMessage]);
}
