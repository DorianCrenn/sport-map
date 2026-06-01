# SportLink — Plans d'abonnement

> Document officiel de référence. Toute modification de feature gating commence ici.
> Source de vérité technique : `src/lib/subscriptionFeatures.ts`

---

## Vue d'ensemble

SportLink propose quatre plans d'abonnement pour les clubs sportifs.
Les utilisateurs individuels (joueurs, supporters) accèdent à la plateforme gratuitement.

| Plan | Prix | Objectif |
|------|------|----------|
| **Gratuit** | 0 € | Découvrir SportLink et gérer son club au quotidien |
| **Starter** | 9 €/mois | Communication club améliorée |
| **Club Pro** | 29 €/mois | Gestion complète d'un club amateur |
| **Elite** | 59 €/mois | Automatisation et IA |

---

## Plan Gratuit (0 €)

**Objectif** : Permettre à tous les clubs de découvrir SportLink et de l'utiliser au quotidien.

### Inclus

- Calendrier des événements (matchs, tournois, entraînements)
- Résultats et scores
- Actualités et feed des clubs
- Carte Leaflet interactive
- Création et gestion de club
- Gestion des équipes
- Suivi des clubs (abonnement utilisateur)
- Notifications standard push
- PosterStudio — Mode Simple uniquement
- **3 affiches par mois**
- Dashboard club basique

### Restrictions

- Filigrane SportLink obligatoire sur toutes les affiches
- Covoiturage verrouillé
- Compositions d'équipes verrouillées
- Statistiques verrouillées
- Sponsors verrouillés
- Featured events verrouillés
- Mode Expert PosterStudio verrouillé
- IA (fonds, éléments, charte graphique) verrouillée

---

## Plan Starter (9 €/mois)

**Objectif** : Communication club améliorée.

### Inclus (tout le plan Gratuit +)

- **PosterStudio illimité** (aucune limite mensuelle)
- **Mode Expert** PosterStudio débloqué
- **Suppression du filigrane** SportLink sur les affiches
- Accès aux templates graphiques avancés
- Covoiturage pour **1 équipe configurée** (à choisir dans les paramètres)
- Accès aux futures options graphiques avancées

### Restrictions

- Aucune statistique équipe ni joueur
- Aucune composition d'équipe avancée
- Aucune gestion de sponsors
- Featured events verrouillés
- IA PosterStudio verrouillée
- Quota IA : 10 générations/mois, 10 imports/mois (fonds et éléments)

---

## Plan Club Pro (29 €/mois)

**Objectif** : Gestion complète d'un club amateur.

### Inclus (tout le plan Starter +)

- **Compositions d'équipes**
- **Générateur de compositions**
- **Statistiques équipes**
- **Statistiques joueurs**
- **Covoiturage pour toutes les équipes** (illimité)
- **Sponsors sur les affiches** PosterStudio
- **Cartes sponsors dans le feed** (injection automatique)
- **Module Tournois**
- **Module Bilan CO2 / kilomètres**
- **5 événements "À la Une"** par mois (durée 30 jours)
- Fonctionnalités de communication avancées
- Billetterie (à venir)
- Boutique Club (à venir)

### Restrictions

- IA PosterStudio verrouillée (réservée Elite)
- Automatisations intelligentes verrouillées
- Analytics avancés verrouillés

---

## Plan Elite (59 €/mois)

**Objectif** : Automatisation et IA.

### Inclus (tout le plan Club Pro +)

- **IA avancée pour affiches** (génération de fonds Pollinations.ai)
- **IA de génération d'éléments** décoratifs
- **IA de génération de chartes graphiques** (Claude Vision — analyse ADN visuel)
- **Automatisations intelligentes**
- **Relances automatiques covoiturage**
- **Rapports intelligents**
- **Statistiques avancées**
- **Analytics avancés**
- **15 événements "À la Une"** par mois (durée 60 jours)
- Covoiturage toutes équipes + futures automatisations
- Limites maximales sur tous les modules
- Marketplace (à venir)
- CRM club (à venir)
- Messagerie club (à venir)
- Notifications premium (à venir)
- Abonnements supporters (à venir)
- Publicité locale (à venir)
- Offres organisateurs (à venir)

---

## Tableau des quotas

| Quota | Gratuit | Starter | Club Pro | Elite |
|-------|---------|---------|----------|-------|
| Affiches/mois | 3 | Illimité | Illimité | Illimité |
| Featured events/mois | 0 | 0 | 5 | 15 |
| Durée featured event | — | — | 30 jours | 60 jours |
| Générations IA/mois | 0 | 10 | 0 | Illimité |
| Imports joueurs IA/mois | 0 | 10 | 0 | Illimité |
| Équipes covoiturage | 0 | 1 | Toutes | Toutes |

> **Note quotas IA** : Le plan Starter permet 10 générations et 10 imports pour explorer l'IA. Le plan Pro ne donne pas accès à l'IA PosterStudio — c'est une fonctionnalité exclusive Elite.

---

## Règles métier clés

### Bypass administrateur

Les utilisateurs avec `role = 'admin'` ou `role = 'superadmin'` ont accès à **toutes les features** quel que soit le plan du club. Ce bypass est géré dans `src/lib/planHelpers.ts → isAdminRole()`.

### Plan effectif

Un club en statut `past_due`, `cancelled` ou sans abonnement est traité comme **Gratuit**. Seuls les statuts `active` et `trialing` débloquent les features payantes.

### Covoiturage Starter

En plan Starter, un seul `carpool_allowed_team_id` est stocké dans `club_subscriptions`. L'administrateur configure l'équipe autorisée depuis le Dashboard Club. Toute tentative de créer un covoiturage pour une autre équipe affiche une `UpgradePrompt`.

### Filigrane

Le filigrane SportLink est visible sur les affiches exportées en plan Gratuit. Le toggle "Masquer le filigrane" est débloqué à partir du plan Starter (`POSTER_WATERMARK_REMOVE`).

---

## Features futures déjà typées

Les `FeatureKey` suivantes sont déclarées dans `subscriptionFeatures.ts` mais pas encore implémentées. Elles sont prêtes à être activées sans modification des types :

| FeatureKey | Plan | Description |
|------------|------|-------------|
| `MARKETPLACE` | Elite | Marketplace SportLink |
| `TICKETING` | Pro | Billetterie événements |
| `BOUTIQUE_CLUB` | Pro | Boutique merchandising |
| `SUPPORTER_SUBSCRIPTIONS` | Pro | Abonnements supporters |
| `LOCAL_ADS` | Pro | Publicité locale géolocalisée |
| `CRM_CLUB` | Elite | CRM gestion contacts club |
| `CLUB_MESSAGING` | Elite | Messagerie interne club |
| `ORGANIZER_OFFERS` | Elite | Offres organisateurs événements |
| `PREMIUM_NOTIFICATIONS` | Elite | Notifications premium |

---

## Ajouter une nouvelle feature — procédure

1. Ajouter la `FeatureKey` dans le type union de `subscriptionFeatures.ts`
2. Définir son `FEATURE_GATES[nouvelle_key]` (plan minimum requis)
3. Utiliser dans le composant : `const features = useClubFeatures(clubId); features.can('NOUVELLE_KEY')`
4. Documenter ici dans ce fichier

**Aucune modification des hooks ni des composants UI existants n'est nécessaire.**

---

## Architecture technique

```
subscriptionFeatures.ts   ← données pures (types, FEATURE_GATES, PLAN_QUOTAS)
planHelpers.ts            ← fonctions pures (canUseFeature, getQuotas, ...)
useClubPlan.js            ← fetch Supabase club_subscriptions
useClubFeatures.js        ← hook React principal (combine plan + rôle + admin bypass)
PlanGate.jsx              ← composant UI lock (overlay / hide / replace)
UpgradePrompt.jsx         ← modal upgrade avec CTA
```
