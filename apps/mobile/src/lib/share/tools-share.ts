import type { TasbihHistorySnapshot } from "@/src/store/tasbih-history";
import { hasHandledTasbihShare, type TasbihShareState } from "@/src/store/tasbih-share-state";

const APP_URL = "https://pathofnur.com";
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");
const LIFETIME_MILESTONES = [33, 100, 500, 1000] as const;

export type ToolsShareTriggerSurface = "tools_overview" | "tasbih_prompt";
export type ToolsShareType = "manual" | "milestone";
export type ToolsShareArtifactType = "story_card";

export type ToolsShareArtifact = {
  artifactType: ToolsShareArtifactType;
  shareType: ToolsShareType;
  triggerSurface: ToolsShareTriggerSurface;
  milestoneKey?: string;
  eyebrow: string;
  headline: string;
  supportingText: string;
  stats: [
    { label: string; value: string },
    { label: string; value: string },
  ];
  footerLabel: string;
  previewTitle: string;
  actionLabel: string;
  shareMessage: string;
  fileName: string;
};

export type ToolsShareAnalyticsPayload = {
  share_type: ToolsShareType;
  milestone_key?: string;
  artifact_type: ToolsShareArtifactType;
  trigger_surface: ToolsShareTriggerSurface;
};

function formatCount(count: number): string {
  return NUMBER_FORMATTER.format(count);
}

function createFileName(label: string): string {
  return `path-of-nur-${label}`;
}

export function createManualToolsShareArtifact(
  snapshot: TasbihHistorySnapshot,
  triggerSurface: ToolsShareTriggerSurface = "tools_overview"
): ToolsShareArtifact {
  const headline =
    snapshot.todayCount > 0
      ? `${formatCount(snapshot.todayCount)} today`
      : `${formatCount(snapshot.lifetimeCount)} all-time`;
  const supportingText =
    snapshot.todayCount > 0
      ? `${formatCount(snapshot.lifetimeCount)} all-time tasbih kept close in Path of Nur.`
      : `${formatCount(snapshot.lifetimeCompletedLoops)} completed loops of remembrance.`;

  return {
    artifactType: "story_card",
    shareType: "manual",
    triggerSurface,
    eyebrow: snapshot.todayCount > 0 ? "Today's remembrance" : "Practice kept close",
    headline,
    supportingText,
    stats: [
      {
        label: snapshot.todayCount > 0 ? "Today" : "All-time",
        value: formatCount(snapshot.todayCount > 0 ? snapshot.todayCount : snapshot.lifetimeCount),
      },
      {
        label: snapshot.todayCount > 0 ? "All-time" : "Completed loops",
        value: formatCount(snapshot.todayCount > 0 ? snapshot.lifetimeCount : snapshot.lifetimeCompletedLoops),
      },
    ],
    footerLabel: "pathofnur.com",
    previewTitle: "Share your progress",
    actionLabel: snapshot.todayCount > 0 ? "Share today's count" : "Share practice",
    shareMessage:
      snapshot.todayCount > 0
        ? `Today's remembrance on Path of Nur: ${formatCount(snapshot.todayCount)} today, ${formatCount(snapshot.lifetimeCount)} all-time.\n\n${APP_URL}`
        : `Path of Nur practice update: ${formatCount(snapshot.lifetimeCount)} all-time tasbih.\n\n${APP_URL}`,
    fileName: createFileName(snapshot.todayCount > 0 ? "today" : "practice"),
  };
}

function createLifetimeMilestoneArtifact(
  threshold: (typeof LIFETIME_MILESTONES)[number],
  snapshot: TasbihHistorySnapshot
): ToolsShareArtifact {
  const milestoneLabel = threshold === 33 ? "First 33 complete" : `${formatCount(threshold)} all-time`;

  return {
    artifactType: "story_card",
    shareType: "milestone",
    triggerSurface: "tasbih_prompt",
    milestoneKey: `total:${threshold}`,
    eyebrow: threshold === 33 ? "Milestone reached" : "Practice milestone",
    headline: milestoneLabel,
    supportingText:
      threshold === 33
        ? "A full loop of remembrance, kept in Path of Nur."
        : `${formatCount(snapshot.todayCount)} today, ${formatCount(snapshot.lifetimeCount)} all-time.`,
    stats: [
      { label: "Today", value: formatCount(snapshot.todayCount) },
      { label: "All-time", value: formatCount(snapshot.lifetimeCount) },
    ],
    footerLabel: "pathofnur.com",
    previewTitle: "Share this milestone",
    actionLabel: "Share milestone",
    shareMessage:
      threshold === 33
        ? `First 33 complete on Path of Nur today. ${formatCount(snapshot.lifetimeCount)} all-time.\n\n${APP_URL}`
        : `${formatCount(threshold)} all-time tasbih on Path of Nur. ${formatCount(snapshot.todayCount)} today.\n\n${APP_URL}`,
    fileName: createFileName(`milestone-${threshold}`),
  };
}

function createBeatYesterdayArtifact(snapshot: TasbihHistorySnapshot): ToolsShareArtifact {
  const improvement = snapshot.todayCount - snapshot.yesterdayCount;

  return {
    artifactType: "story_card",
    shareType: "milestone",
    triggerSurface: "tasbih_prompt",
    milestoneKey: `beat-yesterday:${snapshot.todayKey}`,
    eyebrow: "A stronger day",
    headline: "Ahead of yesterday",
    supportingText: `${formatCount(improvement)} more than yesterday in quiet remembrance.`,
    stats: [
      { label: "Yesterday", value: formatCount(snapshot.yesterdayCount) },
      { label: "Today", value: formatCount(snapshot.todayCount) },
    ],
    footerLabel: "pathofnur.com",
    previewTitle: "Share today's progress",
    actionLabel: "Share today's edge",
    shareMessage: `Today's remembrance on Path of Nur is ahead of yesterday: ${formatCount(snapshot.todayCount)} today, ${formatCount(snapshot.yesterdayCount)} yesterday.\n\n${APP_URL}`,
    fileName: createFileName(`beat-yesterday-${snapshot.todayKey}`),
  };
}

export function getTriggeredTasbihShareArtifact(
  previousSnapshot: TasbihHistorySnapshot,
  nextSnapshot: TasbihHistorySnapshot,
  shareState: TasbihShareState
): ToolsShareArtifact | null {
  for (const threshold of LIFETIME_MILESTONES) {
    const milestoneKey = `total:${threshold}`;
    if (
      previousSnapshot.lifetimeCount < threshold &&
      nextSnapshot.lifetimeCount >= threshold &&
      !hasHandledTasbihShare(shareState, milestoneKey)
    ) {
      return createLifetimeMilestoneArtifact(threshold, nextSnapshot);
    }
  }

  const beatYesterdayKey = `beat-yesterday:${nextSnapshot.todayKey}`;
  const beatYesterdayTarget = nextSnapshot.yesterdayCount + 33;
  const crossedBeatYesterdayThreshold =
    nextSnapshot.yesterdayCount > 0 &&
    previousSnapshot.todayCount < beatYesterdayTarget &&
    nextSnapshot.todayCount >= beatYesterdayTarget;

  if (crossedBeatYesterdayThreshold && !hasHandledTasbihShare(shareState, beatYesterdayKey)) {
    return createBeatYesterdayArtifact(nextSnapshot);
  }

  return null;
}

export function getToolsShareAnalyticsPayload(
  artifact: ToolsShareArtifact
): ToolsShareAnalyticsPayload {
  return {
    share_type: artifact.shareType,
    milestone_key: artifact.milestoneKey,
    artifact_type: artifact.artifactType,
    trigger_surface: artifact.triggerSurface,
  };
}
