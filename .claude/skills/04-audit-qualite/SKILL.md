---
name: audit-qualite
description: Checklist pre-merge, review de code, détection de bugs courants, conventions de tests
---

# Audit & Review Qualité — SportLink

## Checklist pre-merge

Avant tout commit/PR, vérifier chaque point :

### Auth & Sécurité

- [ ] Aucun appel `supabase.auth.getUser()` dans les hooks ou composants — utiliser `useAuth()`
- [ ] Aucun appel `supabase.auth.getSession()` direct dans les composants
- [ ] Tout texte utilisateur écrit en BDD passe par `sanitizeText()`
- [ ] Les opérations sensibles (delete, update) vérifient `userId` avant d'agir
- [ ] Les RLS policies couvrent les nouvelles tables/opérations

### Data & Supabase

- [ ] Pas de `DELETE ALL + INSERT ALL` — utiliser UPSERT + DELETE ciblé
- [ ] Les `.upsert()` ont un `onConflict` qui correspond à une contrainte UNIQUE réelle en BDD
- [ ] Les subscriptions realtime ont un cleanup `supabase.removeChannel(channel)` dans le return du useEffect
- [ ] Les channels realtime ont des noms uniques (incluent un paramètre ou suffixe aléatoire)
- [ ] Les `.single()` → `.maybeSingle()` pour les lookups qui peuvent ne rien trouver

### React & Hooks

- [ ] Tous les `useEffect` ont leurs dépendances correctes (lint rule exhaustive-deps)
- [ ] Pas de state update sur un composant démonté (vérifier `cancelled = true` / `isMounted` patterns)
- [ ] Les `useCallback` ont leurs deps correctes
- [ ] Pas de définition de fonction à l'intérieur d'un `useEffect` sans raison (extraire en `useCallback`)
- [ ] Les listes React ont des `key` stables (pas d'index si la liste peut être réordonnée)

### UI & Mobile

- [ ] Les éléments fixed/sticky ont le safe-area padding (`env(safe-area-inset-bottom)`)
- [ ] Tous les éléments interactifs font min 44×44px
- [ ] Les `<button>` sans texte visible ont `aria-label`
- [ ] Les images ont un attribut `alt`
- [ ] Les états de chargement sont gérés (skeleton ou spinner)
- [ ] L'UI fonctionne sur mobile 375px (tester en DevTools)

### Performance

- [ ] Pas de re-render inutile sur les composants lourds (PosterStudio, MapView)
- [ ] Les requêtes Supabase fréquentes ont des index correspondants
- [ ] Pas d'appel réseau dans le render (tout dans `useEffect` ou handlers)

### SQL / Migrations

- [ ] Migration idempotente (`CREATE INDEX IF NOT EXISTS`, DO blocks pour contraintes)
- [ ] `NOTIFY pgrst, 'reload schema';` en fin de migration
- [ ] `ALTER TABLE ADD CONSTRAINT IF NOT EXISTS` → remplacé par DO block (non supporté par PG)

---

## Bugs récurrents — patterns à détecter

### Silent field mismatch

Quand un champ a un nom différent entre la BDD (`mapFromDB`) et le composant :
- `club.userId` (mapFromDB) ≠ `club.ownerId` (ancien code) → toujours vérifier le mapper

### Prop manquante dans une chaîne longue

Si une feature marche dans contexte A mais pas contexte B, vérifier la chaîne de props complète. Ex: `club` prop dans `App → MapPage → EventSidebar → EventCard → PosterStudio`.

### Stale data après action serveur

Si le serveur modifie des données via trigger (ex: `profiles.role` après `addClub`), le client ne le sait pas automatiquement. Solutions :
1. `refetchProfile()` après l'action
2. Subscription realtime sur la table modifiée

### Scope bug dans les composants imbriqués

Les fonctions définies au niveau module (hors composant) ne peuvent pas accéder aux variables locales du composant parent — les passer en props.

---

## Conventions de tests

### Fichiers

- `*.test.jsx` ou `*.test.js` à côté du fichier testé, ou dans `__tests__/`
- Utiliser Vitest (`describe`, `it`, `expect`, `vi`)
- Utiliser `@testing-library/react` pour les composants

### Pattern standard

```js
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

### Mock Supabase

```js
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      // ...
    }),
  },
}));
```

### Ce qu'on teste

- Logique métier dans les hooks (pas les effets réseau)
- Comportement UI sur actions utilisateur (click, input)
- Cas limites (data vide, erreur réseau, utilisateur non connecté)

### Ce qu'on ne teste pas

- Les appels Supabase réels (pas de tests d'intégration BDD)
- Les animations Framer Motion
- Les détails d'implémentation interne des composants

---

## Review de PR — questions clés

1. **Que fait ce code si l'utilisateur n'est pas connecté ?** (`userId === null`)
2. **Que fait ce code si la requête Supabase échoue ?** (error handling)
3. **Est-ce que le cleanup est fait ?** (removeChannel, cancelled flag)
4. **Est-ce que ça marche sur mobile 375px ?**
5. **Est-ce que l'opération est idempotente ?** (peut-on la rejouer sans effet de bord ?)
