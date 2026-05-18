# SportLink — Fonctionnalités complètes

> Application web de découverte et gestion d'événements sportifs en Finistère.
> Stack : React · Supabase · Leaflet · Framer Motion

---

## Carte & Événements

- Carte interactive Finistère (Leaflet) avec tous les événements sportifs géolocalisés sous forme de marqueurs colorés par sport
- Filtres : par sport, par plage de dates, "à venir uniquement", et un filtre proximité (géolocalisation GPS auto-demandée) qui trie les événements par distance
- Sidebar événements (desktop) + bottom sheet (mobile, 3 snap points : peek / détail / plein écran) pour lire le détail d'un événement
- Création d'événement : formulaire complet avec type (Championnat / Coupe / Amical), équipe, catégorie, adversaire, domicile/extérieur, lieu (autocomplete OSM), description
- Duplication d'événement : bouton ⎘ dans la card → formulaire pré-rempli, date vide à resaisir
- Modification & suppression : réservé au créateur ou admin
- Saisie de score rapide post-match directement depuis la card
- Partage d'un événement (Web Share API ou copie de lien)
- Export ICS : télécharge un fichier calendrier pour un événement ou tous les matchs d'un club
- Realtime : Supabase Realtime synchronise les événements entre utilisateurs en direct

---

## Clubs

- Annuaire des clubs avec recherche (nom, ville) et filtres par sport, triés par "clubs suivis en premier"
- Mini-site officiel par club avec éditeur de blocs
- Suivi de club avec configuration : sports suivis, fréquence de digest email (opt-in)
- Onglets par équipe dans la page club pour naviguer entre les équipes
- Dashboard stats : nombre de vues de page, followers, matchs à venir, résultats récents

### Éditeur de page club (blocs)

Accessible en mode Modifier (FAB bas-droite), uniquement pour les propriétaires et gestionnaires.

| Bloc | Ce qu'il fait |
|---|---|
| Titre | H1/H2/H3 personnalisable |
| Texte | Paragraphe libre |
| Image | Photo locale ou URL, ratio configurable |
| Galerie | Jusqu'à 5 photos, grille avec lightbox |
| Prochains événements | Liste auto des events du club |
| Entraînements | Créneaux hebdo (jour / heure / lieu / niveau) |
| Matchs & Résultats | Calendrier avec scores V/N/D |
| À propos | Description, adresse, tarifs licences, contacts |
| Sponsors | Logos cliquables, tiers gold / silver / bronze / partner |
| Prochain match | Carte auto du prochain événement du club |

- Drag & drop de lignes pour réordonner (Framer Motion Reorder)
- Mise en colonnes : chaque bloc peut être 1/1, 1/2, 1/3, 2/3 — plusieurs blocs côte-à-côte sur une même ligne
- Typographie : choix de police pour les titres et le corps (Oswald, Inter, Manrope, Poppins, Raleway) avec injection Google Fonts dynamique
- Thème couleur : couleur principale du header + couleur d'accent, persistées en base Supabase
- Génération d'entraînements : à partir des créneaux, génère automatiquement tous les événements d'entraînement sur une plage de dates
- OpenGraph : title + meta og:* injectés dynamiquement pour le partage sur réseaux sociaux

### Gestion du club

- Gestionnaires : le propriétaire peut ajouter des co-gestionnaires par email
- Annonces : envoi de messages aux abonnés, ciblés par équipe (types : info, urgent, résultat, événement)
- Demandes de création de club : un utilisateur peut demander à créer un club, l'admin valide

---

## Covoiturage

- Proposer un trajet depuis un événement : lieu de départ, heure, places, équipements acceptés, flexibilité de détour
- Rejoindre un trajet : envoi d'une demande avec message au conducteur
- Gestion conducteur : accepter ou refuser les demandes de passagers
- Notifications temps réel : nouvelle demande, acceptée, refusée, trajet annulé
- Page Mes trajets : 3 onglets — mes trajets conducteur / mes demandes passager / notifications

---

## Favoris

- Mise en favori de n'importe quel événement
- Page Favoris : liste des événements sauvegardés avec badge de type, partage, export ICS individuel
- Prochains événements suivis : widget avec compte à rebours sur les events favoris

---

## Compte & Profil

- Inscription / connexion par email + mot de passe
- OAuth simulé Google et Instagram (mock pour démo — crée ou connecte un compte à partir d'un email)
- Mot de passe oublié simulé (affiche un message de confirmation)
- Onboarding : sélection des sports favoris à la première connexion — filtre automatiquement la carte et les clubs
- Profil : modification des sports favoris, toggle dark/light mode, déconnexion
- Badges : 5 badges débloqués automatiquement selon la participation (Premier pas, Explorateur, Fan fidèle, Vétéran, Champion), avec modal d'unlock animé

---

## Générateur d'affiches (PosterStudio)

- 22 templates visuels : Classique, Light, Color, Éditorial, Impact, Luxe, Blanc, Élégant, Magazine, Neon, Fluo, Cinéma, Rétro, Vivid, Bento, Prestige, Pulse, Strike, Glass, Flag, Ink, Aurora
- Formats Story (portrait 9:16) et Post (carré)
- Personnalisation : couleur d'accent, noms d'équipes + logos, compétition, tagline, image de fond
- Éditeur visuel : déplacer / scaler / pivoter chaque bloc du poster
- Export image (html-to-image) et partage Web Share API

---

## Admin

- Gestion des sports : ajouter, modifier (nom, couleur, icône), supprimer
- Gestion des utilisateurs : voir les comptes, changer les rôles (user / club_admin / admin / superadmin)
- Gestion des clubs : voir tous les clubs, supprimer
- Validation des demandes de création de club
- Statistiques globales : nombre d'utilisateurs, clubs, événements

---

## Technique

- Supabase (PostgreSQL + Auth + Realtime) comme backend
- RLS sur toutes les tables : chaque utilisateur ne lit/écrit que ce qu'il a le droit
- Dark / Light mode avec CSS custom properties sur toute l'UI
- PWA-ready : touch-action, safe-area-inset, overscroll-behavior pour iOS/Android
- Toasts : feedback visuel sur toutes les actions utilisateur (connexion, mise à jour, erreurs)
- Géolocalisation : centrage auto sur la position de l'utilisateur au premier chargement
