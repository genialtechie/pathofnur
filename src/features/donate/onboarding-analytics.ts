import {
  EventName,
  track,
  trackOnboardingStep
} from "@/src/lib/analytics/track";

export const TOTAL_ONBOARDING_STEPS = 5;

export async function trackOnboardingStarted(): Promise<void> {
  await track(EventName.ONBOARDING_STARTED, {}, "onboarding");
}

export async function trackOnboardingCompleted(): Promise<void> {
  await track(EventName.ONBOARDING_COMPLETED, {}, "onboarding-complete");
}

export async function trackOnboardingAbandoned(stepReached: string): Promise<void> {
  await track(
    EventName.ONBOARDING_ABANDONED,
    { step_reached: stepReached },
    "onboarding"
  );
}

export async function trackOnboardingStepViewed(
  stepName: string,
  stepNumber: number
): Promise<void> {
  await trackOnboardingStep(stepName, stepNumber, TOTAL_ONBOARDING_STEPS, false);
}

export async function trackOnboardingStepCompleted(
  stepName: string,
  stepNumber: number,
  startedAtMs: number
): Promise<void> {
  await trackOnboardingStep(
    stepName,
    stepNumber,
    TOTAL_ONBOARDING_STEPS,
    true,
    Math.max(0, Date.now() - startedAtMs)
  );
}
