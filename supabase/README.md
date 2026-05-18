# SportLink — Base de données Supabase

## Déploiement (projet vierge)

Exécuter dans l'ordre dans **Supabase Dashboard → SQL Editor** :

| Ordre | Fichier | Contenu |
|-------|---------|---------|
| 1 | `01_schema.sql` | Toutes les tables + colonnes + trigger signup |
| 2 | `02_rls.sql` | Toutes les politiques RLS |
| 3 | `03_views.sql` | Vues agrégées + grants |
| 4 | `seed.sql` | Données de démonstration (optionnel) |

Chaque fichier est **idempotent** — safe to re-run sur une base existante.

## Mise à jour (base existante)

Re-runner uniquement le fichier modifié. Exemple : ajout d'une colonne → modifier
`01_schema.sql` et re-runner, le `ADD COLUMN IF NOT EXISTS` sera ignoré si la
colonne existe déjà.

## Structure des tables

```
profiles          — utilisateurs (rôle, sports favoris, club_id)
events            — événements sportifs (carte)
favorites         — événements mis en favoris par un utilisateur
attendees         — utilisateurs présents à un événement
clubs             — clubs sportifs (+ catégories/équipes en JSONB)
club_pages        — page personnalisable de chaque club (blocs + typo)
club_managers     — gestionnaires additionnels d'un club
club_trainings    — calendriers d'entraînement par équipe
club_page_views   — analytics de vues des pages clubs
```

## Paramètres Auth (Dashboard UI)

Authentication → Configuration → Email :
- Désactiver "Confirm email" en dev/démo

Authentication → Providers → Email :
- Activer le provider Email
