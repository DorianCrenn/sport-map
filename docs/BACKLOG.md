# SportLink — Backlog Produit & Technique
> Restructuré le 2026-05-25 · Audit complet codebase + croisement backlog existant  
> Rôle : Lead Product + Lead Tech — priorisation stratégique

---

## Légende

| Statut | Signification |
|--------|---------------|
| ✅ | Implémenté et stable |
| ⚠️ | Partiellement fait / à vérifier |
| ⬜ | À faire |
| ❌ | Bloqué ou dépriorisé |

| Taille | Effort |
|--------|--------|
| XS | < 2h |
| S | 2–8h |
| M | 1–3 jours |
| L | 1 semaine |
| XL | 2–4 semaines |

| Impact | Valeur produit |
|--------|---------------|
| 🔵 Faible | Nice-to-have |
| 🟡 Moyen | Amélioration notable |
| 🟠 Fort | Différenciateur ou rétention |
| 🔴 Critique | Adoption / survie du produit |

---

## ✅ ACQUIS — Fonctionnalités stables (ne pas retoucher sans raison)

| Domaine | Fonctionnalité | Notes |
|---------|---------------|-------|
| Auth | Google OAuth PKCE + email/password + RLS | Retry cold start, failsafe 8s |
| Auth | RBAC : user / club_admin / admin | Trigger SECURITY DEFINER |
| Événements | CRUD complet + Realtime | Batch CSV, duplication, score live |
| Événements | Carte Leaflet + filtres sport/ville/date | Clustering, géolocalisation |
| Événements | Favoris + "J'y serai" + compteurs realtime | Supabase + localStorage |
| Événements | Commentaires + réactions emoji | Realtime via channels nommés |
| Événements | Partage WhatsApp/Facebook/Instagram/Web Share | Deeplinks #event/:id |
| Clubs | Pages clubs éditeur blocs (8 types) | Simple + Avancé, drag & drop |
| Clubs | Annonces clubs → abonnés (realtime) | AnnouncementsCenter |
| Clubs | Suivi clubs + équipes spécifiques | FollowModal, team targeting |
| Clubs | Analytics basiques (vues, abonnés, présence) | ClubDashboard.jsx |
| Clubs | Deep linking #club/:id + OpenGraph | club-page.html multi-entry |
| PosterStudio | 37 templates (24 matchs + 10 tournois + 3 spéciaux) | Export PNG pixelRatio 3 |
| PosterStudio | Éditeur visuel drag & drop | Handles précis, alignement G/C/D |
| PosterStudio | Contrôles typo : taille + 8 familles de polices | Par bloc, mode Auto/custom |
| PosterStudio | Fond IA (Pollinations.ai) + Éléments IA | AiElementEditor, 576×1024 |
| PosterStudio | DNA club (Claude Vision) + variantes auto | useClubDNA, generateVariants |
| PosterStudio | Bibliothèque joueurs (upload + mock détourage) | useClubMedia, Remove.bg API |
| PosterStudio | Draft auto-sauvegardé par événement | localStorage + Supabase |
| Covoiturage | Création, demandes, notifs realtime | MyRidesPage (346 lignes) |
| Profil | Badges XP + classements clubs/users | useBadges, leaderboards |
| PWA | Service Worker, cache Workbox, manifest | vite-plugin-pwa |
| Push | Code push notifications complet | Déploiement prod ⬜ (voir P0) |
| Infra | RLS sur toutes les tables | Politiques SQL consolidées |
| Infra | ErrorBoundary sur toutes les pages | Lazy loading pages lourdes |

---

## P0 — CRITIQUE : Adoption & Stabilité

> Ces items bloquent ou freinent directement l'adoption par les clubs. À traiter avant tout.

---

### FLOW-001 ⬜ Boucle publication ultra-rapide
**Catégorie :** Produit · UX/UI  
**Impact :** 🔴 Critique  
**Taille :** L  
**Problème :** Aujourd'hui : créer un événement → aller dans PosterStudio → choisir un template → exporter → partager = 5+ étapes et 3 écrans distincts. Sur mobile, c'est trop long et trop complexe.  
**Objectif :** Moins de 2 minutes entre la création d'un événement et le premier partage.

Sous-tâches :
- ⬜ FLOW-001a — Après création d'un événement, CTA immédiat "Générer l'affiche" avec template par défaut du club pré-sélectionné `[S]`
- ⬜ FLOW-001b — PosterStudio en mode "quick" : template + export + partage en 3 taps `[M]`
- ⬜ FLOW-001c — Bouton "Partager maintenant" en haut de PosterStudio (visible sans scroller) génère + ouvre Web Share API `[S]`
- ⬜ FLOW-001d — Depuis EventCard : bouton secondaire "📢 Créer l'affiche" accessible sans ouvrir PosterStudio `[M]`

**Dépendances :** MOBILE-PS-001 (PosterStudio mobile stable)

---

### MOBILE-PS-001 ⬜ PosterStudio mobile — audit & fiabilisation
**Catégorie :** UX/UI · Mobile  
**Impact :** 🔴 Critique  
**Taille :** L  
**Problème :** PosterStudio est le cœur du produit, mais il a été développé en pensant desktop. Sur iPhone SE (375px) et téléphones Android standards, plusieurs zones sont inaccessibles ou dysfonctionnelles.

Sous-tâches :
- ⬜ MOBILE-PS-001a — Audit complet : tester sur iOS Safari + Chrome Android, noter chaque problème `[S]`
- ⬜ MOBILE-PS-001b — Onglets du bas de PosterStudio : tap targets minimum 44px, labels visibles `[S]`
- ⬜ MOBILE-PS-001c — Éditeur drag & drop : pointer events fiables sur tactile (pointermove + touch-action) `[M]`
- ⬜ MOBILE-PS-001d — Export PNG sur mobile : tester html-to-image sur Safari iOS (souvent cassé) et corriger `[M]`
- ⬜ MOBILE-PS-001e — Sliders de contrôle (opacité, taille, rotation) : min-height 44px, confortables au doigt `[S]`
- ⬜ MOBILE-PS-001f — Safe areas iOS : padding-bottom dynamique sur les panneaux bas `[XS]`

---

### PUSH-PROD-001 ⬜ Déploiement push notifications en production
**Catégorie :** Technique · Produit  
**Impact :** 🔴 Critique  
**Taille :** S  
**Problème :** Le code push est complet (PWA Web Push, VAPID, Edge Function `send-push`, table `push_subscriptions`) mais n'est pas activé en prod.

Étapes manuelles requises :
```bash
# 1. Générer les clés VAPID (une seule fois)
npx web-push generate-vapid-keys
# → VITE_VAPID_PUBLIC_KEY dans .env
# → VAPID_PRIVATE_KEY + VAPID_SUBJECT dans Supabase Edge Functions Secrets

# 2. Appliquer la migration
# Coller supabase/migrations/20260520_push_subscriptions.sql dans SQL Editor

# 3. Déployer la Edge Function
supabase functions deploy send-push
```

Puis déclencher les notifications depuis l'app :
- ⬜ PUSH-PROD-001a — Notif "Rappel match dans 2h" (J, H-2) `[S]`
- ⬜ PUSH-PROD-001b — Notif "Résultat publié" pour abonnés du club `[S]`
- ⬜ PUSH-PROD-001c — Notif "Nouvelle annonce de [Club]" `[XS]`

**Dépendances :** Aucune — le code est prêt.

---

### STABLE-001 ⬜ Audit stabilité création d'événements
**Catégorie :** Technique · Produit  
**Impact :** 🔴 Critique  
**Taille :** M  
**Problème :** Des bugs intermittents ont été signalés sur la création/modification d'événements (synchro, permissions, délai d'apparition).

Sous-tâches :
- ⬜ STABLE-001a — Vérifier que l'événement créé apparaît immédiatement dans la carte sans refresh `[S]`
- ⬜ STABLE-001b — Vérifier cohérence user_id / club_id à la création (trigger vs frontend) `[S]`
- ⬜ STABLE-001c — Tester les permissions club_admin : peut créer, modifier, supprimer uniquement ses events `[S]`
- ⬜ STABLE-001d — Vérifier que le realtime channel ne se duplique pas sur re-render `[XS]`

---

### PERF-GLOBAL-001 ⬜ Audit performance globale
**Catégorie :** Performance  
**Impact :** 🟠 Fort  
**Taille :** M  
**Problème :** Pas d'audit de performance depuis la croissance du codebase.

Sous-tâches :
- ⬜ PERF-GLOBAL-001a — Mesurer First Contentful Paint et Time to Interactive sur mobile 4G `[S]`
- ⬜ PERF-GLOBAL-001b — Identifier les requêtes Supabase inutiles (N+1, rechargements globaux) `[M]`
- ⬜ PERF-GLOBAL-001c — Vérifier que `useLocalEvents` ne recharge pas tout le store à chaque update realtime `[S]`
- ⬜ PERF-GLOBAL-001d — Lazy loading images clubs (logos, galeries) : ajouter `loading="lazy"` systématiquement `[XS]`
- ⬜ PERF-GLOBAL-001e — Audit renders React inutiles : profiler MapPage et ClubPageView `[M]`

---

## P1 — FORTE VALEUR PRODUIT COURT TERME

---

### AUTO-001 ⬜ Génération automatique affiche post-match
**Catégorie :** Produit · IA  
**Impact :** 🔴 Critique  
**Taille :** L  
**Problème :** Actuellement, un club doit créer manuellement son affiche de résultat après chaque match. C'est une friction majeure qui limite l'adoption.  
**Objectif :** Quand un score est saisi, proposer automatiquement une affiche de résultat.

Sous-tâches :
- ⬜ AUTO-001a — Trigger UX : quand `event.score` est mis à jour, afficher un CTA "Créer l'affiche résultat" `[S]`
- ⬜ AUTO-001b — Template résultat dédié : affiche pré-configurée avec score, équipes, couleurs club `[M]`
- ⬜ AUTO-001c — Champ "Joueur du match" dans EventFormModal (facultatif) `[S]`
- ⬜ AUTO-001d — Génération en 1 clic : template résultat + données event + export direct `[M]`

**Dépendances :** FLOW-001 (boucle publication), template résultat (peut réutiliser existants)

---

### VIRAL-001 ⬜ Watermark SportLink sur les exports
**Catégorie :** Croissance · Viralité  
**Impact :** 🔴 Critique  
**Taille :** S  
**Constat :** Le backlog ancien mentionnait un watermark mais il n'est PAS implémenté (vérifié dans le code). Chaque affiche partagée est une opportunité d'acquisition manquée.

Sous-tâches :
- ⬜ VIRAL-001a — Ajouter watermark discret "Créé avec SportLink" en bas de chaque export PNG `[S]`
- ⬜ VIRAL-001b — Watermark cliquable → deeplink vers page du club `[S]`
- ⬜ VIRAL-001c — Option "Supprimer le watermark" en plan payant (plan Club Pro) `[XS]`

---

### DISTRIB-001 ⬜ Distribution multicanal depuis PosterStudio
**Catégorie :** Produit · Croissance  
**Impact :** 🟠 Fort  
**Taille :** M  
**Problème :** Les formats sont générés mais la distribution reste manuelle et fragmentée.

Sous-tâches :
- ⬜ DISTRIB-001a — Bouton "Tout exporter" : génère les 3 formats (story 9:16, carré 1:1, paysage 16:9) en une action `[M]`
- ⬜ DISTRIB-001b — Panel "Partager partout" : WhatsApp, Instagram, Facebook, Copier le lien — accessible depuis un seul CTA `[S]`
- ⬜ DISTRIB-001c — Preview "à quoi ça ressemble sur Instagram/WhatsApp" avant envoi `[M]`

**Dépendances :** FLOW-001b (mode quick PosterStudio)

---

### MEDIA-001 ⬜ Bibliothèque média club — finalisation
**Catégorie :** Produit  
**Impact :** 🟠 Fort  
**Taille :** M  
**Constat :** `useClubMedia` et l'onglet Joueurs existent (upload + mock détourage + grille). Il manque la réutilisation rapide dans PosterStudio et quelques finitions.

Sous-tâches :
- ⬜ MEDIA-001a — PS-RND-004 : drag & drop pour repositionner un joueur sur l'affiche dans PosterEditor `[M]`
- ⬜ MEDIA-001b — PS-API-002 : fallback Fal.ai BRIA RMBG 2.0 si Remove.bg quota épuisé `[M]`
- ⬜ MEDIA-001c — PS-API-003 : afficher "X imports restants ce mois" depuis `club_ai_usage` `[S]`
- ⬜ MEDIA-001d — PS-LIB-001 : tags assets joueurs (ajout/suppression inline dans la grille) `[S]`
- ⬜ MEDIA-001e — PS-LIB-004 : dossiers virtuels par équipe/saison dans la bibliothèque `[M]`

---

### ROLES-001 ⬜ Gestion rôles club multi-bénévoles
**Catégorie :** Produit  
**Impact :** 🟠 Fort  
**Taille :** M  
**Problème :** Un club a plusieurs bénévoles qui ont besoin d'accès différents (pub résultats, gestion planning, communication). Aujourd'hui, un seul `club_admin`.

Sous-tâches :
- ⬜ ROLES-001a — Définir 3 sous-rôles : `manager` (tout), `editor` (events + affiches), `communicant` (annonces) `[S]`
- ⬜ ROLES-001b — Interface invitation multi-bénévoles dans ClubManagersPanel `[M]`
- ⬜ ROLES-001c — RLS adaptées aux sous-rôles `[M]`

**Dépendances :** Existant `club_managers` table + ClubManagersPanel.jsx

---

### ANALYTICS-001 ⬜ Analytics club — enrichissement
**Catégorie :** Produit  
**Impact :** 🟡 Moyen  
**Taille :** M  
**Constat :** ClubDashboard existe (followers, pageViews par semaine, top events). Il manque les données sur les affiches et le contenu.

Sous-tâches :
- ⬜ ANALYTICS-001a — Tracker les exports d'affiches par event (table `poster_exports`) `[S]`
- ⬜ ANALYTICS-001b — Afficher "X affiches créées ce mois" dans ClubDashboard `[S]`
- ⬜ ANALYTICS-001c — Afficher "X partages via SportLink" (Web Share + WhatsApp) `[M]`

---

## P1 — CROISSANCE & VIRALITÉ

---

### VIRAL-002 ⬜ Boucle hebdomadaire automatique club
**Catégorie :** Croissance · Produit  
**Impact :** 🟠 Fort  
**Taille :** L  
**Objectif :** Créer une habitude hebdomadaire automatique : avant match → jour J → résultat → prochain match.

Sous-tâches :
- ⬜ VIRAL-002a — Rappel automatique J-1 : push notif "Votre match est demain — créez l'affiche !" `[S]` (dépend PUSH-PROD-001)
- ⬜ VIRAL-002b — Rappel J : push notif "C'est aujourd'hui !" avec CTA vers PosterStudio `[S]`
- ⬜ VIRAL-002c — Post-match : push notif "Saisissez le score et partagez votre victoire" `[S]`
- ⬜ VIRAL-002d — Préférences notifications par club_admin (quoi recevoir, quand) `[M]`

---

### VIRAL-003 ⬜ Page club publique optimisée SEO
**Catégorie :** Croissance  
**Impact :** 🟡 Moyen  
**Taille :** M  
**Constat :** `club-page.html?id=` existe avec OG tags dynamiques. Il manque le SEO structuré.

Sous-tâches :
- ⬜ VIRAL-003a — Schema.org SportsOrganization sur les pages clubs `[S]`
- ⬜ VIRAL-003b — Sitemap auto-généré avec toutes les pages clubs publiques `[M]`
- ⬜ VIRAL-003c — Canonical URL propre (slug lisible vs UUID) `[M]`

---

## P2 — AMÉLIORATION PRODUIT & TECHNIQUE

---

### EQUIPES-001 ⬜ Gestion équipes et saisons
**Catégorie :** Produit  
**Impact :** 🟡 Moyen  
**Taille :** L  
**Problème :** Les équipes sont en JSONB dans `clubs.categories` — fonctionnel mais pas structuré.

Sous-tâches :
- ⬜ EQUIPES-001a — Table `club_teams(id, club_id, name, category, season)` `[M]`
- ⬜ EQUIPES-001b — Filtre par équipe dans la vue club (matchs équipe U13, U15, seniors...) `[M]`
- ⬜ EQUIPES-001c — Archives saison : bouton "Clôturer la saison" → archive les events passés `[L]`

---

### AI-COST-001 ⬜ Optimisation et contrôle coûts IA
**Catégorie :** Technique · Monétisation  
**Impact :** 🟠 Fort  
**Taille :** M  
**Problème :** Pollinations.ai est gratuit mais sans SLA. Fal.ai et Remove.bg coûtent par appel. Aucun système de quota n'est actif.

Sous-tâches :
- ⬜ AI-COST-001a — Activer `club_ai_usage` : incrémenter à chaque génération (fond IA + détourage) `[S]`
- ⬜ AI-COST-001b — Limite mensuelle par plan (gratuit = 5 générations/mois, Pro = illimité) `[M]`
- ⬜ AI-COST-001c — Cache des générations IA : si même prompt → retourner URL existante `[M]`
- ⬜ AI-COST-001d — Monitoring coûts Fal.ai via webhook + alerte si dépassement `[S]`

---

### PROG-001 ⬜ Programmation de publications
**Catégorie :** Produit  
**Impact :** 🟡 Moyen  
**Taille :** L  
**Problème :** Les clubs ont besoin de préparer leurs communications à l'avance.

Sous-tâches :
- ⬜ PROG-001a — Champ "Publier le [date]" sur les annonces clubs `[M]`
- ⬜ PROG-001b — Edge Function cron pour déclencher les annonces programmées `[M]`
- ⬜ PROG-001c — Calendrier éditorial simple dans ClubDashboard `[L]`

---

### POSTER-ARCH-001 ⬜ Audit architecture PosterStudio
**Catégorie :** Technique  
**Impact :** 🟡 Moyen  
**Taille :** M  
**Problème :** PosterStudio est devenu le composant le plus large de l'app. Il accumule de la dette.

Sous-tâches :
- ⬜ POSTER-ARCH-001a — Mesurer mémoire utilisée avec 5 templates chargés simultanément `[S]`
- ⬜ POSTER-ARCH-001b — Virtualiser la galerie de templates (IntersectionObserver existant — à vérifier sur ≥37 templates) `[S]`
- ⬜ POSTER-ARCH-001c — Extraire la logique IA (génération fond + éléments) dans un hook dédié `usePosterAI` `[M]`
- ⬜ POSTER-ARCH-001d — PS-LIB-002 : versions d'un asset joueur (historique) `[M]`
- ⬜ POSTER-ARCH-001e — PS-LIB-003 : remplacement image sans changer l'ID `[M]`

---

### CONTENT-001 ⬜ Photos d'événements
**Catégorie :** Produit · Communauté  
**Impact :** 🟡 Moyen  
**Taille :** L  
**Problème :** Après un match, les clubs n'ont nulle part pour publier leurs photos dans l'app.

Sous-tâches :
- ⬜ CONTENT-001a — Upload photos post-event (max 10, stockage Supabase Storage) `[M]`
- ⬜ CONTENT-001b — Galerie événement visible dans EventCard / EventSidebar `[M]`
- ⬜ CONTENT-001c — Photo → réutilisable dans PosterStudio comme fond `[M]`

---

### TS-001 ⬜ Migration progressive TypeScript
**Catégorie :** Technique · Dette  
**Impact :** 🔵 Faible (court terme) / 🟡 Moyen (long terme)  
**Taille :** XL  
**Recommandation :** Ne pas tout migrer d'un coup. Commencer par les nouveaux modules.

Sous-tâches :
- ⬜ TS-001a — Configurer `tsconfig.json` en mode `allowJs: true` + `checkJs: true` (zéro refacto) `[S]`
- ⬜ TS-001b — Typer `src/lib/schemas.js` → `.ts` (Zod schemas déjà là) `[S]`
- ⬜ TS-001c — Typer les nouveaux hooks en `.ts` au fur et à mesure `[ongoing]`
- ⬜ TS-001d — Générer les types Supabase : `supabase gen types typescript` `[S]`

---

## P3 — CONFORT, LONG TERME & EXPÉRIMENTAL

---

### GAMIF-001 ⚠️ Gamification — maintenir mais ne pas étendre
**Catégorie :** Produit · Communauté  
**Impact :** 🔵 Faible (priorité actuelle)  
**Constat :** Badges, XP, classements clubs/users sont ✅ implémentés. Streaks aussi. C'est suffisant pour la phase actuelle. Ne pas investir davantage tant que la boucle club (publication, engagement) n'est pas parfaite.  
**Action :** Garder stable. Pas de nouvelles features gamification avant P1 completé.

---

### CARP-001 ⚠️ Covoiturage — maintenir mais ne pas étendre
**Catégorie :** Produit  
**Impact :** 🟡 Moyen  
**Constat :** Système complet ✅. Fonctionne bien. Peu utilisé si la base utilisateurs est petite.  
**Action :** Corriger les bugs remontés. Pas de nouvelle feature avant que la base utilisateurs dépasse ~500 actifs.

---

### FUTURE-001 ⬜ Auto-communication post-match
**Catégorie :** IA · Automatisation  
**Impact :** 🟠 Fort (quand la base est là)  
**Taille :** XL  
**Description :** Générer automatiquement une annonce textuelle après un résultat (style "L'équipe U15 a gagné 3-1 contre [adversaire] ce weekend ! Prochain match le [date].") et proposer de la publier en 1 clic.

---

### FUTURE-002 ⬜ Digests hebdomadaires email
**Catégorie :** Croissance  
**Impact :** 🟡 Moyen  
**Taille :** L  
**Description :** Email hebdomadaire automatique aux abonnés d'un club : résultats de la semaine + prochains matchs.

---

### FUTURE-003 ⬜ Motion Posters (vidéo)
**Catégorie :** IA · Génération  
**Impact :** 🟠 Fort (long terme)  
**Taille :** XL  
**Description :** Affiches animées pour Reels et Stories vidéo. Architecture `motion_layers` à préparer dans le schema `posters`.  
**Recommandation :** Préparer le schema maintenant (`PS-FUT-001`), implémenter plus tard (Remotion ou ffmpeg).

---

### FUTURE-004 ⬜ Offline complet (mode dégradé)
**Catégorie :** Technique · Mobile  
**Impact :** 🔵 Faible (phase actuelle)  
**Taille :** XL  
**Description :** Cache Supabase complet via Service Worker. Afficher les événements/clubs en mode déconnecté.  
**Recommandation :** Reporter après que la base utilisateurs dépasse ~1000 actifs.

---

## ROADMAP SYNTHÉTIQUE

```
SPRINT ACTUEL (Mai–Juin 2026)
├── PUSH-PROD-001   Déployer push notifications en prod        [S]  🔴
├── MOBILE-PS-001   Audit + fix PosterStudio mobile            [L]  🔴
├── FLOW-001        Boucle publication ultra-rapide            [L]  🔴
├── STABLE-001      Audit stabilité création événements        [M]  🔴
└── VIRAL-001       Watermark SportLink sur exports            [S]  🔴

SPRINT SUIVANT (Juin–Juillet 2026)
├── AUTO-001        Génération affiche post-match              [L]  🔴
├── DISTRIB-001     Distribution multicanal                    [M]  🟠
├── MEDIA-001       Bibliothèque média — finalisation          [M]  🟠
├── VIRAL-002       Boucle hebdomadaire automatique            [L]  🟠
└── PERF-GLOBAL-001 Audit performance globale                  [M]  🟠

SPRINT 3 (Juillet–Août 2026)
├── ROLES-001       Gestion multi-bénévoles club               [M]  🟠
├── AI-COST-001     Contrôle coûts IA + quotas                 [M]  🟠
├── ANALYTICS-001   Analytics enrichies affiches               [M]  🟡
├── CONTENT-001     Photos d'événements                        [L]  🟡
└── POSTER-ARCH-001 Audit architecture PosterStudio            [M]  🟡

SPRINT 4 (Automne 2026)
├── EQUIPES-001     Gestion équipes + saisons                  [L]  🟡
├── VIRAL-003       SEO pages clubs                            [M]  🟡
├── PROG-001        Programmation publications                 [L]  🟡
└── TS-001          Migration TypeScript progressive           [XL] 🔵

LONG TERME
├── FUTURE-001      Auto-communication post-match IA           [XL] 🟠
├── FUTURE-002      Digests email hebdomadaires                [L]  🟡
├── FUTURE-003      Motion Posters vidéo                       [XL] 🟠
└── FUTURE-004      Offline complet PWA                        [XL] 🔵
```

---

## ANALYSE STRATÉGIQUE

### ⚡ Quick Wins — Fort impact, effort minimal

| ID | Feature | Effort | Impact |
|----|---------|--------|--------|
| VIRAL-001 | Watermark "Créé avec SportLink" sur exports | S | 🔴 Viralité organique immédiate |
| PUSH-PROD-001 | Activer push notifications (code ✅, config ⬜) | S | 🔴 Engagement immédiat |
| FLOW-001c | Bouton "Partager maintenant" visible dans PosterStudio | S | 🔴 Réduction friction majeure |
| FLOW-001a | CTA "Créer l'affiche" après création événement | S | 🟠 Boucle produit fluide |
| PERF-GLOBAL-001d | Lazy loading images systématique | XS | 🟡 Perf mobile immédiate |

---

### 🏆 Fonctionnalités différenciantes — À pousser fort

Ces features n'existent pas chez les concurrents directs (Splio, Teameo, etc.) :

1. **PosterStudio IA** — Génération d'affiches avec identité visuelle club automatique. Aucun concurrent ne propose ça à ce niveau pour les clubs amateurs.
2. **Boucle publication post-match automatique** (AUTO-001) — Résultat saisi → affiche générée → partagée en 2 taps. Énorme différenciateur si fluide.
3. **DNA visuel club** — L'IA analyse l'identité d'un club et génère des affiches cohérentes. Unique sur ce marché.
4. **Covoiturage intégré** — Valeur réelle pour les petits clubs ruraux bretons. Personne ne le fait.

---

### 🗑️ Fonctionnalités probablement inutiles ou prématurées

| Feature | Raison |
|---------|--------|
| Migration TypeScript complète | Effort XL, zéro valeur utilisateur, à faire progressivement seulement |
| Offline complet PWA | Aucun usage identifié avant 1000+ utilisateurs actifs |
| Gamification avancée (extensions) | Badges/XP déjà faits, les clubs n'utilisent pas l'app pour le jeu |
| Motion Posters / vidéo | Trop tôt, mais préparer l'architecture schema maintenant |
| Suggestions IA événements | Pas assez de données comportementales pour être pertinent |
| Détection résultats depuis photos | Technologiquement complexe, valeur incertaine |
| Versions d'assets (historique) | Ultra-secondaire, aucun club ne demande ça à ce stade |

---

### ⚠️ Risques techniques majeurs

| Risque | Probabilité | Sévérité | Mitigation |
|--------|-------------|----------|------------|
| `html-to-image` cassé sur Safari iOS | Haute | Critique | Tester sur iPhone réel + fallback `canvas.toBlob()` |
| Pollinations.ai rate limit ou downtime | Moyenne | Fort | Fallback Unsplash API ou fonds statiques pré-générés |
| Supabase realtime — connexions multiples | Moyenne | Moyen | Canaux nommés fixes (déjà fait), monitorer |
| Coût Fal.ai non maîtrisé | Haute | Fort | AI-COST-001 prioritaire |
| CORS canvas avec logos externes | Faible | Critique | `crossOrigin="anonymous"` déjà en place |
| PWA push permission < 15% opt-in | Haute | Moyen | Proposer au bon moment (après engagement), message contextualisé |
| Données statiques `events.js` / `clubs.js` désynchronisées avec Supabase | Haute | Moyen | Migration progressive, noter les IDs statiques |

---

*Backlog vivant — mis à jour à chaque sprint. Chaque item complété → changer ⬜ en ✅ avec date.*
