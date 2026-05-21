---
name: supabase-database
description: Patterns Supabase JS v2, requêtes, realtime, migrations SQL, RLS, optimisation queries
---

# Supabase & Base de Données — SportLink

## Client

```js
import { supabase } from '../lib/supabase.js';
```

Ne jamais instancier un nouveau client — toujours importer celui de `lib/supabase.js`.

## Auth — règle critique

**Ne jamais appeler `supabase.auth.getUser()` dans les composants ou hooks.**

- `getUser()` fait un appel réseau (validation JWT) → latence à chaque render
- `getSession()` utilise le cache local → acceptable mais déprécié dans les patterns récents
- **Pattern correct** : utiliser `useAuth()` pour récupérer `currentUser` et `userId`

```js
// ❌ Mauvais
const { data: { user } } = await supabase.auth.getUser();

// ✅ Correct
const { currentUser } = useAuth();
const userId = currentUser?.id ?? null;
```

## Patterns de requêtes

### Select avec join

```js
const { data, error } = await supabase
  .from('event_comments')
  .select('id, content, created_at, user_id, profiles(name)')
  .eq('event_id', eventId)
  .order('created_at', { ascending: true })
  .limit(100);
```

### Upsert (insert ou update)

```js
await supabase.from('posters').upsert(
  { event_id: eventId, user_id: userId, ...fields },
  { onConflict: 'event_id,user_id', ignoreDuplicates: false }
);
```

L'`onConflict` doit correspondre à une contrainte UNIQUE existante en BDD. Vérifier la migration avant d'utiliser upsert.

### Mise à jour de listes (follows, teams…)

**Ne jamais faire DELETE ALL + INSERT ALL** — risque de perte si l'insert échoue.

Pattern correct :
```js
// 1. UPSERT les entrées nouvelles/modifiées
if (next.length > 0) {
  await supabase.from('club_follows').upsert(
    next.map(f => ({ user_id: userId, club_id: f.clubId, ...f })),
    { onConflict: 'user_id,club_id' }
  );
}
// 2. DELETE ciblé des entrées supprimées
const removed = prev.filter(f => !nextIds.has(f.clubId)).map(f => f.clubId);
if (removed.length > 0) {
  await supabase.from('club_follows').delete()
    .eq('user_id', userId).in('club_id', removed);
}
```

### maybeSingle vs single

- `.single()` → erreur si 0 ou >1 résultats
- `.maybeSingle()` → retourne `null` si 0 résultats, erreur si >1
- Préférer `.maybeSingle()` pour les lookups qui peuvent ne rien trouver

## Realtime — subscriptions

Pattern standard pour une subscription :

```js
const channel = supabase
  .channel(`unique-channel-name-${param}`)
  .on('postgres_changes', {
    event: 'INSERT',   // ou 'UPDATE', 'DELETE', ou '*'
    schema: 'public',
    table: 'ma_table',
    filter: `event_id=eq.${eventId}`,  // optionnel mais recommandé
  }, (payload) => {
    // payload.new pour INSERT/UPDATE, payload.old pour DELETE
    setData(prev => /* mise à jour incrémentale */);
  })
  .subscribe();

// Cleanup dans le return du useEffect
return () => supabase.removeChannel(channel);
```

### Règles realtime

- Toujours nettoyer avec `supabase.removeChannel(channel)` dans le cleanup
- Nommer le channel avec un paramètre unique pour éviter les collisions : `reactions-${eventId}`, `profile-${userId}`
- Si plusieurs handlers sur le même canal : chaîner `.on()` avant `.subscribe()`
- Pour des channels qui peuvent se dupliquer (re-renders) : ajouter un suffixe aléatoire `Math.random().toString(36).slice(2,7)`
- La table doit être dans la publication `supabase_realtime` pour que les updates soient broadcastés

### Tables dans supabase_realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
```

Vérifier via migration si une table n'émet pas ses changements.

## Migrations SQL

- Fichier : `supabase/migrations/YYYYMMDD_description.sql`
- Toujours idempotent : `CREATE INDEX IF NOT EXISTS`, DO blocks pour contraintes
- `IF NOT EXISTS` **non supporté** pour `ALTER TABLE ADD CONSTRAINT` → utiliser un DO block :

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ma_contrainte_unique'
      AND conrelid = 'public.ma_table'::regclass
  ) THEN
    ALTER TABLE public.ma_table
      ADD CONSTRAINT ma_contrainte_unique UNIQUE (col1, col2);
  END IF;
END $$;
```

- Toujours terminer par `NOTIFY pgrst, 'reload schema';` pour que PostgREST prenne en compte les changements

## Index — quand en créer

Créer un index sur toute colonne utilisée dans :
- `.eq('col', val)` dans des requêtes fréquentes
- `.order('col', ...)` sur des tables volumineuses
- `.filter` de realtime
- Colonnes de FK non indexées automatiquement par Postgres

Index partiels quand applicable :
```sql
CREATE INDEX IF NOT EXISTS events_club_id_idx ON public.events (club_id)
  WHERE club_id IS NOT NULL;
```

## Tables principales

| Table               | Rôle                                      |
|---------------------|-------------------------------------------|
| `profiles`          | Profils utilisateur, role, club_id        |
| `clubs`             | Clubs sportifs, user_id = propriétaire    |
| `events`            | Événements, club_id, user_id, date        |
| `favorites`         | Événements favoris par user               |
| `attendees`         | Participants aux événements               |
| `club_follows`      | Abonnements club, unique(user_id,club_id) |
| `posters`           | Affiches PosterStudio, status draft/saved |
| `event_reactions`   | Réactions emoji par event                 |
| `event_comments`    | Commentaires par event                    |
| `club_announcements`| Annonces par club                         |
| `club_brand_kits`   | Branding club (logo, couleurs, template)  |
| `event_reaction_counts` | Vue matérialisée des counts par emoji |

## Sanitisation

Tout texte utilisateur écrit en BDD doit passer par `sanitizeText` :

```js
import { sanitizeText } from '../lib/sanitize.js';
message: sanitizeText(rawMessage),
```

Ne jamais insérer directement `event.target.value` ou des strings non-sanitisées venant de l'utilisateur.
