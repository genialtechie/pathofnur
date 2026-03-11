/**
 * Typed Event Helpers
 * 
 * Provides type-safe event tracking functions for all analytics events.
 * Never use raw event names in components - always use these helpers.
 */

import { EventName, EventProperties, EventSchemas } from './schema';
import { getAnalyticsClient } from './client';
import { Platform } from 'react-native';
import * as Application from 'expo-application';

// ============================================================================
// Session Management
// ============================================================================

let sessionId: string | null = null;
let userId: string | null = null;

// ============================================================================
// Event Queue for Pre-Init Events
// ============================================================================

interface QueuedEvent {
  eventName: EventName;
  properties: Record<string, unknown>;
  screenName: string;
  timestamp: number;
}

const eventQueue: QueuedEvent[] = [];
const MAX_QUEUE_SIZE = 100;

/**
 * Add event to queue for later processing
 */
function queueEvent(eventName: EventName, properties: Record<string, unknown>, screenName: string): void {
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    // Remove oldest event if queue is full
    eventQueue.shift();
    if (__DEV__) {
      console.warn('[Analytics] Queue full, dropped oldest event');
    }
  }
  
  eventQueue.push({
    eventName,
    properties,
    screenName,
    timestamp: Date.now(),
  });
  
  if (__DEV__) {
    console.log('[Analytics] Event queued:', eventName, '| Queue size:', eventQueue.length);
  }
}

/**
 * Flush queued events
 * Call this after analytics client is initialized
 */
export async function flushEventQueue(): Promise<void> {
  const client = getAnalyticsClient();
  if (!client || eventQueue.length === 0) return;

  if (__DEV__) {
    console.log('[Analytics] Flushing', eventQueue.length, 'queued events');
  }

  // Process queue in order
  while (eventQueue.length > 0) {
    const queuedEvent = eventQueue.shift();
    if (!queuedEvent) continue;

    try {
      // Rebuild properties with current context
      const baseProps = await buildBaseProperties(queuedEvent.screenName);
      const completeProps = {
        ...baseProps,
        ...queuedEvent.properties,
        // Preserve original timestamp for accuracy
        timestamp_utc: new Date(queuedEvent.timestamp).toISOString(),
      };

      // Validate and send
      if (validateEvent(queuedEvent.eventName, completeProps as EventProperties<EventName>)) {
        client.capture(queuedEvent.eventName, completeProps);
      }
    } catch (error) {
      console.error('[Analytics] Failed to flush queued event:', queuedEvent.eventName, error);
    }
  }
}

/**
 * Generate or retrieve the current session ID
 */
export function getSessionId(): string {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  return sessionId;
}

/**
 * Generate a new session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Reset the session (call on app background/foreground transitions)
 */
export function resetSession(): void {
  sessionId = generateSessionId();
}

/**
 * Set the user ID for tracking
 */
export function setAnalyticsUserId(id: string | null): void {
  userId = id;
}

/**
 * Get the current user ID
 */
export function getAnalyticsUserId(): string | null {
  return userId;
}

// ============================================================================
// Attribution Storage
// ============================================================================

const ATTRIBUTION_KEY = 'pon_attribution';

/**
 * Store marketing attribution parameters
 * Call this when the app is opened with UTM params
 */
export async function storeAttribution(
  source?: string,
  medium?: string,
  content?: string
): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const attribution = JSON.stringify({ source, medium, content, timestamp: Date.now() });
    await AsyncStorage.setItem(ATTRIBUTION_KEY, attribution);
  } catch {
    // Silently fail - attribution is not critical
  }
}

/**
 * Get stored attribution parameters
 */
export async function getAttribution(): Promise<{ source?: string; medium?: string; content?: string }> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const stored = await AsyncStorage.getItem(ATTRIBUTION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        source: parsed.source,
        medium: parsed.medium,
        content: parsed.content,
      };
    }
  } catch {
    // Silently fail
  }
  return {};
}

// ============================================================================
// Base Event Builder
// ============================================================================

/**
 * Build the base properties that all events require
 */
async function buildBaseProperties(screenName: string, entrySource?: string): Promise<{
  user_id?: string;
  session_id: string;
  timestamp_utc: string;
  screen_name: string;
  platform: 'web' | 'ios' | 'android';
  app_version: string;
  entry_source: string;
  campaign_source?: string;
  campaign_medium?: string;
  campaign_content?: string;
}> {
  const attribution = await getAttribution();

  const props: {
    user_id?: string;
    session_id: string;
    timestamp_utc: string;
    screen_name: string;
    platform: 'web' | 'ios' | 'android';
    app_version: string;
    entry_source: string;
    campaign_source?: string;
    campaign_medium?: string;
    campaign_content?: string;
  } = {
    session_id: getSessionId(),
    timestamp_utc: new Date().toISOString(),
    screen_name: screenName,
    platform: Platform.OS as 'web' | 'ios' | 'android',
    app_version: Application.nativeApplicationVersion || 'unknown',
    entry_source: entrySource || attribution.source || 'direct',
    campaign_source: attribution.source,
    campaign_medium: attribution.medium,
    campaign_content: attribution.content,
  };

  // Only include user_id if it exists (avoid undefined for PostHog JsonType compatibility)
  if (userId) {
    props.user_id = userId;
  }

  return props;
}

// ============================================================================
// Event Validation
// ============================================================================

/**
 * Validate event properties against the schema
 * Throws in development, logs warning in production
 */
function validateEvent<T extends EventName>(
  eventName: T,
  properties: EventProperties<T>
): boolean {
  const schema = EventSchemas[eventName];
  if (!schema) {
    console.error(`[Analytics] Unknown event: ${eventName}`);
    return false;
  }

  const result = schema.safeParse(properties);
  if (!result.success) {
    if (__DEV__) {
      console.error(`[Analytics] Invalid payload for ${eventName}:`, result.error);
      throw new Error(`Invalid analytics payload for ${eventName}`);
    } else {
      console.warn(`[Analytics] Invalid payload for ${eventName}:`, result.error);
    }
    return false;
  }
  return true;
}

// ============================================================================
// Typed Event Tracking Functions
// ============================================================================

/**
 * Track an analytics event with full type safety
 * 
 * Usage:
 * ```typescript
 * await track(EventName.ONBOARDING_STEP_VIEWED, {
 *   step_name: 'welcome',
 *   step_number: 1,
 *   total_steps: 10,
 * });
 * ```
 */
export async function track<T extends EventName>(
  eventName: T,
  properties: Omit<EventProperties<T>, 'user_id' | 'session_id' | 'timestamp_utc' | 'screen_name' | 'platform' | 'app_version' | 'campaign_source' | 'campaign_medium' | 'campaign_content' | 'entry_source'>,
  screenName: string
): Promise<void> {
  const client = getAnalyticsClient();
  
  // If client not ready, queue the event for later
  if (!client) {
    queueEvent(eventName, properties as Record<string, unknown>, screenName);
    return;
  }

  try {
    // Build complete properties with base fields
    const baseProps = await buildBaseProperties(screenName);
    const completeProps = {
      ...baseProps,
      ...properties,
    } as EventProperties<T>;

    // Validate the payload
    if (!validateEvent(eventName, completeProps)) {
      return;
    }

    // Send to PostHog
    client.capture(eventName, completeProps);

    if (__DEV__) {
      console.log('[Analytics] Tracked:', eventName, completeProps);
    }
  } catch (error) {
    console.error('[Analytics] Failed to track event:', eventName, error);
  }
}

// ============================================================================
// Convenience Helpers
// ============================================================================

/**
 * Track screen view
 */
export async function trackScreenView(
  screenName: string,
  previousScreen?: string
): Promise<void> {
  await track(
    EventName.SCREEN_VIEWED,
    { previous_screen: previousScreen },
    screenName
  );
}

/**
 * Track app open
 */
export async function trackAppOpen(launchType: 'cold' | 'warm' | 'hot'): Promise<void> {
  await track(
    EventName.APP_OPENED,
    { launch_type: launchType },
    'app'
  );
}

/**
 * Track error
 */
export async function trackError(
  errorCode: string,
  errorMessage: string,
  errorContext: string,
  isFatal: boolean,
  screenName: string
): Promise<void> {
  await track(
    EventName.ERROR_OCCURRED,
    {
      error_code: errorCode,
      error_message: errorMessage,
      error_context: errorContext,
      is_fatal: isFatal,
    },
    screenName
  );
}

/**
 * Track onboarding step
 */
export async function trackOnboardingStep(
  stepName: string,
  stepNumber: number,
  totalSteps: number,
  isCompleted: boolean = false,
  timeSpentMs?: number
): Promise<void> {
  if (isCompleted) {
    await track(
      EventName.ONBOARDING_STEP_COMPLETED,
      {
        step_name: stepName,
        step_number: stepNumber,
        total_steps: totalSteps,
        time_spent_ms: timeSpentMs,
      },
      `onboarding-${stepName}`
    );
  } else {
    await track(
      EventName.ONBOARDING_STEP_VIEWED,
      {
        step_name: stepName,
        step_number: stepNumber,
        total_steps: totalSteps,
      },
      `onboarding-${stepName}`
    );
  }
}

/**
 * Track donation flow
 */
export async function trackDonationPrompt(
  triggerContext: 'onboarding_end' | 'first_action_complete' | 'streak_milestone' | 'share_card_created' | 'settings',
  milestoneDay?: number
): Promise<void> {
  await track(
    EventName.DONATION_PROMPT_VIEWED,
    {
      trigger_context: triggerContext,
      milestone_day: milestoneDay,
    },
    'donation'
  );
}

export async function trackDonationAmount(
  amountUsd: number,
  isCustom: boolean,
  presetIndex?: number
): Promise<void> {
  await track(
    EventName.DONATION_AMOUNT_SELECTED,
    {
      amount_usd: amountUsd,
      is_custom: isCustom,
      preset_index: presetIndex,
    },
    'donation'
  );
}

// Function overloads for type-safe status/props combinations
export async function trackDonationCheckout(
  amountUsd: number,
  status: 'started'
): Promise<void>;
export async function trackDonationCheckout(
  amountUsd: number,
  status: 'completed',
  extraProps: { donationId: string }
): Promise<void>;
export async function trackDonationCheckout(
  amountUsd: number,
  status: 'failed',
  extraProps: { errorCode: string }
): Promise<void>;
export async function trackDonationCheckout(
  amountUsd: number,
  status: 'abandoned',
  extraProps: { stepReached: string }
): Promise<void>;

// Implementation
export async function trackDonationCheckout(
  amountUsd: number,
  status: 'started' | 'completed' | 'failed' | 'abandoned',
  extraProps?: { donationId: string } | { errorCode: string } | { stepReached: string }
): Promise<void> {
  const eventMap = {
    started: EventName.DONATION_CHECKOUT_STARTED,
    completed: EventName.DONATION_CHECKOUT_COMPLETED,
    failed: EventName.DONATION_CHECKOUT_FAILED,
    abandoned: EventName.DONATION_CHECKOUT_ABANDONED,
  };

  // Build props based on status with proper typing
  const baseProps = { amount_usd: amountUsd };
  
  if (status === 'completed' && extraProps && 'donationId' in extraProps) {
    await track(
      eventMap[status],
      { ...baseProps, donation_id: extraProps.donationId },
      'donation'
    );
  } else if (status === 'failed' && extraProps && 'errorCode' in extraProps) {
    await track(
      eventMap[status],
      { ...baseProps, error_code: extraProps.errorCode },
      'donation'
    );
  } else if (status === 'abandoned' && extraProps && 'stepReached' in extraProps) {
    await track(
      eventMap[status],
      { ...baseProps, step_reached: extraProps.stepReached },
      'donation'
    );
  } else {
    await track(eventMap[status], baseProps, 'donation');
  }
}
