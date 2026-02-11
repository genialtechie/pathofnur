# Path of Nur - Project Blueprint

## 1. Brand Identity & Strategy
* **Product Name:** Path of Nur
* **Domain:** `pathofnur.com`
* **Core Concept:** A "Digital Sanctuary" for Muslims. An audio-first, premium mindfulness experience for Ramadan 2026.
* **Vibe:** "Hallow for Muslims." Minimalist, high-end, and "delicate."
* **Target Launch:** Ramadan 2026 (approx. Feb 17, 2026).
* **Marketing Strategy:**
    * **"Build in Public":** Leveraging TikTok/Reels to show the dev journey.
    * **The "Gentle" Hook:** Reframing prayer alerts as "Invitations" rather than alarms.
    * **Viral Loop:** Shareable "Journey" cards and "Day 30" completion graphics.

---

## 2. Visual Design System

### Color Palette
| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Deep Forest Green** | `#355E3B` | **Primary Brand.** Action buttons, active states, "Journey" progress. |
| **Metallic Gold** | `#C5A021` | **Spiritual Accents.** Qiblah needle, Tasbih ring, "Nur" glow effects. |
| **Midnight Blue** | `#2C5292` | **Depth & Night.** Backgrounds for Quran player and sleep stories. |
| **Rich Black** | `#121212` | **Dark Mode Base.** Softer than pure black for eye comfort. |
| **Paper White** | `#FAFAFA` | **Light Mode Base.** Text in dark mode. |

### Typography
| Role | Font Family | Usage Note |
| :--- | :--- | :--- |
| **Headings / UI** | **Zalando Sans** | Main interface text, buttons, and navigation labels. Modern & Clean. |
| **Scripture / Body** | **Lora** | Quran translations, Hadiths, and long-form reading. "Delicate" & Legible. |
| **Accents / Cards** | **Playfair Display** | "Verse of the Day" hero cards, special quotes. High-impact & "Royal." |
| **Arabic Text** | **Amiri** | The sacred text. Classic Naskh style that pairs perfectly with Lora. |

Implementation guardrail (non-negotiable):
- Default app UI font is Zalando Sans.
- Lora is only for Quran/Hadith/long devotional text.
- Playfair Display is only for selective decorative accents.
- Amiri is only for Arabic script content.

### Art Direction
* **Style:** Abstract, Aniconic, Textured.
* **Themes:** Nature (mountains, light, water), silhouettes, soft "Blue Hour" lighting.
* **Logo Concept:** Geometric Minimalism. A gold circle or path interacting with a crescent/arch, set against Deep Forest Green.

---

## 3. Technical Architecture (Expo PWA)

* **Framework:** **Expo (React Native for Web)**.
* **Why Expo?** Native-feel (haptics, gestures), unified codebase, easy path to App Store later.
* **Key Libraries:**
    * `expo-av`: For the "Stacking" audio player (Recitation + Ambient).
    * `expo-haptics`: For the tactile "Thump" of the Tasbih beads.
    * `expo-notifications`: For "Gentle Reminders" (Web Push API).
    * `expo-location` & `expo-sensors`: For Qiblah compass and Mosque finding.
* **PWA Configuration (`app.json`):**
    * `display: "standalone"` (Removes browser URL bar).
    * `backgroundColor`: `#121212` (Seamless opening experience).
    * **Icons:** 1024x1024px source file for auto-generation.

---

## 4. High-Level App Structure

### A. Global Navigation (Bottom Tab)
1.  **Home (The Sanctuary):** Dynamic dashboard.
2.  **Library (Quran/Audio):** The content hub.
3.  **Tools (Essentials):** Utilities (Tasbih, Qiblah).
4.  **Journey (Profile):** User progress and settings.

### B. Detailed Screen Functions
* **Home Screen:**
    * **Hero Carousel:** Swipeable cards (Daily Challenge, Night Reflection).
    * **Prayer Timeline:** Minimal horizontal bar (Current prayer in Gold).
    * **Quick Tasbih:** FAB (Floating Action Button) for instant access.
* **Library Screen:**
    * **Audio Mixer:** Toggle "Ambient Sound" (Rain, Medina wind) under Quran audio.
    * **Collections:** "Sleep," "Anxiety," "Gratitude."
* **Tools Screen:**
    * **Deep Focus Tasbih:** Full-screen, dark mode, haptic-only interface.
    * **Qiblah Compass:** Minimalist Gold/Blue design.
* **Journey Screen:**
    * **Ramadan Grid:** 30-day visual tracker (Green fill for completed days).
    * **Streak Counter:** "Days of Nur."

---
