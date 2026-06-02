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

### Edge Functions (Supabase)

- [ ] Toute Edge Function lit le Bearer token et valide via `anonClient.auth.getUser(token)`
- [ ] Toute Edge Function appelle `checkRateLimit()` depuis `_shared/rateLimit.ts`
- [ ] Aucune clé API dans le code — uniquement `Deno.env.get('...')` / `import.meta.env.VITE_...`
- [ ] Les quotas IA (aiGeneratesPerMonth) sont vérifiés **côté serveur** avant l'appel API payant
- [ ] `dangerouslySetInnerHTML` : la source est une **constante hardcodée** (jamais données utilisateur)

### Accessibilité WCAG 2.2 AA

- [ ] Boutons sans texte visible → `aria-label` présent (standard : le nom visible ou la description de l'action)
- [ ] Nouveaux tokens CSS de couleur → contraste vérifié sur https://webaim.org/resources/contrastchecker/
  - Texte normal : ratio ≥ 4.5:1 (AA) / ≥ 7:1 (AAA)
  - Texte large (18px+ ou 14px+ bold) : ratio ≥ 3:1 (AA)
  - Composants UI (borders, inputs) : ratio ≥ 3:1 (AA, critère 1.4.11)
- [ ] Touch targets ≥ 44px en hauteur ET largeur (WCAG 2.5.5)
  - Règle : `padding: '11px 12px'` sur un bouton 12px de fonte ≈ 44px de hauteur totale
  - Pour les boutons icône : `minWidth: 44, minHeight: 44` dans le style
- [ ] Images dynamiques (src venant de Supabase) → `loading="lazy"` présent
- [ ] Modals → `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointant sur le titre
- [ ] Images décoratives → `alt=""` ou SVG avec `aria-hidden="true"`

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
- [ ] Nouvelle table → `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + au moins 1 policy SELECT
- [ ] Colonnes filtrées fréquemment (club_id, user_id, event_id) → `CREATE INDEX IF NOT EXISTS` présent
- [ ] Migrations irréversibles → impact vérifié avant `supabase db push` en prod

### Tests

- [ ] Nouveaux hooks → fichier `src/__tests__/hooks/use*.test.js` avec cas positifs ET négatifs
- [ ] Nouveaux composants → fichier `src/__tests__/components/*.test.jsx`
- [ ] `npm run test:coverage` → couverture branches ≥ 60% (seuil Vitest configuré)
- [ ] Pas de `vi.mock` qui désactive les vérifications de sécurité dans les tests (ex: mock useClubFeatures → toujours true)

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
6. **Est-ce que la feature gating est vérifiée côté serveur** et pas uniquement via `can(featureKey)` frontend ?
7. **Est-ce que les nouveaux boutons interactifs ont un aria-label** si le texte n'est pas visible ?

---

## Audit sécurité Edge Functions — points de contrôle

Pour chaque nouvelle Edge Function :

```typescript
// ── 1. Auth obligatoire ─────────────────────────────────
const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
if (!token) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, ... });
const { data: { user }, error } = await anonClient.auth.getUser(token);
if (error || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, ... });

// ── 2. Rate limit obligatoire pour appels coûteux ───────
const limited = await checkRateLimit(serviceClient, user.id, 'function-name', maxReqs, windowSec);
if (limited) return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, ... });

// ── 3. Validation input ────────────────────────────────
const { field } = await req.json();
if (!field || typeof field !== 'string') return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, ... });
```

Pattern de référence : `supabase/functions/generate-variant-bg/index.ts`
