# Release SportLink

Gère le cycle de release complet de SportLink : vérifie l'état git, calcule la prochaine version depuis les commits conventionnels, génère le CHANGELOG, crée le tag et pousse.

## Étapes

1. **Vérifie l'état du dépôt**
   - `git status` — s'il y a des fichiers non committés, signale-le et demande si on continue
   - `git log <dernier-tag>..HEAD --oneline` — liste les commits depuis le dernier tag pour montrer ce qui sera inclus dans la release

2. **Détermine le type de bump**
   - Analyse les préfixes des commits depuis le dernier tag :
     - Au moins un `feat:` → bump **minor** (ex: 1.0.0 → 1.1.0)
     - Uniquement `fix:`, `refactor:`, `perf:` → bump **patch** (ex: 1.0.0 → 1.0.1)
     - `BREAKING CHANGE` dans un commit → bump **major** (ex: 1.0.0 → 2.0.0)
   - Affiche le type détecté et la version actuelle → prochaine version estimée
   - Si aucun commit feat/fix depuis le dernier tag : informe qu'il n'y a rien à releaser

3. **Confirme avec l'utilisateur** (sauf si l'argument `--auto` est passé)
   - Affiche le résumé : version actuelle → prochaine version, nombre de commits inclus
   - Attend confirmation avant de continuer

4. **Lance la release**
   - Utilise le script du `package.json` selon le type détecté :
     - patch/minor auto → `npm run release` (standard-version calcule lui-même)
     - Si l'utilisateur veut forcer : `npm run release:minor` ou `npm run release:major`
   - Le script crée le commit de release, le tag git, met à jour `CHANGELOG.md` et pousse

5. **Rapport final**
   - Affiche la nouvelle version depuis `package.json`
   - Affiche les 5 premières lignes du CHANGELOG pour cette release
   - Rappelle que Vercel déploiera automatiquement

## Règles

- Ne jamais lancer la release sans avoir vérifié qu'il y a des commits depuis le dernier tag
- Si le working tree a des fichiers modifiés non committés, bloquer et demander de committer d'abord
- Toujours afficher les commits qui seront inclus avant de demander confirmation
- Le répertoire de travail est `c:\Users\doria\Desktop\Project\sport-map`
