/**
 * Analytics Provider Component
 * 
 * Wrap your app with this provider to enable analytics tracking.
 * Should be placed near the root of your app, after NavigationContainer.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  initAnalytics,
  isAnalyticsReady,
  trackAppOpen,
  trackScreenView,
  flushAnalytics,
  resetSession,
  getAnalyticsClient,
  identifyUser,
  storeAttribution,
  flushEventQueue,
} from './track';

interface AnalyticsContextValue {
  isReady: boolean;
  identify: (userId: string, traits?: Record<string, string | number | boolean | null>) => Promise<void>;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  /**
   * User ID to identify on mount (optional)
   */
  userId?: string;
  /**
   * User traits to set on mount (optional)
   */
  userTraits?: Record<string, string | number | boolean | null>;
  /**
   * Marketing attribution params from deep link/launch URL
   */
  attribution?: {
    source?: string;
    medium?: string;
    content?: string;
  };
}

export function AnalyticsProvider({
  children,
  userId,
  userTraits,
  attribution,
}: AnalyticsProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize analytics on mount
    const init = async () => {
      // Store attribution BEFORE any events are tracked
      if (attribution) {
        await storeAttribution(
          attribution.source,
          attribution.medium,
          attribution.content
        );
      }

      await initAnalytics();

      if (isAnalyticsReady()) {
        setIsReady(true);

        // Identify user FIRST if provided (before any events)
        // This ensures user_id is set on all subsequent events including queued ones
        if (userId) {
          await identifyUser(userId, userTraits);
        }

        // Flush any events that were queued before initialization
        // Now they will have user_id if it was provided above
        await flushEventQueue();

        // Track app open (will have user_id if identified above)
        await trackAppOpen('cold');
      }
    };

    init();

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [userId, userTraits, attribution]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      // Flush events when app goes to background
      await flushAnalytics();
    } else if (nextAppState === 'active') {
      // Reset session and track warm start when app comes to foreground
      resetSession();
      await trackAppOpen('warm');
    }
  };

  const identify = async (id: string, traits?: Record<string, string | number | boolean | null>) => {
    await identifyUser(id, traits);
  };

  return (
    <AnalyticsContext.Provider value={{ isReady, identify }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to access analytics context
 */
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

/**
 * Hook to track screen views automatically with navigation
 * 
 * Usage with React Navigation:
 * ```typescript
 * function MyNavigator() {
 *   useTrackScreenViews(navigationRef);
 *   return (
 *     <NavigationContainer ref={navigationRef}>
 *       // screens
 *     </NavigationContainer>
 *   );
 * }
 * ```
 */
export function useTrackScreenViews(
  navigationRef: {
    current?: {
      getCurrentRoute: () => { name: string } | undefined;
      addListener?: (event: string, callback: () => void) => () => void;
    };
  }
) {
  useEffect(() => {
    if (!navigationRef.current) return;

    let previousScreen: string | undefined;

    const unsubscribe = navigationRef.current.addListener?.('state', () => {
      const currentRoute = navigationRef.current?.getCurrentRoute?.();
      if (currentRoute?.name && currentRoute.name !== previousScreen) {
        trackScreenView(currentRoute.name, previousScreen);
        previousScreen = currentRoute.name;
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [navigationRef]);
}
