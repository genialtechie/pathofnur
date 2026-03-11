import { z } from "zod"

export const InterventionTypeSchema = z.enum([
  "contextual_anchor",
  "quick_validation",
  "concise_ruling",
])

export const SourceKindSchema = z.enum(["quran", "hadith", "seerah", "fiqh"])

export const ResolutionStateSchema = z.enum(["grounded", "done"])

export const FollowupStatusSchema = z.enum([
  "pending",
  "sent",
  "completed",
  "dismissed",
  "expired",
])

export const NotificationPlatformSchema = z.enum(["ios", "android"])
export const RetrievalSourceTypeSchema = z.enum(["quran", "hadith"])

export const CitationSchema = z.object({
  id: z.string().min(1),
  sourceKind: SourceKindSchema,
  title: z.string().min(1),
  reference: z.string().min(1),
  excerpt: z.string().min(1),
})

export const DuaSchema = z.object({
  arabic: z.string().min(1).nullable(),
  transliteration: z.string().min(1).nullable(),
  translation: z.string().min(1).nullable(),
})

export const InterventionPayloadSchema = z.object({
  id: z.string().min(1),
  type: InterventionTypeSchema,
  title: z.string().min(1),
  validationCopy: z.string().min(1),
  primaryText: z.string().min(1),
  dua: DuaSchema.nullable(),
  repeatCount: z.number().int().min(1).nullable(),
  citations: z.array(CitationSchema).min(1),
  followupSuggested: z.boolean(),
  ledgerSummary: z.string().min(1),
  createdAtUtc: z.string().datetime(),
})

export const AppUserProfileSchema = z.object({
  id: z.string().min(1),
  email: z.string().email().nullable(),
  displayName: z.string().min(1).nullable(),
  onboardingCompleted: z.boolean(),
  notificationsEnabled: z.boolean(),
  momentsGrounded: z.number().int().min(0),
})

export const LedgerEntrySchema = z.object({
  id: z.string().min(1),
  occurredAtUtc: z.string().datetime(),
  summary: z.string().min(1),
  interventionType: InterventionTypeSchema,
  resolutionState: ResolutionStateSchema.nullable(),
  followupStatus: FollowupStatusSchema.nullable(),
})

export const FollowupRecordSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  scheduledForUtc: z.string().datetime(),
  status: FollowupStatusSchema,
  relatedInterventionId: z.string().min(1),
})

export const CreateInterventionRequestSchema = z.object({
  inputText: z.string().min(1),
  locale: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  entrySource: z.string().min(1).optional(),
})

export const ResolveInterventionRequestSchema = z.object({
  resolution: ResolutionStateSchema,
})

export const LedgerPageResponseSchema = z.object({
  entries: z.array(LedgerEntrySchema),
  nextCursor: z.string().min(1).nullable(),
})

export const FollowupListResponseSchema = z.object({
  followups: z.array(FollowupRecordSchema),
})

export const MeResponseSchema = z.object({
  profile: AppUserProfileSchema,
})

export const FollowupResponseRequestSchema = z.object({
  responseText: z.string().min(1),
})

export const RegisterPushTokenRequestSchema = z.object({
  platform: NotificationPlatformSchema,
  pushToken: z.string().min(1),
})

export const RetrievePassagesRequestSchema = z.object({
  inputText: z.string().min(1),
  matchCount: z.number().int().min(1).max(10).optional(),
  sourceTypes: z.array(RetrievalSourceTypeSchema).min(1).optional(),
})

export const RetrievedPassageSchema = z.object({
  id: z.string().min(1),
  sourceType: RetrievalSourceTypeSchema,
  title: z.string().min(1),
  reference: z.string().min(1),
  excerpt: z.string().min(1),
  arabicText: z.string().min(1),
  englishTranslation: z.string().min(1),
  contextSummary: z.string().min(1),
  emotionalTags: z.array(z.string().min(1)),
  similarity: z.number(),
})

export const RetrievePassagesResponseSchema = z.object({
  matches: z.array(RetrievedPassageSchema),
})

export const MutationSuccessSchema = z.object({
  ok: z.literal(true),
})

export const BackendErrorResponseSchema = z.object({
  error: z.string().min(1),
  message: z.string().min(1),
})

export const RetrievalPassageSchema = z.object({
  id: z.string().min(1),
  sourceType: RetrievalSourceTypeSchema,
  reference: z.string().min(1),
  citationTitle: z.string().min(1),
  arabicText: z.string().min(1),
  englishTranslation: z.string().min(1),
  contextSummary: z.string().min(1),
  emotionalTags: z.array(z.string().min(1)),
  retrievalText: z.string().min(1),
})

export const SeededRetrievalPassageSchema = RetrievalPassageSchema.extend({
  embedding: z.array(z.number()),
})

export type InterventionType = z.infer<typeof InterventionTypeSchema>
export type SourceKind = z.infer<typeof SourceKindSchema>
export type ResolutionState = z.infer<typeof ResolutionStateSchema>
export type Citation = z.infer<typeof CitationSchema>
export type Dua = z.infer<typeof DuaSchema>
export type RetrievalSourceType = z.infer<typeof RetrievalSourceTypeSchema>
export type RetrievePassagesRequest = z.infer<
  typeof RetrievePassagesRequestSchema
>
export type RetrievedPassage = z.infer<typeof RetrievedPassageSchema>
export type RetrievePassagesResponse = z.infer<
  typeof RetrievePassagesResponseSchema
>
export type InterventionPayload = z.infer<typeof InterventionPayloadSchema>
export type AppUserProfile = z.infer<typeof AppUserProfileSchema>
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>
export type FollowupRecord = z.infer<typeof FollowupRecordSchema>
export type RetrievalPassage = z.infer<typeof RetrievalPassageSchema>
export type SeededRetrievalPassage = z.infer<typeof SeededRetrievalPassageSchema>
export type CreateInterventionRequest = z.infer<
  typeof CreateInterventionRequestSchema
>
export type ResolveInterventionRequest = z.infer<
  typeof ResolveInterventionRequestSchema
>
export type LedgerPageResponse = z.infer<typeof LedgerPageResponseSchema>
export type FollowupListResponse = z.infer<typeof FollowupListResponseSchema>
export type MeResponse = z.infer<typeof MeResponseSchema>
export type FollowupResponseRequest = z.infer<
  typeof FollowupResponseRequestSchema
>
export type RegisterPushTokenRequest = z.infer<
  typeof RegisterPushTokenRequestSchema
>
export type MutationSuccess = z.infer<typeof MutationSuccessSchema>
export type BackendErrorResponse = z.infer<typeof BackendErrorResponseSchema>
