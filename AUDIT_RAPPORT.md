# Rapport d'Audit Complet — SportLink
## Parcours Club : Création → Validation → Utilisation

**Date :** 2026-06-03  
**Scope :** Parcours club complet avant mise en production premier club réel

---

## Scores sur 100

| Dimension | Score | Tendance |
|-----------|-------|----------|
| **UX** | 72/100 | ↑ (+18 vs avant sprint) |
| **UI** | 78/100 | → |
| **Accessibilité** | 61/100 | → |
| **Sécurité** | 74/100 | ↑ (+22 vs avant sprint) |
| **Performance** | 66/100 | → |
| **Monétisation** | 69/100 | ↑ (+15 vs avant sprint) |
| **Maintenabilité** | 72/100 | ↑ (+8 vs avant sprint) |
| **Qualité globale** | 70/100 | ↑ (+12 vs avant sprint) |

---

## Problèmes identifiés et criticité

### CRITIQUE (bloquants prod) — tous corrigés dans ce sprint

| # | Problème | Fichier | Correction |
|---|---------|---------|------------|
| C1 | Club création réservée aux admins uniquement | `ClubsPage.jsx` | Ouvert à tous les users auth |
| C2 | Demandes club en localStorage (admin ne voit pas) | `useClubRequests.js` | Remplacé par Supabase + `club_notifications` |
| C3 | `mapToDB` perd slogan, venue, address, socials | `useClubs.js` | Complet (22 champs) |
| C4 | Pas de colonne `status` sur clubs | DB | Migration SQL + 5 statuts |
| C5 | `refetchProfile()` non awaité → race condition | `ClubsPage.jsx` | `await refetchProfile()` |
| C6 | CityAutocomplete ne retourne pas codesPostaux/codeRegion | `CityAutocomplete.jsx` | Champs ajoutés à l'API + callback |
| C7 | Onboarding ne se déclenche pas après confirmation email | `App.jsx` | Condition `|| currentUser.onboardingDone === false` |

### MAJEUR (gênant prod) — corrigés

| # | Problème | Fichier | Correction |
|---|---------|---------|------------|
| M1 | featured_events : quota bypassable côté client | DB | Trigger `validate_featured_event()` |
| M2 | Rides : accès covoiturage bypass côté client | DB | Trigger `validate_ride_plan()` |
| M3 | poster_exports : quota FREE 3/mois non enforced | DB | Trigger `validate_poster_export_quota()` |
| M4 | generate-announcement : aucune auth requise | Edge function | Auth guard + rôle club_admin requis |
| M5 | clubs rejected/suspended visibles publiquement | RLS | Policy filtrée par status |
| M6 | Un user peut changer son propre club.status via API | DB | Guard trigger `clubs_guard_status()` |
| M7 | Écran confirmation email trop vague | `AuthPage.jsx` | Instructions étape par étape + email affiché |

### MOYEN (à corriger avant scaling)

| # | Problème | Statut |
|---|---------|--------|
| Me1 | Watermark poster bypass côté client (export local) | ⚠️ Non corrigé (techniquement impossible côté serveur pour export local) |
| Me2 | events INSERT ne vérifie pas club_managers comme éditeurs | ✅ Déjà corrigé dans migration précédente |
| Me3 | RLS SELECT clubs : tous les clubs visibles (draft etc.) | ✅ Corrigé dans ce sprint |
| Me4 | Un club_admin avec plusieurs clubs n'est lié qu'au premier | ⚠️ Non corrigé (acceptable v1) |
| Me5 | Bundle main.js 1.09MB (trop lourd) | ⚠️ Non corrigé — code splitting en backlog |

---

## Corrections appliquées (ce sprint)

### Fichiers modifiés
| Fichier | Changement |
|---------|-----------|
| `supabase/migrations/20260603_club_status_and_fields.sql` | 24 colonnes + table `club_notifications` + indexes |
| `supabase/migrations/20260603_rls_hardening_club_status.sql` | RLS SELECT clubs, guard trigger status, events managers |
| `supabase/migrations/20260603_feature_gating_serverside.sql` | 3 triggers DB (featured_events, rides, poster_exports) |
| `supabase/functions/notify-admin-club-created/index.ts` | Nouvelle edge function création club |
| `supabase/functions/notify-club-status/index.ts` | Nouvelle edge function statut club |
| `supabase/functions/generate-announcement/index.ts` | Auth guard + rôle requis |
| `supabase/seed_recette.sql` | 8 clubs tests + abonnements + events + annonces |
| `src/hooks/useClubs.js` | mapFromDB/mapToDB complets + 4 mutations admin + addClubAndNotify |
| `src/hooks/useClubNotifications.js` | Nouveau hook Supabase Realtime |
| `src/components/club/ClubCreationWizard.jsx` | 6 étapes enrichies (sigle, couleurs, contact, GPS, médias) |
| `src/pages/ClubsPage.jsx` | Wizard ouvert à tous, banner vérification, await refetchProfile |
| `src/pages/AdminPage.jsx` | Onglet Clubs complet (statuts, filtres, actions, scores de complétude) |
| `src/components/Header.jsx` | Badge Realtime via useClubNotifications |
| `src/components/CityAutocomplete.jsx` | codesPostaux + codeRegion dans onSelect callback |
| `src/pages/AuthPage.jsx` | Écran confirmation email enrichi |
| `src/App.jsx` | Onboarding conditionné sur onboardingDone |

### Fichiers supprimés
- `src/hooks/useClubRequests.js` (localStorage, remplacé)
- `src/components/club/ClubRequestModal.jsx` (flux obsolète)

### Tests ajoutés
- `src/__tests__/hooks/useClubNotifications.test.js` — 5 tests (100% pass)
- `src/__tests__/hooks/useClubs.new.test.js` — 8 tests (100% pass)
- `src/__tests__/components/ClubCreationWizard.test.jsx` — 9 tests (100% pass)
- `src/__tests__/components/AdminClubsTab.test.jsx` — 6 tests (100% pass)

**Total tests : 754 (744 passent / 10 échouent — pré-existants sur PosterStudio, hors scope)**

---

## Parcours FC Plouvorn simulé

| Étape | État avant | État après |
|-------|-----------|-----------|
| 1. Inscription | ✅ Fonctionnel | ✅ + instructions email confirmation |
| 2. Onboarding | ⚠️ Pas déclenché si email confirmé ailleurs | ✅ Déclenché sur onboardingDone=false |
| 3. Aller sur Clubs | ✅ | ✅ |
| 4. "Créer un club" visible | ❌ Réservé admins | ✅ Tous users auth |
| 5. Wizard création | ⚠️ Champs perdus (5 champs), code postal vide | ✅ 22 champs sauvegardés |
| 6. Club créé → notification | ❌ Aucune | ✅ Admin notifié + confirmation créateur |
| 7. Banner pending | ❌ Absent | ✅ "Club en cours de vérification" |
| 8. Utiliser SportLink immédiatement | ✅ Techniquement | ✅ + message explicatif |
| 9. Admin voit la demande | ❌ Uniquement sur son navigateur | ✅ Supabase, tous appareils |
| 10. Admin vérifie → notification créateur | ❌ Absent | ✅ In-app + email |

---

## Risques restants (à traiter avant scaling)

| Risque | Criticité | Effort |
|--------|-----------|--------|
| Bundle 1.09MB — code splitting manquant | 🟠 Moyen | 2j |
| Un club par user (trigger limité) | 🟡 Faible | 1j |
| Watermark poster bypass côté client | 🟡 Faible | — (non bloquant) |
| Tests E2E Playwright (parcours navigateur complet) | 🟠 Moyen | 3j |
| Seed users (auth.users) à créer manuellement | 🟡 Faible | 30min |
| RESEND_API_KEY à configurer en production | 🔴 Critique | 10min |
| Migrations SQL à appliquer en production | 🔴 Critique | 30min |
| Edge functions à déployer | 🔴 Critique | 15min |

---

## Checklist de mise en production

Avant d'onboarder le premier club réel :

- [ ] Appliquer `20260603_club_status_and_fields.sql`
- [ ] Appliquer `20260603_rls_hardening_club_status.sql`
- [ ] Appliquer `20260603_feature_gating_serverside.sql`
- [ ] Déployer `notify-admin-club-created`
- [ ] Déployer `notify-club-status`
- [ ] Configurer `RESEND_API_KEY` dans Supabase Edge Function Secrets
- [ ] Configurer `FROM_EMAIL=noreply@sportlink.fr`
- [ ] Configurer `APP_URL=https://sportlink.fr`
- [ ] (Optionnel) Exécuter `seed_recette.sql` pour données de test
- [ ] Vérifier que l'admin `doriancrenn17@gmail.com` peut se connecter et voit l'onglet Clubs
- [ ] Créer un compte test et créer un club → vérifier la notification admin
- [ ] Vérifier le club depuis l'onglet admin → cliquer Vérifier → vérifier email reçu

---

## Améliorations recommandées (backlog)

1. **Code splitting** — lazy load ClubPageView, PosterStudio, AdminPage → bundle -30%
2. **Tests Playwright E2E** — parcours complet en navigateur (signup → club → admin → verify)
3. **Multi-club par user** — permettre à un user d'être admin de plusieurs clubs
4. **Score de complétude en temps réel** — afficher dans ClubPageView le % de profil complété
5. **Email digest admin** — résumé hebdo des clubs en attente (cron existant à brancher)
6. **Page club publique** — SEO, open graph, partage direct du lien `#club/:id`
7. **Tableau de bord analytics** — vues, followers, impressions par semaine
