---
name: release-deployment
description: PWA build, checklist de release, déploiement, migrations Supabase, vérifications pre-prod
---

# Release & Déploiement — SportLink

## Stack de déploiement

- **Frontend** : Vite build → hébergement statique (Vercel / Netlify / autre)
- **Backend** : Supabase (managed — pas de déploiement backend custom)
- **PWA** : `vite-plugin-pwa` — génère manifest + service worker automatiquement
- **Migrations** : SQL appliqués manuellement via Supabase Studio SQL editor ou CLI

---

## Build de production

```bash
npm run build
```

Vérifie avant le build :
- Pas d'erreurs TypeScript/JSX dans la console Vite
- Variables d'environnement définies (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Pas de `console.log` de debug laissés dans le code critique

### Variables d'environnement

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

- Ne JAMAIS committer `.env` avec des vraies valeurs — uniquement `.env.example`
- La `ANON_KEY` est publique (safe en frontend) — jamais la `service_role` key

---

## Checklist pre-release

### Code

- [ ] Tous les `console.log` de debug supprimés (ou remplacés par un logger conditionnel)
- [ ] Pas de commentaires `TODO` ou `FIXME` bloquants
- [ ] `npm run build` passe sans erreur ni warning critique
- [ ] `npm run test` passe (si tests disponibles)
- [ ] Review de sécurité : pas d'input non-sanitisé, RLS en place

### Migrations SQL

- [ ] Toutes les migrations sont dans `supabase/migrations/` avec le bon format de nom
- [ ] Chaque migration a été testée en environnement de staging avant prod
- [ ] Les migrations sont idempotentes (safe à rejouer)
- [ ] Pas de migration destructive (DROP TABLE, ALTER COLUMN avec perte de données) sans sauvegarde

### PWA

- [ ] `vite-plugin-pwa` configuré avec les bons assets (icônes 192×192, 512×512)
- [ ] `manifest.webmanifest` contient `name`, `short_name`, `theme_color`, `background_color`
- [ ] Le service worker est mis à jour (vérifier `workbox` strategy)
- [ ] Le mode offline fonctionne pour les pages essentielles

### Performance

- [ ] Bundle analysé (`npm run build -- --report` ou `vite-bundle-visualizer`)
- [ ] Pas de dépendance volumineuse importée en entier (tree-shaking ok)
- [ ] Images optimisées (WebP, tailles correctes)
- [ ] Lazy loading en place pour les pages/composants lourds

### Mobile & PWA install

- [ ] Testé sur Safari iOS (safe-area, PWA install prompt)
- [ ] Testé sur Chrome Android
- [ ] Testé hors connexion (service worker cache)

---

## Appliquer les migrations Supabase

### Via Supabase Studio

1. Aller dans **SQL Editor** dans le dashboard Supabase
2. Copier le contenu du fichier de migration
3. Exécuter
4. Vérifier qu'il n'y a pas d'erreur

### Via Supabase CLI (si configuré)

```bash
supabase db push
```

### Ordre d'application

Appliquer les migrations dans l'ordre chronologique de leur nom. Ne jamais modifier une migration déjà appliquée en production — créer une nouvelle migration corrective.

---

## Rollback

### Frontend

Le rollback frontend est immédiat — redéployer la version précédente du build.

### Migrations SQL

Les migrations ne sont pas automatiquement rollbackables. Pour annuler :
1. Créer une migration `YYYYMMDD_revert_xxx.sql` qui défait les changements
2. Ne jamais supprimer les migrations appliquées

Exemple de rollback migration :
```sql
-- Revert 20260521_perf_indexes.sql
DROP INDEX IF EXISTS events_club_date_idx;
DROP INDEX IF EXISTS events_club_id_idx;
-- ... etc
```

---

## Monitoring post-déploiement

### Après chaque deploy, vérifier

1. **Console browser** — pas d'erreurs JS en production
2. **Supabase Logs** — pas d'erreurs de requête ou de RLS
3. **Auth flow** — login/logout fonctionnel
4. **Features critiques** :
   - Carte interactive charge
   - Création d'événement fonctionne
   - PosterStudio génère une affiche
   - Notifications realtime arrivent

### Supabase Realtime

Si les subscriptions realtime ne fonctionnent pas :
1. Vérifier que la table est dans `supabase_realtime` publication
2. Vérifier les RLS policies SELECT (realtime utilise SELECT pour les broadcasts)
3. Vérifier les logs dans Supabase Dashboard → Realtime

---

## PWA — mise à jour du service worker

Quand une nouvelle version est déployée, le service worker met du temps à se mettre à jour. Pour forcer la mise à jour chez les utilisateurs :

```js
// Dans vite-plugin-pwa config
workbox: {
  skipWaiting: true,     // active immédiatement le nouveau SW
  clientsClaim: true,    // prend le contrôle des clients existants
}
```

Ou afficher une bannière "Nouvelle version disponible — Recharger" en détectant `onNeedRefresh`.

---

## Nommage des versions

Format recommandé : `YYYY.MM.DD` (ex: `2026.05.21`)

Tagguer les releases importantes avec git :
```bash
git tag v2026.05.21
git push origin v2026.05.21
```
