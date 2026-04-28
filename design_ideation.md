# Orbit — Design-Richtung: Warm Paper / Postcard (iOS first)

## Context

Orbit ist in der frühen Konzeptphase (Stand 2026-04-28, Repo `~/Desktop/projects/!orbit_neu/` ist quasi leer). Die App-Idee — soziales Leben in Präsenz, Current-Orbit, Meetups, Trips — verlangt einen **Tone-of-Voice, der bewusst gegen den überreizten, performativen Look heutiger Social-Apps steht** (keine Likes, keine Streaks, kein Snapmap-Stalking; siehe `App Framing.md`). Lucas möchte den nostalgischen Vibe einer Zeit *vor dem Smartphone* erzeugen — ein Gefühl von Brieffreundschaft, Reisetagebuch, Postkarte vom Freund — ohne dass die App technisch dahinter zurückfällt.

Entschieden in dieser Session:
- **Sub-Direction:** Warm Paper / Postcard (cream + beige + warme Erdtöne, Serifen-Headlines, dezente Polaroid-/Postkarten-Anmutung).
- **Intensität:** Retro über cleaner Basis — moderne iOS-UI-Architektur als Skelett, Retro nur in Tokens (Farbe, Typo, Illustration, Empty States, Haptik-Details).
- **Plattform:** iOS first.

Diese Datei ist eine **Design-Direction-Spec**, kein Implementierungsplan für Code. Code-Schritte folgen, sobald Tokens und 2–3 Schlüssel-Screens visuell definiert sind.

---

## Visuelle Sprache (Vorschlag, zum Validieren)

### Farb-Tokens (Light)
| Rolle | Hex | Notiz |
|---|---|---|
| `bg/canvas` | `#F4ECDD` | Cream-Papier, leicht warm |
| `bg/raised` | `#EFE4CD` | Cards, sheets — minimal Kontrast zur Canvas |
| `surface/accent` | `#E8D9BF` | Pull-Quotes, Highlights |
| `ink/primary` | `#2B2722` | Almost-black warm, statt reines Schwarz |
| `ink/secondary` | `#6E5236` | Sepia-Body |
| `accent/stamp` | `#C13E2C` | Sparsam: Stempel, "Live"-Indikatoren, CTA |
| `accent/postage` | `#3F6B5F` | Sekundär-CTA, Trips-Tab |
| `accent/sky` | `#A6B8C9` | Calendar-/Notification-Akzent |

Dark Mode: invertiert auf warmes Anthrazit (`#1F1A14`) mit Cream-Ink — **nicht** plain `#000`.

### Typografie
- **Display/Headlines:** Serif mit Charakter (Kandidaten: *PP Editorial New*, *Tiempos Headline*, *GT Super*). Falls Lizenz-Budget knapp: *Fraunces* (open source, sehr expressive Optical Sizes).
- **Body:** Geometric/Humanist Sans, ruhig, hochlesbar (*Söhne*, *GT America*, oder OSS: *Inter Tight* / *Geist Sans*).
- **Akzent / Notiz:** ein Mono-Italic für "Stempel-Daten" und Timestamps (*JetBrains Mono Italic* oder *Berkeley Mono*).
- iOS-Default-Sizes nicht antasten — nur Schriftarten tauschen, Hierarchie bleibt nativ.

### Form-Sprache
- **Cards:** Radius `16pt`, sehr weicher Schlagschatten (Y `4`, Blur `12`, Opacity `0.06`), papier-artige `1px` warme Hairline (`#D9C7A0` @ 40 %).
- **Buttons:** Pill-Shape, Cream-Surface mit `ink/primary`-Border, kein Gradient. Active-State = Stempel-Press (kurzer Scale-Down + Haptic).
- **Iconography:** Custom-Set in **Outline-Style mit leicht ungeraden Linien** (1.5pt, gerundete Caps), inspiriert von Filofax-Symbolen. Standard SF Symbols **nicht** mischen — wirkt sofort generisch. Alternativ: *Phosphor Icons* (Duotone Variant) als Startpunkt, dann selektiv ersetzen.
- **Texturen:** dezenter Paper-Grain als globaler Overlay (Opacity `~3 %`, additive blend). Polaroid-Frames für User-Avatare in Profile-/Personal-Space-Tab. **Kein** Memphis-Geo-Pattern, **keine** Synthwave-Gradients, **keine** Neon-Akzente.
- **Motion:** ruhige `easeInOut`, 250–350 ms. Keine Spring-Bounces außer auf Stempel-Press.

### "Postkarten-Momente" (gezielt platzieren, nicht überall)
- **Onboarding-Final-Screen** (5/5 in `Onboarding Flow.md`) → als Postkarte mit Tagline "Die App für dein soziales Leben", Stempel "Welcome".
- **Meetup-Anfrage / Meetup-Antwort** → Briefumschlag-Animation beim Senden, Briefmarken-Stempel beim Empfangen.
- **Trips-Tab** → Reisetagebuch-Layout mit "geklebten" Polaroids und Klebeband-Sticker.
- **Empty States in Notifications/Calendar** → handgeschriebene Italic-Notiz statt generischer Illustration.
- **Personal Space** → Album-Seite mit Spiralbindung-Detail.

---

## Foundation-Prinzipien (was die "clean Basis" konkret bedeutet)

1. **iOS-Patterns werden nicht angefasst.** Tab Bar, Navigation Bar, Sheet-Verhalten, Pull-to-Refresh, Swipe-Gestures, Tap-Targets ≥ 44pt, Dynamic Type, VoiceOver-Labels, Safe Areas — alles native. Retro lebt in Tokens, nicht in Interaktionsmustern.
2. **Lesbarkeit > Stimmung.** Wenn ein nostalgisches Element die Nutzbarkeit reduziert (z. B. Schreibmaschinen-Font für 6h Body-Text), gewinnt Lesbarkeit. Nostalgie kommt durch Pacing, nicht durch Reibung.
3. **Akzente sind teuer.** Stempel-Rot und Postage-Grün werden für Aktionen reserviert, nicht für Dekoration. Eine Screen mit ≥ 3 Akzentfarben wurde zu laut entworfen.
4. **Skalierbarkeit.** Token-System (Farben, Spacing, Typo) als zentrale Quelle (z. B. SwiftUI `Theme.swift` oder via Style-Dictionary, falls später RN). Kein Hardcoded-Hex im View-Code.

---

## Referenz-URLs (kuratiert für gewählte Sub-Direction)

### Inspiration / Mood
- [Dribbble — pastel retro](https://dribbble.com/search/pastel-retro)
- [Dribbble — retro ui app](https://dribbble.com/search/retro-ui-app)
- [Dribbble — retro app Tag](https://dribbble.com/tags/retro-app)
- [Dribbble — pastel app design](https://dribbble.com/search/pastel-app-design)

### Apps zum konkret Anschauen (App Store + Mobbin)
- **Lapse** — disposable-cam-Ästhetik, Nostalgie ohne Skeumorph-Übertreibung. Direkt installieren und Onboarding-Flow studieren.
- **Co–Star Astrology** — Cream-Paper + Serif-Headlines + ruhige Pacing. Closest visual neighbor zu deinem Wunsch.
- **Partiful** — retro-leaning Event-App, zeigt wie man warm und funktional bleibt.
- **Day One Journal** — Paper-Texturen + Polaroid-Layouts in einer iOS-App, die täglich genutzt wird.
- **Howl** / **Finch** — als Gegenbeispiel für Pastell, das *zu* kindisch wirkt — bewusst dagegen abgrenzen.

### Trend-Kontext / Paletten
- [Figma — 100 Color Combinations (Retro/Earthy Section)](https://www.figma.com/resource-library/color-combinations/)
- [Muzli — 2026 UI/UX Trends (muted earthy + pastel)](https://muz.li/inspiration/ecommerce-website/)

---

## Nächste Schritte (vorgeschlagene Reihenfolge)

1. **Mood-Board konsolidieren** — 12–20 Screenshots aus den Dribbble-Links + App-Stores in `~/Obsidian/Vault/main/Projects/orbit/Design/MoodBoard.md` (oder als Excalidraw-Canvas via excalidraw-Skill).
2. **Token-Sheet als Excalidraw oder Figma** — Farben, Typo-Scale, Spacing, Radii, Schatten als visueller Reference-Sheet.
3. **3 Schlüssel-Screens als Hi-Fi-Mock** (in dieser Reihenfolge, weil sie Token-Coverage maximieren):
   - **Current Orbit Tab** (Listenscreen mit Avataren, Status, Karten-Element) — testet Cards, Avatar-Frames, Tab Bar, Empty State.
   - **Meetup-Anfrage senden** (Sheet/Modal) — testet Form-Inputs, CTA, Briefumschlag-Moment, Haptic.
   - **Onboarding 5/5 (Postkarten-Screen)** — testet Display-Typo, Stempel-Akzent, finale Tagline.
4. **Validation-Loop:** beide Screens als statisches Bild + 1 Klick-Prototyp im echten iPhone-Frame ansehen (nicht nur in Figma-Canvas). Erst danach Code-Repo in `!orbit_neu` aufsetzen.
5. **Repo-Setup** (separater Plan, später): SwiftUI + Xcode-Projekt in `!orbit_neu`, Tokens als `Theme.swift` aus dem Token-Sheet generiert.

---

## Verifikation / "Ist die Direction richtig?"

Bevor in Code investiert wird, drei Tests:

1. **Squint-Test:** Mock-Screens aus 2 m Entfernung anschauen. Wirkt es wie eine warme, gemütliche App? Nicht wie ein Filter-Pack auf einer generischen UI?
2. **5-Sekunden-Test mit 3 Personen aus der Zielgruppe** (junge Erwachsene, social-app-müde): "Welches Wort beschreibt diese App?" Keywords wie *cozy, freundlich, ruhig, nostalgisch, anders* sind Treffer. *Boomer, esoterisch, Kinder-App* wären Warnsignale.
3. **Daily-Use-Test:** Den Current-Orbit-Mock als iPhone-Wallpaper nutzen oder per Sketch/Figma-Mirror täglich ansehen. Wenn die Cream-Helligkeit oder Stempel-Rot nach 3 Tagen nervt → Tokens nachjustieren, *bevor* gebaut wird.

---

## Kritische Dateien (für die Implementierungsphase, später)

- `~/Desktop/projects/!orbit_neu/` — Code-Repo, derzeit nur Initial-Commit. Wird erst nach Token-Validation befüllt.
- `~/Obsidian/Vault/main/Projects/orbit/` — Konzept-Notizen, hier sollte ein neuer Unterordner `Design/` für Mood-Board und Token-Sheet entstehen.
- `~/Obsidian/Vault/main/Projects/orbit/Onboarding Flow.md` — referenziert Screens 1–5, von denen Screen 5 als erster Hi-Fi-Mock-Kandidat hier oben vorgeschlagen ist.
