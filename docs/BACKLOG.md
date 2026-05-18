# SportLink — Backlog Technique & Produit
> Document vivant — mis à jour au fil des sprints  
> Dernière mise à jour : 2026-05-18

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

---

## P0 — Stabilisation critique (AVANT toute grosse évolution)

### EPIC-P0-1 🔴 Refonte Auth / RBAC / Sécurité
- **Objectif** : Zéro faille permissions. Perte de confiance → abandon total du produit.
- **Sous-tâches** :
  - ✅ SEC-001 — Clé Supabase hors du repo (`.env.local`)
  - ✅ SEC-002 — RLS `club_managers` (fuite emails)
  - ✅ SEC-003 — `events_insert` restreint aux admins/club_admins
  - ✅ SEC-004 — Retirer `role`/`clubId` de `updateProfile` + trigger BEFORE UPDATE SECURITY DEFINER
  - 🔄 BUG-001 — Rôle admin cassé sur cold start (fix poussé, validation en attente)
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

### BUG-001 🔴 Rôle admin cassé après connexion sur Supabase cold start
- **Catégorie** : Auth / Bug
- **Complexité** : S (fix poussé commit `7b03efc`, validation en attente)
- **Problème** : Timeout 5s expirait sur cold start → `setProfile(null)` → rôle = 'user'.
- **Solution appliquée** : Timeout 12s, update fonctionnel, retry si profile null après 4s.
- **Action restante** : Hard-refresh + reconnexion pour valider le fix.

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
  - ⬜ PERF-006 — Table `club_follows` dédiée (remplacer `profiles.followed_clubs`) → P5
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
  - ⬜ Pré-remplissage depuis contexte (sport, club, équipe, niveau)
  - ⬜ Auto-sélection équipe/niveau depuis le profil club_admin
  - ⬜ Aide saisie lieu avancée (Google Places ou Mapbox Geocoding)
  - ⬜ Logique domicile/extérieur automatique (club détecté = domicile)
  - ⬜ Sélection rapide adversaire (recherche parmi clubs connus)
  - ⬜ Saisie score rapide post-match (depuis le listing événements passés)
  - ⬜ Duplication événement (recréer le même match pour la prochaine journée)
- **Note** : eventType (championship/cup/friendly) + teamName + category déjà implémentés ✅

---

### BUG-003 🟠 `updateEvent` réassigne le `user_id` de l'event
- **Catégorie** : Backend / Bug
- **Complexité** : XS
- **Problème** : Un admin qui modifie l'événement d'un autre utilisateur s'en approprie la propriété en DB.
- **Solution** : Conserver le `user_id` original. Passer `prev.userId` plutôt que `currentUser?.id`.

---

### BUG-004 🟠 Channel Realtime avec nom aléatoire — fuites de connexions
- **Catégorie** : Performance / Supabase
- **Complexité** : XS
- **Problème** : `useLocalEvents.js` génère un nom random à chaque mount → double souscription.
- **Solution** : Utiliser un nom fixe `'events-realtime'`.

---

### PERF-001 🟠 `currentUser` recréé à chaque render d'AuthProvider
- **Catégorie** : Performance / React
- **Complexité** : XS
- **Solution** :
  ```js
  const currentUser = useMemo(() => mapProfile(authUser, profile), [authUser, profile]);
  ```

---

### BUG-005 🟠 `bulkAddEvents` : import CSV séquentiel, bloquant
- **Catégorie** : Performance / UX
- **Complexité** : S
- **Solution** : `supabase.from('events').insert([...eventsArray])` en batch unique.

---

### SEC-005 🟠 `attendees_select_public` — données personnelles exposées
- **Catégorie** : Sécurité / RGPD
- **Complexité** : S
- **Solution** : Changer la policy SELECT à `USING (user_id = auth.uid())`. Counts via view `event_attendee_counts`.

---

### PERF-002 🟠 `event_attendee_counts` view sans SECURITY DEFINER
- **Catégorie** : Supabase / Performance
- **Complexité** : S
- **Problème** : Counts toujours à 0 ou 1 pour les autres utilisateurs.
- **Solution** :
  ```sql
  CREATE VIEW public.event_attendee_counts WITH (security_invoker = false)
  AS SELECT event_id, COUNT(*)::int AS count FROM public.attendees GROUP BY event_id;
  ```

---

### UX-001 🟠 Feedback visuel manquant sur actions utilisateur
- **Catégorie** : UX/UI
- **Complexité** : M
- **Problème** : J'y serai, favori, connexion — l'utilisateur ne sait pas si son action a fonctionné.
- **Solution** : Système de toasts léger (context React, sans librairie).

---

### BUG-006 ✅ Dark mode incomplet — AdminPage hardcodée
- **Catégorie** : Frontend / UX
- **Complexité** : M
- **Solution** : Remplacer `bg-white`, `text-gray-800` par `var(--sl-card)`, `var(--sl-t1)`.
- **Résolu** : Réécriture complète de `AdminPage.jsx` avec CSS vars `var(--sl-*)` partout.

---

### EPIC-P1-2 🟠 Pages clubs — mini sites officiels modernes
- **Objectif** : Transformer chaque page club en vitrine professionnelle.
- **Note** : Éditeur de blocs + drag & drop + typographie déjà implémentés ✅
- **Reste à faire** :
  - ⬜ Thèmes de couleurs par club (palette primaire/secondaire)
  - ⬜ Bloc sponsors avec logos + liens
  - ⬜ Mise en avant événements (bloc "Prochain match" en hero)
  - ⬜ Mode Simple (3 champs) vs Mode Avancé (blocs complets) — UX-004
  - ⬜ Lien public `/club/:id` avec OpenGraph — PROD-002

---

### EPIC-P1-3 🟠 Générateur d'affiches premium
- **Objectif** : Énorme valeur perçue — les clubs partagent, SportLink devient visible.
- **Note** : PosterStudio de base existe ✅
- **Reste à faire** :
  - ⬜ Templates premium variés (5+ designs)
  - ⬜ Export format Story Instagram (1080×1920) + Post carré (1080×1080)
  - ⬜ Génération HD (canvas 2x)
  - ⬜ Éditeur drag & drop textes/logos dans l'affiche
  - ⬜ Resize/rotation des éléments texte
  - ⬜ Branding club (couleurs + logo automatiques)
  - ⬜ Logo SportLink en filigrane discret

---

## P2 — Engagement & rétention utilisateurs

### EPIC-P2-1 🟡 Partage social intelligent
- **Objectif** : Viralité organique. Chaque partage = acquisition potentielle.
- **Complexité** : M
- **À faire** :
  - ⬜ Partage direct vers Instagram Stories (URL scheme)
  - ⬜ Partage Facebook (Open Graph + share dialog)
  - ⬜ Partage WhatsApp / Messenger (URL scheme avec texte auto)
  - ⬜ Génération description automatique depuis l'événement
  - ⬜ Bouton "Partager l'affiche" génère affiche + ouvre native share sheet
- **Exemple description auto** :
  ```
  🏆 Championnat D1
  ⚽ FC SportLink vs Racing Club
  📅 Samedi 18h00
  📍 Stade Municipal
  Créé avec SportLink
  ```

---

### PERF-003 🟡 `React.memo` manquant sur EventCard
- **Catégorie** : Performance / React
- **Complexité** : S
- **Solution** : `export default React.memo(EventCard)` + `useCallback` sur les handlers dans les parents.

---

### PERF-004 🟡 `AttendeeCountContext` : reload global sur chaque event Realtime
- **Catégorie** : Performance / Supabase
- **Complexité** : S
- **Solution** : Mettre à jour uniquement le count de l'`event_id` concerné dans le handler Realtime.

---

### ARCH-002 🟡 Pas d'ErrorBoundary autour des pages critiques
- **Catégorie** : Architecture / Frontend
- **Complexité** : XS
- **Solution** : Wrapper chaque page dans `<ErrorBoundary fallback={<PageErrorState />}>`.

---

### UX-002 🟡 Bottom sheet non progressif — expérience sub-Google Maps
- **Catégorie** : UX/UI / Mobile
- **Complexité** : L
- **Solution** : 3 snap points (15% peek / 55% détail / 95% plein écran). Framer Motion `drag` + `dragConstraints`.

---

### UX-003 🟡 Onboarding sans "aha moment"
- **Catégorie** : UX/UI / Produit
- **Complexité** : M
- **Problème** : L'utilisateur arrive sur une carte vide après l'onboarding.
- **Solution** : Card contextuelle post-onboarding avec les événements du sport choisi cette semaine.

---

### SEC-006 🟡 `club_trainings` et `club_pages` sans RLS confirmée
- **Catégorie** : Sécurité / Supabase
- **Complexité** : S
- **Solution** : Vérifier dans le dashboard Supabase. Ajouter policies SELECT public, INSERT/UPDATE/DELETE owner.

---

### PERF-005 🟡 Navigation 7 onglets — trop pour mobile
- **Catégorie** : UX/UI / Mobile
- **Complexité** : M
- **Solution** : Réduire à 5 onglets (home, map, favoris, clubs, profil). Admin → menu profil. News → home.

---

### ARCH-003 🟡 Pas de PWA — app non installable
- **Catégorie** : Mobile / Architecture
- **Complexité** : M
- **Solution** : `vite-plugin-pwa`. Manifest, cache strategy, offline fallback.

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

### PROD-001 🟢 Notifications push — matchs et rappels
- **Catégorie** : Produit / Mobile
- **Complexité** : XL
- **Dépendance** : ARCH-003 (PWA) obligatoire avant
- **Solution** : PWA Web Push API + Supabase Edge Functions.

---

### PROD-002 🟢 Lien public par club avec OpenGraph
- **Catégorie** : Produit / Marketing
- **Complexité** : L
- **Problème** : Pas de lien partageable sur Facebook/WhatsApp. Viralité bloquée.
- **Solution** : Route publique `/club/:id` avec meta OG. Landing simple, sans auth requise.

---

### PROD-003 🟢 Score live + fil d'actualité
- **Catégorie** : Produit / Engagement
- **Complexité** : L
- **Problème** : Colonne `score` en DB mais pas d'interface de saisie rapide. Onglet News vide.
- **Solution** : Interface saisie score pour club_admins. Feed Realtime sur la page d'accueil.

---

### PROD-004 🟢 Gamification — badges et streaks
- **Note** : Système de badges "J'y étais" existe déjà partiellement ✅
- **Reste à faire** :
  - ⬜ Badge "Fan fidèle" (5 J'y serai dans un club)
  - ⬜ Classement clubs les plus actifs du mois
  - ⬜ Streaks de présence

---

## P4 — Valeur Premium Clubs

### EPIC-P4-1 🟡 Branding premium
- **Note** : Typographie par club déjà implémentée ✅
- **Reste à faire** :
  - ⬜ Thèmes de couleurs club (palette primaire/secondaire personnalisée)
  - ⬜ Typographies supplémentaires
  - ⬜ Bloc sponsors avec logos + liens
  - ⬜ Pages avancées (sections custom, hero image)

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
- **À faire plus tard** :
  - ⬜ Réactions sur événements (👏 🔥 💪)
  - ⬜ Commentaires post-match
  - ⬜ Photos d'événements (upload + galerie)
  - ⬜ Fil communauté (feed des clubs suivis)

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

### PERF-006 🟢 `club_follower_counts` — query non scalable
- **Catégorie** : Performance / Supabase
- **Complexité** : M
- **Problème** : Full table scan sur `profiles` à 10 000 utilisateurs.
- **Solution** : Table `club_follows(user_id, club_id, created_at)` dédiée avec index sur `club_id`.

---

### ARCH-004 🟢 Offline handling — cache et mode dégradé
- **Catégorie** : Architecture / Mobile
- **Complexité** : XL
- **Dépendance** : ARCH-003 (PWA)
- **Solution** : Cache Supabase avec service worker. Banner "Mode hors ligne — données du [date]".

---

### UX-004 🟢 Éditeur page club — mode Simple vs Avancé
- **Catégorie** : UX/UI / Produit
- **Complexité** : L
- **Problème** : Éditeur de blocs intimidant pour un président de club amateur.
- **Solution** : Mode "Simple" (photo, description, prochains matchs) par défaut. Mode "Avancé" via toggle.

---

## ROADMAP — Ordre recommandé

```
SPRINT 1 — Stabilisation (cette semaine)
├── SEC-001  Clé API en .env.local                          [XS] ⬜
├── SEC-002  RLS club_managers                              [XS] ⬜
├── SEC-003  events_insert restreint admins/clubs           [XS] ⬜
├── SEC-004  Retirer role/clubId de updateProfile           [XS] ⬜
├── BUG-001  Valider fix rôle admin (hard-refresh)          [XS] 🔄
├── BUG-002  Consolider SQL policies                        [M]  ⬜
├── MOBILE-001/002/003  Safe area + scroll + tap targets    [S]  ✅
└── BUG-003  updateEvent conserve user_id original          [XS] ⬜

SPRINT 2 — Clubs indispensables (semaines 1-2)
├── EPIC-P1-1  Création événement < 15s                     [L]  ⬜
├── BUG-004  Channel Realtime nom fixe                      [XS] ⬜
├── BUG-005  Import CSV batch                               [S]  ⬜
├── BUG-006  Dark mode AdminPage                            [M]  ✅
├── PERF-001 useMemo currentUser                            [XS] ⬜
├── SEC-005  attendees_select restreint                     [XS] ⬜
└── PERF-002 event_attendee_counts SECURITY DEFINER         [S]  ⬜

SPRINT 3 — Engagement (semaines 3-4)
├── EPIC-P2-1  Partage social Instagram/WhatsApp/Facebook   [M]  ⬜
├── EPIC-P1-3  Affiches premium + export Story/Post         [L]  ⬜
├── PERF-003 React.memo EventCard                           [S]  ⬜
├── PERF-004 AttendeeCount update incrémental               [S]  ⬜
├── ARCH-002 ErrorBoundary autour des pages                 [XS] ⬜
└── UX-001   Toasts/feedback actions                        [M]  ⬜

SPRINT 4 — Mobile & Architecture (mois 2)
├── ARCH-001 Migration données statiques → Supabase seed   [L]  ✅
├── UX-002   Bottom sheet snap points                       [L]  ⬜
├── PERF-005 BottomNav 5 onglets                            [M]  ⬜
├── UX-003   Onboarding avec aha moment                     [M]  ⬜
├── SEC-006  RLS club_trainings + club_pages                [S]  ⬜
└── ARCH-003 PWA manifest + service worker                  [M]  ⬜

SPRINT 5 — Premium & Distribution (mois 3)
├── EPIC-P1-2  Pages clubs thèmes + sponsors               [L]  ⬜
├── EPIC-P4-1  Branding premium couleurs club               [M]  ⬜
├── PROD-001 Notifications push matchs                      [XL] ⬜
├── PROD-002 Lien public club + OpenGraph                   [L]  ⬜
└── PROD-003 Score live + fil actualité                     [L]  ⬜

LONG TERME
├── EPIC-P5-1  Réseau social léger (réactions, commentaires)[XL] ⬜
├── EPIC-P5-2  IA & automatisation                          [XL] ⬜
├── PROD-004 Gamification badges/streaks                    [L]  ⬜
├── PERF-006 Table club_follows dédiée                      [M]  ⬜
├── ARCH-004 Offline handling + PWA cache                   [XL] ⬜
└── UX-004   Éditeur club mode Simple/Avancé                [L]  ⬜
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
