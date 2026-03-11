# Analytics Implementation Guide

## Overview

Path of Nur uses **PostHog** for analytics tracking with a fully typed, schema-validated event system.

## Architecture

```
src/lib/analytics/
├── client.ts       # PostHog client initialization
├── schema.ts       # Event schemas and validation (Zod)
├── events.ts       # Typed event tracking helpers
├── provider.tsx    # React provider for auto-tracking
└── track.ts        # Main exports
```

## Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
EXPO_PUBLIC_POSTHOG_API_KEY=phc_your_project_api_key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com  # or your self-hosted URL
```

### 2. Install Dependencies

```bash
npm install
# or
npx expo install
```

### 3. Wrap App with Provider

In your root `_layout.tsx`:

```tsx
import { AnalyticsProvider } from '@/src/lib/analytics/track';

export default function RootLayout() {
  return (
    <AnalyticsProvider
      userId={currentUser?.id}
      attribution={{
        source: utmSource,
        medium: utmMedium,
        content: utmContent,
      }}
    >
      {/* Your app content */}
    </AnalyticsProvider>
  );
}
```

## Usage

### Track an Event

```tsx
import { track, EventName } from '@/src/lib/analytics/track';

// In your component:
await track(
  EventName.ONBOARDING_STEP_COMPLETED,
  {
    step_name: 'faith_segmentation',
    step_number: 3,
    total_steps: 10,
  },
  'onboarding'  // screen name
);
```

### Convenience Helpers

```tsx
import { 
  trackScreenView,
  trackOnboardingStep,
  trackDonationPrompt,
} from '@/src/lib/analytics/track';

// Track screen view
await trackScreenView('home');

// Track onboarding
await trackOnboardingStep('welcome', 1, 10, false);  // viewed
await trackOnboardingStep('welcome', 1, 10, true, 5000);  // completed

// Track donation
await trackDonationPrompt('onboarding_end');
```

## Event Naming Convention

All events follow: `area_object_action`

Examples:
- `onboarding_step_viewed`
- `donation_prompt_viewed`
- `library_track_played`
- `tools_tasbih_completed`

## Event Validation

All events are validated at runtime using Zod schemas. Invalid events:
- Throw in development
- Log warning (but don't crash) in production

## Offline Support

PostHog automatically queues events when offline and retries on reconnect. Config:
- Flush after 20 events
- Flush every 30 seconds

## Testing

In development, all tracked events are logged to console.

## Funnel Events to Track

Per AGENTS.md requirements:

1. **Acquisition → Onboarding**
   - `app_opened`
   - `onboarding_started`

2. **Onboarding Completion**
   - `onboarding_step_viewed` (per step)
   - `onboarding_step_completed` (per step)
   - `onboarding_completed`

3. **First Spiritual Action**
   - `library_track_played`
   - `tools_tasbih_completed`
   - `tools_qiblah_completed`

4. **Donation Funnel**
   - `donation_prompt_viewed`
   - `donation_amount_selected`
   - `donation_checkout_started`
   - `donation_checkout_completed`

## Retention Metrics

Track these for retention analysis:
- `app_opened` (with launch_type: cold/warm/hot)
- `journey_day_completed` (daily)
- `journey_streak_milestone` (3, 7, 14, 30 days)

## Privacy

- User ID is optional for anonymous tracking
- All events include required properties (session_id, timestamp, platform, etc.)
- Attribution data is stored locally and included with events
- Reset analytics on logout: `await resetAnalytics()`
