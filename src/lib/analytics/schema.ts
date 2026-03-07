/**
 * Analytics Schema Definitions
 * 
 * Defines all event names, properties, and validation rules for Path of Nur analytics.
 * All events follow the pattern: area_object_action
 */

import { z } from 'zod';

// ============================================================================
// Event Name Patterns
// ============================================================================

/**
 * Analytics areas - top-level app sections
 */
export const AnalyticsArea = {
  ONBOARDING: 'onboarding',
  HOME: 'home',
  LIBRARY: 'library',
  TOOLS: 'tools',
  JOURNEY: 'journey',
  DONATE: 'donate',
  SETTINGS: 'settings',
  GLOBAL: 'global',
} as const;

export type AnalyticsArea = typeof AnalyticsArea[keyof typeof AnalyticsArea];

/**
 * All canonical event names
 * Format: area_object_action
 */
export const EventName = {
  // Onboarding events
  ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',
  
  // Home events
  HOME_HERO_OPENED: 'home_hero_opened',
  HOME_HERO_SWIPED: 'home_hero_swiped',
  HOME_PRAYER_TIMELINE_VIEWED: 'home_prayer_timeline_viewed',
  HOME_QUICK_TASBIH_OPENED: 'home_quick_tasbih_opened',
  
  // Library events
  LIBRARY_COLLECTION_OPENED: 'library_collection_opened',
  LIBRARY_TRACK_PLAYED: 'library_track_played',
  LIBRARY_AMBIENT_TOGGLED: 'library_ambient_toggled',
  
  // Tools events
  TOOLS_QIBLAH_STARTED: 'tools_qiblah_started',
  TOOLS_QIBLAH_COMPLETED: 'tools_qiblah_completed',
  TOOLS_TASBIH_STARTED: 'tools_tasbih_started',
  TOOLS_TASBIH_COMPLETED: 'tools_tasbih_completed',
  TOOLS_TASBIH_RESET: 'tools_tasbih_reset',
  
  // Journey events
  JOURNEY_DAY_COMPLETED: 'journey_day_completed',
  JOURNEY_STREAK_MILESTONE: 'journey_streak_milestone',
  JOURNEY_SHARE_CARD_CREATED: 'journey_share_card_created',
  JOURNEY_HABIT_TOGGLED: 'journey_habit_toggled',
  JOURNEY_ROUTINE_CREATED: 'journey_routine_created',
  JOURNEY_ROUTINE_UPDATED: 'journey_routine_updated',
  JOURNEY_REMINDER_PERMISSION_REQUESTED: 'journey_reminder_permission_requested',
  JOURNEY_REMINDER_PERMISSION_GRANTED: 'journey_reminder_permission_granted',
  JOURNEY_REMINDER_SCHEDULED: 'journey_reminder_scheduled',
  JOURNEY_PRAYER_CHECKIN_COMPLETED: 'journey_prayer_checkin_completed',
  
  // Donation events
  DONATION_PROMPT_VIEWED: 'donation_prompt_viewed',
  DONATION_AMOUNT_SELECTED: 'donation_amount_selected',
  DONATION_CHECKOUT_STARTED: 'donation_checkout_started',
  DONATION_CHECKOUT_COMPLETED: 'donation_checkout_completed',
  DONATION_CHECKOUT_FAILED: 'donation_checkout_failed',
  DONATION_CHECKOUT_ABANDONED: 'donation_checkout_abandoned',
  
  // Global/App events
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  SCREEN_VIEWED: 'screen_viewed',
  ERROR_OCCURRED: 'error_occurred',
} as const;

export type EventName = typeof EventName[keyof typeof EventName];

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

/**
 * Platform values
 */
export const PlatformSchema = z.enum(['web', 'ios', 'android']);

/**
 * Base event properties required for ALL events
 */
export const BaseEventPropertiesSchema = z.object({
  // Required core properties
  user_id: z.string().min(1).optional(), // Optional for anonymous users
  session_id: z.string().min(1),
  timestamp_utc: z.string().datetime(), // ISO 8601 format
  
  // Screen/Context
  screen_name: z.string().min(1),
  entry_source: z.string().min(1),
  
  // Marketing attribution
  campaign_source: z.string().optional(),
  campaign_medium: z.string().optional(),
  campaign_content: z.string().optional(),
  
  // Device/App info
  platform: PlatformSchema,
  app_version: z.string().min(1),
});

export type BaseEventProperties = z.infer<typeof BaseEventPropertiesSchema>;

/**
 * Onboarding step viewed properties
 */
export const OnboardingStepViewedSchema = BaseEventPropertiesSchema.extend({
  step_name: z.string().min(1),
  step_number: z.number().int().min(1),
  total_steps: z.number().int().min(1),
});

/**
 * Onboarding step completed properties
 */
export const OnboardingStepCompletedSchema = BaseEventPropertiesSchema.extend({
  step_name: z.string().min(1),
  step_number: z.number().int().min(1),
  total_steps: z.number().int().min(1),
  time_spent_ms: z.number().int().optional(),
});

/**
 * Donation prompt viewed properties
 */
export const DonationPromptViewedSchema = BaseEventPropertiesSchema.extend({
  trigger_context: z.enum([
    'onboarding_end',
    'first_action_complete',
    'streak_milestone',
    'share_card_created',
    'settings',
  ]),
  milestone_day: z.number().int().optional(), // For streak milestones
});

/**
 * Donation amount selected properties
 */
export const DonationAmountSelectedSchema = BaseEventPropertiesSchema.extend({
  amount_usd: z.number().positive(),
  is_custom: z.boolean(),
  preset_index: z.number().int().optional(),
});

/**
 * Track played properties
 */
export const LibraryTrackPlayedSchema = BaseEventPropertiesSchema.extend({
  track_id: z.string().min(1),
  track_name: z.string().min(1),
  collection_name: z.string().optional(),
  has_ambient: z.boolean(),
  ambient_type: z.enum(['rain', 'medina_wind', 'silence']).optional(),
});

/**
 * Journey day completed properties
 */
export const JourneyDayCompletedSchema = BaseEventPropertiesSchema.extend({
  day_number: z.number().int().min(1).max(30),
  ramadan_year: z.number().int(),
  action_type: z.enum(['quran', 'tasbih', 'dua', 'reflection']),
});

/**
 * Streak milestone properties
 */
export const JourneyStreakMilestoneSchema = BaseEventPropertiesSchema.extend({
  streak_days: z.number().int(),
  milestone_type: z.enum(['3', '7', '14', '30']),
  habit: z.enum(['prayer', 'fasting', 'reading']).optional(),
});

export const JourneyHabitToggledSchema = BaseEventPropertiesSchema.extend({
  habit: z.enum(['prayer', 'fasting', 'reading']),
  is_complete: z.boolean(),
  day_key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const JourneyRoutineSavedSchema = BaseEventPropertiesSchema.extend({
  selected_prayer_count: z.number().int().min(0).max(5),
  includes_reading: z.boolean(),
  includes_fasting: z.boolean(),
  reminder_lead_minutes: z.number().int().min(0),
  follow_up_delay_minutes: z.number().int().min(0),
});

export const JourneyReminderPermissionGrantedSchema = BaseEventPropertiesSchema.extend({
  permission_status: z.enum(['granted', 'denied', 'unknown', 'unsupported']),
});

export const JourneyReminderScheduledSchema = BaseEventPropertiesSchema.extend({
  reminder_count: z.number().int().min(0),
  selected_prayer_count: z.number().int().min(0).max(5),
  window_days: z.number().int().min(1).max(14),
});

export const JourneyPrayerCheckinCompletedSchema = BaseEventPropertiesSchema.extend({
  prayer_name: z.enum(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']),
  is_complete: z.boolean(),
  day_key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Error occurred properties
 */
export const ErrorOccurredSchema = BaseEventPropertiesSchema.extend({
  error_code: z.string().min(1),
  error_message: z.string().min(1),
  error_context: z.string().min(1),
  is_fatal: z.boolean(),
});

// ============================================================================
// Event Schema Map
// ============================================================================

/**
 * Map of event names to their validation schemas
 * Used for runtime payload validation
 */
export const EventSchemas = {
  [EventName.ONBOARDING_STEP_VIEWED]: OnboardingStepViewedSchema,
  [EventName.ONBOARDING_STEP_COMPLETED]: OnboardingStepCompletedSchema,
  [EventName.ONBOARDING_STARTED]: BaseEventPropertiesSchema,
  [EventName.ONBOARDING_COMPLETED]: BaseEventPropertiesSchema,
  [EventName.ONBOARDING_ABANDONED]: BaseEventPropertiesSchema.extend({
    step_reached: z.string().min(1),
  }),
  
  [EventName.HOME_HERO_OPENED]: BaseEventPropertiesSchema.extend({
    hero_type: z.string().min(1),
    hero_index: z.number().int(),
    action: z.string().optional(),
  }),
  [EventName.HOME_HERO_SWIPED]: BaseEventPropertiesSchema.extend({
    hero_index: z.number().int(),
    previous_index: z.number().int(),
  }),
  [EventName.HOME_PRAYER_TIMELINE_VIEWED]: BaseEventPropertiesSchema,
  [EventName.HOME_QUICK_TASBIH_OPENED]: BaseEventPropertiesSchema,
  
  [EventName.LIBRARY_COLLECTION_OPENED]: BaseEventPropertiesSchema.extend({
    collection_name: z.string().min(1),
  }),
  [EventName.LIBRARY_TRACK_PLAYED]: LibraryTrackPlayedSchema,
  [EventName.LIBRARY_AMBIENT_TOGGLED]: BaseEventPropertiesSchema.extend({
    ambient_type: z.string().min(1),
    is_enabled: z.boolean(),
  }),
  
  [EventName.TOOLS_QIBLAH_STARTED]: BaseEventPropertiesSchema,
  [EventName.TOOLS_QIBLAH_COMPLETED]: BaseEventPropertiesSchema.extend({
    accuracy_meters: z.number().optional(),
  }),
  [EventName.TOOLS_TASBIH_STARTED]: BaseEventPropertiesSchema,
  [EventName.TOOLS_TASBIH_COMPLETED]: BaseEventPropertiesSchema.extend({
    count: z.number().int().min(1),
    dhikr_type: z.string().min(1),
  }),
  [EventName.TOOLS_TASBIH_RESET]: BaseEventPropertiesSchema,
  
  [EventName.JOURNEY_DAY_COMPLETED]: JourneyDayCompletedSchema,
  [EventName.JOURNEY_STREAK_MILESTONE]: JourneyStreakMilestoneSchema,
  [EventName.JOURNEY_SHARE_CARD_CREATED]: BaseEventPropertiesSchema.extend({
    share_type: z.string().min(1),
  }),
  [EventName.JOURNEY_HABIT_TOGGLED]: JourneyHabitToggledSchema,
  [EventName.JOURNEY_ROUTINE_CREATED]: JourneyRoutineSavedSchema,
  [EventName.JOURNEY_ROUTINE_UPDATED]: JourneyRoutineSavedSchema,
  [EventName.JOURNEY_REMINDER_PERMISSION_REQUESTED]: BaseEventPropertiesSchema,
  [EventName.JOURNEY_REMINDER_PERMISSION_GRANTED]: JourneyReminderPermissionGrantedSchema,
  [EventName.JOURNEY_REMINDER_SCHEDULED]: JourneyReminderScheduledSchema,
  [EventName.JOURNEY_PRAYER_CHECKIN_COMPLETED]: JourneyPrayerCheckinCompletedSchema,
  
  [EventName.DONATION_PROMPT_VIEWED]: DonationPromptViewedSchema,
  [EventName.DONATION_AMOUNT_SELECTED]: DonationAmountSelectedSchema,
  [EventName.DONATION_CHECKOUT_STARTED]: BaseEventPropertiesSchema.extend({
    amount_usd: z.number().positive(),
  }),
  [EventName.DONATION_CHECKOUT_COMPLETED]: BaseEventPropertiesSchema.extend({
    amount_usd: z.number().positive(),
    donation_id: z.string().min(1),
  }),
  [EventName.DONATION_CHECKOUT_FAILED]: BaseEventPropertiesSchema.extend({
    amount_usd: z.number().positive(),
    error_code: z.string().min(1),
  }),
  [EventName.DONATION_CHECKOUT_ABANDONED]: BaseEventPropertiesSchema.extend({
    amount_usd: z.number().positive(),
    step_reached: z.string().min(1),
  }),
  
  [EventName.APP_OPENED]: BaseEventPropertiesSchema.extend({
    launch_type: z.enum(['cold', 'warm', 'hot']),
  }),
  [EventName.APP_BACKGROUNDED]: BaseEventPropertiesSchema.extend({
    session_duration_ms: z.number().int(),
  }),
  [EventName.SCREEN_VIEWED]: BaseEventPropertiesSchema.extend({
    previous_screen: z.string().optional(),
  }),
  [EventName.ERROR_OCCURRED]: ErrorOccurredSchema,
} as const;

/**
 * Type helper to get the schema type for a given event name
 */
export type EventSchema<T extends EventName> = typeof EventSchemas[T];

/**
 * Type helper to get the properties type for a given event name
 */
export type EventProperties<T extends EventName> = z.infer<typeof EventSchemas[T]>;
