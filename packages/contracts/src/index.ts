import { z } from "zod"

export const MomentStatusSchema = z.enum(["open", "resolved"])
export const JourneyMomentStatusSchema = z.enum([
  "open",
  "revisited",
  "resolved",
])
export const MomentMessageRoleSchema = z.enum(["user", "assistant"])
export const MomentArtifactKindSchema = z.enum(["ayah", "hadith", "dua", "note"])
export const RetrievalSourceTypeSchema = z.enum(["quran", "hadith"])

export const MomentSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string(),
  status: MomentStatusSchema,
  createdAtUtc: z.string().datetime(),
  updatedAtUtc: z.string().datetime(),
  resolvedAtUtc: z.string().datetime().nullable(),
})

export const MomentMessageSchema = z.object({
  id: z.string().min(1),
  momentId: z.string().min(1),
  role: MomentMessageRoleSchema,
  text: z.string().min(1),
  createdAtUtc: z.string().datetime(),
})

export const MomentArtifactSchema = z.object({
  id: z.string().min(1),
  momentId: z.string().min(1),
  kind: MomentArtifactKindSchema,
  title: z.string().min(1),
  reference: z.string().min(1).nullable(),
  content: z.string().min(1),
  createdAtUtc: z.string().datetime(),
})

export const CitationSchema = z.object({
  id: z.string().min(1),
  sourceKind: z.enum(["quran", "hadith", "seerah", "fiqh"]),
  title: z.string().min(1),
  reference: z.string().min(1),
  excerpt: z.string().min(1),
})

export const InterventionPayloadSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["contextual_anchor", "quick_validation", "concise_ruling"]),
  title: z.string().min(1),
  validationCopy: z.string().min(1),
  primaryText: z.string().min(1),
  dua: z
    .object({
      arabic: z.string().min(1).nullable(),
      transliteration: z.string().min(1).nullable(),
      translation: z.string().min(1).nullable(),
    })
    .nullable(),
  repeatCount: z.number().int().min(1).nullable(),
  citations: z.array(CitationSchema),
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

export const CreateMomentRequestSchema = z.object({
  text: z.string().min(1),
  title: z.string().min(1).optional(),
  locale: z.string().min(1).optional(),
  entrySource: z.string().min(1).optional(),
})

export const AppendMomentMessageRequestSchema = z.object({
  text: z.string().min(1),
  locale: z.string().min(1).optional(),
  entrySource: z.string().min(1).optional(),
})

export const GetMomentsRequestSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  status: MomentStatusSchema.optional(),
})

export const CreateMomentResponseSchema = z.object({
  moment: MomentSummarySchema,
  messages: z.array(MomentMessageSchema),
  artifacts: z.array(MomentArtifactSchema),
})

export const MomentDetailResponseSchema = z.object({
  moment: MomentSummarySchema,
  messages: z.array(MomentMessageSchema),
  artifacts: z.array(MomentArtifactSchema),
})

export const MomentsListResponseSchema = z.object({
  moments: z.array(MomentSummarySchema),
})

export const AppendMomentMessageResponseSchema = z.object({
  moment: MomentSummarySchema,
  messages: z.array(MomentMessageSchema).length(2),
  artifacts: z.array(MomentArtifactSchema),
})

export const MutationSuccessSchema = z.object({
  ok: z.literal(true),
})

export const BackendErrorResponseSchema = z.object({
  error: z.string().min(1),
  message: z.string().min(1),
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

export const RetrievePassagesRequestSchema = z.object({
  inputText: z.string().min(1),
  matchCount: z.number().int().min(1).max(10).optional(),
  sourceTypes: z.array(RetrievalSourceTypeSchema).min(1).optional(),
})

export const RetrievePassagesResponseSchema = z.object({
  matches: z.array(RetrievedPassageSchema),
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

export type MomentStatus = z.infer<typeof MomentStatusSchema>
export type JourneyMomentStatus = z.infer<typeof JourneyMomentStatusSchema>
export type MomentMessageRole = z.infer<typeof MomentMessageRoleSchema>
export type MomentArtifactKind = z.infer<typeof MomentArtifactKindSchema>
export type MomentSummary = z.infer<typeof MomentSummarySchema>
export type JourneyMoment = Omit<MomentSummary, "status"> & {
  status: JourneyMomentStatus
}
export type MomentMessage = z.infer<typeof MomentMessageSchema>
export type MomentArtifact = z.infer<typeof MomentArtifactSchema>
export type Citation = z.infer<typeof CitationSchema>
export type InterventionPayload = z.infer<typeof InterventionPayloadSchema>
export type AppUserProfile = z.infer<typeof AppUserProfileSchema>
export type CreateMomentRequest = z.infer<typeof CreateMomentRequestSchema>
export type AppendMomentMessageRequest = z.infer<
  typeof AppendMomentMessageRequestSchema
>
export type GetMomentsRequest = z.infer<typeof GetMomentsRequestSchema>
export type CreateMomentResponse = z.infer<typeof CreateMomentResponseSchema>
export type MomentDetailResponse = z.infer<typeof MomentDetailResponseSchema>
export type MomentsListResponse = z.infer<typeof MomentsListResponseSchema>
export type AppendMomentMessageResponse = z.infer<
  typeof AppendMomentMessageResponseSchema
>
export type MutationSuccess = z.infer<typeof MutationSuccessSchema>
export type BackendErrorResponse = z.infer<typeof BackendErrorResponseSchema>
export type RetrievalSourceType = z.infer<typeof RetrievalSourceTypeSchema>
export type RetrievedPassage = z.infer<typeof RetrievedPassageSchema>
export type RetrievePassagesRequest = z.infer<
  typeof RetrievePassagesRequestSchema
>
export type RetrievePassagesResponse = z.infer<
  typeof RetrievePassagesResponseSchema
>
export type RetrievalPassage = z.infer<typeof RetrievalPassageSchema>
export type SeededRetrievalPassage = z.infer<typeof SeededRetrievalPassageSchema>
