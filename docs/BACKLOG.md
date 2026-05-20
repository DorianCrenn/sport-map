# SportLink — Backlog Technique & Produit
> Document vivant — mis à jour au fil des sprints  
> Dernière mise à jour : 2026-05-20

---

## Légende

| Symbole | Criticité |
|---------|-----------|
| 🔴 | Critique — bloquant ou faille sécurité |
| 🟠 | Haute — bug impactant ou dette majeure |
| 🟡 | Moyenne — amélioration notable |
| 🟢 | Faible — nice-to-have, polish |

| Taille | Complexité estimée |
|--------|--------------------|
| XS | < 1h |
| S | 1–4h |
| M | 4–8h (1 jour) |
| L | 2–3 jours |
| XL | 1 semaine+ |

| Statut | Signification |
|--------|---------------|
| ✅ | Implémenté |
| 🔄 | En cours |
| ⬜ | À faire |
| ❌ | Bloqué |

---

## ✅ FONCTIONNALITÉS RÉALISÉES

| Feature | Date | Notes |
|---------|------|-------|
| Système de thème dark/light | 2026-05 | CSS vars complètes, toggle dans header |
| Pages clubs — éditeur de blocs | 2026-05 | Drag & drop, 8 types de blocs, typographie |
| Système covoiturage | 2026-05 | Création, demandes, notifications realtime, MyRidesPage |
| Communication clubs → abonnés | 2026-05 | Annonces, ciblage équipes, AnnouncementsCenter |
| Système "J'y serai" avec compteurs | 2026-05 | Realtime, view aggregée |
| Favoris avec suivi équipes spécifiques | 2026-05 | FollowModal, team targeting notifications |
| Générateur d'affiches (PosterStudio) | 2026-05 | Génération SVG, export image |
| Analytics clubs (ClubDashboard) | 2026-05 | Vues de page, stats événements |
| Notifications covoiturage (temps réel) | 2026-05 | Badge header + profil, MyRidesPage |
| Notifications annonces clubs (temps réel) | 2026-05 | Cloche header, AnnouncementsCenter |
| Éditeur événement : types + équipes | 2026-05 | eventType radio, teamName, category |
| Autocomplete lieu (Photon/OSM) | 2026-05 | VenueAutocomplete, sans clé API |
| Partage deeplinks club/événement | 2026-05 | #club/:id, #event/:id, Web Share API |
| Réactions sur événements | 2026-05 | EventReactions.jsx + useEventReactions hook |
| Commentaires sur événements | 2026-05 | EventComments.jsx + useEventComments hook, 10 tests |
| UX-003 Onboarding aha moment | 2026-05 | Bannière sport contextuelle post-onboarding sur MapPage |
| PROD-003 Score live + fil actualité | 2026-05 | NewsPage Realtime, score updates, feed clubs suivis |
| QA Audit hooks critiques | 2026-05 | useLocalEvents + useClubs réécrits, 14 tests, 10 bugs corrigés |

---

## P0 — Stabilisation critique (AVANT toute grosse évolution)

### EPIC-P0-1 🔴 Refonte Auth / RBAC / Sécurité
- **Objectif** : Zéro faille permissions. Perte de confiance → abandon total du produit.
- **Sous-tâches** :
  - ✅ SEC-001 — Clé Supabase hors du repo (`.env.local`)
  - ✅ SEC-002 — RLS `club_managers` (fuite emails)
  - ✅ SEC-003 — `events_insert` restreint aux admins/club_admins
  - ✅ SEC-004 — Retirer `role`/`clubId` de `updateProfile` + trigger BEFORE UPDATE SECURITY DEFINER
  - ✅ BUG-001 — Rôle admin cassé sur cold start (retry 5×500ms + failsafe 8s dans AuthContext.jsx)
  - ✅ BUG-002 — Policies SQL en conflit (`schema.sql` vs `rls_policies.sql`)
  - ✅ — Vérifier RLS sur toutes les tables (rides, announcements, club_pages, club_trainings)
  - ✅ — Vérifier permissions upload/storage Supabase (aucun bucket utilisé — images via URL externe)
  - ✅ — Vérifier accès modification clubs/events côté API (trigger SECURITY DEFINER + RLS policies)
  - ✅ — Vérifier persistance sessions + expiry tokens (onAuthStateChange + TOKEN_REFRESHED handler)

---

### SEC-001 🔴 Clé Supabase hardcodée dans le repo Git
- **Catégorie** : Sécurité
- **Complexité** : XS
- **Problème** : `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont en clair dans `src/lib/supabase.js`, commités dans l'historique Git.
- **Impact business** : Quota Supabase épuisable, données exposées, non-conformité RGPD.
- **Solution** : Créer `.env.local`, utiliser `import.meta.env.VITE_SUPABASE_URL`. Ajouter `.env.local` au `.gitignore`. Documenter dans `.env.example`.

---

### SEC-002 🔴 Table `club_managers` sans RLS
- **Catégorie** : Sécurité / Supabase
- **Complexité** : XS
- **Problème** : N'importe qui peut lire les emails de tous les managers via l'API Supabase directe.
- **Impact business** : Fuite RGPD, perte de confiance des clubs.
- **Solution** :
  ```sql
  ALTER TABLE club_managers ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "managers_select_owner" ON club_managers FOR SELECT
    USING (EXISTS (SELECT 1 FROM clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
  CREATE POLICY "managers_insert_owner" ON club_managers FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid()));
  CREATE POLICY "managers_delete_owner" ON club_managers FOR DELETE
    USING (EXISTS (SELECT 1 FROM clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid()));
  ```

---

### SEC-003 🔴 `events_insert` ouvert à tous les utilisateurs authentifiés
- **Catégorie** : Sécurité / RBAC
- **Complexité** : XS
- **Problème** : N'importe quel compte peut créer des événements via l'API directe, contournant le garde `canAddEvent` du frontend.
- **Solution** :
  ```sql
  DROP POLICY IF EXISTS "events_insert_authenticated" ON events;
  CREATE POLICY "events_insert_admin_or_club" ON events FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','club_admin'))
  );
  ```

---

### BUG-001 ✅ Rôle admin cassé après connexion sur Supabase cold start
- **Catégorie** : Auth / Bug
- **Complexité** : S
- **Problème** : Timeout 5s expirait sur cold start → `setProfile(null)` → rôle = 'user'.
- **Solution appliquée** : Retry 5×500ms + failsafe 8s dans `AuthContext.jsx`, upsert si trigger échoue.

---

### SEC-004 🔴 Escalade de rôle via `updateProfile`
- **Catégorie** : Sécurité / RBAC
- **Complexité** : XS
- **Problème** : `updateProfile()` inclut `role` dans son mapping. Un utilisateur pourrait appeler `updateProfile({ role: 'admin' })`.
- **Solution** : Retirer `role` et `clubId` du mapping `updateProfile`.

---

### BUG-002 🔴 Policies SQL en conflit entre `schema.sql` et `rls_policies.sql`
- **Catégorie** : Supabase / Sécurité
- **Complexité** : M
- **Problème** : `profiles_select_public (USING true)` et `profiles_select_own_or_admin` coexistent et s'OR-ent → tout le monde lit tous les profils.
- **Solution** : Consolider en un seul `supabase/policies.sql` idempotent avec `DROP POLICY IF EXISTS` exhaustifs.

---

### EPIC-P0-2 🔴 Audit complet base de données
- **Objectif** : Les équipes doivent devenir de vraies entités persistées, réutilisables partout.
- **Sous-tâches** :
  - ✅ Vérifier sauvegarde équipes (JSONB dans `clubs.categories` — fonctionnel)
  - ✅ Vérifier sauvegarde événements (cohérence `user_id`, `club_id` — validé en seed.sql)
  - ✅ Vérifier sauvegarde favoris (Supabase source of truth + localStorage fallback)
  - ✅ Vérifier sauvegarde pages clubs (`club_pages` JSONB — RLS en place)
  - ✅ ARCH-001 — Migration données statiques `events.js`/`clubs.js` → seed SQL
  - ✅ PERF-006 — Table `club_follows` dédiée (créée dans `sportlink_full_migration.sql`)
  - ✅ Cohérence relations SQL + intégrité référentielle (seed.sql + `ON CONFLICT (static_id) DO NOTHING`)

---

### ARCH-001 🟠 Double source de vérité : données statiques + Supabase
- **Catégorie** : Architecture / Backend
- **Complexité** : L
- **Problème** : `src/data/events.js` et `src/data/clubs.js` coexistent avec les tables Supabase. IDs statiques vs UUID se mélangent.
- **Solution** : Migrer les données statiques en `supabase/seed.sql`. Supprimer les fichiers `data/`.

---

### EPIC-P0-3 🔴 Audit Mobile / Responsive
- **Objectif** : Application utilisable à une main, fluide, moderne.
- **Sous-tâches** :
  - ✅ MOBILE-001 — Safe-area insets systématiques (Dynamic Island iOS)
  - ✅ MOBILE-002 — Scroll imbriqués iOS Safari (`overscroll-behavior: contain`)
  - ✅ MOBILE-003 — Tap targets minimum 44px sur tous les boutons
  - ✅ Débordements textes dans EventCard et MobileEventSheet
  - ✅ Bottom sheet snap points progressifs (UX-002) — peek/detail/full déjà implémenté
  - 🔄 Boutons inaccessibles / trop petits sur Android/iOS
  - ✅ Overflow map sur petits écrans
  - ✅ Problèmes tablette (layout 768px+)

---

### MOBILE-001 🟡 Safe-area insets non systématiques
- **Catégorie** : Mobile / UX
- **Complexité** : S
- **Solution** : CSS var globale `--safe-bottom: env(safe-area-inset-bottom, 0px)` sur tous les composants avec `bottom: 0`.

---

### MOBILE-002 🟡 Scroll imbriqués sur iOS Safari
- **Catégorie** : Mobile / UX
- **Complexité** : S
- **Solution** : `overscroll-behavior: contain` sur conteneurs enfants. `touch-action: pan-y` pour bloquer le parent.

---

### MOBILE-003 🟡 Tap targets inférieurs à 44px
- **Catégorie** : Accessibilité / Mobile
- **Complexité** : S
- **Solution** : `min-width: 44px; min-height: 44px` sur tous les boutons d'action.

---

## P1 — Rendre l'application indispensable pour les clubs

### EPIC-P1-1 🟠 Refonte création d'événements intelligente
- **Objectif** : Créer un événement en moins de 15 secondes.
- **Criticité** : HAUTE — frein à l'adoption par les clubs
- **Complexité** : L
- **À faire** :
  - ✅ Pré-remplissage depuis contexte (sport, club, équipe, niveau) — buildDefaults() dans EventFormModal
  - ✅ Auto-sélection équipe/niveau depuis le profil club_admin — première équipe auto-sélectionnée
  - ✅ Aide saisie lieu avancée — VenueAutocomplete (Photon/OSM) déjà implémenté
  - ✅ Logique domicile/extérieur automatique — champ homeOrAway avec club auto
  - ✅ Sélection rapide adversaire — `AdversaireField` avec dropdown de clubs du même sport
  - ✅ Saisie score rapide post-match — QuickScoreEdit déjà implémenté
  - ✅ Duplication événement — bouton ⎘ dans EventCard, modal pré-rempli date vide
- **Note** : eventType (championship/cup/friendly) + teamName + category déjà implémentés ✅

---

### BUG-003 ✅ `updateEvent` réassigne le `user_id` de l'event
- **Catégorie** : Backend / Bug
- **Complexité** : XS
- **Solution appliquée** : `useLocalEvents.js` ligne 105 — `mapToDB({ ...prev, ...data }, prev?.userId)` conserve le userId original.

---

### BUG-004 ✅ Channel Realtime avec nom aléatoire — fuites de connexions
- **Catégorie** : Performance / Supabase
- **Complexité** : XS
- **Solution appliquée** : `useLocalEvents.js` ligne 63 — `.channel('events-realtime')` nom fixe.

---

### PERF-001 ✅ `currentUser` recréé à chaque render d'AuthProvider
- **Catégorie** : Performance / React
- **Complexité** : XS
- **Solution appliquée** : `AuthContext.jsx` ligne 295 — `useMemo(() => mapProfile(authUser, profile), [authUser, profile])`.

---

### BUG-005 ✅ `bulkAddEvents` : import CSV séquentiel, bloquant
- **Catégorie** : Performance / UX
- **Complexité** : S
- **Solution appliquée** : `useLocalEvents.js` — `addEventsBatch` insère en batch unique via `supabase.from('events').insert(rows).select()`.

---

### SEC-005 ✅ `attendees_select_public` — données personnelles exposées
- **Catégorie** : Sécurité / RGPD
- **Complexité** : S
- **Solution appliquée** : `sportlink_full_migration.sql` — policy `attendees_select_own` + view `event_attendee_counts` SECURITY DEFINER.

---

### PERF-002 ✅ `event_attendee_counts` view sans SECURITY DEFINER
- **Catégorie** : Supabase / Performance
- **Complexité** : S
- **Solution appliquée** : `sportlink_full_migration.sql` — `CREATE VIEW event_attendee_counts WITH (security_invoker = false)` + `GRANT SELECT TO anon, authenticated`.

---

### UX-001 ✅ Feedback visuel manquant sur actions utilisateur
- **Catégorie** : UX/UI
- **Complexité** : M
- **Solution appliquée** : Système de toasts React context (ToastContext) — connexion, favori, covoiturage, annonces, modifications événements.

---

### BUG-006 ✅ Dark mode incomplet — AdminPage hardcodée
- **Catégorie** : Frontend / UX
- **Complexité** : M
- **Solution** : Remplacer `bg-white`, `text-gray-800` par `var(--sl-card)`, `var(--sl-t1)`.
- **Résolu** : Réécriture complète de `AdminPage.jsx` avec CSS vars `var(--sl-*)` partout.

---

### EPIC-P1-2 ✅ Pages clubs — mini sites officiels modernes
- **Objectif** : Transformer chaque page club en vitrine professionnelle.
- **Note** : Éditeur de blocs + drag & drop + typographie déjà implémentés ✅
- **Sous-tâches** :
  - ✅ Thèmes de couleurs par club (palette primaire/secondaire) — `theme.primary` + `theme.accent` dans `club_pages`
  - ✅ Bloc sponsors avec logos + liens — `SponsorsBlock.jsx`
  - ✅ Bloc "Prochain match" automatique — `NextMatchBlock.jsx`
  - ✅ Lien public avec OpenGraph — dynamic `<title>` + `og:*` meta injection
  - ✅ Mode Simple (sections en 1 clic) vs Mode Avancé (blocs complets) — UX-004

---

### EPIC-P1-3 ✅ Générateur d'affiches premium
- **Objectif** : Énorme valeur perçue — les clubs partagent, SportLink devient visible.
- **Note** : PosterStudio de base existe ✅, 22 templates au total
- **Sous-tâches** :
  - ✅ 5 nouveaux templates premium : Strike, Glass, Flag, Ink, Aurora
  - ✅ Export format Story Instagram (1080×1920) + Post (1080×1350) — `pixelRatio: 3` sur base 360×640
  - ✅ Génération HD — export `toBlob({ pixelRatio: 3 })` via html-to-image
  - ✅ Éditeur drag & drop textes/logos dans l'affiche — `PosterEditor.jsx`
  - ✅ Resize/rotation des éléments texte — `blockStyle(transforms, id)` avec translate/scale/rotate
  - ✅ Branding club (couleurs + logo automatiques) — `PosterStudio` reçoit `club` prop, auto-fill `accentColor`/`homeLogo`/`homeName`
  - ✅ Logo SportLink en filigrane discret — `PosterRenderer.jsx` watermark `rgba(255,255,255,0.30)` bas-droite

---

## P2 — Engagement & rétention utilisateurs

### EPIC-P2-1 🟡 Partage social intelligent
- **Objectif** : Viralité organique. Chaque partage = acquisition potentielle.
- **Complexité** : M
- **À faire** :
  - ✅ Partage direct vers Instagram — `openInstagramShare()` dans `eventShare.js`, bouton dans `ShareBtn`
  - ✅ Partage Facebook (Open Graph + share dialog) — `eventShare.js` `openFacebookShare()`
  - ✅ Partage WhatsApp / Messenger (URL scheme avec texte auto) — `eventShare.js` `openWhatsAppShare()`
  - ✅ Génération description automatique depuis l'événement — `generateEventDescription()` dans `eventShare.js`
  - ✅ Bouton "Partager l'affiche" génère affiche + ouvre native share sheet — `PosterShareBtn.jsx`

---

### PERF-003 ✅ `React.memo` manquant sur EventCard
- **Catégorie** : Performance / React
- **Complexité** : S
- **Solution appliquée** : `EventCard.jsx` — `export default memo(EventCard)` (ligne 524).

---

### PERF-004 ✅ `AttendeeCountContext` : reload global sur chaque event Realtime
- **Catégorie** : Performance / Supabase
- **Complexité** : S
- **Solution appliquée** : `AttendeeCountContext.jsx` — handler Realtime met à jour uniquement `counts[event_id]` en incrémental (INSERT/DELETE individuel, pas de rechargement global).

---

### ARCH-002 ✅ Pas d'ErrorBoundary autour des pages critiques
- **Catégorie** : Architecture / Frontend
- **Complexité** : XS
- **Solution appliquée** : `ErrorBoundary.jsx` existe. `App.jsx` wrappe toutes les pages (home, map, favoris, news, clubs, profil, admin).

---

### UX-002 🟡 Bottom sheet non progressif — expérience sub-Google Maps
- **Catégorie** : UX/UI / Mobile
- **Complexité** : L
- **Solution** : 3 snap points (15% peek / 55% détail / 95% plein écran). Framer Motion `drag` + `dragConstraints`.

---

### UX-003 ✅ Onboarding sans "aha moment"
- **Catégorie** : UX/UI / Produit
- **Complexité** : M
- **Solution appliquée** : Bannière AnimatePresence dans `MapPage.jsx` — compte les événements du sport choisi dans les 7 prochains jours, affiche sport icon + compteur, dismissible.

---

### SEC-006 ✅ `club_trainings` et `club_pages` sans RLS confirmée
- **Catégorie** : Sécurité / Supabase
- **Complexité** : S
- **Solution appliquée** : `sportlink_full_migration.sql` contient policies complètes : `trainings_select_public`, `trainings_insert_owner`, `trainings_update_owner`, `trainings_delete_owner`, et idem pour `club_pages`.

---

### PERF-005 ✅ Navigation 7 onglets — trop pour mobile
- **Catégorie** : UX/UI / Mobile
- **Complexité** : M
- **Solution appliquée** : `BottomNav.jsx` — 5 slots fixes : HOME, MAP, FAB central, CLUBS, PROFIL. News intégré dans Home.

---

### ARCH-003 ✅ PWA — service worker
- **Catégorie** : Mobile / Architecture
- **Complexité** : M
- **Solution appliquée** : `vite-plugin-pwa` installé et configuré dans `vite.config.js`. Cache strategy NetworkFirst pour Supabase, CacheFirst pour Google Fonts. SW généré à chaque build. `manifest.json` déjà en place.

---

## P3 — Fonctionnalités communautaires

### EPIC-P3-1 🟡 Notifications intelligentes
- **Note** : Notifications in-app (annonces, covoiturage) déjà implémentées ✅
- **Reste à faire** :
  - ⬜ PROD-001 — Push notifications (PWA Web Push API)
  - ⬜ Rappels matchs (J-1, H-2)
  - ⬜ Alertes changements d'horaire
  - ⬜ Scores mis à jour
  - ⬜ Événements proches géolocalisés

---

### PROD-001 ✅ Notifications push — matchs et rappels
- **Catégorie** : Produit / Mobile
- **Complexité** : XL
- **Solution appliquée** : Web Push API + VAPID + Supabase. `pushNotifications.js` gère subscribe/unsubscribe, `usePushNotifications` hook React, `PushNotificationToggle` composant UI. SW `public/sw.js` gère l'event `push`. Table `push_subscriptions` avec RLS. Edge Function `send-push` (Deno + web-push).

#### ⬜ DÉPLOIEMENT EN PROD — 3 étapes manuelles requises

1. **Générer les clés VAPID** (une seule fois) :
   ```bash
   npx web-push generate-vapid-keys
   ```
   - Coller la **clé publique** dans `.env` → `VITE_VAPID_PUBLIC_KEY=...`
   - Coller la **clé privée** dans Supabase Dashboard → Edge Functions → Secrets → `VAPID_PRIVATE_KEY`
   - Ajouter aussi `VAPID_SUBJECT=mailto:ton@email.com` dans les secrets

2. **Appliquer la migration SQL** :
   ```bash
   supabase db push
   # ou coller le contenu de supabase/migrations/20260520_push_subscriptions.sql
   # dans Supabase Dashboard → SQL Editor
   ```

3. **Déployer la Edge Function** :
   ```bash
   supabase functions deploy send-push
   ```

**Pour déclencher un push depuis l'app** (ex: rappel J-1) :
```js
fetch('/functions/v1/send-push', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
  body: JSON.stringify({ user_id, title: '📅 Rappel match', body: 'Dans 1h !', url: '/#events' }),
});
```

---

### PROD-002 ✅ Lien public par club avec OpenGraph
- **Catégorie** : Produit / Marketing
- **Complexité** : L
- **Solution appliquée** : Page standalone `club-page.html` + `src/club-page.jsx` + `ClubPublicPage.jsx`. URL `/club-page.html?id=CLUB_ID`. OG tags injectés dynamiquement (og:title, og:description, og:image, og:url). Fonctionne pour WhatsApp/Twitter. Vite multi-entry build configuré.

---

### PROD-003 ✅ Score live + fil d'actualité
- **Catégorie** : Produit / Engagement
- **Complexité** : L
- **Solution appliquée** : `useNewsFeed.js` — Realtime sur `events` INSERT (nouveaux événements futurs) et UPDATE (score mis à jour). `NewsPage.jsx` affiche `ResultCard` avec score home/away. `App.jsx` transmet `followedClubs`.

---

### PROD-004 🟢 Gamification — badges et streaks
- **Note** : Système de badges "J'y étais" existe déjà partiellement ✅
- **Reste à faire** :
  - ✅ Badge "Fan fidèle" (5 J'y serai dans un club) — `useBadges.js` badge `loyal_fan`
  - ✅ Classement clubs les plus actifs du mois — `useClubLeaderboard.js` + section collapsible dans `ClubsPage`
  - ✅ Streaks de présence — `computeMaxStreak()` dans `useBadges.js`, badges `streak_3` et `streak_5`

---

## P4 — Valeur Premium Clubs

### EPIC-P4-1 🟡 Branding premium
- **Note** : Typographie par club déjà implémentée ✅
- **Reste à faire** :
  - ✅ Thèmes de couleurs club (palette primaire/secondaire personnalisée) — `ClubBrandKitEditor.jsx` avec color picker + presets
  - ⬜ Typographies supplémentaires
  - ✅ Bloc sponsors avec logos + liens — `SponsorsBlock.jsx` dans éditeur de pages
  - ⬜ Pages avancées (hero image, sections custom)

---

### EPIC-P4-2 🟢 Communication club automatisée
- **Note** : Annonces manuelles déjà implémentées ✅
- **Reste à faire** :
  - ⬜ Publication auto post-match (résultat + affiche générée automatiquement)
  - ⬜ Rappels auto J-1 pour les événements
  - ⬜ Calendrier intelligent (suggestions de créneaux)
  - ⬜ Digests hebdomadaires par email

---

## P5 — Long terme / Différenciation

### EPIC-P5-1 🟢 Réseau social sportif léger
- **Complexité** : XL
- **État** :
  - ✅ Réactions sur événements (👏 🔥 💪) — `EventReactions.jsx` + `useEventReactions.js`
  - ✅ Commentaires post-match — `EventComments.jsx` + `useEventComments.js`, intégré dans `EventCard`
  - ⬜ Photos d'événements (upload + galerie)
  - ✅ Fil communauté (feed des clubs suivis) — `NewsPage.jsx` + `useNewsFeed.js` Realtime

---

### EPIC-P5-2 🟢 IA & automatisation
- **Complexité** : XL
- **À faire plus tard** :
  - ⬜ Suggestions d'événements (basées sur localisation + historique)
  - ⬜ Génération de texte auto pour les annonces
  - ⬜ Recommandations utilisateurs (clubs similaires)
  - ⬜ Suggestions de covoiturage (groupement par trajet)
  - ⬜ Détection automatique de résultats depuis photos de tableau de score

---

### PERF-006 ✅ `club_follower_counts` — query non scalable
- **Catégorie** : Performance / Supabase
- **Complexité** : M
- **Problème** : Full table scan sur `profiles` à 10 000 utilisateurs.
- **Solution appliquée** : Table `club_follows(user_id, club_id, teams, notif, created_at)` créée dans `sportlink_full_migration.sql` avec index sur `club_id`.

---

### ARCH-004 🟢 Offline handling — cache et mode dégradé
- **Catégorie** : Architecture / Mobile
- **Complexité** : XL
- **Dépendance** : ARCH-003 (PWA)
- **Solution** : Cache Supabase avec service worker. Banner "Mode hors ligne — données du [date]".

---

### UX-004 ✅ Éditeur page club — mode Simple vs Avancé
- **Catégorie** : UX/UI / Produit
- **Complexité** : L
- **Solution appliquée** : Toggle "Rapide / Avancé" dans la barre d'édition. Mode Rapide = `SimpleModeEditor` avec 6 sections en 1 clic. Mode Avancé = éditeur de blocs complet.

---

## ROADMAP — Ordre recommandé

```
SPRINT 1 — Stabilisation
├── SEC-001  Clé API en .env.local                          [XS] ✅
├── SEC-002  RLS club_managers                              [XS] ✅
├── SEC-003  events_insert restreint admins/clubs           [XS] ✅
├── SEC-004  Retirer role/clubId de updateProfile           [XS] ✅
├── BUG-001  Rôle admin cold start                          [S]  ✅
├── BUG-002  Consolider SQL policies                        [M]  ✅
├── MOBILE-001/002/003  Safe area + scroll + tap targets    [S]  ✅
└── BUG-003  updateEvent conserve user_id original          [XS] ✅

SPRINT 2 — Clubs indispensables
├── EPIC-P1-1  Création événement < 15s                     [L]  ✅
├── BUG-004  Channel Realtime nom fixe                      [XS] ✅
├── BUG-005  Import CSV batch                               [S]  ✅
├── BUG-006  Dark mode AdminPage                            [M]  ✅
├── PERF-001 useMemo currentUser                            [XS] ✅
├── SEC-005  attendees_select restreint                     [XS] ✅
└── PERF-002 event_attendee_counts SECURITY DEFINER         [S]  ✅

SPRINT 3 — Engagement
├── EPIC-P2-1  WhatsApp + Facebook + Instagram + description [M]  ✅
├── EPIC-P2-1  Bouton "Partager l'affiche" (PosterShareBtn) [S]  ✅
├── EPIC-P1-3  Affiches premium + export Story/Post         [L]  ✅
├── EPIC-P1-3  Logo filigrane SportLink                     [XS] ✅
├── PERF-003 React.memo EventCard                           [S]  ✅
├── PERF-004 AttendeeCount update incrémental               [S]  ✅
├── ARCH-002 ErrorBoundary autour des pages                 [XS] ✅
└── UX-001   Toasts/feedback actions                        [M]  ✅

SPRINT 4 — Mobile & Architecture
├── ARCH-001 Migration données statiques → Supabase seed    [L]  ✅
├── UX-002   Bottom sheet snap points                       [L]  ✅
├── PERF-005 BottomNav 5 onglets                            [M]  ✅
├── UX-003   Onboarding avec aha moment                     [M]  ✅
├── SEC-006  RLS club_trainings + club_pages                [S]  ✅
└── ARCH-003 PWA service worker (vite-plugin-pwa)           [M]  ✅

SPRINT 5 — Premium & Distribution
├── EPIC-P1-2  Pages clubs thèmes + sponsors                [L]  ✅
├── EPIC-P4-1  Branding couleurs ✅, typos sup + hero image [M]  ⬜
├── PROD-001 Notifications push matchs (dépend ARCH-003)    [XL] ✅ (déploiement prod ⬜)
├── PROD-002 Lien public club-page.html?id= + OG            [L]  ✅
├── PROD-003 Score live + fil actualité                      [L]  ✅
└── PROD-004 Badges ✅ + Classement ✅ + Streaks ✅          [M]  ✅

LONG TERME
├── EPIC-P5-1  Réactions ✅, Commentaires ✅, Fil ✅        [XL] ✅ (partiel)
├── EPIC-P5-1  Photos d'événements (upload + galerie)       [L]  ⬜
├── EPIC-P4-2  Auto post-match, rappels J-1, digests email  [XL] ⬜
├── EPIC-P5-2  IA & automatisation                          [XL] ⬜
├── PERF-006 Table club_follows dédiée                      [M]  ✅
├── ARCH-004 Offline handling + PWA cache                   [XL] ⬜
└── UX-004   Éditeur club mode Simple/Avancé                [L]  ✅
```

---

## Dépendances techniques

```
SEC-003 (events_insert RLS) → dépend de BUG-002 (SQL consolidé)
PERF-002 (view SECURITY DEFINER) → nécessite accès Supabase SQL Editor
ARCH-001 (migration seed) → ARCH-004 (offline cache) → PROD-001 (push)
ARCH-003 (PWA) → PROD-001 (notifications push)
ARCH-003 (PWA) → ARCH-004 (offline)
PROD-002 (lien public club) → potentiel SSR (Vite SSR ou Astro)
EPIC-P1-3 (affiches premium) → EPIC-P2-1 (partage social)
```

---

*Document vivant. Chaque item complété → cocher + dater. Nouvelles découvertes → P0 si critiques, sinon P2/P3.*
