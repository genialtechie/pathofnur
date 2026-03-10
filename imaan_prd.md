# PRD: imaan.app (V2 Refactor) - Product Definition

Synced into repo: March 10, 2026

## 1. Product Overview & Core Primitive

- **Objective:** A state-driven spiritual companion for the modern Muslim. It replaces the passive "utility dashboard" with an active intervention tool.
- **Core Primitive:** User Friction (an emotional state, an immediate need, or a practical question). Time and geography are secondary, buried utilities.
- **The Product Hook:** It acts as a highly knowledgeable, zero-judgment mentor that meets the user at their exact point of stress and remembers their history.

## 2. The Intervention Types

The app categorizes the user's input and dynamically delivers one of three intervention types:

- **The Contextual Anchor:** For deep or emotional friction like grief, anxiety, feeling wronged, or imposter syndrome. The app maps the user's situation to verified theological sources to provide grounding before the Dua.
- **The Quick Validation:** For acute friction like an interview, argument, or stressful moment happening right now. The app validates briefly and immediately delivers the needed Dua.
- **The Concise Ruling:** For practical lifestyle or fiqh questions. The app skips Duas and delivers a direct, cited, short verdict.

The source pool for grounding and citation should come from curated, reviewed material:

- Quran
- Hadith
- Seerah and Sahaba accounts
- Fiqh and practical rulings

## 3. App Architecture

### Tab 1: Home (The Intervention)

This is the transaction space. It is focused on resolving the immediate friction.

- Prominent text or voice input
- Prompt: `"What's on your mind?"`
- Suggestion chips based on history or time of day
- Delivery view adapts to the intervention type
- Inline tasbih only when the prescribed Dua requires repetition
- One closure action such as `"I feel grounded"` or `"Done"`

### Tab 2: Ledger & Journey (The Memory)

This tab proves the app is a companion because it remembers.

- `Journey` tracks positive momentum through abstract progress, not raw streak pressure
- `Ledger` is a chronological feed of past stressors, interventions, and follow-ups
- Asynchronous follow-ups live here

### Tab 3: Profile (The Utility)

This tab contains necessary but non-core features.

- Account and settings
- Notification toggles
- Standalone tasbih
- Qibla/compass

## 4. Product Boundaries

The app should not become:

- a generic productivity tool
- a passive content browser
- an uncited spiritual chatbot

The app should become:

- a trusted intervention layer
- a memory-backed companion
- a native experience with real account-backed continuity
