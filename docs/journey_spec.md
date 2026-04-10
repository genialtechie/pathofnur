# Journey Spec

Last updated: April 5, 2026

## 1. Purpose

`Journey` is the memory and progress surface for `imaan`.

It should show the user:

- what is still with them
- what they came back to
- what they moved through

It is not:

- a habit tracker
- a streak dashboard
- a feed-first history page
- a place to reward distress itself

It is:

- a visual memory surface
- a state view of recent moments
- a place that rewards return and resolution

## 2. Core Principle

Non-negotiable product rule:

`Journey should reward return and resolution, never distress itself.`

That means:

- more `Open` moments are not a reward
- the app should never make suffering feel like progress by itself
- the satisfying motion comes from moments changing state over time

## 3. Moment Lifecycle

For Journey, the relevant moment states are:

- `Open`
- `Revisited`
- `Resolved`

Definitions:

- `Open`: a saved moment that is still active
- `Revisited`: a saved moment the user meaningfully returned to
- `Resolved`: a saved moment the user explicitly moved through or closed later

Journey should visualize these states over the last `14 days`.

## 4. Relationship To Other Surfaces

`Home`

- starts a moment
- supports the user in the first interaction
- saves the moment automatically

`Follow-ups`

- continue a moment later
- let the user revisit or eventually resolve it

`Journey`

- shows the state of recent moments
- gives the user a sense of continuity
- acts as the visual entry point into deeper drill-downs

## 5. Gamification Model

The overview should not copy productivity or fitness goals directly.

The right gamification is based on:

- movement between states
- continuity of return
- meaningful closure
- quiet milestones

The wrong gamification is based on:

- raw volume of pain
- filling up open-state counters
- points for suffering

## 6. Overview Mechanics

The Journey overview should emphasize these mechanics:

### A. State Progression

The main satisfaction comes from moments progressing:

- `Open` -> `Revisited`
- `Revisited` -> `Resolved`

This is the clearest emotional reward loop in the product.

### B. Return Count

The user should feel rewarded for returning to something rather than abandoning it.

Examples:

- `You came back to 3 moments this week`
- `You did not leave everything hanging`

### C. Resolution Count

The most satisfying state is `Resolved`.

This should feel like:

- relief
- movement
- steadying
- completion without pressure

### D. Quiet Milestones

Milestones should celebrate continuity and closure, not distress volume.

Good milestone directions:

- `First return`
- `3 moments revisited`
- `5 moments moved through`
- `A full week of returning`
- `You closed the loop on something that once felt heavy`

Bad milestone directions:

- `10 difficult moments logged`
- `Most painful week`
- anything that rewards having more unresolved moments

### E. Achievements

`Achievements` can become a future drill-down card in Journey.

They should feel:

- quiet
- premium
- reflective
- earned

They should not feel:

- arcade-like
- point-chasing
- novelty-first

## 7. Main Journey Screen

The main Journey screen should be a path, not a dashboard.

Structure:

1. screen header
2. vertical winding trail of stones
3. month separators that divide the trail into chapters

The main screen should not contain:

- feed lists
- summary cards
- grid cards
- dashboard widgets

Journey should feel like traveling through recent moments, not auditing them.

## 8. Path Model

Each saved moment appears as one stone on the path.

The path rules are:

- newest moments appear lower on the trail
- older moments sit higher on the trail
- the path winds vertically with alternating stone positions
- month separators break the path into readable sections

State styling:

- `Open` = dark inactive stone
- `Revisited` = ring-highlighted stone
- `Resolved` = polished bright stone

The state change updates the stone appearance, not its position.

## 9. Stone Interaction

The stone is the entry point into that moment.

Tap behavior:

- tapping a stone opens a floating detail card
- the card shows a short moment title
- the card offers the action to re-enter that moment or chat

The tap card should feel lightweight and immediate, not like opening a heavy detail page.

## 10. Progress Meaning

The path itself is the progress system.

Meaning:

- new moments reveal more of the trail
- revisited moments show active return
- resolved moments become the most rewarding visual state

The screen should never suggest that having more unresolved moments is an achievement.

Instead, the reward comes from:

- seeing revisited moments light up
- seeing resolved moments become polished
- watching the path fill with moments that have been moved through

## 11. Initial Buildable Version

Version 1 should include:

- a winding vertical path
- open / revisited / resolved stone states
- month separators
- tap-to-open floating moment card

Version 1 should defer:

- full revisit UX
- full resolution UX
- achievements system
- deeper moment detail surfaces
- special milestone stones

## 12. Design Rules

Journey should feel:

- calm
- reflective
- premium
- quietly rewarding

Journey should not feel:

- busy
- gamified in a cheap way
- like a task manager
- like an emotional inbox

Visual rule:

- plain background
- restraint over decoration
- the summary system is the focal point
- secondary cards support the summary, they do not compete with it

## 13. Build Filter

Before adding any Journey mechanic or UI, ask:

1. Does this reward return or resolution?
2. Does this avoid rewarding pain by itself?
3. Does this make the app feel more like a companion for faith?
4. Does this help the user feel continuity across real moments?

If the answer is no, it does not belong in Journey.
