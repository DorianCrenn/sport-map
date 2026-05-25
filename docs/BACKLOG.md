# SportLink — Backlog Technique & Produit
> Document vivant — mis à jour au fil des sprints  
> Dernière mise à jour : 2026-05-25 — PS Phase 5 implémentée (Éditeur visuel premium : AiElementEditor, contrôles typo, handles précis, alignement)

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

## PS — Poster Studio Premium IA (nouveau, 2026-05-23)

> Objectif : Transformer PosterStudio en studio créatif intelligent spécialisé sport.  
> Infrastructure déjà prévue dans le schéma DB : `ai_jobs`, `club_brand_kits.da_profile`, `club_ai_usage`.  
> Phase 1 implémentée en mock interne — intégration API (Remove.bg / Claude Vision) ajoutée en phase finale.

---

### EPIC-PS-1 🟠 Bibliothèque joueurs détourés + upload IA

- **Objectif** : Les clubs uploadent une photo, l'IA détourage le joueur, le résultat est sauvegardé et réutilisable dans toutes les affiches.
- **Criticité** : HAUTE — différenciateur premium fort, valeur perçue immédiate
- **Complexité** : XL
- **Dépendances** : EPIC-P1-3 (PosterStudio existant), Supabase Storage

#### Infrastructure

- ✅ **PS-INF-001** — Bucket Supabase Storage `club-media` + policies RLS par `club_id` `[S]` — `supabase/migrations/20260523_club_media_bucket.sql`
- ✅ **PS-INF-002** — Migration SQL : table `club_media_assets` `[S]` — `supabase/migrations/20260523_club_media_assets.sql`
- ✅ **PS-INF-003** — Migration SQL : index GIN sur `tags` + index `(club_id, type, is_favorite)` `[XS]`

#### Traitement image (Phase 1 — mock interne)

- ⬜ **PS-IMG-001** — Edge Function `process-player-image` `[L]` *(Phase 4)*
- ✅ **PS-IMG-002** — Compression client-side 1200px max, JPEG 88%, reject > 10MB — `src/lib/imageUtils.js` `[S]`
- ✅ **PS-IMG-003** — Thumbnail 120×120 + mock détourage canvas (algo corner-sampling) — `src/lib/imageUtils.js` `processPlayerImage()` `[S]`
- ⬜ **PS-IMG-004** — Incrément quota `club_ai_usage.import_count` `[XS]` *(Phase 4)*

#### Intégration dans PosterRenderer

- ✅ **PS-RND-001** — `playerLayers: []` dans state PosterStudio : `{ uid, assetId, assetUrl, x, yBottom, scale, opacity, shadow, glow, flip, zAbove }` `[S]`
- ✅ **PS-RND-002** — Composant `PlayerLayer` dans `PosterRenderer.jsx` : z=7 (below) ou z=12 (above content) `[S]`
- ✅ **PS-RND-003** — Effets `shadow`, `glow` (accentColor), `flip` scaleX(-1) via CSS filter compatible html-to-image `[S]`
- ⬜ **PS-RND-004** — Position joueur draggable dans `PosterEditor.jsx` `[M]`

#### Hook `useClubMedia`

- ✅ **PS-HK-001** — `useClubMedia(clubId)` : localStorage-first + Supabase sync — `src/hooks/useClubMedia.js` `[M]`
- ✅ **PS-HK-002** — Upload en 3 phases : `compressing` → `processing` → `thumbnail` → `done | error` avec progress bar animée `[S]`

#### UX — Onglet "Joueurs" dans PosterStudio

- ✅ **PS-UX-001** — 5e onglet "Joueurs" avec icône + badge quand `playerLayers.length > 0` `[S]`
- ✅ **PS-UX-002** — Zone drag & drop : border `accentColor`, accept `image/*` `[M]`
- ✅ **PS-UX-003** — Preview 3 phases animées + résultat thumbnail avec confirmation `[M]`
- ✅ **PS-UX-004** — Grille bibliothèque 4 colonnes : thumbnails, favori, supprimer, click = ajout sur l'affiche `[M]`
- ✅ **PS-UX-005** — Liste "Sur cette affiche" : sliders taille/opacité/position X, toggle Fond/Dessus, boutons shadow/glow/miroir, supprimer `[M]`
- ✅ **PS-UX-006** — Recherche texte + filtre Favoris dans la bibliothèque `[S]`
- ✅ **PS-UX-007** — Suppression asset localStorage (Storage en Phase 4) `[S]`

#### Phase finale — Intégration API réelle

- ✅ **PS-API-001** — Intégrer Remove.bg API dans Edge Function (remplace le mock) : POST multipart → transparent PNG, edge smoothing alpha `[M]`
- ⬜ **PS-API-002** — Fallback vers Fal.ai BRIA RMBG 2.0 si Remove.bg quota épuisé `[M]`
- ⬜ **PS-API-003** — UI quota : afficher "X imports restants ce mois" depuis `club_ai_usage` `[S]`

---

### EPIC-PS-2 🟠 Analyse DA Club — Identité visuelle intelligente

- **Objectif** : Le club upload une affiche existante, Claude Vision analyse son style (couleurs, typo, composition, ambiance) et le sauvegarde comme "identité visuelle" réutilisable.
- **Complexité** : L
- **Dépendances** : `club_brand_kits` table existante, Claude API

#### Edge Function `analyze-poster-dna`

- ✅ **PS-DNA-001** — Edge Function `analyze-poster-dna` : reçoit image base64 + `club_id`, appelle Claude claude-haiku-4-5 Vision avec prompt DA structuré, parse JSON retourné `[L]`
- ✅ **PS-DNA-002** — Prompt DA : extrait `colors` (dominant/secondary/accent/bg/text), `palette` (5 hex), `typography` (weight/style/tracking), `composition` (type/density), `mood` (array), `elements` (gradients/glow/textures), `style` (minimalist/bold/cinematic/esport/classic/street/premium), `templateAffinities` (array d'IDs templates) `[M]`
- ✅ **PS-DNA-003** — Enrichissement calculs complémentaires : luminosity score (dark/light), contrast ratio (accessibilité), température de couleur (warm/cool/neutral) `[S]`
- ✅ **PS-DNA-004** — Upsert `club_brand_kits.da_profile` JSONB avec résultat + `analysedAt` + `confidence` `[S]`
- ✅ **PS-DNA-005** — Log dans `ai_jobs` (type='dna', status pending→done/failed) `[XS]`

#### Hook `useClubDNA`

- ✅ **PS-HK-003** — `useClubDNA(clubId)` : charge `da_profile` depuis `club_brand_kits`, expose `analyzePoster(imageBase64)`, `applyToStudio(dispatch)`, `clearDNA()` `[M]`
- ✅ **PS-HK-004** — `applyToStudio` : met à jour `accentColor` ← `da_profile.colors.accent`, pré-filtre selector de templates sur `templateAffinities`, sauvegarde via `useDefaultTemplate` `[S]`

#### UX — "Mon style club"

- ✅ **PS-UX-008** — Section "Identité visuelle" dans onglet Style de PosterStudio (sous les palettes couleurs) `[S]`
- ✅ **PS-UX-009** — Zone upload affiche existante avec instruction "Importez une de vos affiches pour que l'IA comprenne votre style" `[M]`
- ✅ **PS-UX-010** — Loading state : "Notre IA analyse votre identité visuelle..." avec animation subtile (~3s) `[S]`
- ✅ **PS-UX-011** — Résultat : swatches palette détectée + label style (ex : "Élégant · Premium · Gold"), barre de confiance, templates recommandés (chips cliquables) `[M]`
- ✅ **PS-UX-012** — Bouton "Appliquer à mes affiches" → `applyToStudio()` + toast confirmation "Votre identité visuelle est mémorisée" `[S]`
- ✅ **PS-UX-013** — Badge "Style analysé ✓" persistant si `da_profile` existe, bouton "Ré-analyser" `[S]`

---

### EPIC-PS-3 🟡 Génération de variantes intelligentes

- **Objectif** : À partir du DA profile club, générer 8 variantes d'affiches cohérentes avec l'identité du club. Phase 1 = paramétrique (gratuit, instantané). Phase 2 = fond custom Fal.ai.
- **Complexité** : M (phase 1) + L (phase 2)
- **Dépendances** : EPIC-PS-2 (DA profile), templates existants, BG_PRESETS existants

#### Phase 1 — Variantes paramétriques (no API)

- ✅ **PS-VAR-001** — Algorithme `generateVariants(daProfile, baseState, count=8)` : sélectionne templates compatibles via `templateAffinities`, varie couleur (palette du club), BG preset (mapping `STYLE_TO_PRESETS`), overlays SVG (`styleToOverlays`), retourne N `{ variantId, label, state }` `[L]`
- ✅ **PS-VAR-002** — Mapping `STYLE_TO_PRESETS` : premium → [gold-rush, trophy-room, noir-luxe], bold → [power-surge, raw-power], cinematic → [smoke-lights, light-streams], esport → [cyber-grid, neon-pulse], street → [concrete-jungle, ignite] `[S]`
- ✅ **PS-VAR-003** — Mapping `styleToOverlays` : génère combinaisons d'éléments SVG cohérentes avec le style DA (ex : premium → stars + sparks, street → shards + speed) `[S]`

#### UX — Galerie variantes

- ✅ **PS-UX-014** — Bouton "✨ Générer des variantes" dans onglet Modèles (visible si `da_profile` existe) `[S]`
- ✅ **PS-UX-015** — Galerie 4 colonnes de mini-previews : vrais `<PosterRenderer>` à scale 0.22, lazy render via IntersectionObserver `[M]`
- ✅ **PS-UX-016** — Click sur variante → charge son `state` dans le poster principal via dispatch PATCH `[S]`
- ✅ **PS-UX-017** — Bouton "← Régénérer" : reroll les combinaisons paramétriques (seed différent) `[S]`
- ✅ **PS-UX-018** — Label sous chaque variante : nom du template + accentColor swatch `[XS]`

#### Phase 2 — Fond custom IA (Fal.ai Flux)

- ✅ **PS-VAR-004** — Edge Function `generate-variant-bg` : prend `da_profile.mood` + `da_profile.style` + `sport`, génère prompt Flux, appelle Fal.ai Flux-schnell API, retourne URL image background `[XL]`
- ✅ **PS-VAR-005** — Intégration du fond généré comme `bgSrc` dans le state de la variante `[S]`
- ✅ **PS-VAR-006** — UI : section "Fonds IA" dans galerie variantes (après les paramétriques), badge "IA" sur les variantes avec fond généré `[M]`

---

### EPIC-PS-5 ✅ Éditeur Visuel Premium — 2026-05-25

- **Objectif** : Rendre l'éditeur visuel professionnel — handles précis, typographie libre, alignement assisté, éléments IA entièrement manipulables.
- **Complexité** : L (total sprint)
- **Statut** : Entièrement implémenté ✅

| ID | Description | Taille | Statut |
|----|-------------|--------|--------|
| PS-VED-001 | `AiElementEditor.jsx` — éditeur plein écran pour repositionner/ajuster les éléments décoratifs IA (drag, opacité, échelle, rotation, au-dessus/en-dessous, supprimer) | M | ✅ |
| PS-VED-002 | Thumbnails éléments IA en portrait natif (576×1024) + système de favoris localStorage max 12 par club | M | ✅ |
| PS-VED-003 | Réduction taille thumbnails (trop hauts sur mobile, boutons trop petits) | S | ✅ |
| PS-VED-004 | Touche Entrée déclenche la génération IA (fonds personnalisés + éléments) | XS | ✅ |
| PS-VED-005 | Fix images IA aplaties : `objectFit: contain` + dimensions `576×1024` Pollinations (ratio 9:16 exact) | S | ✅ |
| PS-VED-006 | Tous les blocs info tournoi, équipes, date/lieu (`data-block="info"`, `"teams"`, `"meta"`) déplaçables dans l'éditeur visuel | M | ✅ |
| PS-VED-007 | Fix phrases coupées : `-webkit-line-clamp: 2` sur taglines, suppression `overflowWrap/wordBreak: break-word` sur 10 templates tournoi | M | ✅ |
| PS-VED-008 | Contrôle taille de police par bloc dans PosterEditor (slider 8–120px, mode Auto/Personnalisé, reset Auto) | M | ✅ |
| PS-VED-009 | Contrôle famille de police par bloc (dropdown 8 familles Google Fonts : Oswald, Bebas Neue, Montserrat, Barlow Condensed, Playfair Display, Anton…) | S | ✅ |
| PS-VED-010 | Fix InfoRow : texte complet affiché — suppression `truncate()` 12/14 chars + suppression `whiteSpace: nowrap` | XS | ✅ |
| PS-VED-011 | Handles blocs précis : text-node `TreeWalker` pour bounding box réelle du contenu (plus de handles pleine largeur) | M | ✅ |
| PS-VED-012 | Boutons alignement Gauche / Centre / Droite par bloc dans PosterEditor (calcul `dx` depuis position naturelle) | S | ✅ |
| PS-VED-013 | Exclure les `data-block` imbriqués du calcul handle (évite que meta englobe tagline dans TplTrSummer) | S | ✅ |

---

### EPIC-PS-4 🟢 Polish, bibliothèque avancée & préparation vidéo

- **Objectif** : Finitions UX premium + préparer l'architecture pour motion posters et reels futurs.
- **Complexité** : M

#### Bibliothèque avancée

- ⬜ **PS-LIB-001** — Tags assets joueurs : ajout/suppression inline dans la grille bibliothèque `[S]`
- ⬜ **PS-LIB-002** — Versions d'un asset : si re-upload d'un même joueur, conserver historique via `poster_versions` `[M]`
- ⬜ **PS-LIB-003** — Remplacement image : bouton "Remplacer" sur un asset existant → reprocess sans changer l'ID ni les usages en cours `[M]`
- ⬜ **PS-LIB-004** — Dossiers virtuels (par équipe/saison) : colonne `folder` dans `club_media_assets`, filtre sidebar `[M]`

#### Audit final

- ⬜ **PS-AUDIT-001** — Audit UX : tester le flow complet upload→détourage→affiche sur mobile iOS + Android `[M]`
- ⬜ **PS-AUDIT-002** — Audit performances : export PNG 3× avec joueur `<img crossOrigin>` — vérifier pas de canvas tainted `[S]`
- ⬜ **PS-AUDIT-003** — Audit responsive : onglet Joueurs sur écran 375px (iPhone SE) `[S]`
- ⬜ **PS-AUDIT-004** — Audit cohérence produit : da_profile correctement propagé à PosterStudio sur navigation entre events `[S]`

#### Préparation futures features

- ⬜ **PS-FUT-001** — Préparer schema `motion_layers` JSONB dans `posters` pour futures animations (keyframes, durée, easing) `[S]`
- ⬜ **PS-FUT-002** — Documenter API interne PosterRenderer pour future génération vidéo (Remotion / ffmpeg) `[S]`
- ⬜ **PS-FUT-003** — `branding_packs` table : regrouper logo + palette + da_profile + template_default en un "pack" exportable/importable `[M]`

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

POSTER STUDIO PREMIUM — Phase 1 (Infrastructure + Joueurs) ✅ 2026-05-23
├── PS-INF-001  Bucket Storage club-media + RLS             [S]  ✅
├── PS-INF-002  Migration table club_media_assets           [S]  ✅
├── PS-INF-003  Index GIN tags + index club/type            [XS] ✅
├── PS-IMG-001  Edge Function process-player-image (mock)   [L]  ⬜ (Phase 4)
├── PS-IMG-002  Compression client-side imageUtils.js       [S]  ✅
├── PS-IMG-003  Mock détourage canvas + thumbnail           [S]  ✅
├── PS-IMG-004  Incrément quota club_ai_usage               [XS] ⬜ (Phase 4)
├── PS-RND-001  playerLayers dans state PosterStudio        [S]  ✅
├── PS-RND-002  Rendu joueurs PosterRenderer z=7/z=12       [S]  ✅
├── PS-RND-003  Effets shadow/glow/flip CSS filter          [S]  ✅
├── PS-RND-004  Drag & drop position joueur PosterEditor    [M]  ⬜
├── PS-HK-001   Hook useClubMedia                           [M]  ✅
├── PS-HK-002   États upload 3 phases                       [S]  ✅
├── PS-UX-001   Onglet Joueurs + badge                      [S]  ✅
├── PS-UX-002   Zone drag & drop upload                     [M]  ✅
├── PS-UX-003   Preview 3 phases + confirmation             [M]  ✅
├── PS-UX-004   Grille bibliothèque 4 colonnes              [M]  ✅
├── PS-UX-005   Liste "Sur cette affiche" + contrôles       [M]  ✅
├── PS-UX-006   Recherche + filtre favoris                  [S]  ✅
└── PS-UX-007   Suppression asset localStorage              [S]  ✅

POSTER STUDIO PREMIUM — Phase 2 (DA Intelligence)
├── PS-DNA-001  Edge Function analyze-poster-dna            [L]  ✅
├── PS-DNA-002  Prompt DA structuré (couleurs/style/mood)   [M]  ✅
├── PS-DNA-003  Calculs luminosity/contrast/température     [S]  ✅
├── PS-DNA-004  Upsert club_brand_kits.da_profile           [S]  ✅
├── PS-DNA-005  Log ai_jobs type=dna                        [XS] ✅
├── PS-HK-003   Hook useClubDNA                             [M]  ✅
├── PS-HK-004   applyToStudio() → accentColor + templates   [S]  ✅
├── PS-UX-008   Section "Identité visuelle" onglet Style    [S]  ✅
├── PS-UX-009   Zone upload affiche existante               [M]  ✅
├── PS-UX-010   Loading state analyse IA                    [S]  ✅
├── PS-UX-011   Résultat : palette + style + recommandations[M]  ✅
├── PS-UX-012   Bouton "Appliquer à mes affiches"           [S]  ✅
└── PS-UX-013   Badge "Style analysé ✓" + Ré-analyser       [S]  ✅

POSTER STUDIO PREMIUM — Phase 3 (Variantes)
├── PS-VAR-001  Algorithme generateVariants paramétrique    [L]  ✅
├── PS-VAR-002  Mapping STYLE_TO_PRESETS                    [S]  ✅
├── PS-VAR-003  Mapping styleToOverlays                     [S]  ✅
├── PS-UX-014   Bouton "Générer des variantes"              [S]  ✅
├── PS-UX-015   Galerie mini-previews 4col IntersectionObs  [M]  ✅
├── PS-UX-016   Click variante → charge state poster        [S]  ✅
├── PS-UX-017   Bouton Régénérer                            [S]  ✅
└── PS-UX-018   Labels variantes (template + swatch)        [XS] ✅

POSTER STUDIO PREMIUM — Phase 5 (Éditeur Visuel Premium) ✅ 2026-05-25
├── PS-VED-001  AiElementEditor drag + sliders éléments IA    [M]  ✅
├── PS-VED-002  Thumbnails portrait + favoris éléments IA     [M]  ✅
├── PS-VED-003  Réduction taille thumbnails mobile             [S]  ✅
├── PS-VED-004  Entrée = génération IA (fonds + éléments)     [XS] ✅
├── PS-VED-005  Fix images aplaties (contain + 576×1024)      [S]  ✅
├── PS-VED-006  Blocs info/équipes/date déplaçables           [M]  ✅
├── PS-VED-007  Fix phrases coupées (line-clamp + overflowWrap)[M]  ✅
├── PS-VED-008  Contrôle taille de police par bloc             [M]  ✅
├── PS-VED-009  Contrôle famille de police par bloc            [S]  ✅
├── PS-VED-010  Fix InfoRow texte complet (suppression truncate)[XS] ✅
├── PS-VED-011  Handles précis (text-node TreeWalker)          [M]  ✅
├── PS-VED-012  Boutons alignement G/C/D par bloc              [S]  ✅
└── PS-VED-013  Exclure data-block imbriqués du calcul handle  [S]  ✅

POSTER STUDIO PREMIUM — Phase 4 (API réelle + Polish)
├── PS-API-001  Remove.bg API dans Edge Function            [M]  ✅
├── PS-API-002  Fallback Fal.ai BRIA RMBG 2.0              [M]  ⬜
├── PS-API-003  UI quota imports restants                   [S]  ⬜
├── PS-VAR-004  Edge Function generate-variant-bg (Flux)   [XL] ✅
├── PS-VAR-005  Fond généré comme bgSrc variante            [S]  ✅
├── PS-VAR-006  Section "Fonds IA" + badge IA               [M]  ✅
├── PS-LIB-001  Tags assets inline                          [S]  ⬜
├── PS-LIB-002  Versions d'un asset                         [M]  ⬜
├── PS-LIB-003  Remplacement image sans changer ID          [M]  ⬜
├── PS-LIB-004  Dossiers virtuels par équipe/saison         [M]  ⬜
├── PS-AUDIT-001 Audit UX mobile iOS + Android              [M]  ⬜
├── PS-AUDIT-002 Audit perf export PNG avec joueur          [S]  ⬜
├── PS-AUDIT-003 Audit responsive 375px                     [S]  ⬜
├── PS-AUDIT-004 Audit da_profile propagation               [S]  ⬜
├── PS-FUT-001  Schema motion_layers pour animations        [S]  ⬜
├── PS-FUT-002  Documenter API PosterRenderer (Remotion)    [S]  ⬜
└── PS-FUT-003  Table branding_packs club                   [M]  ⬜
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
