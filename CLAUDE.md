# SportLink — Guide Claude Code

> Lis ce fichier en entier avant toute modification. Il décrit précisément ce que fait l'app, comment elle est structurée, et les conventions à respecter.

---

## 1. Vue d'ensemble

**SportLink** est une PWA mobile-first (React 19 + Supabase) pour la communauté sportive amateur, actuellement déployée sur Vercel. Elle couvre la **Bretagne** (départ Finistère). En français uniquement.

**Ce que fait l'app :**
- Carte interactive d'événements sportifs géolocalisés (matchs, tournois)
- Pages clubs personnalisables (mini-sites officiels)
- Générateur d'affiches sportives IA (PosterStudio) — 37 templates
- Covoiturage événementiel intégré
- Système communautaire : favoris, annonces, réactions, commentaires, badges XP

---

## 2. Stack technique

| Couche | Tech |
|--------|------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Animations | Framer Motion 12 |
| Maps | Leaflet + React-Leaflet + React-Leaflet-Cluster |
| Backend | Supabase (PostgreSQL + Auth PKCE + Realtime + RLS + Storage) |
| Export image | html-to-image (pixelRatio 3 → HD) |
| Validation | Zod 4 |
| Tests | Vitest + Testing Library (couverture partielle) |
| PWA | vite-plugin-pwa + Workbox |
| Déploiement | Vercel |
| TypeScript | NON — JavaScript pur |

**Variables d'env (`.env.local`) :**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=        # push notifications
VITE_REMOVEBG_API_KEY=        # détourage joueurs
VITE_ANTHROPIC_API_KEY=       # analyse DNA visuel
```

---

## 3. Architecture React

### Contextes (ordre d'imbrication dans App.jsx)
```
AuthProvider          → currentUser, isAdmin, isClubAdmin, followedClubs
  SportsProvider      → allSports (depuis Supabase)
    FavoritesProvider → favorites (Supabase + localStorage)
      AttendanceProvider → attending (Supabase + localStorage)
        AppInner
```

### Navigation (tabs, pas de router)
```
home     → HomePage.jsx
map      → MapPage.jsx         (carte principale)
favoris  → FavorisPage.jsx
news     → NewsPage.jsx
clubs    → ClubsPage.jsx
profil   → ProfilPage.jsx
admin    → AdminPage.jsx (lazy, isAdmin only)
```
Persistance de l'onglet actif : `sessionStorage('sl-tab')`.

### Deep linking hash-based
- `#club/:id` → ouvre ClubPageView en overlay
- `#event/:id` → focus sur l'event dans MapPage

### Lazy-loaded (code split)
AdminPage, OnboardingPage, EventFormModal, CSVImportModal, BadgeUnlockModal, MyRidesPage, AnnouncementsCenter

---

## 4. Structure des fichiers

```
src/
├── App.jsx                        # Entrée principale, routing par tabs
├── contexts/
│   ├── AuthContext.jsx            # Auth Supabase PKCE + profils
│   ├── SportsContext.jsx          # Sports disponibles
│   ├── FavoritesContext.jsx       # Favoris utilisateur
│   ├── AttendanceContext.jsx      # "J'y serai"
│   └── ToastContext.jsx           # Notifications toast
├── pages/
│   ├── HomePage.jsx               # Landing + stats + feed récent
│   ├── MapPage.jsx                # Carte Leaflet + filtres + sidebar
│   ├── FavorisPage.jsx            # Événements sauvegardés
│   ├── NewsPage.jsx               # Fil actualité clubs suivis
│   ├── ClubsPage.jsx              # Annuaire clubs + leaderboard
│   ├── ProfilPage.jsx             # Profil + badges + XP
│   ├── AuthPage.jsx               # Google OAuth + email/password
│   ├── AdminPage.jsx              # Dashboard admin (lazy)
│   ├── OnboardingPage.jsx         # Sélection sports (lazy)
│   └── MyRidesPage.jsx            # Covoiturage (lazy)
├── components/
│   ├── EventCard.jsx              # Carte événement (memo)
│   ├── EventFormModal.jsx         # Création/édition événement (lazy)
│   ├── EventSidebar.jsx           # Sidebar desktop événement
│   ├── MobileEventSheet.jsx       # Bottom sheet mobile événement
│   ├── EventComments.jsx          # Commentaires temps réel
│   ├── EventReactions.jsx         # Réactions emoji temps réel
│   ├── PosterStudio.jsx           # Studio d'affiches (MAJEUR)
│   ├── PosterShareBtn.jsx         # Bouton partage affiche
│   ├── Header.jsx                 # Header avec search + filtres
│   ├── BottomNav.jsx              # Navigation bas (5 tabs + FAB)
│   ├── MapView.jsx                # Leaflet map wrapper
│   ├── AnnouncementsCenter.jsx    # Centre annonces clubs (lazy)
│   ├── ClubLeaderboard.jsx        # Classement clubs
│   ├── UserLeaderboard.jsx        # Classement utilisateurs
│   ├── FollowModal.jsx            # Suivi équipes spécifiques
│   ├── VenueAutocomplete.jsx      # Autocomplete lieux (Photon/OSM)
│   ├── CityAutocomplete.jsx       # Autocomplete communes (geo.api.gouv.fr)
│   ├── CSVImportModal.jsx         # Import CSV événements (lazy)
│   ├── BadgeUnlockModal.jsx       # Animation débloquage badge (lazy)
│   ├── ErrorBoundary.jsx          # Boundary autour de chaque page
│   ├── OfflineBanner.jsx          # Bannière mode hors ligne
│   ├── ReminderBanner.jsx         # Rappel événements du jour/lendemain
│   ├── PushNotificationToggle.jsx # Toggle push notifications PWA
│   └── club/
│       ├── ClubPageView.jsx       # Page club complète (overlay)
│       └── [blocs éditeur club]   # SponsorsBlock, NextMatchBlock, etc.
├── components/poster/
│   ├── PosterRenderer.jsx         # Rendu React pur (POSTER_TEMPLATES, BASE_DIMS)
│   ├── PosterEditor.jsx           # Éditeur visuel drag & drop
│   ├── AiElementEditor.jsx        # Éditeur éléments décoratifs IA
│   ├── posterBgLibrary.jsx        # Bibliothèque fonds (presets)
│   ├── posterElements.jsx         # Éléments SVG décoratifs
│   └── templates/
│       ├── tourUtils.jsx          # Utilitaires templates tournoi (InfoRow, etc.)
│       ├── posterUtils.js         # blockStyle(), scaledTitle(), venueFs()
│       ├── Tpl*.jsx               # 24 templates matchs
│       └── TplTr*.jsx             # 10 templates tournois + 3 spéciaux
├── hooks/                         # 36 hooks (tous named exports)
├── lib/
│   ├── supabase.js                # Client Supabase (PKCE, realtime disabled)
│   ├── posterVariants.js          # generateVariants(), generateCustomBackground()
│   ├── imageUtils.js              # Compression + mock détourage joueur
│   ├── eventShare.js              # WhatsApp/Facebook/Instagram share
│   ├── pushNotifications.js       # Web Push VAPID
│   ├── sanitize.js                # DOMPurify wrapper
│   ├── schemas.js                 # Zod schemas validation
│   └── plans.js                   # Plans tarifaires
└── data/
    ├── events.js                  # EVENTS[] statiques (seed local)
    └── clubs.js                   # STATIC_CLUBS[] statiques (seed local)
```

---

## 5. Base de données Supabase

### Tables principales
```sql
profiles            -- utilisateurs (id, role, clubId, xp, favoriteSports, onboardingDone)
clubs               -- clubs sportifs (id, name, sport, city, logo_url, user_id)
events              -- événements (id, club_id, user_id, sport, date, homeTeam, awayTeam, score, type, status)
favorites           -- favoris utilisateur (user_id, event_id)
attendees           -- "J'y serai" (user_id, event_id)
club_follows        -- abonnements clubs (user_id, club_id, teams, notif)
club_pages          -- pages clubs JSONB (club_id, blocks[], theme)
club_trainings      -- créneaux entraînement (club_id, day, time, location)
club_managers       -- gestionnaires de clubs (club_id, user_id, role)
club_announcements  -- annonces clubs (club_id, title, message, type, target_teams)
announcement_reads  -- lectures annonces (user_id, announcement_id)
event_comments      -- commentaires (event_id, user_id, content)
event_reactions     -- réactions emoji (event_id, user_id, emoji)
event_reaction_counts -- view agrégée réactions
event_attendee_counts -- view SECURITY DEFINER compteurs
rides               -- covoiturage (event_id, driver_id, seats, departure, status)
ride_requests       -- demandes passagers (ride_id, passenger_id, status, message)
ride_notifications  -- notifs covoiturage (user_id, ride_id, type, read)
club_media_assets   -- photos/joueurs uploadés (club_id, url, thumbnail_url, tags, is_favorite)
club_brand_kits     -- identité visuelle club (club_id, da_profile JSONB, default_template_id)
posters             -- affiches sauvegardées (event_id, user_id, name, status, layers JSONB)
push_subscriptions  -- abonnements push PWA (user_id, endpoint, keys)
ai_jobs             -- logs jobs IA (type, status, club_id)
club_page_views     -- analytics pages clubs
```

### Rôles utilisateur (colonne `profiles.role`)
- `user` — utilisateur standard
- `club_admin` — gestionnaire de club (peut créer événements, annonces, modifier sa page)
- `admin` — administrateur plateforme (accès AdminPage, toutes opérations)

### Realtime
Désactivé globalement dans `supabase.js`. Activé manuellement par hook via `.channel()` uniquement pour : commentaires, réactions, annonces, covoiturage, compteurs présence.

---

## 6. PosterStudio — Système d'affiches (MAJEUR)

### Architecture state (useReducer)
```js
// Actions : PATCH | RESET | LOAD
{
  format: 'story' | 'post',          // story=9:16 (360×640), post=4:5 (360×450)
  templateId: string,
  accentColor: string,               // couleur principale
  homeLogo: string | null,           // URL ou base64
  awayLogo: string | null,
  homeTeam: string,
  awayTeam: string,
  date: string,
  time: string,
  venue: string,
  championship: string,
  tagline: string,
  bgPreset: string,                  // preset fond (ex: 'gold-rush')
  bgImage: string | null,            // URL fond custom ou IA
  overlayElements: [],               // éléments SVG décoratifs
  aiOverlayElements: [],             // éléments IA (Pollinations.ai)
  playerLayers: [],                  // photos joueurs détourés
  transforms: {},                    // overrides visuels par bloc
  effects: {},
}
```

### Templates
```js
// PosterRenderer.jsx — POSTER_TEMPLATES array
// BASE_DIMS = { story: {w:360,h:640}, post: {w:360,h:450} }

// 24 templates matchs : TplSimple, TplLight, TplColor, TplEditorial,
//   TplNeon, TplFluo, TplCinema, TplRetro, TplVivid, TplPulse,
//   TplPrestige, TplLuxe, TplBento, TplBlanc, TplStrike, TplElegant,
//   TplMagazine, TplImpact, TplSplit, TplDark, TplGlass, TplFlag,
//   TplInk, TplAurora

// 10 templates tournois (isTournament: true) :
//   TplTrCoupe, TplTrNeon, TplTrPremium, TplTrMinimal, TplTrGradient,
//   TplTrGlass, TplTrStreet, TplTrSummer, TplTrCinema, TplTrEsport
//   + 3 spéciaux : TplTrChampion, TplTrField, TplTrDynamic
```

### Système de blocs draggables (PosterEditor)
Chaque template marque ses zones avec `data-block="id"` :
```
title       → nom tournoi / titre
champ       → compétition / catégories
home-team   → équipe domicile
away-team   → équipe visiteur
teams       → section équipes complète
info        → infos tournoi (InfoRow)
meta        → date · lieu
tagline     → accroche
```

`blockStyle(transforms, id)` dans `posterUtils.js` retourne les overrides CSS :
- `dx`, `dy` → translate (via drag)
- `scale` → scale CSS
- `rotation` → rotate CSS
- `opacity`
- `hidden` → display none
- `fontSize` → override taille police (templates tournoi : lus directement via `transforms?.title?.fontSize ?? scaledTitle(...)`)
- `fontFamily` → override police (8 familles Google Fonts)

Alignement G/C/D : calculé via `naturalLeft = rect.left - currentDx * scale`.

Mesure des handles : `TreeWalker` sur nœuds texte uniquement (pas de nœuds dans des `data-block` imbriqués) → bounding box précise du contenu réel.

### Éléments décoratifs IA (`aiOverlayElements`)
```js
{ uid, imageUrl, prompt, dx, dy, scale, rotation, opacity, above }
```
Générés via **Pollinations.ai Flux** (`576×1024` px = ratio 9:16 exact).
`mix-blend-mode: screen` + `objectFit: contain` → fond noir = transparent.
Éditeur dédié : `AiElementEditor.jsx`.

### Fonds IA
- Fonds custom : Pollinations.ai (`576×1024`, prompt utilisateur)
- Fonds variantes : Edge Function Supabase `generate-variant-bg` → Fal.ai Flux

### Exports
- PNG via `html-to-image` (pixelRatio 3 = HD)
- Formats : Story 1080×1920, Post 1080×1350
- Draft : localStorage `sl-poster-draft` + table `posters` Supabase

---

## 7. Hooks — catalogue

| Hook | Ce qu'il fait |
|------|--------------|
| `useLocalEvents()` | CRUD événements Supabase + Realtime |
| `useClubs()` | CRUD clubs Supabase |
| `useClubMatches()` | Résultats matchs du club connecté |
| `useFavorites()` | Favoris (Supabase + localStorage) |
| `useAttendees()` | "J'y serai" (Supabase + localStorage) |
| `useRides()` | Covoiturage CRUD + gestion demandes |
| `useRideNotifications()` | Notifs covoiturage temps réel |
| `useMyAnnouncements()` | Annonces clubs suivis + unread count |
| `useClubAnnouncements()` | Annonces d'un club spécifique (club_admin) |
| `useEventComments()` | Commentaires Realtime |
| `useEventReactions()` | Réactions emoji Realtime |
| `useNewsFeed()` | Fil actualité (résultats + nouveaux events) |
| `useClubPage()` | Lecture/écriture page club JSONB |
| `useClubMedia()` | Upload + bibliothèque photos/joueurs |
| `useClubDNA()` | Analyse identité visuelle IA (Claude Vision) |
| `useClubBrandKit()` | Kit marque club (couleurs, template par défaut) |
| `usePosterDraft()` | Draft affiche par event (localStorage + Supabase) |
| `useBadges()` | Calcul + débloquage badges XP |
| `useClubLeaderboard()` | Classement clubs |
| `useUserLeaderboard()` | Classement utilisateurs |
| `usePushNotifications()` | Abonnement/désabonnement push Web |
| `useUpcomingFavorites()` | Rappels aujourd'hui/demain |
| `useCommunes()` | Communes depuis geo.api.gouv.fr |
| `useGeolocation()` | Géolocalisation navigateur |
| `useFilteredEvents()` | Filtrage événements (sport, date, ville) |
| `useShare()` | Web Share API wrapper |

---

## 8. Conventions de code

### Patterns à respecter
- **Pas de TypeScript** — JS pur uniquement
- **Pas de commentaires** sauf si le "pourquoi" est non évident
- **Hooks = named exports** (`export function useXxx()`, jamais `export default`)
- **Composants = default export** (`export default function MonComposant()`)
- **Styles = inline React** (pas de classes Tailwind dans les composants poster)
- **Tailwind** uniquement dans les pages et composants non-poster
- **Pas de `overflowWrap: 'break-word'`** sur les titres de templates (casse les mots en milieu de syllabe)
- **`blockStyle(transforms, id)`** à spreader APRÈS les styles du template (pour que les overrides prennent effet)
- **Templates tournoi** : inner div titre lit `transforms?.title?.fontSize ?? scaledTitle(...)` directement

### Sécurité
- Clés API dans `.env.local` uniquement (jamais dans le code)
- Contenu utilisateur sanitisé via `src/lib/sanitize.js` (DOMPurify)
- RLS Supabase active sur toutes les tables
- `updateProfile()` ne touche jamais `role` ni `clubId`

### Performance
- `React.memo` sur `EventCard`
- Lazy loading sur les pages lourdes (AdminPage, PosterStudio variants)
- Realtime Supabase activé uniquement par hook (pas global)
- `useMemo` sur `allEvents`, `allClubs`, `currentUser`

---

## 9. Ce qui est en attente (⬜ backlog)

Voir `docs/BACKLOG.md` pour le détail complet. Points clés non implémentés :

**PosterStudio :**
- `PS-RND-004` — Drag & drop position joueur dans PosterEditor
- `PS-API-002` — Fallback Fal.ai BRIA RMBG 2.0 (si Remove.bg quota épuisé)
- `PS-API-003` — UI quota imports restants (club_ai_usage)
- `PS-LIB-001→004` — Tags, versions, remplacement, dossiers assets joueurs
- `PS-AUDIT-001→004` — Audits UX/perf mobile

**App générale :**
- Photos d'événements (upload + galerie)
- Auto post-match (résultat + affiche auto)
- Offline handling complet (PWA cache Supabase)
- Notifications push : déployées en code mais nécessitent 3 étapes manuelles prod (VAPID keys + migration SQL + Edge Function deploy)
- IA & automatisation (suggestions, génération texte annonces)

**Déploiement prod push notifications :**
```bash
npx web-push generate-vapid-keys  # → .env + Supabase secrets
supabase db push                   # migration push_subscriptions
supabase functions deploy send-push
```

---

## 10. Commandes utiles

```bash
npm run dev          # démarrage dev (port 5173)
npm run build        # build prod (multi-entry: index.html + club-page.html)
npm run test         # vitest run
npm run lint         # eslint
```

---

## 11. Fichiers à ne jamais toucher sans comprendre l'impact

| Fichier | Risque |
|---------|--------|
| `src/contexts/AuthContext.jsx` | Auth + rôles — toute modification peut casser les permissions |
| `src/components/poster/PosterRenderer.jsx` | Rendu affiches + `POSTER_TEMPLATES` + `BASE_DIMS` |
| `src/lib/supabase.js` | Config client — PKCE, realtime off |
| `supabase/migrations/*.sql` | Migrations DB — irréversibles en prod |
| `public/sw.js` | Service Worker PWA |
| `src/components/poster/templates/tourUtils.jsx` | Utilitaires partagés par les 10 templates tournoi |
| `src/components/poster/posterUtils.js` | `blockStyle()` utilisé par TOUS les templates |
