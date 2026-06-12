# SportLink — QA Registry

> Registre vivant de la couverture qualité. Mis à jour après chaque sprint.
> Dernière mise à jour : 2026-06-11 (Sprint QA complet)

---

## Pages

| Page | Tab / Route | Composant | Criticité | Tests unitaires | Tests E2E | Responsive | Visuel |
|------|------------|-----------|-----------|----------------|-----------|------------|--------|
| Accueil | `home` | `HomePage.jsx` | P0 | ⬜ | `home.spec.js` ✅ | ✅ 6/6 | ✅ |
| Carte | `map` | `MapPage.jsx` | P0 | `MapPage.test.jsx` ✅ | `navigation.spec.js` ✅ | ✅ 6/6 | ✅ |
| Favoris | `favoris` | `FavorisPage.jsx` | P1 | `FavorisPage.test.jsx` ✅ | `favoris.spec.js` ✅ | ✅ | ⬜ |
| Actualités | `home` (connecté) | `ActualitesPage.jsx` | P1 | ⬜ | `news.spec.js` ✅ | ✅ 6/6 | ✅ |
| Clubs | `clubs` | `ClubsPage.jsx` | P0 | ⬜ | `clubs.spec.js` ✅ | ✅ 6/6 | ✅ |
| Profil | `profil` | `ProfilPage.jsx` | P1 | ⬜ | `profil.spec.js` ✅ | ✅ | ⬜ |
| Authentification | overlay | `AuthPage.jsx` | P0 | `AuthPage.test.jsx` ✅ | `auth.spec.js` ✅ | ✅ | ⬜ |
| Admin | `admin` | `AdminPage.jsx` | P1 | ⬜ | `admin.spec.js` ✅ | ✅ | ⬜ |
| Covoiturage | lazy | `MyRidesPage.jsx` | P1 | ⬜ | `carpooling.spec.js` ✅ | ⬜ | ⬜ |
| Entraînements | lazy | `TrainingManagerPage.jsx` | P2 | ⬜ | `trainings.spec.js` ⬜ | ⬜ | ⬜ |
| Aide / FAQ | lazy | `HelpPage.jsx` | P2 | `HelpFab.test.jsx` ✅ | ⬜ | ⬜ | ⬜ |
| Onboarding sports | lazy | `OnboardingPage.jsx` | P1 | ⬜ | ⬜ | ⬜ | ⬜ |
| Légal | `/legal` | `LegalPage.jsx` | P3 | ⬜ | ⬜ | ⬜ | ⬜ |

### Overlays / Modales critiques

| Composant | Déclencheur | Criticité | Tests unitaires | Tests E2E |
|-----------|------------|-----------|----------------|----------|
| `ClubPageView.jsx` | `#club/:id` | P0 | `ClubPageView.test.jsx` ✅ | `clubs.spec.js` ✅ |
| `EventFormModal.jsx` | bouton création | P0 | `EventFormModal.test.jsx` ✅ | `event-creation.spec.js` ✅ |
| `PosterStudio.jsx` | depuis EventCard | P0 | `PosterStudio.test.jsx` ✅ | `poster-studio.spec.js` ✅ |
| `CSVImportModal.jsx` | import joueurs | P2 | ⬜ | `csv-import.spec.js` ⬜ |
| `ClubCreationWizard.jsx` | nouveau club | P0 | `ClubCreationWizard.test.jsx` ✅ | `club-creation.spec.js` ✅ |
| `BadgeUnlockModal.jsx` | débloquage XP | P2 | ⬜ | ⬜ |
| `AnnouncementsCenter.jsx` | menu annonces | P1 | ⬜ | `announcements.spec.js` ✅ |

---

## Workflows Métiers

| # | Workflow | Criticité | Fichier test | État |
|---|---------|-----------|-------------|------|
| 1 | Création de compte (email) | P0 | `auth.spec.js` | ✅ |
| 2 | Connexion Google OAuth | P0 | `auth.spec.js` | ✅ |
| 3 | Connexion email/password | P0 | `auth.spec.js` | ✅ |
| 4 | Navigation entre 5 tabs | P0 | `navigation.spec.js` | ✅ |
| 5 | Création événement (match) | P0 | `event-creation.spec.js` | ✅ |
| 6 | Modification événement | P0 | `event-creation.spec.js` | ✅ |
| 7 | Suppression événement | P1 | `event-creation.spec.js` | ✅ |
| 8 | Duplication événement | P2 | `event-creation.spec.js` | ⬜ |
| 9 | Création club (wizard) | P0 | `club-creation.spec.js` | ✅ |
| 10 | Modification page club | P1 | `club-creation.spec.js` | ✅ |
| 11 | Suivi / unfollow club | P1 | `clubs.spec.js` | ✅ |
| 12 | Envoi convocation | P1 | `convocations.spec.js` | ✅ |
| 13 | Réponse convocation (joueur) | P1 | `convocations.spec.js` | ✅ |
| 14 | Saisie présences événement | P1 | `convocations.spec.js` | ✅ |
| 15 | Création trajet covoiturage | P1 | `carpooling.spec.js` | ✅ |
| 16 | Demande passager | P1 | `carpooling.spec.js` | ✅ |
| 17 | Validation conducteur | P1 | `carpooling.spec.js` | ✅ |
| 18 | Envoi annonce club | P1 | `announcements.spec.js` | ✅ |
| 19 | Programmation annonce | P2 | `announcements.spec.js` | ⬜ |
| 20 | Ajout favori | P1 | `favoris.spec.js` | ✅ |
| 21 | "J'y serai" (présence) | P1 | `event-creation.spec.js` | ✅ |
| 22 | Commentaire événement | P1 | `event-creation.spec.js` | ✅ |
| 23 | Réaction emoji événement | P1 | `event-creation.spec.js` | ✅ |
| 24 | Prédiction événement | P2 | Manuel | ⬜ |
| 25 | Photos événements | P2 | Manuel | ⬜ |
| 26 | PosterStudio — ouverture | P0 | `poster-studio.spec.js` | ✅ |
| 27 | PosterStudio — création affiche | P0 | `poster-studio.spec.js` | ✅ |
| 28 | PosterStudio — export PNG | P0 | `poster-studio.spec.js` | ✅ |
| 29 | PosterStudio — partage | P1 | `poster-studio.spec.js` | ✅ |
| 30 | Import joueurs CSV | P2 | `csv-import.spec.js` | ⬜ |
| 31 | Suppression arrière-plan | P2 | `poster-studio.spec.js` | ✅ |
| 32 | Création session entraînement | P2 | `trainings.spec.js` | ⬜ |
| 33 | Saisie présences entraînement | P2 | `trainings.spec.js` | ⬜ |
| 34 | Dashboard club (stats) | P1 | `clubs.spec.js` | ✅ |
| 35 | Dashboard admin (vue globale) | P1 | `admin.spec.js` | ✅ |
| 36 | Validation club (admin) | P2 | `admin.spec.js` | ✅ |
| 37 | Gestion sports (admin) | P2 | `admin.spec.js` | ✅ |
| 38 | Gestion utilisateurs (admin) | P2 | `admin.spec.js` | ✅ |
| 39 | Abonnement plan | P2 | Manuel | ⬜ |
| 40 | Flux affiche résultat (AUTO-001) | P1 | `poster-studio.spec.js` | ✅ |
| 41 | Démo Président | P0 | `demo-sandbox.spec.js` | ✅ |
| 42 | Démo Coach | P0 | `demo-sandbox.spec.js` | ✅ |
| 43 | Démo Parent | P1 | `demo-sandbox.spec.js` | ✅ |
| 44 | Démo Communication | P1 | `demo-sandbox.spec.js` | ✅ |
| 45 | Démo Joueur | P1 | `demo-sandbox.spec.js` | ✅ |
| 46 | Démo Supporter | P1 | `demo-sandbox.spec.js` | ✅ |
| 47 | Sandbox libre | P0 | `demo-sandbox.spec.js` | ✅ |
| 48 | ActualitesPage — flux Absent parent | P1 | `news.spec.js` | ✅ |
| 49 | ActualitesPage — flux Présent + transport | P1 | `news.spec.js` | ✅ |
| 50 | ActualitesPage — covoiturage conducteur | P1 | `news.spec.js` | ✅ |
| 51 | ActualitesPage — covoiturage passager | P1 | `news.spec.js` | ✅ |
| 52 | ActualitesPage — Multiplex live visible | P1 | `news.spec.js` | ✅ |
| 53 | ActualitesPage — score auto-incrémenté (setInterval) | P1 | `news.spec.js` | ✅ |
| 54 | ActualitesPage — zéro crash tous profils | P1 | `news.spec.js` | ✅ |

---

## Composants — État de Couverture

### Composants avec tests ✅

| Composant | Fichier test | Nb tests |
|-----------|-------------|---------|
| `AdminClubsTab` | `AdminClubsTab.test.jsx` ✅ | ~5 |
| `BottomNav` | `BottomNav.test.jsx` ✅ | ~5 |
| `ClubCreationWizard` | `ClubCreationWizard.test.jsx` ✅ | ~5 |
| `ClubPageView` | `ClubPageView.test.jsx` ✅ | **11** ← nouveau |
| `ClubPublicPage` | `ClubPublicPage.test.jsx` ✅ | ~15 |
| `ErrorBoundary` | `ErrorBoundary.test.jsx` ✅ | ~5 |
| `EventCard` | `EventCard.test.jsx` ✅ | ~8 |
| `EventFormModal` | `EventFormModal.test.jsx` ✅ | ~8 |
| `HelpFab` | `HelpFab.test.jsx` ✅ | ~3 |
| `MapPage` | `MapPage.test.jsx` ✅ | ~8 |
| `MatchesTab` | `MatchesTab.test.jsx` ✅ | ~5 |
| `OfflineBanner` | `OfflineBanner.test.jsx` ✅ | ~3 |
| `PosterRenderer` | `PosterRenderer.test.jsx` ✅ | **17** ← nouveau |
| `PosterShareBtn` | `PosterShareBtn.test.jsx` ✅ | ~3 |
| `PosterStudio` | `PosterStudio.test.jsx` ✅ | **7** ← nouveau |
| `PosterWizard` | `PosterWizard.test.jsx` ✅ | ~5 |
| `PushNotificationToggle` | `PushNotificationToggle.test.jsx` ✅ | ~3 |

### Composants sans tests ⬜ (restants)

| Composant | Criticité |
|-----------|-----------|
| `AnnouncementsCenter.jsx` | P1 |
| `ClubDashboard.jsx` | P1 |
| `ClubFormModal.jsx` | P1 |
| `ConvocationsList.jsx` | P1 |
| `Header.jsx` | P1 |
| `RideSection.jsx` | P1 |

---

## Hooks — État de Couverture

### Hooks avec tests ✅ (30/59)

| Hook | Tests |
|------|-------|
| `useActiveClubs` | ✅ |
| `useAttendees` | ✅ **nouveau** |
| `useClubBrandKit` | ✅ |
| `useClubById` | ✅ |
| `useClubChallenges` | ✅ |
| `useClubFeatures` | ✅ |
| `useClubLeaderboard` | ✅ |
| `useClubNotifications` | ✅ |
| `useClubPage` | ✅ |
| `useClubPlan` | ✅ |
| `useClubs` | ✅ |
| `useEventComments` | ✅ |
| `useEventReactions` | ✅ |
| `useFavorites` | ✅ |
| `useFeedback` | ✅ |
| `useFilteredEvents` | ✅ |
| `useFormDraft` | ✅ |
| `useLocalEvents` | ✅ **enrichi** |
| `useManagedClubs` | ✅ |
| `useMatchesForDate` | ✅ |
| `useNewsFeed` | ✅ |
| `usePosterAI` | ✅ |
| `usePosterAssets` | ✅ |
| `usePosterDraft` | ✅ |
| `usePosterExport` | ✅ |
| `usePushNotifications` | ✅ |
| `useShare` | ✅ |
| `useStability` | ✅ |
| `useUpcomingFavorites` | ✅ |
| `useBadges` | ✅ |

### Hooks sans tests ⬜ (29 restants — prioritaires)

| Hook | Criticité |
|------|-----------|
| `useClubAnnouncements` | P1 |
| `useClubDashboard` | P1 |
| `useClubEvents` | P1 |
| `useClubManagers` | P1 |
| `useClubMatches` | P1 |
| `useClubMedia` | P1 |
| `useEventConvocations` | P1 |
| `useMyConvocations` | P1 |
| `useRides` | P1 |
| `useRideNotifications` | P1 |
| `useMyAnnouncements` | P1 |
| `useClubPlayers` | P2 |
| `useClubStats` | P2 |
| `useTrainingSessions` | P2 |
| `useTrainingAttendance` | P2 |

---

## Responsive — Résultats par Page

| Page | iPhone SE (375) | iPhone 15 (393) | Desktop 1440 | Dernier test |
|------|----------------|----------------|-------------|-------------|
| HomePage | ✅ | ✅ | ✅ | 2026-06-11 |
| MapPage | ✅ | ✅ | ✅ | 2026-06-11 |
| ClubsPage | ✅ | ✅ | ✅ (grille) | 2026-06-11 |
| FavorisPage | ✅ | ⬜ | ⬜ | 2026-06-11 |
| ProfilPage/Auth | ✅ | ⬜ | ⬜ | 2026-06-11 |
| ClubPageView | ⬜ | ⬜ | ⬜ | Jamais |
| PosterStudio | ⬜ | ⬜ | ⬜ | Jamais |
| AdminPage | N/A | N/A | ✅ | 2026-06-11 |

---

## Tests Visuels — Captures de Référence

**Fichier** : `e2e/visual/visual.spec.js` — **22 baselines** dans `e2e/screenshots/visual/`
**Commande** : `npm run test:visual` / `npm run test:visual:update`

| # | Screenshot | Appareil | Baseline | Dernier résultat |
|---|-----------|---------|---------|-----------------|
| VIS-01 | Accueil | iPhone SE (375) | ✅ | 2026-06-12 |
| VIS-02 | Carte | iPhone SE (375) | ✅ | 2026-06-12 |
| VIS-03 | Clubs | iPhone SE (375) | ✅ | 2026-06-12 |
| VIS-04 | Favoris | iPhone SE (375) | ✅ | 2026-06-12 |
| VIS-05 | Auth | iPhone SE (375) | ✅ | 2026-06-12 |
| VIS-06 | BottomNav | iPhone SE (375) | ✅ | 2026-06-12 |
| VIS-10 | Accueil | iPhone 15 (393) | ✅ | 2026-06-12 |
| VIS-11 | Clubs | iPhone 15 (393) | ✅ | 2026-06-12 |
| VIS-12 | Carte | iPhone 15 (393) | ✅ | 2026-06-12 |
| VIS-20 | Accueil | Desktop 1440 | ✅ | 2026-06-12 |
| VIS-21 | Clubs (grille 4 col) | Desktop 1440 | ✅ | 2026-06-12 |
| VIS-22 | Carte + sidebar | Desktop 1440 | ✅ | 2026-06-12 |
| VIS-23 | Auth | Desktop 1440 | ✅ | 2026-06-12 |
| VIS-30 | Auth page | iPhone SE | ✅ | 2026-06-12 |
| VIS-31 | Hero section | iPhone SE | ✅ | 2026-06-12 |
| VIS-32 | BottomNav (3 états) | iPhone SE | ✅ | 2026-06-12 |
| VIS-40 | Accueil | Galaxy S22 (360) | ✅ | 2026-06-12 |
| VIS-41 | Clubs | Galaxy S22 (360) | ✅ | 2026-06-12 |
| VIS-50 | Accueil | Desktop 1920 | ✅ | 2026-06-12 |
| VIS-51 | Clubs (grille large) | Desktop 1920 | ✅ | 2026-06-12 |

**Tolérance** : 0.4% de pixels différents. Toute régression visuelle bloque.

---

## Légende

- ✅ Couvert et passant
- ⚠️ Partiel ou fragile
- ⬜ Non couvert
- 🔴 Cassé

---

## Historique des mises à jour

| Date | Sprint | Changements |
|------|--------|------------|
| 2026-06-11 | Init | Création du registre — couverture initiale évaluée |
| 2026-06-11 | QA Sprint 1 | +4 fichiers tests (ClubPageView, PosterRenderer, PosterStudio, useAttendees), useLocalEvents enrichi, E2E pages manquantes, bundle -228kB, vercel.json SPA fix |
| 2026-06-12 | QA Sprint 2 (Option A) | +16 fichiers tests : Header, ConvocationsList, RideSection, ClubDashboard, ClubFormModal, AnnouncementsCenter + 9 hooks P1 (useClubAnnouncements, useClubEvents, useRides, useClubManagers, useEventConvocations, useMyConvocations, useRideNotifications, useClubMatches, useMyAnnouncements) + 7 tests a11y + fix OfflineBanner. 93 fichiers / 1115 tests. Bundle page-clubs -86kB. |
