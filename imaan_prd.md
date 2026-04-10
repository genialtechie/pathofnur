# PRD: imaan.app (V2 Refactor) - Product Definition

Synced into repo: March 10, 2026

Related implementation note:

- See `docs/journey_spec.md` for the current Journey product direction and overview mechanics.

## 1. Product Overview & Core Primitive

- **Objective:** A state-driven spiritual companion for the modern Muslim. It replaces the passive "utility dashboard" with an active intervention tool.
- **Core Primitive:** User Friction (an emotional state, an immediate need, or a practical question). Time and geography are secondary, buried utilities.
- **The Product Hook:** It acts as a highly knowledgeable, zero-judgment mentor that meets the user at their exact point of stress and remembers their history.

## 2. Interaction Model

The app should behave like a companion first and a source engine second.

Rules:

- every user message starts or continues a saved moment automatically
- the first interaction is for support, not closure
- the app should understand first, support second, and ground third
- duas, Quran, Hadith, and other response cards are artifacts that can be saved or shared
- resolution belongs to follow-ups and revisits, not the initial moment

For clear emotional moments, the app may briefly clarify what kind of help the user wants before giving a full response:

- talk through the situation
- get something grounding right now

For vague or layered moments, the app may ask one short natural clarifying question in freeform text before proceeding.

## 3. The Intervention Types

The app categorizes the user's input and dynamically delivers one of three intervention types:

- **The Contextual Anchor:** For deep or emotional friction like grief, anxiety, feeling wronged, or imposter syndrome. The app maps the user's situation to verified theological sources to provide grounding before the Dua.
- **The Quick Validation:** For acute friction like an interview, argument, or stressful moment happening right now. The app validates briefly and immediately delivers the needed Dua.
- **The Concise Ruling:** For practical lifestyle or fiqh questions. The app skips Duas and delivers a direct, cited, short verdict.

The source pool for grounding and citation should come from curated, reviewed material:

- Quran
- Hadith
- Seerah and Sahaba accounts
- Fiqh and practical rulings

## 4. App Architecture

### Tab 1: Home (The Intervention)

This is where a moment begins.

- Prominent text or voice input
- Prompt: `"What's on your mind?"`
- The first response should feel conversational before it becomes structured
- The delivery view adapts to the intervention type
- Quran, Hadith, and Dua cards can be saved or shared
- Inline tasbih only when the prescribed Dua requires repetition
- The initial interaction does not ask the user to resolve the moment

### Tab 2: Ledger & Journey (The Memory)

This tab proves the app is a companion because it remembers.

- `Journey` visualizes the lifecycle of moments over the last 14 days
- Primary states:
  - `Open`
  - `Revisited`
  - `Resolved`
- `Ledger` is the chronological memory of saved moments, interventions, and follow-ups
- Asynchronous follow-ups are where moments continue and eventually resolve

### Tab 3: Profile (The Utility)

This tab contains necessary but non-core features.

- Account and settings
- Notification toggles
- Standalone tasbih
- Qibla/compass

## 5. Product Boundaries

The app should not become:

- a generic productivity tool
- a passive content browser
- an uncited spiritual chatbot

The app should become:

- a trusted intervention layer
- a memory-backed companion
- a native experience with real account-backed continuity
