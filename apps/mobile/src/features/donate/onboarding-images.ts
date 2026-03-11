export const onboardingImages = {
  bismillah: require("@/assets/images/onboarding/bismillah.png"),
  location: require("@/assets/images/onboarding/location.png"),
  notifications: require("@/assets/images/onboarding/notifications.png"),
  planBreak: require("@/assets/images/onboarding/plan-break.png"),
  quranBreak: require("@/assets/images/onboarding/quran-break.png"),
  ready: require("@/assets/images/onboarding/ready.png"),
} as const;

export const onboardingImageModules = Object.values(onboardingImages);
