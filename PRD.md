# Orbit — Product Requirements Document

> **Stand:** 2026-04-28
> **Status:** MVP-Definition
> **Owner:** Lucas
> **Source of Truth:** Diese Datei. Vault-Notes unter `~/Obsidian/Vault/main/Projects/orbit/` sind Brain-Dump-Quelle und können bei Konflikten aktualisiert werden.

---

## 1. Overview

**Orbit** ist die App für dein soziales Leben. Sie verbindet Menschen, die sich (über Ecken) kennen, in Präsenz: Wer von meinen Leuten ist gerade in meiner Stadt? Wer reist zur gleichen Zeit wie ich nach Mallorca? Wer von meinen Freunden hat gemeinsame Freunde, die ich noch nicht kenne?

**Tagline:** *orbit — your social life*

**Zielgruppe:** Studenten und Young Professionals, 20–28, iPhone-dominiert, mobil, mit aktivem sozialem Leben in mehreren Städten.

**Kern-Idee:** Kein Feed, keine Likes, keine Follower. Eine sehr fokussierte App mit einem einzigen Ziel: **mehr echte Treffen mit den Leuten, die du eh schon kennst — und ein paar neue dazu.**

---

## 2. Business Context (Kurz)

Nur als Hintergrund für Produkt-Entscheidungen. Marketing- und Business-Plan sind out-of-scope dieses PRD.

- **Cold-Start-Problem:** Die App ist wertlos ohne Kontakte. Onboarding und Invite-Mechanik sind deshalb das wichtigste Feature, nicht ein „Nice-to-have".
- **Kritische Masse:** Mutuals und „Wer ist gerade hier"-Features brauchen Netzwerkdichte. Der MVP muss organischen Pull über Invites schaffen.
- **Datenschutz als Feature:** Konkurrenz-Apps (Snapmap, etc.) leiden unter Stalking-Vorwürfen. Orbit positioniert sich bewusst dagegen: **Stadt-Granularität, kein GPS-Storage.** Das ist auch der Schlüssel zur Apple-Store-Approval.
- **AppStore-Launch:** Apple-Review kann Tage bis Wochen dauern. Entsprechend Puffer einplanen, AGB / Datenschutz / Impressum / Website müssen vor Submission stehen.

---

## 3. Core Concept & Principles

**Sinn der App:** Menschen, die sich (über Ecken) kennen, in Präsenz verbinden.

**Designprinzipien:**

1. **Friction-frei:** Kein Passwort, keine Formulare, keine Tutorials. Wenn ein Feld nicht zwingend nötig ist, wird es ausgeblendet (per „+"-Toggle einblendbar).
2. **Privacy by Design:** Stadt statt Koordinate. Keine Likes, keine Follower-Counts, keine öffentlichen Profile. Nichts wird gespeichert, was die App nicht braucht.
3. **Kein Spielzeug:** Keine Gamification, keine Streaks, keine Punkte. Der Anreiz ist immer „dein echtes Leben wird besser".
4. **Single-Action-Screens:** Jeder Screen hat genau eine Hauptaktion. Kein Choice-Overload.
5. **Mobile-First, iOS-First:** Native Look-and-Feel. Apple Sign In primär. „When in Use"-Standortberechtigung reicht.

---

## 4. User Account Model

Es gibt **zwei** Wege, mit Orbit zu interagieren. Beide sind auf minimale Friction optimiert.

### 4.1 Voller Account *(Standard)*

Für alle, die Orbit aktiv nutzen wollen.

| Schritt | Aktion | Tap-Count |
|---|---|---|
| 1 | Apple Sign In *(primär)* oder Google Sign In | 1 |
| 2 | Standort freigeben *(„When in Use")* | 1 |
| 3 | Kontakte synchronisieren | 1 |
| 4 | Drin im Current Orbit | 1 |

- **Gesamtdauer-Ziel:** unter 30 Sekunden
- **Textfelder:** 0 (Name + Email kommen aus Apple/Google)
- **Kein Email/Passwort-Signup**

### 4.2 Gastmodus *(PWA, ohne Installation)*

Für Empfänger einer Meetup-Einladung, die noch kein Orbit haben.

- **Trigger:** Ein Orbit-User schickt eine Meetup-Anfrage an eine Person ohne Account → personalisierter Deep Link wird per iMessage/WhatsApp verschickt.
- **Umgebung:** Schlanke Mobile-Webansicht (PWA). **Kein App-Download.**
- **Inhalt:** Wer lädt ein, wann, wo, wer kommt noch.
- **Aktionen:** Annehmen / Ablehnen / Gegenvorschlag, optional Textnachricht. Eingabe nur: Name.
- **Übergang:** Nach dem Annehmen sanfter Hinweis zur App-Installation. Bereits eingegebener Name + Antworten werden beim Account-Erstellen automatisch verknüpft.

**Was ein Gast NICHT kann:**

- ❌ Eigene Meetup-Anfragen erstellen
- ❌ Current Orbit sehen
- ❌ Trips planen
- ❌ Kontakte adden

Der Gastmodus ist bewusst limitiert — er zeigt einen Wert, ohne alles freizugeben.

---

## 5. Onboarding Flow

Maximal **5 Screens** vom Cold Start zum Current Orbit. **Jeder Screen hat genau eine Aktion.**

### Screen 0 — Startscreen

Cleaner, dunkler Screen. In der Mitte:

> **orbit**
> *your social life*

Der Text fadet sanft ein (max. 2 Sekunden Animation), darunter ein dezenter „Swipe to start"-Hinweis. Inspiriert vom Apple-„hello"-Setup-Screen. **Kein Feature-Pitch, nur Vibe.**

### Screen 1 — Willkommen & Login

- **Apple Sign In** (primär, ein Tap)
- **Google Sign In** (Alternative)
- Kurzer Subtitle: *„Finde heraus, wer von deinen Leuten gerade in deiner Stadt ist."*

### Screen 2 — Standort freigeben

- Illustration + Erklärung: *„Orbit erkennt, in welcher Stadt du bist. Nie wo genau."*
- Button: „Standort freigeben" → triggert iOS-Permission-Dialog *(„Nur bei Verwendung")*
- Subtext: *„Wir speichern keine GPS-Daten, nur den Städtenamen."*

**Begründung:** Ohne Standort funktioniert Current Orbit nicht. Spätere Aktivierung führt zu Empty-State-Churn.

### Screen 3 — Kontakte importieren ⭐ *Kritischster Screen*

- Button: „Kontakte synchronisieren" → triggert iOS-Contacts-Permission-Dialog
- **Sofort danach:** Anzeige „X deiner Kontakte sind schon auf Orbit" mit Profilbildern
- Darunter: Vorausgewählte Liste an Kontakten zum Einladen via Deep Link

**Empty State (keine Kontakte auf Orbit):**

> „Du bist einer der Ersten! Lade 3 Freunde ein und Orbit wird lebendig."

Mit großem Share-Button und vorgeschriebener Nachricht für WhatsApp/iMessage.

### Screen 4 — Erster Blick auf Current Orbit

User landet direkt im Current-Orbit-Tab. Bei vorhandenen Kontakten: Liste der Personen in der Stadt. Bei leerem Stand: Empty-State mit Invite-CTA.

**Kein Tutorial, keine Coach-Marks, keine Overlay-Hinweise.**

### Erfolgsmetriken (Onboarding-Funnel)

| Metrik | Definition | Ziel |
|---|---|---|
| Completion Rate | % der User, die alle 5 Screens durchlaufen | > 80 % |
| Contacts Synced Rate | % die Kontakte freigeben | > 60 % |
| Invite Sent Rate | % die ≥ 1 Einladung verschicken | > 30 % |
| Time to First Meetup | Zeit bis zur ersten Meetup-Anfrage | < 48 h |

---

## 6. Features (MVP)

### 6.1 Meetup — Anfrage & Antwort

Auslösbar über den **Plus-Button in der Mitte** der Tab-Bar.

#### Anfrage-Felder

| Feld | Status |
|---|---|
| Betreff / Titel | **Mandatory** |
| Datum | **Mandatory** |
| Zeit | Optional |
| Location | Optional |
| Kategorie *(Sport, Café, Restaurant…)* | Optional |
| Beschreibung | Optional |
| Zusätzliche Teilnehmer | Optional |
| Ausweichtermine | Optional *(MVP: tbd)* |

UX-Regel: **Alles Optionale ist initial ausgeblendet** und per kleinem „+" einblendbar. Ziel ist „Invite in 10 Sekunden raus".

#### Antwort-Optionen

- **Annehmen** *(optional mit Textnachricht)*
- **Reschedule** → öffnet eine neue Meetup-Anfrage mit den ursprünglichen Werten vorausgefüllt
- **Ablehnen** *(optional mit Textnachricht)*

#### Spezialfall: Empfänger ohne Orbit-Account

→ Die Anfrage wird als **Gastmodus-Link** verschickt (siehe 4.2). Empfänger kann ohne Account annehmen/ablehnen/Gegenvorschlag.

---

### 6.2 Tab — Notifications

**Position:** Oben rechts als Nachrichten-Symbol (nicht in der Hauptnavigation).

**Kategorien:**

- **Neue Einladungen zu Treffen** *(Top-Priorität)*
- **Änderungswünsche zu Treffen** *(Top-Priorität)*
- **Neuer Kontakt im gleichen Orbit**
  - Default off für Heimatstadt (sonst zu viel Noise)
  - Optional an für aktuellen Standort
- **Neue Registrierungen von Kontakten**
- **Neue Überschneidung mit einem Kontakt auf einem geplanten Trip**
  *(z.B. „Louis reist zur gleichen Zeit wie du nach Mallorca")*

---

### 6.3 Tab — Current Orbit

**Default-Tab nach Onboarding.** Hier sieht der User, wer von seinen Leuten gerade in derselben Stadt/Region ist.

#### Hauptansicht

- **Meine Freunde / Kontakte** — Liste aller Kontakte im Current Orbit
  - Optional: Unterscheidung in „Freundeskreise" (Post-MVP)
- **Subtab Mutuals** — Freunde von Freunden
  - Filter: Mindestanzahl an gemeinsamen Freunden (Default: 10)
  - Optional: Filter auf gemeinsame Interessen *(Post-MVP)*

#### Klick auf Profil

| Beziehung | Verfügbare Aktionen |
|---|---|
| Freund / Kontakt | WhatsApp-Chat · Meetup-Anfrage · Anruf |
| Mutual | Meetup-Anfrage |

#### Netzwerk-Status

Permanent eingeblendet: *„4 von 23 Kontakten sind auf Orbit."* — Trigger zum Einladen.

#### Locations *(Post-MVP)*

→ siehe Backlog (7.5).

---

### 6.4 Tab — Calendar

#### Standard-Kalenderansicht

Geplante Treffen pro Woche/Monat.

#### Listenansicht

Anstehende Treffen ausführlicher, mit Bild der Location, **aufsteigend nach Datum sortiert**.

#### Integration

- **Bidirektional** mit externen Kalendern (iOS-Kalender, Google Calendar)
- Treffen aus Orbit erscheinen im externen Kalender, externe Termine optional in Orbit sichtbar (für Verfügbarkeits-Check beim Meetup-Vorschlag)

---

### 6.5 Tab — Trips

Trips = geplante Aufenthalte in anderen Städten (Urlaub, Auslandssemester, Geschäftsreise, Wochenendtrip).

#### Plan a new Trip

| Feld | Status |
|---|---|
| Daten *(Zeitraum)* | **Mandatory** |
| Grund der Reise *(Business, Auslandssemester, Familienurlaub)* | Optional |
| Teilnehmer hinzufügen | Optional |
| Anschlussreise hinzufügen *(Multi-Stadt-Trip)* | Optional |

UX-Regel wie bei Meetup: Optionale Felder per „+" einblendbar.

#### Upcoming Trips

- Liste der eigenen geplanten Trips
- Pro Trip: **Wer von meinen Kontakten ist auch da?**
  - Personen mit zeitlich überlappendem Trip
  - Personen, die das Reiseziel als Current Orbit haben und keinen abweichenden Trip eingetragen haben

---

### 6.6 Tab — Personal Space

Profil + Einstellungen + Kontakte.

#### Daten

- Vor- und Nachname
- Email
- *(weitere Profilfelder MVP-minimal)*

#### Kontakte

- Kontaktliste (alle synchronisierten + manuell geaddeten)
- **Neue Kontakte adden** (ähnlich Snapchat: Username/QR/Deep-Link)
- Kontakte synchronisieren → Liste der Match-Treffer mit Orbit-Accounts
- Push-Benachrichtigung wenn ein Kontakt sich neu registriert

#### Einstellungen

- Push-Benachrichtigungen (granular, pro Kategorie aus 6.2)
- Standort An/Aus für Sichtbarkeit im Orbit anderer
- Mutual-Filter (Default: ≥ 10 gemeinsame Freunde, manuell überschreibbar)

#### Standort-Tracking *(Kern-Privacy-Konzept)*

- **Verfahren:** Beim App-Open wird im Hintergrund ein Standort-Check gemacht, **die Koordinaten direkt auf eine Stadt gerundet, der GPS-Punkt verworfen**.
- **Was gespeichert wird:** Nur Städtename + Zeitstempel (`„Henrik — Münster — seit 26.03."`).
- **Was NICHT gespeichert wird:** Koordinaten, Bezirke, Adressen.
- **Permission-Level:** „When in Use" (Apple-Lowest, kein Background-Tracking).
- **Fallback ohne Internet/GPS:** Letzter bekannter Standort wird angezeigt mit Refresh-Button: *„Zuletzt in Münster — Standort aktualisieren?"*

#### Standort-Liste *(Definition was ein „Orbit" ist)*

Manuell konfigurierbare Liste, was als ein Orbit zählt:

- **Deutschland:** ein Orbit = eine Stadt/Region (z.B. Münster, Berlin)
- **Auslandsreisen:** ein Orbit = ein Land (z.B. Thailand, Spanien, Mallorca)

Diese Liste lebt in einer CMS-gepflegten Stammdaten-Tabelle (siehe 8 + 10) und wird dem User als vordefinierte Optionen angeboten.

#### Interessen *(Post-MVP)*

→ siehe Backlog (7.6).

---

### 6.7 Invite & Referral *(Permanenter App-Bestandteil, nicht nur Onboarding)*

**Stärkster Anreiz:** Die App wird mit jedem Kontakt besser. Kein Geld, keine Punkte.

#### Persönlicher Einladungslink

Pro User ein Deep Link mit Social Proof:

> *„Henrik und 7 eurer gemeinsamen Freunde sind schon auf Orbit."*

Versand: iMessage / WhatsApp / generischer Share-Sheet-Link.

#### Incentive-Mechaniken

- **Sichtbarer Netzwerk-Fortschritt:** „4 von 23 Kontakten sind auf Orbit." — permanent in Current Orbit.
- **Push beim Beitritt:** *„Lisa ist jetzt auf Orbit. Sie ist gerade in Münster."*
- **Feature-Unlock durch Netzwerkgröße:** Mutuals startet erst ab X Kontakten auf Orbit. Transparent: *„Du brauchst noch 3 Kontakte, damit Mutuals startet."* (Inhaltlich logisch, kein künstlicher Paywall.)

#### Kontextuelle Trigger *(wann die App zum Einladen anstößt)*

| Auslöser | Aufforderung |
|---|---|
| Meetup-Anfrage an Nicht-User | Verschicke als Gastmodus-Link, nach dem Annehmen sanfter Invite zur vollen App |
| Trip geplant | „5 Kontakte in Berlin sind noch nicht auf Orbit. Einladen?" |
| Current Orbit | „Du hast 23 Kontakte in Münster. 8 sind noch nicht auf Orbit." |
| Nach erfolgreichem Meetup | „Kennt ihr noch jemanden, der auf Orbit sein sollte?" |

#### Was bewusst NICHT genutzt wird

- ❌ Punkte / Streaks / Leaderboards
- ❌ Materielle Rewards (Gutscheine, Premium-Trial)
- ❌ Pop-Up-Spam

---

## 7. Backlog / Post-MVP

Nicht im MVP. Reihenfolge ist Brain-Dump-Stand, nicht Prio-Stand.

### 7.1 Events

Wahrscheinlich integriert in **Current Orbit** und **Trips**: gemeinsame Events (Festivals, Konzerte, Konferenzen) als eigene Entität.

### 7.2 Bubbles

Freundesgruppen-Management. Sub-Cluster der Kontaktliste für gerichtete Meetup-Anfragen und gefilterte Sicht auf Current Orbit.

### 7.3 Spontane Meetups *(„Quick Meetup")*

- Aktivierung durch **Handy-Schütteln**
- Vorausgewählte Meetup-Anfrage an z.B. „alle Kontakte im Current Orbit"
- Ein Tap auf Abschicken

### 7.4 AI-Agent für Präsenztreffen

- Terminvorschläge: Freunde, die sich lange nicht getroffen haben
- Vorschläge für Mutuals mit hoher Match-Quote (gemeinsame Freunde + Interessen)
- Voraussetzung: Interessen-Profil (siehe 7.6)

### 7.5 Locations im Current Orbit

Liste mit Locations (Cafés, Bars, Restaurants) im aktuellen Orbit:

- Google-Bewertungen + Rating
- „Favorisieren"
- „Gefällt auch…" — Liste mit Freunden, die die Location favorisiert haben

### 7.6 Interessen-Profil

Optionales Profil-Feld. Voraussetzung für 7.4 (AI-Agent) und für Mutual-Filter auf gemeinsame Interessen.

---

## 8. Tech Stack

### 8.1 Mobile App

- **Framework:** Expo / React Native (TypeScript)
- **Plattform-Priorität:** iOS-First für MVP-Launch, Android folgt
- **Auth:** Apple Sign In (`expo-apple-authentication`), Google Sign In (`@react-native-google-signin/google-signin`)
- **Standort:** `expo-location` mit `When in Use`-Permission
- **Kontakte:** `expo-contacts` — nur Lese-Zugriff, **nur gehashte Telefonnummern** verlassen das Device
- **Push:** Expo Push Notifications (APNs)
- **Deep Links:** Universal Links (iOS) für Invite + Gastmodus-Meetup-Links
- **Navigation:** Tab-Navigation gemäß Abschnitt 6 (Notifications oben rechts, 4 Tabs unten + Plus-Button mittig)

### 8.2 Backend

- **Stack:** Supabase
  - **Auth:** Supabase Auth mit Apple- und Google-OAuth-Providern
  - **Datenbank:** Postgres (siehe Datenmodell §9)
  - **Storage:** Supabase Storage für Profilbilder, Location-Bilder, CMS-Assets
  - **Realtime:** Supabase Realtime für Live-Updates auf Meetups, Notifications, Current Orbit
  - **Serverless Logic:** Supabase Edge Functions (Deno) für:
    - Kontakt-Hash-Matching
    - Stadt-Resolution (Reverse-Geocoding via externer Provider, nur Stadt zurückgeben, Koordinate verwerfen)
    - Push-Notification-Trigger
    - Gast-Account → voller Account Merge
- **Row Level Security:** Aktiv. User dürfen nur eigene Daten schreiben, lesen nur freigegebene Daten anderer.

### 8.3 Web

Eine **einzige Next.js-Codebase** beherbergt drei Use-Cases unter unterschiedlichen Routen:

| Route | Zweck | Auth |
|---|---|---|
| `/m/[meetupId]` *(o.ä.)* | **PWA-Gastmodus:** Meetup als Gast annehmen | Keine *(nur Magic Token im Link)* |
| `/admin/*` | **Admin-Page:** User-Management, Moderation, Stammdaten | Supabase Auth + Role-Check (`role = admin`) |
| `/admin/cms/*` | **CMS-Tool:** Content-Editor (eingebettet in Admin) | Wie Admin |

- **Framework:** Next.js (App Router) + Tailwind
- **Hosting:** Vercel
- **Supabase-Client:** Server- und Client-seitig, RLS bleibt durchgehend aktiv

---

## 9. Datenmodell (High-Level)

Genug Detail, um Supabase-Migrations daraus abzuleiten. Kein vollständiges Schema.

### 9.1 Kern-Tabellen

| Tabelle | Wichtigste Felder | Zweck |
|---|---|---|
| `users` | `id`, `auth_provider` *(apple/google)*, `first_name`, `last_name`, `email`, `created_at`, `role` *(user/admin)* | Profile + Auth-Verknüpfung |
| `user_locations` | `user_id`, `orbit_id`, `last_seen_at` | Aktueller Orbit pro User. **Keine Koordinaten.** |
| `orbits` | `id`, `name` *(z.B. „Münster", „Thailand")*, `type` *(city/country/region)*, `centroid` *(nur für Reverse-Geocoding-Mapping)* | CMS-gepflegte Liste. Definiert was ein „Orbit" ist (siehe 6.6). |
| `user_settings` | `user_id`, `share_location`, `mutual_min_friends`, `notification_prefs` *(JSON)* | Granulare Privacy- und Notification-Settings |
| `contacts` | `user_id`, `phone_hash` *(SHA-256 + Salt)*, `display_name`, `matched_user_id` *(nullable)* | Synchronisierte Kontakte. **Telefonnummern nie im Klartext.** |
| `friend_links` | `user_a`, `user_b`, `status` *(mutual/pending)*, `created_at` | Symmetrische Verknüpfung wenn beide sich in Kontakten haben |
| `meetups` | `id`, `creator_id`, `title`, `date`, `time` *(nullable)*, `location` *(nullable)*, `category` *(nullable)*, `description` *(nullable)*, `status` | Meetup-Anfragen |
| `meetup_participants` | `meetup_id`, `participant_id` *(nullable)*, `guest_name` *(nullable)*, `response` *(pending/accepted/declined/reschedule)*, `response_message` | Teilnehmer inkl. Gäste ohne Account |
| `trips` | `id`, `user_id`, `orbit_id`, `start_date`, `end_date`, `reason` *(nullable)*, `parent_trip_id` *(Anschlussreise)* | Geplante Trips |
| `trip_participants` | `trip_id`, `user_id` | Optionale Co-Reisende |
| `notifications` | `id`, `user_id`, `type`, `payload` *(JSON)*, `read_at`, `created_at` | Notification-Inbox pro User |
| `invites` | `id`, `inviter_id`, `link_token`, `target_phone_hash` *(nullable)*, `accepted_by_user_id` *(nullable)*, `created_at` | Persönliche Deep Links + Gastmodus-Links |
| `cms_content` | `id`, `key`, `locale`, `body` *(JSON/Markdown)*, `published_at`, `updated_by` | In-App-Texte (Empty-States, Onboarding-Subtitles, FAQ) |
| `cms_assets` | `id`, `key`, `storage_path`, `meta` *(JSON)* | Bilder/Icons via CMS |

### 9.2 Wichtige Constraints

- `users.role` defaultet auf `user`. Admin-Rolle wird manuell vergeben.
- `contacts.phone_hash` und `invites.target_phone_hash` nutzen denselben Hash-Algorithmus (Server-side gepfeffert), damit Matching möglich ist.
- `user_locations` darf NIE Koordinaten halten. Reverse-Geocoding passiert in einer Edge Function, nur das `orbit_id` wird persistiert.
- `meetup_participants.participant_id` ist nullable, damit Gäste (ohne Account) als Teilnehmer mit Name gespeichert werden können. Nach Account-Merge wird `participant_id` nachgetragen.

### 9.3 Realtime-Channels

- `meetups:user_id=<me>` — Live-Update bei Meetup-Antworten
- `current_orbit:orbit_id=<x>` — Live-Update wenn Kontakte den Orbit wechseln
- `notifications:user_id=<me>` — Inbox-Updates

---

## 10. Admin-Page & CMS

Selbst gecodet in der Next.js-Codebase, gehostet auf Vercel, gegen Supabase mit Admin-Role-Check.

### 10.1 Admin-Page — Funktionen

- **User-Management:** Suche, Profil ansehen, sperren, Admin-Rolle vergeben
- **Moderation:** Gemeldete Inhalte einsehen und Aktionen ausführen *(Inhalt löschen, User warnen/sperren)* — Reporting-Mechanik MVP-minimal, ausbaubar
- **Stammdaten-Pflege:** `orbits`-Tabelle (Städte/Länder hinzufügen/editieren) — kritisch für die Standort-Liste aus 6.6
- **Beobachtbarkeit:** Onboarding-Funnel-KPIs (siehe 5), Aktive User pro Orbit, Invite-Conversion
- **Auth:** Supabase-Auth-Login + Server-side Check `role = admin`

### 10.2 CMS-Tool — Funktionen

In Admin-Page eingebettet (`/admin/cms/*`).

- **Content-Editor** für `cms_content`-Einträge:
  - Onboarding-Texte (Subtitles auf Screen 1, 2, 3)
  - Empty-State-Texte (z.B. „Du bist einer der Ersten…")
  - Notification-Templates
  - In-App-Hilfe / FAQ-Snippets
- **Asset-Manager** für `cms_assets` (Upload zu Supabase Storage, Vorschau)
- **Locale-Support:** mindestens `de` und `en` parallel pflegbar
- **Publish-Workflow:** Draft → Published, mit Audit-Trail (`updated_by`, `published_at`)
- **Live-Preview:** Mobile-Vorschau-Component, die zeigt, wie der Text in der App rendert

**App-seitig** holt die Mobile-App CMS-Inhalte über einen Supabase-Query mit Caching (TanStack Query o.ä.) — kein Hard-Coding von Strings in der App, soweit es vom CMS abgedeckt ist.

---

## 11. Datenschutz & Compliance

Kern-Position: **Datenschutz ist Feature, nicht Pflicht.** Aktiv kommunizieren.

### 11.1 Standort

- Apple-Permission: `When in Use` (kein `Always`)
- Speicherung: nur Stadt-/Land-Name, **nie Koordinaten**
- Reverse-Geocoding: Edge Function — Koordinate rein, Stadt raus, Koordinate verworfen
- User-seitige Kommunikation: *„Orbit weiß, in welcher Stadt du bist, aber nie wo genau."*

### 11.2 Kontakt-Sync

- Telefonnummern werden lokal **gehasht** (SHA-256 + Server-Salt), nur Hashes verlassen das Device
- Server speichert ausschließlich Hash + Display-Name (vom User vergebener Name aus dem Adressbuch)
- Match: Hash-Vergleich gegen `users.phone_hash`-Index, nie gegen Klartextnummern
- **Keine Speicherung des kompletten Adressbuchs** — nur was matched + zur Anzeige in der eigenen Kontaktliste nötig ist

### 11.3 DSGVO

- **Datenexport** (selbst-bedienbar im Personal Space, Post-MVP akzeptabel, MVP per Admin)
- **Löschanfrage:** Account-Delete kaskadiert über alle Tabellen (Cascade-Constraints in den Foreign Keys)
- **AGB / Datenschutzerklärung / Impressum:** vor App-Store-Submission live, gehostet als statische Pages in der Next.js-Codebase
- **Cookie-/Tracking-Banner:** Web-Gastmodus-Page

### 11.4 AppStore-Anforderungen (Apple)

- Apple-Developer-Account aktiv
- Universal-Link-Konfiguration (`apple-app-site-association`)
- Datenschutz-Labels in App-Store-Connect ehrlich ausfüllen *(„Contact Info — used for App Functionality, not Tracking, not Linked")*
- AGB / Privacy / Support-URL erreichbar
- Review-Puffer: 1–3 Wochen einplanen

---

## 12. Erfolgsmetriken

### 12.1 Onboarding-Funnel *(siehe auch §5)*

| Metrik | Ziel |
|---|---|
| Completion Rate | > 80 % |
| Contacts Synced Rate | > 60 % |
| Invite Sent Rate | > 30 % |
| Time to First Meetup | < 48 h |

### 12.2 Engagement (zusätzlich, lose Ziele für MVP-Lernphase)

- **Wöchentlich aktive User pro Orbit** — Indikator für kritische Masse pro Stadt
- **Meetup-Anfragen pro aktivem User pro Woche**
- **Meetup-Acceptance-Rate**
- **Invite-Conversion** (verschickte Invites → registrierte Accounts)

Tracking: Supabase Analytics + minimaler eigener Event-Log (`events`-Tabelle, optional auch in Admin-Dashboard sichtbar).

---

## 13. Design

_TBD — vom User später zu füllen._

Platzhalter-Sektion. Wird ausgearbeitet, sobald visuelles Konzept, Designsystem, Komponenten-Library und Wireframes definiert sind. Bis dahin gilt: native iOS-Look-and-Feel, dunkler Startscreen-Vibe (siehe 5, Screen 0), und „weniger ist mehr" als Leitlinie.

---

## Anhang — Vault-Quellen

Brain-Dump-Quelle (Stand 2026-04-28): `~/Obsidian/Vault/main/Projects/orbit/`

- `orbit.md` · `App Framing.md` · `Challenges.md` · `Onboarding Flow.md` · `Account Prozess.md`
- `Features/Features.md` · `Features/Meetup.md` · `Features/Invite und Referral.md`
- `Features/Tab — Notifications.md` · `Features/Tab — Current Orbit.md` · `Features/Tab — Calendar.md` · `Features/Tab — Trips.md` · `Features/Tab — Personal Space.md`
- `Features/Backlog und spätere Features.md`
