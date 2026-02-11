# Path of Nur - Ultimate Product + Build Guide

Last updated: February 11, 2026

## 1) Mission

Build the best Muslim prayer and spiritual companion app with:

- Premium-feeling UX
- Deep daily utility during Ramadan and beyond
- Donation-based monetization
- Strong retention loops
- Analytics-first execution from day 0

This document is the operating manual for all agents working in this repo.

---

## 1.1) Collaboration Control Plane

For multi-agent execution, these files are the source of truth:

- `docs/collab/CORE_PROTOCOL.md`
- `docs/collab/WORKTREE_QUICKSTART.md`
- `docs/collab/OWNERSHIP_MAP.md`
- `docs/collab/MERGE_RULES.md`
- `docs/collab/state/task_queue.json`
- `docs/collab/state/reservations.json`
- `docs/collab/state/handoffs.json`
- `docs/collab/state/decisions.json`
- `.agents/instructions/*.md` (runtime-specific deltas)

Every agent run must read those files before implementation work starts.

Mandatory execution rule:

- Implementers execute code changes only from task worktrees (`.worktrees/<task_id>`).
- Root checkout is orchestration + merge surface only.

---

## 2) Inputs Reviewed

Primary reference set:

- `public/hallow-screens/_contact-sheet-large-p1.png`
- `public/hallow-screens/_contact-sheet-large-p2.png`
- `public/hallow-screens/_contact-sheet-large-p3.png`
- `public/hallow-screens/_contact-sheet-large-p4.png`

What we are copying:

- Product framework and UX patterns (flow structure, module hierarchy, onboarding pacing)

What we are not copying:

- Branding, color language, art style, voice, mission framing

Path of Nur remains distinct in identity and theme.

---

## 3) Pattern Extraction From Contact Sheets

## Onboarding Pattern (p1 + p2)

- Many short steps with progress indicator
- One clear action per screen
- Question-driven segmentation before content
- Visual reinforcement cards/illustrations between question steps
- Value framing appears before conversion ask

## Home Pattern (p3 + p4)

- Dark canvas with modular card system
- Prominent hero module at top
- Rail-based content browsing below
- Clear primary CTA per module
- Bottom nav persistent and simple

## Monetization Pattern

- Conversion surfaces appear after value/context
- Prompt appears multiple times across journey, not one-time only
- Offer UI is simple and fast to dismiss/accept

## Content Pattern

- Programmatic tiles/cards for scalable catalog growth
- Visual consistency with strong component reuse
- High information density without visual chaos

---

## 4) Path of Nur UX Principles

## Product Feel

- Calm, sacred, premium, deliberate
- "Invitation" language, not alarm language
- Minimal friction for first spiritual action

## Interaction Rules

- One primary goal per screen
- One primary CTA per view
- Keep visual complexity in cards, not global background
- Use bounded modules with rounded corners and text-safe zones

## Accessibility + Clarity

- Large readable text
- Strong contrast
- Clear state labeling
- No ambiguous toggles

---

## 5) Card-First Visual Usage (Critical)

Do not design images as full-screen wallpapers.

Use images as:

- Hero cards
- Collection covers
- Utility cards
- Share cards

Card composition requirements:

- Keep top text-safe zone
- Keep lower label/CTA-safe zone
- Keep edges low-noise for rounded clipping
- Single focal motif per card

Reference art guidance:

- `.agents/ART_DIRECTION_GUIDE.md`
- `public/asset-manifest.json`

---

## 6) App IA (PWA First)

Top-level nav:

1. Home
2. Library
3. Tools
4. Journey

Core feature anchors:

- Ambient Quran
- Tasbih
- Qiblah locator
- Ramadan journey/streaks
- Shareable progress moments

---

## 7) Onboarding Funnel Blueprint

Primary funnel stages:

1. Acquisition landing
2. Onboarding intro
3. Faith/practice segmentation
4. Intent + schedule capture
5. First-time personalization complete
6. First spiritual action (play, dua, tasbih, etc.)
7. Donation prompt
8. Home activation

Onboarding design rules:

- 8-14 short steps max
- Progress bar always visible
- Never present two hard decisions at once
- Mix question screens with visual motivation screens
- Ask for permissions only after contextual value explanation

---

## 8) Monetization (Donation Instead of Subscription)

All existing "subscription trigger" placements should route to donation prompts.

Allowed conversion approach:

- Persistent, gentle prompting
- Value-first framing
- Clear impact statement ("support free access for the Ummah")
- Quick amount presets + custom amount
- Easy dismiss every time

Do not implement deceptive or coercive dark patterns.

Use high-conversion but trust-preserving tactics:

- Timed reminder prompts after meaningful moments
- Social proof with transparent numbers
- Ramadan urgency framing with real dates
- Contextual asks tied to completed milestones

Donation trigger surfaces:

1. End of onboarding
2. After first completed journey day
3. After streak milestones (3, 7, 14, 30)
4. After share-card creation
5. Settings > Support Path of Nur

---

## 9) Analytics + Tracking (Non-Negotiable)

Instrumentation starts before UI polish.

## Event Naming Convention

- `area_object_action`
- Examples:
  - `onboarding_step_viewed`
  - `onboarding_step_completed`
  - `home_hero_opened`
  - `library_collection_opened`
  - `tools_qiblah_started`
  - `donation_prompt_viewed`
  - `donation_amount_selected`
  - `donation_checkout_started`
  - `donation_checkout_completed`

## Required Event Properties

- `user_id`
- `session_id`
- `timestamp_utc`
- `screen_name`
- `entry_source`
- `campaign_source`
- `campaign_medium`
- `campaign_content`
- `platform` (`web`, `ios`, `android`)
- `app_version`

## Funnel Metrics (Must Have Dashboard)

1. Acquisition -> onboarding start
2. Onboarding start -> onboarding complete
3. Onboarding complete -> first spiritual action
4. First action -> day-1 return
5. Donation prompt viewed -> checkout started
6. Checkout started -> donation completed

## Retention Metrics

- D1, D3, D7, D14, D30
- Streak distribution
- Sessions/week
- Feature-level retention (Quran, Tasbih, Qiblah, Journey)

## Marketing Attribution

- Persist UTM params on first visit
- Carry attribution through onboarding completion
- Attach attribution to donation events
- Capture creator-specific deep link IDs for TikTok/IG

---

## 10) Analytics Implementation Checklist (Code)

Create these files first:

- `src/lib/analytics/client.ts`
- `src/lib/analytics/events.ts`
- `src/lib/analytics/schema.ts`
- `src/lib/analytics/track.ts`

Rules:

- No raw event names inside components
- Use typed event helpers
- Block invalid payloads at runtime
- Queue + retry for offline mode

---

## 11) Technical Direction (Expo PWA)

Baseline stack:

- Expo + Expo Router (web-first)
- TypeScript strict mode
- `expo-image` for all images
- Modular feature folders
- Serverless API routes for donation/webhooks/event ingest

PWA requirements:

- Installable
- Offline shell
- Fast first load on mobile web
- Stable media playback behavior

Key packages/features:

- Audio playback + ambient layering
- Location for Qiblah/mosque helper
- Notifications for gentle reminders
- Analytics SDK + first-party event pipeline

---

## 12) Suggested Project Structure

```txt
app/
  (onboarding)/
  (tabs)/
    home/
    library/
    tools/
    journey/
  donate/
  modal/

src/
  components/
    cards/
    hero/
    navigation/
  features/
    onboarding/
    home/
    library/
    tools/
    journey/
    donate/
  lib/
    analytics/
    audio/
    location/
    notifications/
  services/
    api/
    donation/
  store/
  types/

public/
  images/
    _source/
    _preview/
```

---

## 13) UX for Paid-Consumer Quality (Donation Model)

Ship with these standards:

- Fast load + immediate first action
- Clear progression and milestones
- Habit loops (streaks + reminders + rewards)
- Personalized home modules
- Emotionally resonant but restrained copy

Tone examples:

- "Support Path of Nur"
- "Keep this sanctuary free for others"
- "If this helped your day, consider giving back"

Avoid:

- Guilt-based copy
- Fake scarcity
- Hidden dismiss controls

---

## 14) Experimentation Plan

First A/B tests:

1. Donation prompt timing:
   - End onboarding vs first completed action
2. Donation default amounts:
   - Low/Medium/High preset sets
3. Hero module ordering:
   - Journey-first vs Quran-first
4. Reminder language:
   - Invitation style variants

Success metrics:

- Onboarding completion
- First-action completion rate
- Donation conversion rate
- D7 retention

---

## 15) Build Sequence (Execution Order)

1. Repo init + base Expo PWA setup
2. Routing skeleton + tabs + onboarding stack
3. Analytics plumbing + event schema
4. Onboarding screens + state + progress
5. Donation flow + Stripe link integration
6. Home module system + card components
7. Core features (Quran ambient, Tasbih, Qiblah, Journey)
8. Tracking dashboards + funnel validation
9. Polish + performance pass + QA

---

## 16) Immediate Next Tasks

1. Initialize git and commit current assets/docs.
2. Scaffold Expo PWA project structure in this repo.
3. Implement analytics foundation before feature screens.
4. Build onboarding funnel skeleton with event hooks.
5. Wire donation screen and replace all subscription triggers with donation CTAs.

---

## 17) Agent Rule of Thumb

When uncertain, optimize for:

1. User trust
2. Activation speed
3. Retention depth
4. Donation conversion without deception
