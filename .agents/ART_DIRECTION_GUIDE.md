# Path of Nur Art Direction Guide (Card-First)

## Goal

Create artwork for **contained UI modules** (cards, shelf heroes, onboarding panes), not full-screen wallpapers.

The image should support:

- Headline + subcopy overlays
- Rounded card clipping
- CTA overlays below/inside module
- Reuse across Home, Library, Tools, Journey

---

## 1) Critical Correction (From Hallow Screen Review)

After reviewing `public/hallow-screens/`, the visual usage model is:

1. Dark app canvas + **featured card modules**, not image-as-page background.
2. Images live inside bounded frames (often rounded corners).
3. Card art preserves **text-safe zones** for headings and labels.
4. Hero modules are sleek, compositional, and intentionally sparse.
5. Onboarding and shelf cards use art as **content object**, not backdrop.

So all future prompt language must say:

- "in-app hero card artwork"
- "for rounded-corner module"
- "not full-screen background"

---

## 2) Style DNA (Still Non-Negotiable)

### Core Aesthetic

- Abstract
- Aniconic (no faces, no people, no animals)
- Blue-hour atmosphere
- Minimalist premium tone
- Contemplative, sacred calm
- Matte finish

### Color System

- Deep Forest Green `#355E3B`
- Midnight Blue `#2C5292`
- Rich Black `#121212`
- Metallic Gold `#C5A021` (very restrained accents)

### Prohibited Elements

- No buildings
- No mosque silhouettes
- No crescents/moons/stars
- No explicit religious symbols
- No text baked into the art
- No dramatic cinema-grade flares

---

## 3) Module Archetypes

Use these archetypes for image generation.

### A) Feature Hero Card (Portrait)

- Ratio: `4:5`
- Typical placement: top content card
- Text-safe zones:
  - Top 28% clean
  - Bottom 18% clean
- Focal zone: middle-lower third

### B) Feature Hero Card (Landscape)

- Ratio: `16:9`
- Typical placement: desktop/tablet hero row
- Text-safe zones:
  - Left 35-40% clean for headline
  - Bottom 15% clean
- Focal zone: center-right

### C) Collection Tile

- Ratio: `4:5`
- Typical placement: Library collection grid
- Text-safe zones:
  - Bottom strip for title
- Focal zone: center

### D) Utility Card

- Ratios: `1:1` or `9:16` depending slot
- Typical placement: Tools/Journey module card
- Focal zone: center with low-noise perimeter

---

## 4) Prompt Framework (Card-First)

### Base Prompt Template

```txt
Abstract aniconic [SCENE] at blue hour, minimalist high-end style, deep forest green blended with midnight blue, one restrained ultra-thin metallic gold [LINE/RING/ARC], matte atmosphere, calm sacred mood, artwork for a rounded-corner in-app hero card, not a full-screen background, clear text-safe zones, low-noise edges, restrained, contemplative
```

### Global Negative Prompt

```txt
people, faces, hands, animals, architecture, mosque, dome, minaret, crescent moon, stars, text, logo, watermark, high contrast, neon, fantasy sky, clutter, photoreal city, over-sharpened detail
```

### Composition Clauses to Reuse

- "Leave top area clean for heading text"
- "Leave lower strip clean for label/CTA"
- "Keep corners darker for rounded-card clipping"
- "Single focal object in mid-lower region"
- "No busy detail near edge boundaries"

---

## 5) Slot Map (Launch-Critical, Card Usage)

## Home

- `H1` Daily Challenge: feature hero card, path-on-dunes motif
- `H2` Night Reflection: feature hero card, halo-led minimal glow
- `H3` Prayer Invitation: feature hero card, vertical invitation beam + subtle ring
- `H1D/H2D/H3D`: desktop landscape hero card variants

## Library

- `L1` Sleep cover card
- `L2` Anxiety cover card
- `L3` Gratitude cover card

## Tools

- `T1` Tasbih focus module card (not page background)
- `T2` Qiblah utility card backdrop

## Journey

- `J2` Daily completion share card
- `J3` Day 30 completion share card

## Brand

- `B1` App icon source
- `B2` Splash visual

---

## 6) Existing Asset Mapping (Current Repo)

- `public/desert-dunes.PNG` -> H1 source candidate
- `public/halo-light.PNG` -> H2/H3 source candidate
- `public/soft-meditate.PNG` -> H2 source candidate
- `public/pathofnur.png` -> temporary icon only

---

## 7) Export Specs

Primary generation outputs:

- Portrait card: `1024x1536` (`4:5` usage via crop-safe framing)
- Landscape card: `1536x1024` (`16:9`)
- Square utility: `1024x1024`

Formats:

- Card art: `WEBP` (quality `82-88`)
- Icon/master with alpha needs: `PNG`

Storage:

- Source outputs: `public/images/_source/`
- Chat-preview PNG conversions: `public/images/_preview/`

---

## 8) Implementation Notes (Expo)

From installed Expo/RN skills:

1. Use `expo-image` everywhere.
2. Load card-sized assets (not oversized full-bleed originals).
3. Use `cachePolicy="memory-disk"` for hero modules.
4. Keep list tiles lightweight to protect scroll performance.

---

## 9) Review Rubric (Card Context)

Pass only if all are true:

1. Reads as card art, not wallpaper.
2. Top and bottom text zones remain legible.
3. Corners clip cleanly in rounded containers.
4. Focal object survives 4:5 and 16:9 crops.
5. Visual language matches adjacent modules.
6. Calm and sacred, never theatrical.

---

## 10) Handoff Rules for Generation Agent

1. Treat each manifest item as module artwork.
2. Include "not full-screen background" in every prompt.
3. Keep one approved master per slot before variants.
4. Mark status in `public/asset-manifest.json` (`draft`, `approved`, `final`).
5. For revised outputs, keep `.bak` files until explicitly cleaned.

