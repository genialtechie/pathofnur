import { Pressable, StyleSheet, Text, View } from "react-native";

import { fontFamily, radii, spacing, useTheme } from "@/src/theme";

import {
  FOLLOW_UP_DELAY_OPTIONS,
  JOURNEY_PRAYERS,
  REMINDER_LEAD_OPTIONS,
  getJourneyPrayerLabel,
  type JourneyPrayerKey,
} from "./journey-types";
import { JourneyChip, JourneyPanel } from "./journey-primitives";

type ChecklistItem = {
  key: string;
  title: string;
  meta: string;
  checked: boolean;
  onPress: () => void;
};

type JourneyTodayPanelProps = {
  todayKey: string;
  routineConfigured: boolean;
  routineItemsLabel: string;
  prayerItems: ChecklistItem[];
  supplementalItems: ChecklistItem[];
};

type JourneyRoutinePanelProps = {
  selectedPrayers: JourneyPrayerKey[];
  readingEnabled: boolean;
  fastingEnabled: boolean;
  reminderLeadMinutes: number;
  followUpDelayMinutes: number;
  isCompact: boolean;
  onPrayerPress: (prayer: JourneyPrayerKey) => void;
  onToggleHabit: (habit: "fasting" | "reading") => void;
  onReminderLeadPress: (minutes: number) => void;
  onFollowUpDelayPress: (minutes: number) => void;
};

type JourneyReminderPanelProps = {
  locationStatus: string;
  reminderStatusLabel: string;
  lastScheduledAt: string | null;
  remindersActive: boolean;
  remindersDirty: boolean;
  supportsScheduling: boolean;
  isScheduling: boolean;
  onSync: () => void;
  onDisable: () => void;
};

export function JourneyTodayPanel({
  todayKey,
  routineConfigured,
  routineItemsLabel,
  prayerItems,
  supplementalItems,
}: JourneyTodayPanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="Today"
      subtitle={
        routineConfigured
          ? routineItemsLabel
          : "Create a routine to unlock your daily checklist."
      }
      badge={todayKey}
    >
      {prayerItems.map((item) => (
        <ChecklistRow key={item.key} item={item} />
      ))}

      {supplementalItems.map((item) => (
        <ChecklistRow key={item.key} item={item} />
      ))}

      {!routineConfigured ? (
        <View
          style={[
            styles.emptyNotice,
            {
              backgroundColor: colors.surface.background,
              borderColor: colors.surface.border,
            },
          ]}
        >
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]} selectable>
            Start with the routine below.
          </Text>
          <Text style={[styles.emptyCopy, { color: colors.text.secondary }]} selectable>
            Pick the prayers you want to protect, then add reading or fasting if they belong in your daily return.
          </Text>
        </View>
      ) : null}
    </JourneyPanel>
  );
}

export function JourneyRoutinePanel({
  selectedPrayers,
  readingEnabled,
  fastingEnabled,
  reminderLeadMinutes,
  followUpDelayMinutes,
  isCompact,
  onPrayerPress,
  onToggleHabit,
  onReminderLeadPress,
  onFollowUpDelayPress,
}: JourneyRoutinePanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="Routine"
      subtitle="Turn Journey into a daily return, not a static tracker."
    >
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: colors.text.tertiary }]} selectable>
          Prayers to track
        </Text>
        <View style={styles.chipRow}>
          {JOURNEY_PRAYERS.map((prayer) => (
            <JourneyChip
              key={prayer}
              label={getJourneyPrayerLabel(prayer)}
              selected={selectedPrayers.includes(prayer)}
              onPress={() => onPrayerPress(prayer)}
              compact={isCompact}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: colors.text.tertiary }]} selectable>
          Add daily habits
        </Text>
        <View style={styles.chipRow}>
          <JourneyChip
            label="Reading"
            selected={readingEnabled}
            onPress={() => onToggleHabit("reading")}
            compact={isCompact}
          />
          <JourneyChip
            label="Fasting"
            selected={fastingEnabled}
            onPress={() => onToggleHabit("fasting")}
            compact={isCompact}
          />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: colors.text.tertiary }]} selectable>
          Prayer reminder lead time
        </Text>
        <View style={styles.chipRow}>
          {REMINDER_LEAD_OPTIONS.map((minutes) => (
            <JourneyChip
              key={minutes}
              label={`${minutes} min before`}
              selected={reminderLeadMinutes === minutes}
              onPress={() => onReminderLeadPress(minutes)}
              compact={isCompact}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: colors.text.tertiary }]} selectable>
          Follow-up check-in
        </Text>
        <View style={styles.chipRow}>
          {FOLLOW_UP_DELAY_OPTIONS.map((minutes) => (
            <JourneyChip
              key={minutes}
              label={`${minutes} min after`}
              selected={followUpDelayMinutes === minutes}
              onPress={() => onFollowUpDelayPress(minutes)}
              compact={isCompact}
            />
          ))}
        </View>
      </View>
    </JourneyPanel>
  );
}

export function JourneyReminderPanel({
  locationStatus,
  reminderStatusLabel,
  lastScheduledAt,
  remindersActive,
  remindersDirty,
  supportsScheduling,
  isScheduling,
  onSync,
  onDisable,
}: JourneyReminderPanelProps) {
  const { colors } = useTheme();

  return (
    <JourneyPanel
      title="Reminders"
      subtitle={
        locationStatus === "denied"
          ? "Location is off, so prayer reminders cannot be scheduled yet."
          : reminderStatusLabel
      }
      badge={
        lastScheduledAt
          ? `Synced ${new Date(lastScheduledAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}`
          : "Not synced"
      }
    >
      <View
        style={[
          styles.reminderState,
          {
            backgroundColor: colors.surface.background,
            borderColor: colors.surface.border,
          },
        ]}
      >
        <Text style={[styles.reminderPrimary, { color: colors.text.primary }]} selectable>
          {remindersActive
            ? remindersDirty
              ? "Your routine changed. Sync reminders again."
              : "Prayer reminders and check-ins are active."
            : "Turn on prayer reminders and follow-up check-ins."}
        </Text>
        <Text style={[styles.reminderSecondary, { color: colors.text.secondary }]} selectable>
          {process.env.EXPO_OS === "web"
            ? "Scheduled prayer reminders currently need iOS or Android builds."
            : "Each selected prayer gets a reminder before the adhan and a later check-in asking if you prayed."}
        </Text>
      </View>

      <View style={styles.ctaRow}>
        <Pressable
          disabled={isScheduling || !supportsScheduling}
          onPress={onSync}
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.brand.metallicGold,
              opacity: isScheduling || !supportsScheduling ? 0.55 : 1,
            },
          ]}
        >
          <Text style={[styles.primaryButtonLabel, { color: colors.text.onAccent }]} selectable>
            {supportsScheduling
              ? remindersActive
                ? "Sync reminders"
                : "Turn on reminders"
              : "iOS / Android only"}
          </Text>
        </Pressable>

        {remindersActive ? (
          <Pressable
            disabled={isScheduling}
            onPress={onDisable}
            style={[
              styles.secondaryButton,
              {
                borderColor: colors.surface.borderInteractive,
                backgroundColor: colors.surface.background,
              },
            ]}
          >
            <Text style={[styles.secondaryButtonLabel, { color: colors.text.secondary }]} selectable>
              Turn off
            </Text>
          </Pressable>
        ) : null}
      </View>
    </JourneyPanel>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={item.onPress}
      style={[
        styles.checklistRow,
        {
          backgroundColor: item.checked
            ? colors.interactive.selectedBackground
            : colors.surface.background,
          borderColor: item.checked
            ? colors.interactive.selectedBorder
            : colors.surface.border,
        },
      ]}
    >
      <View style={styles.checklistCopy}>
        <Text style={[styles.checklistTitle, { color: colors.text.primary }]} selectable>
          {item.title}
        </Text>
        <Text style={[styles.checklistMeta, { color: colors.text.secondary }]} selectable>
          {item.meta}
        </Text>
      </View>
      <View
        style={[
          styles.checkIndicator,
          {
            borderColor: item.checked ? colors.brand.metallicGold : colors.surface.borderInteractive,
            backgroundColor: item.checked ? colors.brand.metallicGold : "transparent",
          },
        ]}
      >
        {item.checked ? (
          <Text style={[styles.checkIndicatorLabel, { color: colors.text.onAccent }]} selectable>
            Yes
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  checklistCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  checklistTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  checklistMeta: {
    fontFamily: fontFamily.appRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  checkIndicator: {
    minWidth: 56,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  checkIndicatorLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 12,
  },
  emptyNotice: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  emptyCopy: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  reminderState: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  reminderPrimary: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  reminderSecondary: {
    fontFamily: fontFamily.appRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  ctaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: 52,
    flexGrow: 1,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryButtonLabel: {
    fontFamily: fontFamily.appBold,
    fontSize: 16,
    lineHeight: 20,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonLabel: {
    fontFamily: fontFamily.appSemiBold,
    fontSize: 15,
  },
});
