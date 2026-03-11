import type { AppUserProfile } from "@imaan/contracts"

export type AuthProvider = "apple" | "google" | "email_otp"

export type AuthSessionSnapshot = {
  accessToken: string
  refreshToken: string
  expiresAtUtc: string
  provider: AuthProvider
  profile: AppUserProfile
}
