# SportLink — Backlog Technique & Produit
> Document vivant — mis à jour au fil des sprints  
> Dernière mise à jour : 2026-05-17

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

---

## P0 — À corriger immédiatement (bloquant / critique)

### SEC-001 🔴 Clé Supabase hardcodée dans le repo Git
- **Catégorie** : Sécurité
- **Complexité** : XS
- **Problème** : `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont en clair dans `src/lib/supabase.js`, commités dans l'historique Git. Toute personne ayant accès au repo peut lire la clé et faire des requêtes directes à l'API.
- **Impact utilisateur** : Aucun direct, mais un acteur malveillant peut spammer la DB ou scraper les données.
- **Impact business** : Quota Supabase épuisable, données exposées, non-conformité RGPD.
- **Solution** : Créer `.env.local` (non commité), utiliser `import.meta.env.VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`. Ajouter `.env.local` au `.gitignore`. Documenter dans un `.env.example`.
- **Note** : La clé `anon` Supabase est semi-publique by design — la vraie protection reste les RLS. Mais la bonne pratique s'impose avant de scaler.

---

### SEC-002 🔴 Table `club_managers` sans RLS
- **Catégorie** : Sécurité / Supabase
- **Complexité** : XS
- **Problème** : La table `club_managers` n'a aucune policy RLS définie dans les fichiers SQL. N'importe qui peut lire les emails de tous les managers de tous les clubs, ou s'ajouter comme manager d'un club arbitraire via l'API Supabase directe.
- **Impact utilisateur** : Emails de bénévoles/dirigeants exposés publiquement.
- **Impact business** : Fuite RGPD, perte de confiance des clubs.
- **Solution** :
  ```sql
  ALTER TABLE club_managers ENABLE ROW LEVEL SECURITY;
  -- Lecture : owner du club ou admin
  CREATE POLICY "managers_select_owner" ON club_managers FOR SELECT
    USING (EXISTS (SELECT 1 FROM clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')));
  -- Écriture : owner du club uniquement
  CREATE POLICY "managers_insert_owner" ON club_managers FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid()));
  CREATE POLICY "managers_delete_owner" ON club_managers FOR DELETE
    USING (EXISTS (SELECT 1 FROM clubs WHERE clubs.id::text = club_id AND clubs.user_id = auth.uid()));
  ```

---

### SEC-003 🔴 `events_insert` ouvert à tous les utilisateurs authentifiés
- **Catégorie** : Sécurité / RBAC
- **Complexité** : XS
- **Problème** : La policy RLS `events_insert_authenticated` autorise n'importe quel compte inscrit à créer des événements via l'API directe, contournant le garde `canAddEvent` du frontend.
- **Impact utilisateur** : Spam d'événements, pollution de la carte.
- **Impact business** : Modération impossible à l'échelle, atteinte à la qualité du contenu.
- **Solution** :
  ```sql
  DROP POLICY IF EXISTS "events_insert_authenticated" ON events;
  CREATE POLICY "events_insert_admin_or_club"
    ON events FOR INSERT WITH CHECK (
      auth.uid() IS NOT NULL
      AND user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin', 'club_admin')
      )
    );
  ```

---

### BUG-001 🔴 Rôle admin cassé après connexion sur Supabase cold start
- **Catégorie** : Auth / Bug
- **Complexité** : S (fix poussé, validation en attente)
- **Problème** : Sur le free tier Supabase, le projet se met en pause après 7 jours d'inactivité. Au réveil, les queries DB prennent 5–15 secondes. L'ancien timeout de 5s dans `login()` expirait → `setProfile(null)` → rôle = 'user' → menu admin invisible.
- **Impact utilisateur** : Admin voit "Membre", perd accès à l'administration.
- **Impact business** : Bloquant pour la gestion de la plateforme.
- **Solution appliquée** (commit `7b03efc`) :
  - Timeout `login()` passé de 5s à 12s
  - `setProfile` utilise update fonctionnel (`prev => prof !== null ? prof : prev`)
  - `useEffect` de retry si `authUser` set mais `profile` null après 4s
- **Action restante** : Hard-refresh + reconnexion pour valider le fix.

---

### SEC-004 🔴 Escalade de rôle via `updateProfile`
- **Catégorie** : Sécurité / RBAC
- **Complexité** : XS
- **Problème** : `updateProfile()` dans AuthContext inclut `role` dans son mapping. Un utilisateur pourrait théoriquement appeler `updateProfile({ role: 'admin' })`. La RLS bloque en DB, mais le pattern est dangereux et la protection dépend de la bonne configuration SQL.
- **Impact utilisateur** : Escalade de privilèges potentielle.
- **Solution** : Retirer `role` et `clubId` du mapping `updateProfile`. Ces champs ne doivent être modifiables que par un admin via `AdminPage > updateUserRole`.
  ```js
  // Dans AuthContext.jsx, supprimer de `map` :
  // role: 'role',
  // clubId: 'club_id',
  ```

---

### BUG-002 🔴 Policies SQL en conflit entre `schema.sql` et `rls_policies.sql`
- **Catégorie** : Supabase / Sécurité
- **Complexité** : M
- **Problème** : Les deux fichiers définissent des policies sur `profiles` avec des noms différents. Selon l'ordre d'exécution, le comportement en production est imprévisible. `profiles_select_public (USING true)` de `schema.sql` et `profiles_select_own_or_admin` de `rls_policies.sql` coexistent et s'OR-ent → tout le monde peut lire tous les profils.
- **Impact utilisateur** : Données de profil (rôle, clubs suivis) lisibles publiquement.
- **Impact business** : Non-conformité RGPD si des données sensibles sont stockées.
- **Solution** : Consolider en un seul fichier `supabase/policies.sql` idempotent avec des `DROP POLICY IF EXISTS` exhaustifs avant chaque `CREATE POLICY`. Supprimer `schema.sql` et `rls_policies.sql` séparés ou les marquer comme archives.

---

## P1 — Sprint suivant (haute priorité)

### BUG-003 🟠 `updateEvent` réassigne le `user_id` de l'event
- **Catégorie** : Backend / Bug
- **Complexité** : XS
- **Problème** : Dans `useLocalEvents.js:105`, `mapToDB({ ...prev, ...data }, currentUser?.id)` passe le `user_id` du **modificateur** à chaque update. Un admin qui modifie l'événement d'un autre utilisateur s'en approprie la propriété en DB.
- **Impact utilisateur** : L'auteur original perd la propriété de son événement, ne peut plus le modifier.
- **Solution** : Conserver le `user_id` original de l'event lors des updates. Passer `prev.userId` plutôt que `currentUser?.id`.

---

### BUG-004 🟠 Channel Realtime avec nom aléatoire — fuites de connexions
- **Catégorie** : Performance / Supabase
- **Complexité** : XS
- **Problème** : `useLocalEvents.js:63` génère `'events-realtime-' + Math.random()...` à chaque mount. Si le composant se remonte (changement d'onglet), une nouvelle souscription est créée. Si le cleanup s'exécute avec délai, deux channels sont actifs simultanément.
- **Solution** : Utiliser un nom fixe `'events-realtime'`.

---

### PERF-001 🟠 `currentUser` recréé à chaque render d'AuthProvider
- **Catégorie** : Performance / React
- **Complexité** : XS
- **Problème** : `const currentUser = mapProfile(authUser, profile)` crée un nouvel objet à chaque render d'AuthProvider. Tout changement de `follows`, `loading` ou autre état du provider force un re-render de tous les consumers.
- **Impact** : Re-renders inutiles sur toute l'arbre de composants.
- **Solution** :
  ```js
  const currentUser = useMemo(() => mapProfile(authUser, profile), [authUser, profile]);
  ```

---

### BUG-005 🟠 `bulkAddEvents` : import CSV séquentiel, bloquant
- **Catégorie** : Performance / UX
- **Complexité** : S
- **Problème** : L'import CSV fait une boucle `for...await` avec un insert Supabase par événement. 50 événements = 50 requêtes séquentielles, l'UI est bloquée pendant plusieurs secondes sans feedback.
- **Impact utilisateur** : Import lent, pas de progression visible, l'app semble freezée.
- **Solution** : Utiliser `supabase.from('events').insert([...eventsArray])` en batch unique + un seul `setEvents` optimiste.

---

### SEC-005 🟠 `attendees_select_public` — données personnelles exposées
- **Catégorie** : Sécurité / RGPD / Supabase
- **Complexité** : S
- **Problème** : `USING (true)` sur `attendees` permet de requêter qui assiste à quels événements, avec les `user_id`. Couplé à `profiles_select_public`, on peut corréler UUID → nom → présence à un événement. Sensible RGPD.
- **Impact business** : Risque légal, perte de confiance utilisateurs.
- **Solution** : Changer la policy SELECT à `USING (user_id = auth.uid())`. Les comptes agrégés restent accessibles via la view `event_attendee_counts`.

---

### PERF-002 🟠 `event_attendee_counts` view ne bypasse pas le RLS
- **Catégorie** : Supabase / Performance
- **Complexité** : S
- **Problème** : La view est créée sans `SECURITY DEFINER`. Les queries héritent du RLS de l'utilisateur courant → les counts ne reflètent que les attendances de l'utilisateur lui-même, pas le total.
- **Impact utilisateur** : Compteurs "J'y serai" toujours à 0 ou 1 pour les autres utilisateurs.
- **Solution** :
  ```sql
  -- Recréer avec security_invoker désactivé (Supabase PG 15+)
  DROP VIEW IF EXISTS public.event_attendee_counts;
  CREATE VIEW public.event_attendee_counts
  WITH (security_invoker = false)
  AS SELECT event_id, COUNT(*)::int AS count FROM public.attendees GROUP BY event_id;
  ```

---

### ARCH-001 🟠 Double source de vérité : données statiques + Supabase
- **Catégorie** : Architecture / Backend
- **Complexité** : L
- **Problème** : `src/data/events.js` et `src/data/clubs.js` coexistent avec les tables Supabase. Les IDs statiques (`"evt_001"`) et UUID Supabase se mélangent dans `allEvents`. La déduplication Realtime est fragile.
- **Impact** : Bugs potentiels de doublon, IDs incohérents, maintenabilité réduite.
- **Solution** : Migrer les données statiques en seed SQL (`supabase/seed.sql`). Supprimer les fichiers `data/events.js` et `data/clubs.js`. Un seul pipeline de données via Supabase.
- **Dépendance** : Nécessite de tester que tous les composants fonctionnent sans les données statiques.

---

### UX-001 🟠 Aucun feedback visuel sur les actions utilisateur
- **Catégorie** : UX/UI
- **Complexité** : M
- **Problème** : Les actions clés (J'y serai, favori, création événement, connexion) n'ont pas de feedback explicite. L'utilisateur ne sait pas si son action a fonctionné.
- **Impact utilisateur** : Confusion, double-clic, sentiment de bug.
- **Solution** : Système de toasts/notifications léger (sans librairie — 20 lignes de CSS + context React). Messages types : "Événement créé !", "Ajouté aux favoris", "Inscription confirmée".

---

### BUG-006 🟠 Dark mode incomplet — AdminPage et certains composants
- **Catégorie** : Frontend / UX
- **Complexité** : M
- **Problème** : `AdminPage.jsx` utilise des classes Tailwind hardcodées (`bg-white`, `text-gray-800`, `bg-[#F1F5F9]`) qui ne réagissent pas aux CSS vars du thème dark/light.
- **Impact utilisateur** : AdminPage reste en thème clair même en mode dark. Incohérence visuelle.
- **Solution** : Remplacer les couleurs hardcodées par `var(--sl-card)`, `var(--sl-t1)`, `var(--sl-surface)`, `var(--sl-border)` dans AdminPage et tout composant identifié.

---

## P2 — Améliorations importantes (moyen terme)

### PERF-003 🟡 `React.memo` manquant sur EventCard
- **Catégorie** : Performance / React
- **Complexité** : S
- **Problème** : `EventCard` est rendu dans des listes (sidebar, favoris). Chaque mouvement de la carte Leaflet provoque un re-render de toutes les cards.
- **Solution** : `export default React.memo(EventCard)` + `useCallback` sur les handlers `onToggleFavorite`, `onToggleAttend` dans les composants parents.

---

### PERF-004 🟡 `AttendeeCountContext` : reload global sur chaque event Realtime
- **Catégorie** : Performance / Supabase
- **Complexité** : S
- **Problème** : Le channel Realtime sur `attendees` appelle `load()` (rechargement complet de tous les counts) à chaque insert/delete d'un attendee. À 100 utilisateurs simultanés, ça génère 100 requêtes par seconde.
- **Solution** : Dans le handler Realtime, mettre à jour uniquement le count de l'`event_id` concerné :
  ```js
  .on('postgres_changes', ..., ({ eventType, new: row, old }) => {
    const id = String((row ?? old).event_id);
    setCounts(prev => ({
      ...prev,
      [id]: (prev[id] ?? 0) + (eventType === 'INSERT' ? 1 : -1)
    }));
  })
  ```

---

### ARCH-002 🟡 Pas d'ErrorBoundary autour des pages critiques
- **Catégorie** : Architecture / Frontend
- **Complexité** : XS
- **Problème** : `ErrorBoundary.jsx` existe mais n'est utilisé nulle part. Un crash dans MapPage/Leaflet fait tomber toute l'app.
- **Solution** : Wrapper chaque page dans `<ErrorBoundary fallback={<PageErrorState />}>`. Particulièrement critique pour MapPage et ClubPageView.

---

### UX-002 🟡 Bottom sheet non progressif — expérience sub-Google Maps
- **Catégorie** : UX/UI / Mobile
- **Complexité** : L
- **Problème** : Le bottom sheet actuel (52dvh fixe) n'a pas de snap points progressifs. Il n'y a pas de "peek" pour voir juste le titre de l'event sans bloquer la carte.
- **Impact utilisateur** : La moitié de la carte est masquée à l'ouverture. Expérience en dessous des standards (Google Maps, Airbnb).
- **Solution** : Implémenter 3 snap points : 15% (peek titre uniquement), 55% (détail), 95% (plein écran). Utiliser Framer Motion `drag` + `dragConstraints` + `onDragEnd` pour détecter le snap.

---

### UX-003 🟡 Onboarding sans "aha moment"
- **Catégorie** : UX/UI / Produit
- **Complexité** : M
- **Problème** : Après l'onboarding (sélection sports), l'utilisateur arrive sur une carte vide sans contexte. Il ne comprend pas la valeur produit.
- **Impact business** : Taux d'abandon post-inscription élevé.
- **Solution** : Après l'onboarding, afficher une card contextuelle : "Voici les événements de [sport choisi] près de chez vous cette semaine" avec navigation directe vers la carte filtrée.

---

### MOBILE-001 🟡 Safe-area insets non systématiques
- **Catégorie** : Mobile / UX
- **Complexité** : S
- **Problème** : `env(safe-area-inset-bottom)` est appliqué dans MapPage mais pas sur tous les overlays, modales et la BottomNav. Sur iPhone avec Dynamic Island, des éléments sont partiellement masqués.
- **Solution** : Créer une CSS var globale `--safe-bottom: env(safe-area-inset-bottom, 0px)` et l'appliquer systématiquement sur tous les composants avec `bottom: 0`.

---

### MOBILE-002 🟡 Scroll imbriqués sur iOS Safari
- **Catégorie** : Mobile / UX
- **Complexité** : S
- **Problème** : `ClubPageView` a un scroll principal + des blocs avec scroll interne (galerie, liste matchs). Sur iOS, le momentum scroll des deux couches s'applique simultanément → désorientant.
- **Solution** : Ajouter `overscroll-behavior: contain` sur les conteneurs enfants scrollables. Bloquer le scroll parent pendant l'interaction sur un enfant avec `touch-action: pan-y`.

---

### MOBILE-003 🟡 Tap targets inférieurs à 44px
- **Catégorie** : Accessibilité / Mobile
- **Complexité** : S
- **Problème** : Boutons d'action dans EventCard (favoris, J'y serai), bouton fermer des modales : environ 32px. Standard iOS HIG et Material Design : 44px minimum.
- **Impact utilisateur** : Mauvaise précision tactile, frustration sur mobile.
- **Solution** : Utiliser `min-w-[44px] min-h-[44px]` sur tous les boutons d'action, ou ajouter du padding invisible avec `padding: calc((44px - icon_size) / 2)`.

---

### PERF-005 🟡 Navigation 7 onglets — trop pour le mobile
- **Catégorie** : UX/UI / Mobile
- **Complexité** : M
- **Problème** : La BottomNav a 7 onglets (home, map, favoris, news, clubs, profil, admin). Sur un écran de 375px, les icônes sont trop petites et les labels illisibles.
- **Impact utilisateur** : Navigation confuse, découvrabilité réduite.
- **Solution** : Réduire à 5 onglets principaux (home, map, favoris, clubs, profil). Déplacer admin dans le menu profil. Déplacer news dans home ou clubs.

---

### ARCH-003 🟡 Pas de PWA — app non installable
- **Catégorie** : Mobile / Architecture
- **Complexité** : M
- **Problème** : Pas de `manifest.json`, pas de service worker. L'app ne peut pas être "installée" depuis Safari/Chrome sur mobile. Pas de support offline.
- **Impact business** : Friction à l'adoption mobile, pas de push notifications natives possibles.
- **Solution** : Ajouter `vite-plugin-pwa`. Configurer manifest (icônes, thème), cache strategy pour les assets statiques, offline fallback page.

---

### SEC-006 🟡 `club_trainings` et `club_pages` sans RLS confirmée
- **Catégorie** : Sécurité / Supabase
- **Complexité** : S
- **Problème** : Ces tables ne sont pas mentionnées dans les fichiers SQL de policies. Si RLS n'est pas activée, elles sont en mode "public" par défaut.
- **Solution** : Vérifier dans le dashboard Supabase. Ajouter policies similaires à `clubs` (SELECT public, INSERT/UPDATE/DELETE owner ou admin).

---

## P3 — Améliorations futures (long terme)

### PROD-001 🟢 Notifications push — matchs et rappels
- **Catégorie** : Produit / Mobile
- **Complexité** : XL
- **Problème** : Aucune notification proactive. L'utilisateur doit revenir manuellement pour voir les nouveaux événements.
- **Impact business** : Rétention faible sans push. Les apps sportives les plus engageantes (FotMob, Sofascore) reposent massivement sur les notifications.
- **Solution** : PWA Web Push API + Supabase Edge Functions pour déclencher les notifications (match dans 24h, score mis à jour).

---

### PROD-002 🟢 Lien public par club avec OpenGraph
- **Catégorie** : Produit / Marketing
- **Complexité** : L
- **Problème** : Pas de lien partageable par club. Les clubs ne peuvent pas mettre "notre page SportLink" dans leur description Facebook/WhatsApp.
- **Impact business** : Viralité bloquée. Chaque club partagé = acquisition potentielle de nouveaux utilisateurs.
- **Solution** : Route publique `/club/:id` SSR ou génération de page statique avec meta OG. Peut être une landing simple sans auth required.

---

### PROD-003 🟢 Score live + fil d'actualité
- **Catégorie** : Produit / Engagement
- **Complexité** : L
- **Problème** : La colonne `score` existe en DB mais n'est pas mise à jour en temps réel. L'onglet News est vide. Pas de raison de revenir quotidiennement.
- **Solution** : Interface de saisie de score rapide pour les club_admins. Feed Realtime des résultats des clubs suivis sur la page d'accueil.

---

### PROD-004 🟢 Gamification — badges et streaks
- **Catégorie** : Produit / Engagement
- **Complexité** : L
- **Problème** : Aucune mécanique d'engagement récurrent. Pas de récompense pour l'utilisation régulière.
- **Impact business** : Rétention à 30 jours très faible sans gamification dans les apps communautaires sportives.
- **Solution** : Badges "J'y étais" après un événement passé, badge "Fan fidèle" après 5 J'y serai dans un club, classement clubs les plus actifs du mois.

---

### PERF-006 🟢 `club_follower_counts` — query non scalable
- **Catégorie** : Performance / Supabase
- **Complexité** : M
- **Problème** : La view scanne toute la table `profiles` pour unnest le tableau `followed_clubs`. À 10 000 utilisateurs, chaque appel = full table scan.
- **Solution long terme** : Table `club_follows(user_id, club_id, created_at)` dédiée avec index sur `club_id`. Élimination complète de `profiles.followed_clubs` pour les abonnements.

---

### ARCH-004 🟢 Offline handling — cache et mode dégradé
- **Catégorie** : Architecture / Mobile
- **Complexité** : XL
- **Problème** : Si Supabase est indisponible ou l'utilisateur hors réseau, toute l'app affiche des états vides silencieux. Aucun cache, aucun message d'erreur.
- **Impact utilisateur** : App inutilisable sur un terrain de sport sans réseau.
- **Solution** : Cache Supabase avec service worker (PWA). Affichage des dernières données connues + banner "Mode hors ligne — données du [date]".

---

### UX-004 🟢 Éditeur page club — mode Simple vs Avancé
- **Catégorie** : UX/UI / Produit
- **Complexité** : L
- **Problème** : L'éditeur de blocs drag-and-drop est puissant mais intimidant pour un président de club amateur de 50 ans peu tech.
- **Impact business** : Taux d'adoption éditeur faible = pages clubs vides = valeur perçue réduite.
- **Solution** : Mode "Simple" (photo, description, prochains matchs — 3 champs) par défaut. Mode "Avancé" (blocs complets) accessible via toggle.

---

## ROADMAP — Ordre recommandé

```
PHASE 0 — Hotfixes (cette semaine)
├── SEC-001  Clé API en .env.local                         [XS] ✓ à faire
├── SEC-002  RLS club_managers                             [XS] ✓ à faire  
├── SEC-003  events_insert restreint aux admins/clubs      [XS] ✓ à faire
├── SEC-004  Retirer role/clubId de updateProfile          [XS] ✓ à faire
└── BUG-001  Valider fix rôle admin (hard-refresh)         [XS] ✓ en cours

PHASE 1 — Sprint 1 (semaines 1-2)
├── BUG-002  Consolider SQL policies en un seul fichier    [M]
├── BUG-003  updateEvent conserve le user_id original      [XS]
├── BUG-004  Channel Realtime nom fixe                     [XS]
├── SEC-005  attendees_select restreint                    [XS]
├── PERF-002 event_attendee_counts SECURITY DEFINER        [S]
├── PERF-001 useMemo currentUser                           [XS]
└── UX-001   Système de toasts/feedback actions            [M]

PHASE 2 — Sprint 2 (semaines 3-4)
├── BUG-005  Import CSV batch                              [S]
├── BUG-006  Dark mode AdminPage                           [M]
├── PERF-003 React.memo EventCard                          [S]
├── PERF-004 AttendeeCount update incrémental              [S]
├── MOBILE-001 Safe-area systématique                      [S]
├── MOBILE-003 Tap targets 44px                            [S]
└── ARCH-002 ErrorBoundary autour des pages                [XS]

PHASE 3 — Sprint 3 (mois 2)
├── ARCH-001 Migration données statiques → Supabase seed  [L]
├── UX-002   Bottom sheet snap points                      [L]
├── PERF-005 BottomNav 5 onglets                           [M]
├── MOBILE-002 Scroll imbriqués iOS                        [S]
├── UX-003   Onboarding avec aha moment                    [M]
└── SEC-006  RLS club_trainings + club_pages               [S]

PHASE 4 — Sprint 4 (mois 3)
├── ARCH-003 PWA manifest + service worker                 [M]
├── PROD-001 Notifications push matchs                     [XL]
├── PROD-002 Lien public club + OpenGraph                  [L]
└── PROD-003 Score live + fil actualité                    [L]

PHASE 5 — Long terme
├── PROD-004 Gamification badges/streaks                   [L]
├── PERF-006 Table club_follows dédiée                     [M]
├── ARCH-004 Offline handling + PWA cache                  [XL]
└── UX-004   Éditeur club mode Simple/Avancé               [L]
```

---

## Dépendances techniques

```
SEC-003 (events_insert RLS) → dépend de BUG-002 (SQL consolidé)
PERF-002 (view SECURITY DEFINER) → nécessite accès Supabase SQL Editor
ARCH-001 (migration seed) → ARCH-004 (offline cache) → PROD-001 (push)
ARCH-003 (PWA) → PROD-001 (notifications push)
PROD-002 (lien public club) → potentiel SSR (Vite SSR ou Astro)
```

---

*Ce backlog est vivant. Chaque item complété doit être coché et daté. Les nouvelles découvertes sont ajoutées en P0 si critiques, sinon en P2/P3.*
