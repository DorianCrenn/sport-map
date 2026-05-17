# SportLink — Stratégie de Monétisation & Vision Produit
> Document stratégique — Vision SaaS Sport  
> Dernière mise à jour : 2026-05-17

---

## Vision produit

SportLink est positionné comme **l'infrastructure digitale des clubs sportifs amateurs** en France — en commençant par le Finistère, puis en scalant nationalement.

La proposition de valeur centrale :
> "SportLink remplace Canva (affiches), Doodle (planning), WhatsApp (annonces) et Excel (gestion équipes) en un seul outil — pour 9€/mois."

Le marché cible : **~180 000 clubs sportifs amateurs en France**, dont la majorité n'a aucun outil digital structuré. La moitié a un budget communication nul.

---

## 1. Modèle Freemium — Architecture des tiers

### Philosophie

- Le tier gratuit doit être **genuinement utile**, pas une démo tronquée
- Le premium doit apporter une valeur **immédiatement visible** et justifiable devant un CA de club
- La friction entre gratuit et premium doit être douce : le club découvre la limite naturellement, pas via un paywall agressif
- Priorité à la **valeur perçue par les dirigeants de club**, pas les techniciens

---

### TIER GRATUIT — Pour tout le monde

Accessible sans carte bancaire. Objectif : adoption maximale, génération d'effet réseau.

| Fonctionnalité | Limite gratuite |
|---------------|----------------|
| Page club publique | 3 blocs de contenu |
| Création d'événements | 5 par mois |
| Affiches standard | 5 templates de base |
| Suivi de clubs | Illimité |
| J'y serai / Favoris | Illimité |
| Statistiques page | Vues totales (chiffre brut) |
| Inscription membres | Illimitée |
| Score de matchs | Saisie manuelle |

**Objectif du gratuit** : Le club publie ses matchs, ses membres s'inscrivent, les affiches circulent sur WhatsApp → d'autres clubs découvrent SportLink → effet réseau.

---

### TIER STARTER — 9€ / mois par club
*Ou 89€/an (-17%)*

Ciblé : clubs actifs (20+ membres, publication régulière).

Le pricing psychologique : **"Moins cher qu'un maillot"** — argument utilisable en CA.

| Fonctionnalité | Valeur perçue |
|---------------|--------------|
| Événements illimités | Plus de frustration de limite |
| Page club sans limite de blocs | Page club complète et pro |
| 15 templates d'affiches premium | "Nos affiches sont pro" |
| Lien public club partageable | "Notre site officiel SportLink" |
| Score live sur matchs | Engagement supporters en temps réel |
| Export calendrier PDF / ICS | Pratique pour les parents |
| Rappel automatique membres (J-1) | Moins d'absences aux matchs |
| Badge "Club Certifié SportLink" | Visibilité et crédibilité |

---

### TIER CLUB PRO — 29€ / mois par club
*Ou 279€/an (-20%)*

Ciblé : clubs structurés (100+ membres, plusieurs équipes, secrétariat actif).

| Fonctionnalité | Valeur perçue |
|---------------|--------------|
| Tout Starter inclus | — |
| Analytics avancés (visiteurs uniques, clics, pics d'activité) | Justifier le budget communication |
| Multi-admin (jusqu'à 5 comptes club_admin) | Déléguer à secrétaire, coach, communication |
| Widget calendrier embarquable sur site club | "Intégration à notre site officiel" |
| Gestion multi-équipes (U7 à Vétérans) | Clubs avec 8+ équipes |
| Notifications push événements aux membres | "Rappel match demain 15h au stade" |
| Branding personnalisé (couleurs primaires, logo) | Identité visuelle du club |
| Import/export CSV illimité | Migration depuis anciens tableurs |
| Historique résultats (2 saisons) | Archive consultable |
| Support prioritaire (réponse < 48h) | Sérénité pour le bureau |

---

### TIER FÉDÉRATION — Sur devis (estimé : 199–499€/mois)

Ciblé : ligues régionales, fédérations départementales, comités olympiques.

| Fonctionnalité | Valeur perçue |
|---------------|--------------|
| Tout Club Pro pour N clubs | Gestion centralisée |
| Dashboard fédération | Vue agrégée activité tous les clubs membres |
| Modération centralisée des clubs | Validation, suppression, reporting |
| API REST access | Intégration SI fédération / site officiel |
| Marque blanche partielle | "Propulsé par SportLink" optionnel |
| Onboarding guidé pour les clubs membres | Adoption rapide |
| SLA 99,9% + account manager dédié | Engagement contractuel |
| Rapports CSV mensuels | Justification auprès des financeurs publics |

---

## 2. Fonctionnalités Premium Détaillées

### 2.1 Affiches Premium Avancées

**Gratuit** : 5 templates basiques, export PNG standard  
**Starter** : 15 templates premium (Luxe, Cinema, Editorial, Neon, Retro...)  
**Club Pro** : Templates personnalisés aux couleurs du club, logo intégré automatiquement, formats multiples (story Instagram, bannière Facebook, A3 imprimable)

Différenciateur clé : **la génération automatique** — le club saisit l'événement et l'affiche est générée automatiquement avec les bonnes couleurs et le bon logo. Zéro effort.

---

### 2.2 Analytics Avancés

**Gratuit** : Nombre de vues total de la page club (chiffre brut)  
**Starter** : Vues uniques, évolution semaine/mois, top événements  
**Club Pro** :
- Visiteurs uniques vs récurrents
- Heure de pointe des visites
- Taux de conversion visiteur → J'y serai
- Reach des affiches partagées (si lien tracké)
- Comparaison avec la moyenne des clubs du même sport / département
- Export CSV des données

**Valeur perçue** : Le trésorier peut montrer au CA "notre page a eu 340 visiteurs ce mois, nos affiches ont été vues 1200 fois". Tangible pour justifier la cotisation.

---

### 2.3 Notifications Intelligentes

**Starter** :
- Rappel automatique J-1 avant un événement aux membres ayant cliqué "J'y serai"
- Notification score mis à jour aux suiveurs du club

**Club Pro** :
- Segments de notification (envoyer uniquement aux membres U13, ou aux Seniors)
- Notification personnalisée : "Bonjour Jean, rappel : match de l'U17 samedi 10h, stade municipal"
- Notification résultat automatique avec score
- Push "Nouveau match ajouté" aux suiveurs
- Campagne ponctuelle : envoyer un message à tous les membres inscrits

**Note technique** : Nécessite PWA + Web Push API. Serveur de notification via Supabase Edge Functions + table `notification_subscriptions`.

---

### 2.4 Gestion Multi-Équipes

**Gratuit** : 1 équipe par club  
**Club Pro** :
- Équipes illimitées avec catégories (U7, U9, U11, U13, Féminines, Seniors, Vétérans...)
- Calendrier par équipe
- Staff par équipe (entraîneur, dirigeant)
- Page équipe dédiée dans la page club
- J'y serai filtré par équipe (les parents de l'U9 ne voient que les matchs U9)

---

### 2.5 Widget Embarquable

**Club Pro** :  
Un snippet `<iframe>` ou `<script>` que le club colle dans son site WordPress/Wix :
```html
<script src="https://sportlink.fr/widget.js" data-club="brest-fc"></script>
```
Affiche les prochains événements du club avec style personnalisable.

Valeur perçue : "Notre site montre automatiquement nos prochains matchs sans qu'on ait à le mettre à jour."

---

### 2.6 Branding Personnalisé

**Club Pro** :
- Couleur primaire et secondaire du club appliquées dans la page club
- Upload logo haute résolution
- Couleur des affiches générées = couleurs du club automatiquement
- URL personnalisée : `sportlink.fr/brest-football-club` (au lieu d'un ID générique)

---

### 2.7 Exports Avancés

**Club Pro** :
- Export CSV de la liste des membres ayant cliqué "J'y serai" (avec email si consentement)
- Export ICS calendrier complet de la saison
- Export PDF programme de la journée (format papier)
- Export rapport saison (résultats, statistiques événements)

---

## 3. Autres Sources de Revenus

### 3.1 Sponsorisation Locale Intelligente

**Principe** : les PME locales (boulangeries, équipementiers sportifs, garages...) peuvent sponsoriser un club spécifique ou une zone géographique.

**Modèle** :
- Sponsor affiché discrètement sur la page du club : "Cet événement est soutenu par [Boulangerie Kergall]"
- Logo sponsor sur les affiches générées (opt-in du club)
- Badge "Sponsor local" sur la fiche du sponsor dans un annuaire

**Tarif estimé** : 30–150€/mois pour une PME locale pour 1 club. Agrégé sur 1000 clubs = potentiel 30k–150k€/mois.

**Avantage** : revenu récurrent sans friction pour l'utilisateur final. Le club reçoit une commission (ex: 20% du montant du sponsoring).

---

### 3.2 Publicité Géolocalisée Non-Intrusive

**Principe** : dans la vue carte ou la liste d'événements, affichage contextuel d'annonces locales (équipementiers sportifs, physiothérapeutes, restaurants à proximité).

**Différence avec la pub classique** :
- Uniquement pertinent pour le sport affiché (si je regarde un match de handball, je vois un équipementier handball)
- Géolocalisé (je vois des annonces dans ma ville)
- Non-intrusif (pas de popup, pas d'interstitiel)

**Modèle** : CPM ou CPC via régie propre ou intégration Google Ad Manager.

---

### 3.3 Marketplace Équipements Sportifs Locaux

**Long terme** : permettre aux clubs de publier du matériel sportif à revendre ou prêter (maillots d'occasion, équipements...).

Modèle transactionnel : commission 5–10% sur les transactions.

---

### 3.4 Services Professionnels (Agency)

Pour les clubs avec budget :
- Création de page club "clé en main" par l'équipe SportLink : 299€ one-shot
- Formation à l'outil : 99€ par club (session de 1h en visio)
- Migration depuis ancien outil (Excel, autre CMS) : 199€

---

## 4. Stratégie de Croissance

### 4.1 Acquisition Clubs

**Canal principal : bouche à oreille inter-clubs**
- Quand un club publie une affiche avec "Créé avec SportLink" et la partage sur Facebook/WhatsApp, c'est de la pub gratuite
- Les adversaires voient la page du club pendant les matchs → "Comment vous avez fait ça ?"
- **Objectif** : rendre le "Créé avec SportLink" visible sur les affiches gratuites, retiré en Starter

**Canal secondaire : partenariats fédérations**
- Approcher le Comité Départemental Olympique et Sportif du Finistère (CDOS 29)
- Proposition : "Plateforme officielle de communication des clubs membres"
- En échange : mention dans leur newsletter, base de contacts clubs

**Canal tertiaire : SEO local**
- Chaque page club publique = une page indexable "Club de handball Quimper", "Football Brest U13"
- À 1000 clubs = 1000 pages SEO longue traîne. Trafic organique gratuit.

---

### 4.2 Viralité & Partage

**Mécaniques de partage à implémenter** :

1. **Affiche partageable** : bouton "Partager cette affiche" génère un lien court `sportlink.fr/e/abc123` avec preview OG (image affiche + titre event). Parfait pour WhatsApp/Facebook.

2. **"J'y serai" social** : après inscription à un événement, CTA "Dire à mes amis que j'y vais" → partage pré-rempli.

3. **Invitation à un événement** : lien d'invitation généré pour chaque événement. Les non-inscrits voient une landing minimaliste avec le bouton "Rejoindre SportLink" — principal vecteur d'acquisition.

4. **Page club publique** : chaque club a son URL partageable. Les clubs la mettent dans leur bio Instagram, description Facebook, signature email. Chaque visite = potentiel sign-up.

---

### 4.3 Rétention

**Problème central** : une app événementielle est naturellement saisonnière (foot = sept–juin). Il faut des mécaniques qui font revenir entre les événements.

**Solutions** :

1. **Score live + résultats** : une notification "Votre club a gagné 3-1" = raison de revenir même en dehors des événements

2. **Fil d'actualité personnalisé** : "Cette semaine dans vos clubs favoris" — résumé hebdomadaire des événements passés + à venir

3. **Gamification** :
   - Badge "J'y étais" après chaque événement passé (avec date et club)
   - Badge "Super Fan" : 10 présences dans un club
   - Badge "Explorateur" : avoir suivi 5 clubs différents
   - Classement mensuel "Clubs les plus actifs du Finistère"

4. **Email digest hebdomadaire** (opt-in) : "Cette semaine dans votre région" — 5 événements à venir, 3 résultats du week-end. Taux d'ouverture élevé dans les communautés sportives.

---

### 4.4 Engagement Communauté

**À moyen terme** :

1. **Commentaires / réactions sur événements** : les membres peuvent commenter un match passé, réagir à un résultat. Crée de la vie après l'événement.

2. **Photos post-événement** : upload photo par les participants. La galerie s'alimente automatiquement. Contenu généré par l'utilisateur = engagement fort.

3. **Sondages** : le club envoie un sondage rapide à ses membres ("Quel jour pour l'entraînement ?", "Êtes-vous disponibles pour le tournoi ?"). Remplace Doodle.

4. **Forum minimal par club** : espace de discussion interne pour les membres inscrits.

---

### 4.5 Stratégie Notifications

**Règle d'or** : les notifications sportives sont les bienvenues si elles sont pertinentes. Elles deviennent un spam si trop fréquentes ou génériques.

**Cadre de pertinence** :
- Notification déclenchée uniquement pour les clubs/événements **explicitement suivis**
- Maximum 1 notification par jour par utilisateur (sauf scores live opt-in)
- Contenu personnalisé : prénom + nom du club + détail concret

**Types par urgence** :

| Type | Timing | Canal |
|------|--------|-------|
| Rappel match | J-1 à 18h, J à 8h | Push + Email |
| Score mis à jour | Temps réel (si opt-in) | Push uniquement |
| Nouveau match ajouté | Immédiat | Push (opt-in) |
| Résultat du week-end | Dimanche soir | Email digest |
| Événement à venir (favoris) | Lundi matin | Email hebdo |

---

## 5. Réflexions Long Terme

### 5.1 Expansion géographique

**Phase 1** : Finistère (29) — validation du modèle  
**Phase 2** : Bretagne complète (22, 29, 35, 56)  
**Phase 3** : France entière  
**Phase 4** : Europe francophone (Belgique, Suisse, Luxembourg)

Le modèle fonctionne dans toute ville avec une culture sportive forte. En France : Bretagne, Pays de la Loire, Alsace, Nord-Pas-de-Calais sont des marchés prioritaires.

---

### 5.2 Verticales sportives spécialisées

Aujourd'hui SportLink est sport-agnostique. À terme, des verticales dédiées avec fonctionnalités spécifiques :
- **SportLink Football** : arbitres, compositions d'équipe, cartons
- **SportLink Rugby** : mêlées, plaquages, stats avancées
- **SportLink Handball** : rotations, temps de jeu
- **SportLink Natation** : chronos, couloirs, temps de plongeon

Chaque verticale = un segment de marché distinct avec des features payantes spécifiques.

---

### 5.3 Marketplace de services sportifs

À long terme, SportLink peut devenir la place de marché des clubs amateurs :
- **Arbitres disponibles** : un club cherche un arbitre pour samedi → les arbitres inscrits reçoivent une demande
- **Entraîneurs freelance** : entraîneur disponible pour remplacements ponctuels
- **Loueurs d'équipements** : terrain de padel, salle de gym disponible
- **Photographes locaux** : photographier le match du dimanche

Modèle transactionnel : commission 10% sur chaque mise en relation.

---

### 5.4 Données sportives agrégées (B2B)

À grande échelle, SportLink dispose de données uniques :
- Calendriers de matchs en temps réel (non disponibles ailleurs pour l'amateur)
- Affluence aux événements sportifs par zone géographique
- Tendances sportives régionales (popularité handball vs football par département)

Ces données ont de la valeur pour :
- Collectivités territoriales (politique sportive)
- Équipementiers (ciblage publicitaire)
- Médias sportifs régionaux
- Assureurs sportifs

Modèle : API B2B anonymisée et agrégée, facturation à l'usage.

---

## 6. Tableau de Bord KPIs Business

### KPIs d'acquisition

| KPI | Objectif 6 mois | Objectif 12 mois |
|-----|----------------|-----------------|
| Clubs inscrits (gratuit) | 50 | 200 |
| Clubs actifs (≥1 event/mois) | 30 | 120 |
| Utilisateurs (membres) | 500 | 3 000 |
| Affiches générées/mois | 200 | 1 000 |

### KPIs de conversion

| KPI | Cible |
|-----|-------|
| Gratuit → Starter | 15% des clubs actifs |
| Starter → Club Pro | 20% des clubs Starter |
| Churn mensuel Starter | < 5% |
| Churn mensuel Club Pro | < 3% |

### KPIs d'engagement

| KPI | Cible |
|-----|-------|
| DAU/MAU | > 20% |
| Rétention à 30 jours | > 40% |
| Événements créés/club/mois | > 4 |
| J'y serai moyen par événement | > 8 |

### Revenue projections

| Scenario | Clubs payants | MRR estimé |
|----------|--------------|-----------|
| Conservateur (an 1) | 20 Starter + 5 Pro | 325€/mois |
| Réaliste (an 1) | 50 Starter + 15 Pro | 885€/mois |
| Optimiste (an 2) | 200 Starter + 60 Pro | 3 540€/mois |

*Ces chiffres sont volontairement conservateurs pour un marché B2SMB avec cycle de vente long.*

---

## 7. Risques & Mitigation

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|-----------|
| Clubs trop peu tech pour adopter | Haute | Haute | Mode Simple, onboarding guidé, support téléphonique |
| Concurrence d'un acteur établi (LFP, FFF...) | Moyenne | Haute | Focus sur l'amateur, pas le professionnel |
| Churn saisonnier (été) | Haute | Moyenne | Tarification annuelle remisée, features hors-saison (planning reprise) |
| Coûts infra Supabase qui scalent | Faible | Moyenne | Passer sur plan Pro Supabase à 25$/mois avant 10k users |
| RGPD : gestion des données mineurs (U7-U13) | Moyenne | Haute | Consentement parental explicite, données mineurs non stockées nommément |

---

*Ce document est confidentiel — vision interne SportLink. Ne pas partager publiquement.*
