# SportLink — Fonctionnalités

> **SportLink** est une PWA mobile-first pour la communauté sportive amateur en Bretagne.  
> Elle permet aux clubs de gérer leurs événements, communiquer avec leurs membres, et créer des visuels professionnels en quelques secondes.

---

## Carte & Événements

### Consultation
- Carte interactive Leaflet couvrant la Bretagne, avec tous les événements géolocalisés sous forme de marqueurs colorés par sport
- Clustering des marqueurs proches pour éviter la surcharge visuelle
- Filtres combinables : sport, plage de dates, "à venir uniquement", distance (géolocalisation GPS)
- Tri par distance depuis la position de l'utilisateur
- Sidebar événement sur desktop (liste + détail) ; bottom sheet à 3 snap points sur mobile (aperçu / détail / plein écran)

### Gestion des événements
- Création avec formulaire complet : type (Championnat / Coupe / Amical / Tournoi), équipe, catégorie, adversaire, domicile/extérieur, lieu (autocomplete OpenStreetMap), description, joueur du match
- Modification et suppression (réservées au créateur ou admin)
- Duplication : bouton ⎘ pré-remplit le formulaire, date vide à resaisir
- Import CSV pour créer plusieurs événements en une opération
- Saisie de score rapide directement depuis la card, avec formulaire adapté au sport (y compris tennis par jeux/sets)
- Archivage de saison : clôture tous les événements passés d'un club

### Partage & Synchronisation
- Partage natif via Web Share API (iOS/Android) ou copie de lien
- Liens profonds `#event/:id` — chaque événement a une URL partageable
- Export ICS : fichier calendrier pour un événement ou tous les matchs d'un club
- Realtime Supabase : les événements se mettent à jour en direct entre tous les utilisateurs

---

## Clubs

### Annuaire
- Recherche par nom ou ville, filtres par sport
- Tri : clubs suivis affichés en premier
- Classement des clubs (leaderboard) avec score d'activité

### Mini-site officiel par club
Chaque club dispose d'une page personnalisable avec un éditeur de blocs :

| Bloc | Contenu |
|---|---|
| Titre | H1/H2/H3 personnalisable |
| Texte | Paragraphe libre |
| Image | Photo locale ou URL, ratio configurable |
| Galerie | Jusqu'à 5 photos, grille avec lightbox |
| Prochains événements | Liste automatique des events du club |
| Entraînements | Créneaux hebdo (jour / heure / lieu / niveau) |
| Matchs & Résultats | Calendrier avec scores V/N/D |
| À propos | Description, adresse, tarifs licences, contacts |
| Sponsors | Logos cliquables, niveaux gold / silver / bronze / partner |
| Prochain match | Carte automatique du prochain événement |

**Mise en page :**
- Drag & drop pour réordonner les blocs (Framer Motion Reorder)
- Colonnes : chaque bloc peut occuper 1/1, 1/2, 1/3 ou 2/3 de la ligne
- Thème : couleur principale du header + couleur d'accent (persistées en base)
- Typographie : 5 familles de polices (Oswald, Inter, Manrope, Poppins, Raleway) injectées dynamiquement depuis Google Fonts

**Entraînements — deux systèmes complémentaires :**
- Créneaux récurrents (`club_trainings`) : modèles hebdomadaires (jour / heure / lieu / niveau), génération automatique des événements sur une plage de dates
- Sessions concrètes (`training_sessions`) : instances individuelles avec CRUD, suivi de présence par joueur (présent / absent / incertain), messages d'équipe, page dédiée TrainingManagerPage

**SEO :** balises OpenGraph injectées dynamiquement, Schema.org `SportsOrganization`, sitemap auto-généré, canonical URL lisible (`/clubs/:id`).

### Gestion du club

#### Multi-bénévoles
Trois sous-rôles distincts pour les gestionnaires :
- `manager` — accès complet (events, affiches, communication, réglages)
- `editor` — création d'events et d'affiches
- `communicant` — envoi d'annonces uniquement

Le propriétaire invite ses bénévoles par email depuis le ClubManagersPanel.

#### Communication
- **Annonces** : messages ciblés aux abonnés, par équipe, avec types (info / urgent / résultat / événement)
- **Programmation** : envoi différé avec sélection de date/heure — une Edge Function cron déclenche l'envoi automatiquement
- **Calendrier éditorial** : vue 30 jours fusionnant matchs et annonces programmées
- **Suggestions IA** : génération automatique du texte d'une annonce via Claude (Edge Function `generate-announcement`)

#### Analytics
- Vues de page hebdomadaires
- Nombre d'abonnés
- Affiches créées ce mois
- Partages sociaux effectués via SportLink (WhatsApp, Instagram, Facebook, Web Share)

#### Défis inter-clubs
Système de challenges entre clubs avec table dédiée (`club_challenges`) et section dans le dashboard.

### Suivi de club
- Abonnement à un club avec sélection des équipes suivies
- Configuration de la fréquence de digest email (opt-in)
- Feed d'actualité personnalisé affichant les résultats et nouveaux événements des clubs suivis

---

## PosterStudio — Générateur d'affiches sportives

> Fonctionnalité centrale de SportLink. Permet à n'importe quel bénévole de club de créer des visuels professionnels en moins de 2 minutes.

### Templates
- **37 templates visuels** au total :
  - 24 templates matchs : Simple, Light, Color, Éditorial, Impact, Luxe, Blanc, Élégant, Magazine, Neon, Fluo, Cinéma, Rétro, Vivid, Bento, Prestige, Pulse, Strike, Glass, Flag, Ink, Aurora, et d'autres
  - 10 templates tournois : Coupe, Neon, Premium, Minimal, Gradient, Glass, Street, Summer, Cinéma, Esport
  - 3 templates spéciaux : Champion, Field, Dynamic

- **Formats** : Story (9:16 portrait) et Post (1:1 carré)

### Éditeur visuel
- Déplacer, redimensionner et faire pivoter chaque bloc du poster par drag & drop
- Alignement gauche / centre / droite calculé précisément sur le contenu réel
- Contrôles par bloc : taille de police (mode Auto ou personnalisé), famille de police (8 familles)
- Opacité, masquage par bloc

### Contenus IA

**Fonds IA :**
- Génération de fond custom via prompt utilisateur (Pollinations.ai Flux, 576×1024 px)
- Variantes automatiques adaptées au sport détecté (Edge Function Supabase → Fal.ai)
- Cache 7 jours par sport pour éviter les appels redondants

**Éléments décoratifs IA :**
- Génération d'éléments SVG/PNG sur fond noir (`mix-blend-mode: screen` → fond transparent)
- Éditeur dédié `AiElementEditor` : position, scale, rotation, opacité, layer order

**DNA visuel club (Claude Vision) :**
- Analyse de l'identité visuelle du club depuis ses affiches existantes
- Extraction automatique de palette, style typographique, structure de composition
- Génération de variantes cohérentes avec l'identité du club

### Bibliothèque joueurs
- Upload de photos de joueurs avec détourage automatique (Remove.bg, fallback Fal.ai BRIA RMBG)
- Organisation par dossiers (équipes / saisons) avec tags inline
- Versions d'un asset (jusqu'à 5 historiques, restauration possible)
- Remplacement d'image sans changer l'identifiant
- Drag & drop du joueur directement sur l'affiche dans PosterEditor

### Quota et limites
- Compteur "imports restants ce mois" visible dans l'interface (table `club_ai_usage`)
- Plan gratuit : 5 générations IA/mois ; Club Pro : illimité
- Monitoring coûts Fal.ai avec alerte à 80% du seuil mensuel

### Flux ultra-rapide post-match (AUTO-001)
1. Le score est saisi dans la card → CTA "Créer l'affiche résultat" apparaît
2. PosterStudio s'ouvre avec le template Impact pré-sélectionné + overlay score
3. Export panel s'ouvre automatiquement après 900ms
4. Partage en 1 clic

### Distribution multicanal
- Export PNG haute résolution (pixelRatio ×3)
- "Tout télécharger" : génère story + post 4:5 en une action
- Partage direct WhatsApp, Instagram, Facebook, copie presse-papiers
- Preview "à quoi ça ressemble" avant envoi (mockup IG Story / Post / WhatsApp)
- **Watermark** "Créé avec SportLink" sur tous les exports (cliquable → page du club) — supprimable avec plan Club Pro

### Auto-save & Brouillons
- Sauvegarde automatique du brouillon par événement (localStorage + Supabase)
- Reprise d'édition là où on s'est arrêté

---

## Covoiturage

- Proposer un trajet depuis un événement : lieu de départ, heure, places disponibles, équipements acceptés, flexibilité de détour
- Rejoindre un trajet : envoi d'une demande avec message au conducteur
- Gestion conducteur : accepter ou refuser les demandes de passagers
- Notifications temps réel : nouvelle demande reçue, acceptée, refusée, trajet annulé
- Historique des trajets (conducteur et passager)
- Page "Mes trajets" : 3 onglets — mes trajets conducteur / mes demandes passager / notifications

---

## Communauté

### Favoris
- Mise en favori de n'importe quel événement
- Page Favoris avec badge de type, partage, export ICS individuel
- Widget "Prochains événements suivis" avec compte à rebours

### Présence & Interaction
- Bouton "J'y serai" avec compteur temps réel (Supabase Realtime)
- Commentaires sur les événements avec suppression, jusqu'à 100 par événement (Realtime)
- Réactions emoji sur les événements — 3 réactions (👏 🔥 💪), mises à jour temps réel
- Prédictions de résultats avant match : voter pour domicile / nul / extérieur, verrou après coup d'envoi

### Convocations
- Convocation officielle des joueurs à un événement (envoi en masse)
- Suivi des réponses par joueur : présent / absent / incertain / pas de réponse
- Statistiques de réponse en temps réel pour le club_admin
- Page "Mes convocations" pour le joueur (hook `useMyConvocations`)

### Photos d'événements
- Upload jusqu'à 10 photos par événement (stockage Supabase Storage)
- Galerie visible dans la card, la sidebar desktop et la bottom sheet mobile
- Photo réutilisable comme fond dans PosterStudio en 1 clic

### Gamification
- **Badges XP** : 5 badges débloqués automatiquement selon la participation (Premier pas, Explorateur, Fan fidèle, Vétéran, Champion) avec modal d'unlock animé
- **Classements** : leaderboard utilisateurs et leaderboard clubs, basés sur l'activité

### Profils publics
- Page profil publique accessible via deep link `#user/:id`
- Affiches récentes, badges, statistiques de participation

---

## Notifications

### Push (PWA Web Push)
- Abonnement/désabonnement depuis le profil ou le toggle dédié
- Rappel match dans 2h pour les événements suivis
- Notification "Résultat publié" pour les abonnés du club
- Nouvelle annonce de club
- Rappel J-1 "Votre match est demain — créez l'affiche !"
- Rappel J "C'est aujourd'hui !"
- Post-match "Saisissez le score et partagez votre victoire"
- Préférences par club_admin (3 toggles dans le dashboard)

### In-app (Toasts)
- Feedback visuel sur toutes les actions utilisateur : connexion, création, modification, erreurs, succès

---

## Compte & Profil

- Inscription / connexion par email + mot de passe
- Google OAuth PKCE
- Mot de passe oublié (email de réinitialisation)
- **Onboarding** : sélection des sports favoris à la première connexion — filtre automatiquement la carte et les clubs affichés
- Modification des sports favoris et des préférences depuis le profil
- Toggle dark / light mode
- Suppression de compte
- Déconnexion

---

## Admin

- Gestion des sports : ajouter, modifier (nom, couleur, icône), supprimer
- Gestion des utilisateurs : voir les comptes, modifier les rôles (user / club_admin / admin)
- Gestion des clubs : voir tous les clubs, supprimer
- Validation des demandes de création de club (workflow : un utilisateur soumet, l'admin valide)
- Statistiques globales : nombre d'utilisateurs, clubs, événements

---

## Abonnements & Monétisation

| Tier | Prix | Features clés |
|---|---|---|
| **Free** | 0€ | Accès complet app, templates de base, 5 générations IA/mois, watermark SportLink |
| **Club Pro** | 12€/mois | Tous templates, 100 affiches, Brand Kit, 5 imports IA/mois, export HD 2K, suppression watermark |
| **Club Elite** | 29€/mois | Génération IA illimitée, DNA auto-extraction, export 4K, 3 Brand Kits |
| **League** | 99€/mois | API export, templates push aux clubs membres, analytics multi-club |

---

## Technique

- **Stack** : React 19, Vite 8, Tailwind CSS 4, Framer Motion 12, Leaflet, Supabase (PostgreSQL + Auth PKCE + Realtime + Storage)
- **PWA** : Service Worker Workbox, manifest, installable sur iOS et Android
- **RLS Supabase** : politiques Row Level Security sur toutes les tables — chaque utilisateur ne lit/écrit que ce qu'il a le droit
- **Dark / Light mode** : CSS custom properties sur toute l'interface
- **Safe areas** : padding dynamique `env(safe-area-inset-*)` pour iOS/Android
- **ErrorBoundary** : chaque page est encapsulée pour isoler les crashs
- **Performance** : lazy loading pages lourdes, `React.memo` sur les cards, requêtes Supabase limitées (`.limit(500)` au cold start), Realtime activé uniquement là où nécessaire
- **Export image** : `html-to-image` avec pixelRatio ×3 (qualité HD), retry automatique sur Safari iOS
- **Validation** : Zod 4 sur tous les formulaires
- **Sécurité** : contenu utilisateur sanitisé via DOMPurify, clés API hors du code source, import CSV validé
