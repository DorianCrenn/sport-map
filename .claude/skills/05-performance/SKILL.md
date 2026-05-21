---
name: performance-optimisation
description: React perf, Supabase query optimisation, bundle size, lazy loading, réduction des re-renders
---

# Performance & Optimisation — SportLink

## Principes

La perf perçue > la perf mesurée. Priorité :
1. **Données visibles rapidement** (cache localStorage + fetch background)
2. **Actions utilisateur réactives** (optimistic UI)
3. **Pas de re-renders inutiles** sur les composants lourds

---

## Auth — source principale de latence

### Problème

`supabase.auth.getUser()` fait un appel réseau à chaque appel. Si plusieurs hooks l'appellent, chaque mount ajoute de la latence.

### Solution

Un seul appel dans `AuthContext`, exposé via `useAuth()`. **Aucun autre composant ou hook ne doit appeler `getUser()`.**

```js
// AuthContext — le seul endroit où getUser() est appelé
const { data: { user } } = await supabase.auth.getUser();
// Exposé via context :
const userId = currentUser?.id ?? null;
```

---

## Supabase — optimisation des requêtes

### Index obligatoires

Toute colonne utilisée dans `.eq()` ou `.order()` sur des tables volumineuses doit avoir un index :

```sql
-- Compound index pour la query la plus fréquente
CREATE INDEX IF NOT EXISTS events_club_date_idx ON public.events (club_id, date)
  WHERE club_id IS NOT NULL;
```

Tables et colonnes critiques indexées :
- `events(club_id)`, `events(user_id)`, `events(date)`, `events(club_id, date)`
- `clubs(user_id)`
- `favorites(user_id)`
- `attendees(user_id)`, `attendees(event_id)`
- `club_follows(user_id)`
- `profiles(club_id)`, `profiles(role)`

### Select — ne sélectionner que les colonnes nécessaires

```js
// ❌ Mauvais — télécharge tout
.select('*')

// ✅ Correct — seulement ce dont on a besoin
.select('id, name, created_at, layers, format')
```

### Limites

Toujours `.limit(N)` sur les requêtes qui peuvent retourner beaucoup de résultats :
- Commentaires : `.limit(100)`
- Bibliothèque posters : `.limit(20)`
- Annonces club : `.limit(30)`

### Promise.all pour les requêtes parallèles

```js
const [{ data: agg }, { data: own }] = await Promise.all([
  supabase.from('event_reaction_counts').select('emoji, count').eq('event_id', eventId),
  supabase.from('event_reactions').select('emoji').eq('event_id', eventId).eq('user_id', userId),
]);
```

---

## React — réduction des re-renders

### useMemo pour les calculs coûteux

```js
const selectedClub = useMemo(
  () => selectedEvent?.clubId ? allClubs.find(c => c.id === selectedEvent.clubId) ?? null : null,
  [allClubs, selectedEvent]
);
```

### useCallback pour les handlers passés en props

```js
const handleToggle = useCallback(async (emoji) => {
  // ...
}, [eventId, userId, mine]);
```

### Éviter les objets/tableaux inline dans les props

```jsx
// ❌ Crée un nouvel objet à chaque render
<Component style={{ padding: 16 }} options={[1, 2, 3]} />

// ✅ Stable entre les renders
const style = useMemo(() => ({ padding: 16 }), []);
const options = useMemo(() => [1, 2, 3], []);
<Component style={style} options={options} />
```

### PosterStudio — composant lourd

PosterStudio charge des ressources (canvas, images). Le lazy-loader avec `React.lazy` + `Suspense` :

```jsx
const PosterStudio = React.lazy(() => import('./PosterStudio'));

// Usage
<Suspense fallback={<div>Chargement...</div>}>
  <PosterStudio event={event} club={club} />
</Suspense>
```

---

## Cache localStorage — pattern dual-persistence

Les données sont stockées en localStorage pour un chargement immédiat, puis synchronisées avec Supabase en arrière-plan.

```js
// 1. Charger depuis localStorage immédiatement (0 latence)
const [data, setData] = useState(() => ls_get(KEY, []));

// 2. Fetch Supabase en background → mettre à jour si plus récent
useEffect(() => {
  if (!userId) return;
  supabase.from('...').select('...').then(({ data: dbData }) => {
    if (dbData) {
      setData(dbData);
      ls_set(KEY, dbData);
    }
  });
}, [userId]);
```

---

## Bundle size

### Imports — toujours importer par nom, pas le module entier

```js
// ❌ Importe tout lucide-react
import * as Icons from 'lucide-react';

// ✅ Tree-shakeable
import { Calendar, MapPin, Users } from 'lucide-react';
```

### Lazy loading des pages

Les pages lourdes doivent être lazy-loadées dans le router :

```js
const PosterStudioPage = React.lazy(() => import('./pages/PosterStudioPage'));
```

### Images

- Utiliser des formats modernes (WebP) pour les assets statiques
- Les logos de clubs uploadés → passer par l'URL Supabase Storage (déjà CDN)
- Ne pas inline des images base64 volumineuses dans le code

---

## Realtime — éviter les fuites de channels

Chaque subscription non nettoyée consomme une connexion WebSocket. Vérifier :

```js
useEffect(() => {
  const channel = supabase.channel('...').on(...).subscribe();
  return () => supabase.removeChannel(channel); // ← OBLIGATOIRE
}, [deps]);
```

Utiliser les DevTools Supabase pour vérifier le nombre de channels actifs.

---

## Métriques à surveiller

- **TTI** (Time to Interactive) sur mobile 4G simulé : < 3s
- **LCP** (Largest Contentful Paint) : < 2.5s
- **Latence "Mes clubs"** après création/join : < 500ms (réalisé via `refetchProfile()` + realtime)
- **Nombre de requêtes Supabase au montage** de l'app : viser < 5 requêtes avant affichage initial
