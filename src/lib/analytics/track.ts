/**
 * Main Analytics Tracking Export
 * 
 * This is the primary entry point for all analytics functionality.
 * Components should import from here, not from individual files.
 */

// Core client
export {
  initAnalytics,
  getAnalyticsClient,
  isAnalyticsReady,
  flushAnalytics,
  resetAnalytics,
  identifyUser,
  updateUserProperties,
} from './client';

// Event tracking
export {
  track,
  trackScreenView,
  trackAppOpen,
  trackError,
  trackOnboardingStep,
  trackDonationPrompt,
  trackDonationAmount,
  trackDonationCheckout,
  getSessionId,
  resetSession,
  setAnalyticsUserId,
  getAnalyticsUserId,
  storeAttribution,
  getAttribution,
  flushEventQueue,
} from './events';

// Schema and types
export {
  EventName,
  AnalyticsArea,
  EventSchemas,
  BaseEventPropertiesSchema,
  PlatformSchema,
  type BaseEventProperties,
  type EventSchema,
  type EventProperties,
} from './schema';

// Provider
export {
  AnalyticsProvider,
  useAnalytics,
  useTrackScreenViews,
} from './provider';
