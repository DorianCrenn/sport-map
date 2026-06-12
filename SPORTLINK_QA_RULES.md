# SportLink — Gouvernance QA

> **LECTURE OBLIGATOIRE avant toute modification du projet.**
> Ce document est la référence absolue pour la qualité de SportLink.
> Toute évolution qui ne respecte pas ces règles est invalide.

---

## 1. Règle Absolue

Aucune fonctionnalité ne peut être considérée comme terminée sans que :
- ses tests existent et passent
- ses impacts sur les composants/pages/workflows existants ont été vérifiés
- les régressions détectées ont été corrigées

**La qualité est une fonctionnalité à part entière de SportLink.**

---

## 2. Procédure Obligatoire par Tâche

### Avant toute implémentation

1. **Consulter** `QA_REGISTRY.md` pour identifier :
   - les composants impactés
   - les pages impactées
   - les workflows métiers touchés
   - les tests existants à ne pas casser

2. **Lister** les risques de régression

3. **Planifier** les nouveaux tests nécessaires

### Après implémentation

1. Mettre à jour les tests existants si nécessaire
2. Créer les nouveaux tests requis (coverage minimum — voir section 4)
3. Exécuter `npm run test` (Vitest unitaire) → 0 échec
4. Exécuter `npm run test:e2e` (Playwright) sur les workflows impactés → 0 échec
5. Vérifier le responsive (iPhone SE + iPhone 15 + Desktop 1440 minimum)
6. Vérifier l'accessibilité (aucune violation critique axe)
7. Vérifier les performances (pas de régression bundle > +10kB sans justification)
8. Mettre à jour `QA_REGISTRY.md` si nouvelles pages/composants/workflows ajoutés

---

## 3. Checklist de Fin de Tâche (OBLIGATOIRE)

```
□ Fonctionnalité développée et fonctionnelle
□ Tests unitaires créés / mis à jour
□ Tests E2E créés / mis à jour
□ npm run test → 0 échec
□ npm run test:e2e → 0 échec sur workflows impactés
□ Responsive vérifié (mobile + desktop)
□ Accessibilité vérifiée (aucune violation axe critique)
□ Aucune erreur console JavaScript
□ Aucune régression visuelle
□ QA_REGISTRY.md mis à jour
□ CLAUDE.md mis à jour si architecture modifiée
```

---

## 4. Couverture Minimale Obligatoire

Toute nouvelle fonctionnalité doit posséder :

### Tests unitaires (Vitest)
- [ ] Fonctions / hooks métiers testés
- [ ] Cas d'erreur testés
- [ ] Validation des données testée

### Tests E2E (Playwright) — pour chaque nouvelle page ou workflow majeur
- [ ] Ouverture sans erreur console
- [ ] Interaction principale (happy path complet)
- [ ] Responsive : mobile 375px + desktop 1440px
- [ ] Absence d'erreur console
- [ ] Screenshot de référence si composant visuel majeur

---

## 5. Seuils de Couverture Vitest

| Métrique | Seuil minimum | Cible 2026 |
|---------|--------------|------------|
| Branches | 60% | 75% |
| Functions | 60% | 75% |
| Lines | 60% | 75% |

Ne jamais faire baisser ces seuils. Toute modification qui descend la couverture est refusée.

---

## 6. Infrastructure QA — 4 Couches

### Couche 1 — Tests Unitaires (Vitest)
- Framework : Vitest 4 + Testing Library + jest-axe
- Config : `vitest.config.js`
- Dossier tests : `src/__tests__/`
- Commandes :
  ```bash
  npm run test           # run once
  npm run test:watch     # watch mode
  npm run test:coverage  # avec coverage
  ```

### Couche 2 — Tests E2E (Playwright)
- Framework : @playwright/test
- Config : `playwright.config.js`
- Dossier tests : `e2e/`
- Commandes :
  ```bash
  npm run test:e2e         # headless
  npm run test:e2e:ui      # interface visuelle
  npm run test:e2e:debug   # debug mode
  npm run test:all         # unit + e2e
  ```
- Appareils testés : iPhone SE, iPhone 15, Pixel 7, Desktop 1440, Desktop 1920

### Couche 3 — Analyse Statique
- ESLint : `npm run lint`
- Vitest type-check via tsconfig (fichiers .ts)

### Couche 4 — QA Scan Automatique
- Script : `npm run qa:scan`
- Détecte : nouvelles pages, composants, hooks sans couverture
- Génère : rapport des gaps dans `e2e/reports/qa-scan.json`

---

## 7. Workflows Métiers Critiques et Leur Criticité

Les workflows **P0** bloquent tout déploiement s'ils sont cassés.

| # | Workflow | Criticité | Fichier test |
|---|---------|-----------|-------------|
| 1 | Création de compte | P0 | `e2e/workflows/auth.spec.js` |
| 2 | Connexion | P0 | `e2e/workflows/auth.spec.js` |
| 3 | Navigation entre tabs | P0 | `e2e/pages/navigation.spec.js` |
| 4 | Création événement | P0 | `e2e/workflows/event-creation.spec.js` |
| 5 | Création club | P0 | `e2e/workflows/club-creation.spec.js` |
| 6 | PosterStudio — ouverture + export | P0 | `e2e/workflows/poster-studio.spec.js` |
| 7 | Démo Président (vitrine commerciale) | P0 | `e2e/demo/demo-sandbox.spec.js` |
| 8 | Modification événement | P0 | `e2e/workflows/event-creation.spec.js` |
| 9 | Suppression événement | P1 | `e2e/workflows/event-creation.spec.js` |
| 10 | Modification club | P1 | `e2e/workflows/club-creation.spec.js` |
| 11 | Suivi club | P1 | `e2e/pages/clubs.spec.js` |
| 12 | Convocations | P1 | `e2e/workflows/convocations.spec.js` |
| 13 | Réponses convocations | P1 | `e2e/workflows/convocations.spec.js` |
| 14 | Présences événement | P1 | `e2e/workflows/convocations.spec.js` |
| 15 | Covoiturage — création trajet | P1 | `e2e/workflows/carpooling.spec.js` |
| 16 | Covoiturage — demande passager | P1 | `e2e/workflows/carpooling.spec.js` |
| 17 | Annonces clubs | P1 | `e2e/workflows/announcements.spec.js` |
| 18 | Feed (NewsPage) | P1 | `e2e/pages/news.spec.js` |
| 19 | Favoris | P1 | `e2e/pages/favoris.spec.js` |
| 20 | Commentaires événement | P1 | `e2e/workflows/event-creation.spec.js` |
| 21 | Réactions événement | P1 | `e2e/workflows/event-creation.spec.js` |
| 22 | Dashboard club | P1 | `e2e/pages/clubs.spec.js` |
| 23 | Mini-site club | P1 | `e2e/pages/clubs.spec.js` |
| 24 | Dashboard admin | P1 | `e2e/pages/admin.spec.js` |
| 25 | Import joueurs (CSV) | P2 | `e2e/workflows/csv-import.spec.js` |
| 26 | Suppression arrière-plan joueur | P2 | `e2e/workflows/poster-studio.spec.js` |
| 27 | Duplication événement | P2 | `e2e/workflows/event-creation.spec.js` |
| 28 | Entraînements | P2 | `e2e/workflows/trainings.spec.js` |
| 29 | Sessions d'entraînement | P2 | `e2e/workflows/trainings.spec.js` |
| 30 | Prédictions | P2 | Manuel |
| 31 | Photos événements | P2 | Manuel |
| 32 | Programmation annonces | P2 | `e2e/workflows/announcements.spec.js` |
| 33 | Notifications push | P2 | Manuel |
| 34 | Gestion clubs (admin) | P2 | `e2e/pages/admin.spec.js` |
| 35 | Validation clubs (admin) | P2 | `e2e/pages/admin.spec.js` |
| 36 | Gestion sports (admin) | P2 | `e2e/pages/admin.spec.js` |
| 37 | Gestion utilisateurs (admin) | P2 | `e2e/pages/admin.spec.js` |
| 38 | Abonnements | P2 | Manuel |
| 39 | Paiements (Stripe futur) | P3 | Manuel (sandbox Stripe) |

---

## 8. Responsive — Appareils Testés

| Appareil | Largeur | Hauteur | Priorité |
|---------|---------|---------|---------|
| iPhone SE | 375px | 667px | P0 (petit écran critique) |
| iPhone 15 | 393px | 852px | P0 (standard iOS) |
| Pixel 7 | 412px | 915px | P1 (Android) |
| Galaxy S22 | 360px | 780px | P1 (Android petit) |
| iPad | 768px | 1024px | P2 |
| iPad Pro | 1024px | 1366px | P2 |
| Desktop 1366 | 1366px | 768px | P1 |
| Desktop 1440 | 1440px | 900px | P0 (desktop standard) |
| Desktop 1920 | 1920px | 1080px | P1 |

### Défauts automatiquement détectés
- Overflow horizontal (`document.body.scrollWidth > window.innerWidth`)
- Texte tronqué (overflow hidden sur éléments texte critiques)
- Boutons inaccessibles (zone tactile < 44×44px)
- Modales hors écran
- Bottom sheets cassées sur petits écrans

---

## 9. Tests Visuels (Screenshots)

### Captures de référence
Stockées dans : `e2e/screenshots/baseline/`
Diffs dans : `e2e/screenshots/diff/`

Pages avec captures obligatoires :
- `home-mobile.png` — HomePage sur iPhone SE
- `home-desktop.png` — HomePage sur Desktop 1440
- `map-mobile.png` — MapPage sur iPhone SE
- `clubs-mobile.png` — ClubsPage sur iPhone SE
- `news-mobile.png` — NewsPage sur iPhone SE
- `club-view-mobile.png` — ClubPageView overlay
- `poster-studio-mobile.png` — PosterStudio ouvert
- `admin-desktop.png` — AdminPage

Tolérance : 0.2% de pixels différents (< 1% bloquant).

---

## 10. Règles de Blocage — Déploiement Interdit si

- Erreur JavaScript non capturée dans la console
- Error Boundary déclenché (React error)
- Erreur Supabase non gérée visible utilisateur
- Tab/page inaccessible (404 ou crash)
- Workflow P0 cassé
- Coverage Vitest sous les seuils (section 5)
- Overflow horizontal sur mobile (375px)

---

## 11. Mode Démo — Exigences QA Spécifiques

Le mode démo est l'outil de vente principal. **Une démo cassée = un prospect perdu.**

Suite dédiée : `e2e/demo/demo-sandbox.spec.js`

Pour chaque profil (Président, Coach, Parent, Communication, Joueur, Supporter) :
- [ ] Activation du profil sans erreur
- [ ] Navigation entre toutes les étapes
- [ ] Boutons et interactions fonctionnels
- [ ] Encadrés pédagogiques visibles
- [ ] Transitions fluides (Framer Motion)
- [ ] Retour arrière fonctionnel
- [ ] Guide flottant visible et draggable
- [ ] Halos DemoSpotlight affichés sur les éléments guidés
- [ ] Sandbox libre accessible via "Essayer moi-même"
- [ ] SandboxWelcome affiché correctement
- [ ] Données fictives présentes (75 joueurs, 45 événements, 38 convocations)

---

## 12. Audit de Performance

### Métriques surveillées

| Métrique | Seuil alerte |
|---------|-------------|
| Bundle total (gzip) | > 1200kB |
| Chunk principal (gzip) | > 400kB |
| First Contentful Paint (mobile) | > 2.5s |
| Time to Interactive (mobile) | > 4s |

### Commande d'audit
```bash
npm run build
npx vite-bundle-visualizer
```

---

## 13. Fichiers Protégés — Tests Requis Avant Modification

| Fichier | Impact | Tests requis |
|---------|--------|-------------|
| `src/contexts/AuthContext.jsx` | Auth + rôles — toute l'app | `e2e/workflows/auth.spec.js` |
| `src/components/poster/PosterRenderer.jsx` | 37 templates | `e2e/workflows/poster-studio.spec.js` |
| `src/lib/posterReducer.js` | State PosterStudio | `src/__tests__/posterReducer.test.js` |
| `src/components/poster/posterUtils.js` | Tous les templates | `src/__tests__/posterVariables.test.js` |
| `src/lib/supabase.js` | Toutes requêtes DB | Tests d'intégration |
| `src/App.jsx` | Navigation tabs + deep links | `e2e/pages/navigation.spec.js` |
| `src/components/BottomNav.jsx` | Navigation principale | `e2e/pages/navigation.spec.js` |
| `public/sw.js` | PWA Service Worker | Tests manuels offline |
| `src/components/club/ClubPageView.jsx` | Mini-site clubs (1730L) | `e2e/pages/clubs.spec.js` |
| `src/components/PosterStudio.jsx` | PosterStudio (2730L) | `e2e/workflows/poster-studio.spec.js` |

---

## 14. Processus de Release

Avant tout déploiement en production :

```bash
# 1. Vérification statique
npm run lint

# 2. Tests unitaires avec coverage
npm run test:coverage

# 3. Tests E2E complets
npm run test:e2e

# 4. Build de production
npm run build

# 5. QA Scan — détection de gaps
npm run qa:scan

# 6. Checklist manuelle (section 3)
```

---

## 15. Scan Automatique de Couverture

Le script `scripts/qa-scan.js` (`npm run qa:scan`) :
1. Scanne `src/pages/` pour détecter les nouvelles pages
2. Scanne `src/components/` pour les nouveaux composants majeurs
3. Scanne `src/hooks/` pour les nouveaux hooks non testés
4. Compare avec `QA_REGISTRY.md`
5. Génère `e2e/reports/qa-scan.json` avec les gaps identifiés

Exécuter après chaque sprint pour maintenir le registre à jour.

---

## Révisions

| Date | Auteur | Version | Changement |
|------|--------|---------|-----------|
| 2026-06-11 | Gouvernance SportLink | 1.0.0 | Création initiale |
