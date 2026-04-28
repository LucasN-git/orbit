# Orbit — Design-System v1 (committed specs)

## Context

Diese Datei ist die **verbindliche Design-Spec** für Orbit v1 — abgeleitet aus [design_ideation.md](design_ideation.md), aber ohne Optionen oder Kandidaten. Jeder Wert hier ist eine getroffene Entscheidung; Abweichungen brauchen einen expliziten Anlass und eine v2.

- **Sub-Direction:** 80s Modernism
- **Intensität:** Geometric Sans + saturierter Orange-Akzent über cleaner iOS-Basis. Bauhaus-Erbe, 80s-Tech-Optimismus (Apple-Retro-Logo, Pavi-Terminal-Vibe) — explizit **kein** Memphis-Chaos, kein Synthwave-Neon, keine Postkarten-Serifs.
- **Plattform:** iOS first (SwiftUI, iOS 17+ als Minimum)
- **License-Policy:** Nur OSS-Fonts in v1 — kein Lizenz-Budget, kein Reibungspunkt beim App-Store-Submit.

---

## 1. Farb-System

### Light Mode (default)
| Token | Hex | RGB | Verwendung |
|---|---|---|---|
| `bg.canvas` | `#F8F5EC` | `248 245 236` | App-Hintergrund, Scroll-Container — warm-white, deutlich entsättigt vs. v0 |
| `bg.raised` | `#F1EDE0` | `241 237 224` | Cards, Sheets, Modals |
| `bg.sunken` | `#EAE4D5` | `234 228 213` | Inset-Felder, Inputs (resting) |
| `surface.accent` | `#EBE4D2` | `235 228 210` | Pull-Quotes, Highlights, Filter-Chips |
| `ink.primary` | `#2B2722` | `43 39 34` | Headlines, Body-Text default |
| `ink.secondary` | `#6E5236` | `110 82 54` | Sekundär-Text, Captions, Timestamps |
| `ink.tertiary` | `#9C8463` | `156 132 99` | Disabled, Placeholders, Hairlines stark |
| `hairline` | `#D9C7A0` | `217 199 160` | Borders 1pt @ 40 % opacity |
| `accent.stamp` | `#D64300` | `214 67 0` | **Primär-Akzent (einzige laute Farbe)** — CTA, Live-Indikator, Stempel |
| `accent.postage` | `#3F6B5F` | `63 107 95` | Sekundär-CTA, Trips-Tab-Akzent (gedämpft, kein Volumen) |
| `accent.sky` | `#A6B8C9` | `166 184 201` | Calendar-/Notification-Akzent (gedämpft) |
| `accent.stamp.pressed` | `#B03700` | `176 55 0` | CTA active state |
| `success` | `#3F6B5F` | — | identisch mit `accent.postage` |
| `warning` | `#C18B2C` | `193 139 44` | Selten, nur für nicht-kritische Hinweise |
| `error` | `#A33A2A` | `163 58 42` | Form-Errors, Destruktive States |

### Dark Mode
| Token | Hex | Verwendung |
|---|---|---|
| `bg.canvas` | `#1F1A14` | warmes Anthrazit, **kein** `#000` |
| `bg.raised` | `#2A241B` | Cards, Sheets |
| `bg.sunken` | `#16120D` | Inset-Felder |
| `surface.accent` | `#332B20` | Highlights |
| `ink.primary` | `#F8F5EC` | Headlines, Body — synchron mit Light-Mode-Canvas |
| `ink.secondary` | `#C9B894` | Sekundär-Text |
| `ink.tertiary` | `#8C7A5A` | Disabled, Placeholders |
| `hairline` | `#5A4A33` | Borders |
| `accent.stamp` | `#ED5410` | heller Orange für Kontrast auf dunklem Anthrazit |
| `accent.stamp.pressed` | `#D64300` | pressed = Light-Mode-Primary |
| `accent.postage` | `#7AAE9C` | dito |
| `accent.sky` | `#7E97AE` | dito |

**Kontrast-Regel:** Jede Text/Surface-Kombination ≥ WCAG AA (4.5:1 für Body, 3:1 für Large). `ink.primary` auf `bg.canvas` ergibt ≥ 11:1 — Headroom für Dynamic Type und verschmutzte Display-Konditionen draußen. **Primär-CTA**: `ink.primary` auf `accent.stamp` (Orange) ergibt ≈ 4.1:1 — AA für Large-Bold (Button-Label `t-label-l` 17/600 zählt als Large-Bold). Cream auf Orange wäre nur 3.15:1 → Buttons nutzen explizit dunkle Schrift, nicht cream.

---

## 2. Typografie

### Font-Stack (committed, alle OSS via Google Fonts)
- **Display / Headlines:** **Space Grotesk** (weight 300–700) — geometric Sans, leicht techy, 80s-Modernism-Träger
- **Body / UI:** **Inter Tight** (Variable: weight 100–900, italic)
- **Mono / Stempel-Daten:** **Space Mono** (weight 400 / 700) — Terminal-Anmutung als Tech-Akzent

### Type-Scale (iOS pt, anchored on Dynamic Type "Large")
| Rolle | Family | Weight | Size | Line | Letter | Verwendung |
|---|---|---|---|---|---|---|
| `display.xl` | Space Grotesk | 700 | 40 | 44 | -0.5 | Onboarding-Final, Postkarten-Hero |
| `display.l` | Space Grotesk | 600 | 32 | 36 | -0.4 | Tab-Headlines, Empty-State-Titel |
| `display.m` | Space Grotesk | 600 | 24 | 28 | -0.2 | Card-Titel, Modal-Titles |
| `display.s` | Space Grotesk | 600 | 20 | 24 | -0.1 | Section-Headlines |
| `body.l` | Inter Tight | 400 | 17 | 24 | 0 | Primär-Body, default Reading-Size iOS |
| `body.m` | Inter Tight | 400 | 15 | 22 | 0 | Sekundär-Body, Card-Descriptions |
| `body.s` | Inter Tight | 400 | 13 | 18 | 0.1 | Captions, Metadata |
| `label.l` | Inter Tight | 600 | 17 | 22 | 0 | Buttons, Tab-Labels |
| `label.m` | Inter Tight | 600 | 15 | 20 | 0.1 | Chip-Labels, Form-Labels |
| `label.s` | Inter Tight | 600 | 11 | 14 | 0.4 | Tab-Bar-Labels (uppercase) |
| `mono.timestamp` | Space Mono | 400 | 12 | 16 | 0.2 | Stempel-Daten, Timestamps |

**Italic-Display:** Space Grotesk hat keinen echten Italic-Cut. Wo ein expressiver Subtitle/Italic-Display gebraucht wird (z. B. Onboarding-Subtitle "your social life", Empty-State-Subcopy), wird Inter Tight Italic 400 verwendet — bewusste Ausnahme von der Body-Family-Regel an diesen Stellen.

**Dynamic Type:** alle Roles bis `body.l` skalieren via `@ScaledMetric`. `display.*` skaliert *nicht* — Hero-Texte bleiben proportional zur Composition.

---

## 3. Spacing-System

4pt-base. Keine Werte außerhalb dieser Skala in v1:

| Token | pt | Verwendung |
|---|---|---|
| `space.0` | 0 | — |
| `space.1` | 4 | Inline-Gaps zwischen Icon + Text |
| `space.2` | 8 | Tight Stacks |
| `space.3` | 12 | Default Inner-Padding klein |
| `space.4` | 16 | Default Card-Padding, Screen-Margin |
| `space.5` | 20 | Section-Spacing klein |
| `space.6` | 24 | Section-Spacing default |
| `space.8` | 32 | Section-Spacing groß |
| `space.10` | 40 | Hero-Spacing |
| `space.12` | 48 | Onboarding-Hero-Margin |
| `space.16` | 64 | nur Empty-States, Splash |

**Screen-Margin:** `space.4` (16 pt) horizontal, durchgängig. Kein Edge-to-Edge in v1 außer für Top-Hero-Images.

---

## 4. Radius- & Schatten-System

### Radius
| Token | pt | Verwendung |
|---|---|---|
| `radius.s` | 8 | Inputs, kleine Chips |
| `radius.m` | 12 | Buttons (außer Pill), Filter-Chips |
| `radius.l` | 16 | Cards, Modals, Sheets |
| `radius.xl` | 28 | Hero-Cards, Postkarten-Frames, Bottom-Sheet-Top |
| `radius.pill` | 999 | Primary-CTAs, Avatar-Containers |
| `radius.circle` | 999 | Alias — semantisch für IconButton-Container |

### Schatten (Light Mode — Dark Mode = halbe Opacity)
| Token | x | y | blur | spread | color |
|---|---|---|---|---|---|
| `shadow.card` | 0 | 4 | 12 | 0 | `#2B2722 @ 0.06` |
| `shadow.modal` | 0 | 12 | 32 | 0 | `#2B2722 @ 0.10` |
| `shadow.stamp` | 0 | 2 | 4 | 0 | `#2B2722 @ 0.20` |

### Hairline-Border
- Default: `1pt solid hairline @ 0.4`
- Inset top-only auf Cards für Paper-Layer-Effekt: `1pt solid #FFFFFF @ 0.5` als top-edge highlight.

---

## 5. Komponenten-Specs

### 5.1 Buttons

#### Primary (CTA)
- Höhe: **52 pt**
- Padding: `space.5` (20 pt) horizontal
- Radius: `radius.pill`
- BG: `accent.stamp`
- Text: `ink.primary` (`#2B2722`) — dunkler Text auf Orange für AA-Kontrast (≈ 4.1:1, Large-Bold). Cream-on-Orange wäre 3.15:1 → ausgeschlossen.
- Font: `label.l`
- Border: keiner
- Schatten: `shadow.stamp`
- Active: BG → `accent.stamp.pressed`, Scale `0.97`, Haptic `.medium`, Duration `120ms`
- Disabled: BG `ink.tertiary @ 0.3`, Text `ink.tertiary`, kein Schatten

#### Secondary
- Höhe: **52 pt**
- Padding: `space.5` horizontal
- Radius: `radius.pill`
- BG: `bg.raised`
- Text: `ink.primary`
- Font: `label.l`
- Border: `1pt solid ink.primary`
- Active: BG → `surface.accent`, Scale `0.97`, Haptic `.light`

#### Tertiary (Text Button)
- Höhe: **44 pt**
- Padding: `space.3` horizontal
- BG: transparent
- Text: `accent.postage`
- Font: `label.l`
- Underline on press only

### 5.2 Cards

#### Default Card
- BG: `bg.raised`
- Radius: `radius.l` (16 pt)
- Padding: `space.4` (16 pt) all sides
- Border: hairline
- Schatten: `shadow.card`
- Inner top-edge highlight: `1pt #FFFFFF @ 0.5`

#### Postkarten-Card (Hero, z. B. Onboarding 5/5, Trip-Header)
- BG: `bg.raised`
- Radius: `radius.xl` (24 pt)
- Padding: `space.6` (24 pt)
- Border: hairline
- Schatten: `shadow.modal`
- Optional Stempel-Overlay: `accent.stamp`-Glyph oben rechts, Rotation `−8°`, `shadow.stamp`

### 5.3 Form-Inputs

- Höhe: **48 pt**
- Padding: `space.3` (12 pt) horizontal, `space.3` vertical
- Radius: `radius.m` (12 pt)
- BG resting: `bg.sunken`
- BG focused: `bg.raised`
- Border resting: hairline
- Border focused: `1.5pt solid accent.postage`
- Text: `body.l`, color `ink.primary`
- Placeholder: `ink.tertiary`
- Label above: `label.m`, color `ink.secondary`
- Error: Border `error`, helper-text `body.s` in `error`

### 5.4 Avatare

- Default: **40 pt** Durchmesser, Radius `radius.pill`, Border `1pt hairline`
- Polaroid-Frame (Personal-Space, Trips): **80 pt × 96 pt**, BG `#FFFFFF`, Padding `space.2` außer unten `space.4` (Polaroid-Bottom-Lip), Rotation random `−4°…+4°`, `shadow.card`, Bild-Radius `0`

### 5.5 Tab Bar

- Höhe: **84 pt** (inkl. Safe Area)
- BG: `bg.canvas` mit `1pt hairline` top
- 5 Tabs (laut `Features/`): **Notifications · Current Orbit · Calendar · Trips · Personal Space**
- Active: Icon `accent.stamp`, Label `accent.stamp`
- Inactive: Icon `ink.tertiary`, Label `ink.tertiary`
- Label-Font: `label.s` UPPERCASE
- Icon-Größe: 24 pt
- Kein Backdrop-Blur — flat warm cream.

### 5.6 Navigation Bar

- Höhe: **52 pt** (inkl. Status Bar = 96 pt total auf Standard-iPhone)
- BG: `bg.canvas`
- Title: `display.s` (Space Grotesk 20)
- Large-Title-Variant für Top-Level-Tabs: `display.l` (Space Grotesk 32) bei Scroll = 0, animiert auf `display.s`
- Trailing/Leading-Action: **IconButton** (siehe §5.7) — nicht mehr Tertiary-Text
- Kein Backdrop-Blur — bei Scroll hairline-Border bottom einblenden

### 5.7 IconButton (Editorial Circle Action)

Circular Container für sekundäre Aktions-Glyphen (TopBar trailing/leading, Sheet-Dismiss, Bookmark, Share). Ersetzt den vorherigen Tertiary-Text-Button auf Action-Slots.

- Größe `md`: **44 pt** Durchmesser (default), `sm`: **36 pt**
- Form: `radius.circle`
- BG: `bg.raised`
- Border: hairline (1pt @ 0.4)
- Schatten: `shadow.card`
- Glyph: Outline-Variante (siehe §6 — `outline`-Prop, suppress duotone fill), color `ink.primary`, Größe **20 pt** (md) bzw. 18 pt (sm)
- Active: `bg → surface.accent`, Scale `0.97`, Haptic `.light`
- **Disziplin:** IconButton ist **niemals** in `accent.stamp` — Orange ist reserviert für Primary-CTAs und Live-Indikatoren. Aktion durch Form (Circle), nicht durch Farbe.

---

## 6. Iconography

### Library
- **Phosphor Icons — Duotone Variant** als Basis (1.5pt strokes, gerundete Caps)
- Custom-Overrides für orbit-spezifische Glyphen: `stamp`, `postcard`, `polaroid`, `envelope`, `spiral-binding`, `washi-tape`
- Custom-Set wird in `Assets.xcassets/Icons/` als SVG abgelegt, in SwiftUI via `Image("icon.<name>")` referenziert
- **SF Symbols sind in v1 verboten** — visuell zu generisch und brechen den Look sofort

### Sizes
| Token | pt |
|---|---|
| `icon.s` | 16 |
| `icon.m` | 20 |
| `icon.l` | 24 (Tab-Bar default) |
| `icon.xl` | 32 (Empty-States) |
| `icon.hero` | 64 (Onboarding) |

### Coloring & Variants
- **Duotone (default)**: primary stroke `ink.primary`, secondary fill `currentColor @ 22%`. Für Inhalts-Vokabular (Polaroid, Briefumschlag, Stempel, Card-Glyphen).
- **Outline (Editorial)**: pure 1.5pt stroke, **kein** Fill. Aktiviert über `outline`-Prop am Icon. Wird in `IconButton` (§5.7) und für TopBar-Action-Slots verwendet — die Container-Form trägt die Bedeutung, das Glyph bleibt nüchtern. Implementiert via `data-outline` Attribut + globale CSS-Regel in `globals.css`.
- Duotone secondary fill für CTA-Icons: `accent.stamp @ 0.25` (sparsam — Orange-Disziplin), sonst `ink.tertiary @ 0.4`.

### Brand Mark (Orbit-Logo)

- **Form:** konzentrische Ringe + Planeten-Punkt pro Ring + solider Akzent-Punkt im Zentrum. Vollständig 2D, keine Perspektive.
- **Geometrie (100-unit viewBox):** centerR = 8, innerMin = 12, outerMax = 48, planetR = 2.5. Ring-Anzahl `rings`-Prop, default 3.
- **Planeten-Winkel (deterministisch, diagonal verteilt):** `[60°, 200°, 320°, 110°, 250°, 30°]` — pro Ring-Index modulo. Kein Cluster, keine Random-Rotation.
- **Farben:** Ringe + Planeten in `currentColor` (kontextabhängig), Zentrum **immer** in `accent.stamp` — der Orange-Punkt ist die einzige Stelle, an der das Logo Akzent zeigt.
- **PWA-Icon (`/src/app/icon.tsx`, `/src/app/apple-icon.tsx`):** rendert das Logo via Satori-Div-Tree (siehe `/src/lib/og-logo.tsx`), Cream-Background mit `radius.xl ≈ 22% × size`. Apple-touch-icon flush, weil iOS eigene Squircle-Mask anwendet.

---

## 7. Texturen & Effekte

### Paper-Grain Overlay
- Asset: `paper-grain-2048.png` (2048 × 2048, tiled, baked noise)
- Anwendung: globaler `Overlay`-Layer auf jedem Screen, Opacity `3 %`, Blend-Mode `multiply`
- **Nicht** auf Buttons/Inputs (Lesbarkeit)

### Stempel-Effekt
- Eigene SwiftUI-`ViewModifier`: `.stamp(text:rotation:)`
- Glyph: Outline-Style, Color `accent.stamp`, Opacity `0.85`, Blend-Mode `multiply`, leichte Distortion via `.distortionEffect` (Metal-Shader, optional v1.1)

### Polaroid-Frame
- Eigener `View`-Wrapper: `PolaroidFrame { … }`
- weiße Card mit asymmetrischem Padding (top/sides 8 pt, bottom 24 pt)
- Random-Rotation per Hash der Photo-ID (deterministisch, damit nicht bei jedem Re-Render anders)

### Klebeband-Sticker
- 4 vorgefertigte SVG-Assets: `tape-corner-{tl,tr,bl,br}.svg`
- Color: `accent.sky @ 0.6` oder `accent.postage @ 0.4`
- Nur in Trips-Tab und Personal-Space-Albumseite

---

## 8. Motion-Tokens

| Token | Duration | Curve | Verwendung |
|---|---|---|---|
| `motion.tap` | 120 ms | `easeOut` | Button-Press, Card-Tap |
| `motion.standard` | 280 ms | `easeInOut` | Sheet-Open, Modal-Transitions |
| `motion.entrance` | 400 ms | `easeOut` | Screen-Pushes, Hero-Reveals |
| `motion.stamp` | 320 ms | custom spring (response 0.4, damping 0.6) | Stempel-Press, Postkarten-Land |
| `motion.envelope` | 600 ms | `easeInOut` | Briefumschlag-Senden-Animation (Meetup) |

**Globale Regel:** keine Spring-Animation außer `motion.stamp` und `motion.envelope`. Alles andere ruhig und papier-artig — Spring-Bouncing bricht den Tone-of-Voice.

### Haptics
| Trigger | Haptic |
|---|---|
| Primary-Button-Press | `.medium` impact |
| Secondary-Button-Press | `.light` impact |
| Stempel-Land (Meetup-Antwort, Achievement) | `.heavy` impact + sound `stamp.caf` |
| Briefumschlag-Send | `.light` + sound `envelope.caf` |
| Pull-to-Refresh-Trigger | `.soft` |
| Error | Notification `.error` |

---

## 9. Empty States (Pflicht-Specs)

Jeder Tab braucht einen Empty State. Pattern committed:

- Vertikal zentriert, Inhalt max-width 280 pt
- Icon `icon.xl` (32 pt) in `ink.tertiary`
- Titel: `display.m` Space Grotesk, color `ink.primary`
- Sub-Copy: `body.m` Inter Tight Italic, color `ink.secondary` — Italic für expressive Subcopy, da Space Grotesk keinen Italic-Cut hat (siehe §2)
- CTA: Tertiary-Button "→ Was tun?" (Link zur Hilfe-Seite oder Inline-Action)

### Per-Tab-Copy (committed v1)
- **Notifications:** "Noch nichts im Briefkasten." — _"Wenn jemand dich anpingt, landet's hier."_
- **Current Orbit:** "Niemand im Orbit." — _"Sobald Freunde in deiner Stadt sind, tauchen sie hier auf."_
- **Calendar:** "Kein Termin im Kalender." — _"Plane einen Meetup oder warte auf Anfragen."_
- **Trips:** "Keine Reisen geplant." — _"Trag deinen nächsten Trip ein, damit andere wissen, wo du bist."_
- **Personal Space:** "Dein Album ist leer." — _"Hier landen Erinnerungen aus euren Treffen."_

---

## 10. SwiftUI-Implementation-Spec

### Datei-Layout (committed)
```
Orbit/
├── App/
│   ├── OrbitApp.swift
│   └── RootView.swift
├── DesignSystem/
│   ├── Theme.swift              // Color + Font + Spacing tokens
│   ├── Components/
│   │   ├── OrbitButton.swift
│   │   ├── OrbitCard.swift
│   │   ├── OrbitInput.swift
│   │   ├── OrbitAvatar.swift
│   │   ├── PolaroidFrame.swift
│   │   └── PostcardCard.swift
│   ├── Modifiers/
│   │   ├── PaperGrain.swift
│   │   ├── Stamp.swift
│   │   └── HairlineTop.swift
│   └── Motion.swift
├── Features/
│   ├── Notifications/
│   ├── CurrentOrbit/
│   ├── Calendar/
│   ├── Trips/
│   ├── PersonalSpace/
│   └── Onboarding/
└── Resources/
    ├── Fonts/
    │   ├── SpaceGrotesk[wght].ttf
    │   ├── InterTight[wght].ttf
    │   └── SpaceMono-Regular.ttf
    ├── Icons/
    │   └── (custom svgs)
    └── Textures/
        └── paper-grain-2048.png
```

### Token-Convention
- **Farben:** `Color.orbit.bg.canvas`, `Color.orbit.ink.primary`, …
- **Spacing:** `Spacing.m` (entspricht `space.4`)
- **Type:** `Font.orbit.displayL`, `.bodyM`, …
- Kein hardcoded `Color(hex:)` außerhalb `Theme.swift`. Lint-Rule per SwiftLint custom rule: `Color\(hex:` außerhalb `DesignSystem/` = error.

### Theme-Switching
- Light/Dark via `@Environment(\.colorScheme)` — alle Tokens haben beide Werte hardcoded in `Theme.swift`. Kein User-Override in v1 (folgt System-Setting).

---

## 11. Was es in v1 *nicht* gibt (explizit ausgeschlossen)

- Custom-Theme-Picker, anderes Color-Scheme als Light/Dark
- Animations-Effekte mit Confetti, Streaks, Counters, Streak-Recovery
- Memphis-Geometrie, Synthwave-Gradients, Neon-Akzente
- SF Symbols (siehe §6)
- Hardcoded-Hex außerhalb `Theme.swift`
- iPad-spezifische Layouts (Phone-only in v1)
- Web/PWA-Parity (PWA-Gastmodus aus `Account Prozess.md` nutzt eigene minimale Style-Variant — separater Spec)
- Right-to-Left-Layouts
- Pixel-Art, Voxel, 3D-Renderings

---

## 12. Verifikation vor Merge in `main`

Bevor ein Screen als "v1-ready" gilt:

1. **Token-Audit** — `grep -rE "Color\(hex|UIColor\(red" Orbit/Features` muss 0 Treffer liefern.
2. **Squint-Test** im Hardware-iPhone (nicht Simulator), Dynamic Type "Default", "Larger Accessibility 1", "AX5".
3. **Light + Dark Mode Screenshot-Diff** in PR.
4. **Reduced Motion** aktiviert: alle `motion.stamp` / `motion.envelope` müssen auf `motion.standard` degradieren.
5. **VoiceOver-Pass** für alle interaktiven Elemente.
6. **Squint-Test** bei Tageslicht draußen (am Fenster) — Cream darf nicht in Weiß überstrahlen, Stempel-Rot bleibt erkennbar.

---

## 13. Versionierung

- Diese Datei = `DESIGN1.md` = v1 der Design-Spec.
- Substanzielle Änderungen (neue Komponente, Token-Wert geändert, Font-Wechsel) → neue Datei `DESIGN2.md`, alte als historisches Reference behalten.
- Token-Werte werden per Code-Review geschützt: PRs, die `Theme.swift` ändern, brauchen explizite Begründung in der PR-Description und einen Verweis auf den DESIGN-File-Änderungs-Antrag.
