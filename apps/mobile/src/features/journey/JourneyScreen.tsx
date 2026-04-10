import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import type { JourneyMoment as BackendJourneyMoment, JourneyMomentStatus } from "@imaan/contracts";

import { getMoments } from "@/src/lib/backend/client";
import { getAuthenticatedBackendActor } from "@/src/lib/session/session-cache";
import { fontFamily, spacing, useTheme } from "@/src/theme";

import { trackJourneyScreenView } from "./journey-analytics";

const PATH_STAGE_WIDTH = 320;
const PATH_STAGE_MIN_HEIGHT = 820;
const STONE_SIZE = 104;
const STONE_OFFSET = STONE_SIZE / 2;
const JOURNEY_WINDOW_DAYS = 180;
const MONTH_DIVIDER_HEIGHT = 72;
const PATH_TOP_PADDING = 120;
const PATH_BOTTOM_PADDING = 128;
const PATH_VERTICAL_STEP = 112;
const PATH_CENTER_X = PATH_STAGE_WIDTH / 2;
const PATH_X_OFFSETS = [-18, 54, 10, -42, -6, 60, 16, -50] as const;

type JourneyMoment = BackendJourneyMoment & {
  monthLabel: string;
};

function formatMonthLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

function mapBackendMoment(moment: BackendJourneyMoment): JourneyMoment {
  return {
    ...moment,
    monthLabel: formatMonthLabel(moment.createdAtUtc),
  };
}

function buildPathLayout(moments: JourneyMoment[]) {
  const monthFirstIndex = new Map<string, number>();
  moments.forEach((moment, index) => {
    if (!monthFirstIndex.has(moment.monthLabel)) {
      monthFirstIndex.set(moment.monthLabel, index);
    }
  });

  const stageHeight = Math.max(
    PATH_STAGE_MIN_HEIGHT,
    PATH_TOP_PADDING +
      PATH_BOTTOM_PADDING +
      moments.length * PATH_VERTICAL_STEP +
      monthFirstIndex.size * MONTH_DIVIDER_HEIGHT
  );

  const points = moments.map((moment, index) => {
    const monthIndex = Array.from(monthFirstIndex.keys()).indexOf(moment.monthLabel);
    const y =
      stageHeight -
      PATH_BOTTOM_PADDING -
      index * PATH_VERTICAL_STEP -
      monthIndex * MONTH_DIVIDER_HEIGHT;

    return {
      id: moment.id,
      x: PATH_CENTER_X + PATH_X_OFFSETS[index % PATH_X_OFFSETS.length],
      y,
    };
  });

  const monthAnchors = Array.from(monthFirstIndex.entries()).map(
    ([monthLabel, index]) => ({
      monthLabel,
      y: points[index].y - 96,
    })
  );

  return {
    monthAnchors,
    points,
    stageHeight,
  };
}

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [selectedMoment, setSelectedMoment] = useState<JourneyMoment | null>(null);
  const [moments, setMoments] = useState<JourneyMoment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void trackJourneyScreenView("journey");
      let isActive = true;

      void (async () => {
        try {
          const actor = await getAuthenticatedBackendActor();
          if (!actor) {
            if (isActive) {
              setLoadError(null);
              setMoments([]);
            }
            return;
          }

          const response = await getMoments(
            {
              limit: 48,
              windowDays: JOURNEY_WINDOW_DAYS,
            },
            actor.accessToken
          );

          if (!isActive) {
            return;
          }

          setLoadError(null);
          setMoments(response.moments.map(mapBackendMoment));
        } catch (error) {
          if (!isActive) {
            return;
          }

          setLoadError(
            error instanceof Error
              ? error.message
              : "Journey could not load right now."
          );
          setMoments([]);
        }
      })();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const orderedMoments = useMemo(
    () =>
      [...moments].sort(
        (left, right) =>
          new Date(left.createdAtUtc).getTime() -
          new Date(right.createdAtUtc).getTime()
      ),
    [moments]
  );
  const pathLayout = useMemo(() => buildPathLayout(orderedMoments), [orderedMoments]);

  return (
    <>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: colors.surface.background,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + 140,
          },
        ]}
      >
        <Stack.Screen options={{ title: "Journey", headerShown: false }} />

      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: colors.text.primary }]} selectable>
          Journey
        </Text>
      </View>

        <View style={[styles.pathScreen, { height: pathLayout.stageHeight }]}>
          {orderedMoments.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  borderColor: colors.surface.border,
                  backgroundColor: colors.surface.card,
                },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]} selectable>
                {loadError ? "Journey could not load" : "Bring your first moment"}
              </Text>
              <Text style={[styles.emptyBody, { color: colors.text.secondary }]} selectable>
                {loadError
                  ? loadError
                  : "When you share something from Home, it will appear here as the first stone on your path."}
              </Text>
            </View>
          ) : null}

          <Svg
            height={pathLayout.stageHeight}
            pointerEvents="none"
            style={styles.pathSvg}
            width={PATH_STAGE_WIDTH}
          >
            <Path
              d={buildTrailPath(pathLayout.points)}
              fill="none"
              stroke={colors.surface.border}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.55}
              strokeWidth={8}
            />
          </Svg>

          {pathLayout.monthAnchors.map(({ monthLabel, y }) => (
            <View
              key={monthLabel}
              style={[
                styles.monthDividerAbsolute,
                {
                  top: y,
                },
              ]}
            >
              <View style={[styles.monthDividerLine, { backgroundColor: colors.surface.border }]} />
              <Text style={[styles.monthLabel, { color: colors.text.tertiary }]} selectable>
                {monthLabel}
              </Text>
              <View style={[styles.monthDividerLine, { backgroundColor: colors.surface.border }]} />
            </View>
          ))}

          {orderedMoments.map((moment, index) => {
            const point = pathLayout.points[index];

            return (
              <View
                key={moment.id}
                style={[
                  styles.pathNodeAbsolute,
                  {
                    left: point.x,
                    top: point.y,
                  },
                ]}
              >
                <JourneyStone
                  moment={moment}
                  onPress={() => setSelectedMoment(moment)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <MomentModal moment={selectedMoment} onClose={() => setSelectedMoment(null)} />
    </>
  );
}

function JourneyStone({
  moment,
  onPress,
}: {
  moment: JourneyMoment;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  const palette: Record<
    JourneyMomentStatus,
    {
      shell: string;
      top: string;
      face: string;
      icon: string;
      outerRing?: string;
      innerRing?: string;
    }
  > = {
    open: {
      shell: "#2A333D",
      top: "#3B4652",
      face: "#465261",
      icon: "#6E7B8A",
    },
    revisited: {
      shell: "#2B8E78",
      top: "#7BDBBE",
      face: "#63CAA8",
      icon: "#FFFFFF",
      outerRing: "#4EB79A",
      innerRing: colors.surface.background,
    },
    resolved: {
      shell: "#2B8E78",
      top: "#7BDBBE",
      face: "#63CAA8",
      icon: "#FFFFFF",
    },
  };

  const current = palette[moment.status];

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.stonePressable}>
      {moment.status === "revisited" ? (
        <View style={[styles.stoneOuterRing, { backgroundColor: current.outerRing }]}>
          <View style={[styles.stoneInnerRing, { backgroundColor: current.innerRing }]} />
        </View>
      ) : null}

      <View style={[styles.stoneShadow, { backgroundColor: current.shell }]} />
      <View style={[styles.stoneFace, { backgroundColor: current.face }]}>
        {moment.status === "resolved" ? (
          <View style={[styles.stonePolishA, { backgroundColor: "rgba(255,255,255,0.14)" }]} />
        ) : null}
        {moment.status === "resolved" ? (
          <View style={[styles.stonePolishB, { backgroundColor: "rgba(255,255,255,0.10)" }]} />
        ) : null}
        <Text style={[styles.stoneStar, { color: current.icon }]} selectable={false}>
          ★
        </Text>
      </View>
    </Pressable>
  );
}

function buildTrailPath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return "";
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const controlX = (previous.x + current.x) / 2;
    const controlY = (previous.y + current.y) / 2;

    path += ` Q ${controlX} ${controlY} ${current.x} ${current.y}`;
  }

  return path;
}

function MomentModal({
  moment,
  onClose,
}: {
  moment: JourneyMoment | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();

  if (!moment) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: colors.brand.deepForestGreen,
            },
          ]}
        >
          <View style={styles.modalStoneWrap}>
            <JourneyStone moment={moment} onPress={onClose} />
          </View>

          <Text style={styles.modalTitle} selectable>
            {moment.title}
          </Text>

          <Pressable
            accessibilityRole="button"
            style={[styles.modalButton, { backgroundColor: "#F4F5F7" }]}
          >
            <Text style={[styles.modalButtonLabel, { color: colors.brand.deepForestGreen }]} selectable>
              Open moment
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  screenHeader: {
    gap: spacing.xxs,
  },
  screenTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 34,
    lineHeight: 38,
  },
  pathScreen: {
    position: "relative",
    width: PATH_STAGE_WIDTH,
    alignSelf: "center",
    marginTop: spacing.sm,
  },
  pathSvg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  monthDividerAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  monthDividerLine: {
    flex: 1,
    height: 2,
    borderRadius: 999,
  },
  monthLabel: {
    fontFamily: fontFamily.appRegular,
    fontSize: 16,
    lineHeight: 20,
  },
  pathNodeAbsolute: {
    position: "absolute",
    marginLeft: -STONE_OFFSET,
    marginTop: -STONE_OFFSET,
  },
  emptyState: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 220,
    zIndex: 2,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fontFamily.appBold,
    fontSize: 24,
    lineHeight: 28,
    textAlign: "center",
  },
  emptyBody: {
    fontFamily: fontFamily.appRegular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  stonePressable: {
    width: 104,
    height: 104,
    alignItems: "center",
    justifyContent: "center",
  },
  stoneOuterRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  stoneInnerRing: {
    width: 76,
    height: 76,
    borderRadius: 999,
  },
  stoneShadow: {
    position: "absolute",
    width: 74,
    height: 74,
    borderRadius: 999,
    top: 28,
  },
  stoneFace: {
    width: 74,
    height: 74,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  stonePolishA: {
    position: "absolute",
    width: 44,
    height: 16,
    borderRadius: 999,
    top: 16,
    left: 10,
    transform: [{ rotate: "-24deg" }],
  },
  stonePolishB: {
    position: "absolute",
    width: 38,
    height: 14,
    borderRadius: 999,
    top: 24,
    right: 12,
    transform: [{ rotate: "32deg" }],
  },
  stoneStar: {
    fontSize: 30,
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7, 11, 20, 0.48)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    borderRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    gap: spacing.lg,
    alignItems: "center",
  },
  modalStoneWrap: {
    marginTop: -56,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontFamily: fontFamily.appBold,
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
  },
  modalButton: {
    minWidth: 220,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonLabel: {
    fontFamily: fontFamily.appBold,
    fontSize: 16,
    lineHeight: 20,
  },
});
