/**
 * PostHog Analytics Client Configuration
 * 
 * Initializes and exports the PostHog client for Path of Nur.
 * Supports offline queuing and retries.
 */

import PostHog from 'posthog-react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAnalyticsUserId } from './events';

// PostHog configuration constants
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
const IS_DEV = __DEV__;

// PostHog client instance
let posthogClient: PostHog | null = null;

/**
 * Initialize the PostHog analytics client
 * Call this once at app startup (in _layout.tsx or root component)
 */
export async function initAnalytics(): Promise<PostHog | null> {
  if (!POSTHOG_API_KEY) {
    if (IS_DEV) {
      console.warn('[Analytics] PostHog API key not configured');
    }
    return null;
  }

  if (posthogClient) {
    return posthogClient;
  }

  try {
    posthogClient = await PostHog.initAsync(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Enable automatic screen tracking
      captureScreens: true,
      // Enable automatic session tracking
      captureLifecycleEvents: true,
      // Enable automatic deep link tracking
      captureDeepLinks: true,
      // Flush configuration for offline support
      flushAt: 20, // Flush after 20 events
      flushInterval: 30, // Flush every 30 seconds
      // Enable debug mode in development
      enableDebug: IS_DEV,
    });

    // Set global properties that apply to all events
    await setGlobalProperties();

    if (IS_DEV) {
      console.log('[Analytics] PostHog initialized successfully');
    }

    return posthogClient;
  } catch (error) {
    console.error('[Analytics] Failed to initialize PostHog:', error);
    return null;
  }
}

/**
 * Set global properties for all events
 */
async function setGlobalProperties(): Promise<void> {
  if (!posthogClient) return;

  const globalProps = {
    $app_name: 'Path of Nur',
    $app_version: Application.nativeApplicationVersion || 'unknown',
    $app_build: Application.nativeBuildVersion || 'unknown',
    $app_platform: Platform.OS,
    $device_model: Device.modelName || 'unknown',
    $device_manufacturer: Device.manufacturer || 'unknown',
    $os_version: Device.osVersion || 'unknown',
    $locale: Localization.locale,
    $timezone: Localization.timeZone,
  };

  posthogClient.register(globalProps);
}

/**
 * Get the PostHog client instance
 */
export function getAnalyticsClient(): PostHog | null {
  return posthogClient;
}

/**
 * Check if analytics is initialized and ready
 */
export function isAnalyticsReady(): boolean {
  return posthogClient !== null;
}

/**
 * Flush queued events immediately
 * Useful before app backgrounding or logout
 */
export async function flushAnalytics(): Promise<void> {
  if (posthogClient) {
    await posthogClient.flush();
  }
}

/**
 * Reset analytics (clear user identity and queued events)
 * Call on user logout
 */
export async function resetAnalytics(): Promise<void> {
  if (posthogClient) {
    await posthogClient.reset();
  }
}

/**
 * Identify a user with a distinct ID
 */
export async function identifyUser(userId: string, traits?: Record<string, unknown>): Promise<void> {
  // Set the user ID for event tracking
  setAnalyticsUserId(userId);

  if (!posthogClient) return;

  try {
    posthogClient.identify(userId, traits);
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
}

/**
 * Update user properties without changing the distinct ID
 */
export async function updateUserProperties(traits: Record<string, unknown>): Promise<void> {
  if (!posthogClient) return;

  try {
    // Use $set for properties that should be set
    posthogClient.capture('$set', { $set: traits });
  } catch (error) {
    console.error('[Analytics] Failed to update user properties:', error);
  }
}
