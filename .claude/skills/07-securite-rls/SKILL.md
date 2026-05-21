---
name: securite-rls
description: Sécurité Supabase, Row Level Security, politiques RLS, auth patterns, protection contre les injections
---

# Sécurité & RLS — SportLink

## Principes de sécurité

1. **RLS toujours activé** sur toutes les tables publiques
2. **Sanitisation** de tout input utilisateur avant écriture en BDD
3. **Validation côté serveur** (RLS) — ne pas se fier uniquement au frontend
4. **Moindre privilège** — les utilisateurs ne voient que ce dont ils ont besoin

---

## Row Level Security (RLS)

### Activer RLS sur une nouvelle table

```sql
ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;
```

**Toujours activer RLS avant de créer des policies.**

### Policies standard

#### Lecture publique (events, clubs)

```sql
CREATE POLICY "events_select_public" ON public.events
  FOR SELECT USING (true);
```

#### Lecture authentifiée seulement

```sql
CREATE POLICY "comments_select_auth" ON public.event_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);
```

#### Écriture propriétaire seulement

```sql
CREATE POLICY "comments_insert_own" ON public.event_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON public.event_comments
  FOR DELETE USING (auth.uid() = user_id);
```

#### Fonction helper — gestion de club

```sql
-- Vérifier si l'utilisateur peut gérer un club
CREATE OR REPLACE FUNCTION public.sl_can_manage_club(club_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        role IN ('admin', 'superadmin')
        OR (role = 'club_admin' AND profiles.club_id = sl_can_manage_club.club_id)
      )
  );
$$;

-- Utilisation dans une policy
CREATE POLICY "events_update_club_admin" ON public.events
  FOR UPDATE USING (sl_can_manage_club(club_id));
```

### Policies pour les profils

```sql
-- Chacun peut lire tous les profils (nécessaire pour les noms dans commentaires)
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- Chacun peut seulement modifier son propre profil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

## Rôles utilisateur

| Rôle         | Accès                                                   |
|--------------|---------------------------------------------------------|
| `user`       | Accès standard — propres données seulement              |
| `club_admin` | Peut gérer son club (events, annonces, membres)         |
| `admin`      | Accès étendu — modération                               |
| `superadmin` | Accès total                                             |

Le rôle est stocké dans `profiles.role` et indexé :
```sql
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role)
  WHERE role IN ('admin', 'superadmin', 'club_admin');
```

**Ne jamais faire confiance au rôle côté client seul** — toujours vérifier via RLS ou une fonction SECURITY DEFINER.

---

## Sanitisation des inputs

### Règle absolue

Tout texte entré par l'utilisateur et écrit en BDD doit passer par `sanitizeText()` :

```js
import { sanitizeText } from '../lib/sanitize.js';

// Avant insert/update
message: sanitizeText(userInput),
title:   title ? sanitizeText(title) : null,
```

### Ce que sanitizeText doit faire

- Supprimer les balises HTML (`<script>`, `<img onerror=...>`, etc.)
- Trimmer les espaces
- Limiter la longueur si nécessaire
- Ne PAS encoder les caractères unicode légitimes (emojis, accents)

### Validation de longueur côté client

```js
if (!trimmed || trimmed.length > 500) return { error: 'invalid' };
```

La validation côté client est pour l'UX — la vraie protection est dans les CHECK constraints SQL et les RLS policies.

---

## CORS et canvas (PosterStudio)

Pour les images dessinées sur canvas depuis des URLs Supabase Storage :

```js
const img = new Image();
img.crossOrigin = 'anonymous';  // OBLIGATOIRE
img.src = logoUrl;
```

Sans `crossOrigin = 'anonymous'`, le canvas est "tainted" et `toDataURL()` lance une erreur de sécurité.

Côté Supabase Storage : configurer les CORS headers pour autoriser l'origine de l'app.

---

## Protection des routes frontend

Vérifications côté UI (pas suffisantes seules, doublées par RLS) :

```js
// Vérifier si l'utilisateur peut éditer un club
function isOwnClub(club) {
  if (isAdmin) return club.isUserCreated;
  if (currentUser) return club.userId === currentUser.id || club.ownerId === currentUser.id;
  return false;
}
```

**Attention** : `mapFromDB` expose `userId` (pas `ownerId`) pour les clubs. Toujours vérifier le mapper quand un check de propriété échoue silencieusement.

---

## Données sensibles

- Ne jamais logger `currentUser` entier (contient email, métadonnées)
- Ne jamais stocker de tokens JWT en localStorage manuellement — Supabase gère ça
- Ne jamais exposer les clés Supabase `service_role` côté client — seulement `anon`
- Le fichier `.env` avec `VITE_SUPABASE_ANON_KEY` est correct (clé publique, safe en frontend)

---

## Checklist sécurité — nouvelle feature

- [ ] RLS activé sur toute nouvelle table
- [ ] Policies SELECT, INSERT, UPDATE, DELETE définies selon le besoin
- [ ] Inputs utilisateur sanitisés avant écriture
- [ ] Opérations destructives (delete) vérifiées avec `auth.uid() = user_id`
- [ ] Aucune logique sensible côté client sans vérification RLS serveur
- [ ] CORS configuré si des assets sont chargés cross-origin
- [ ] Pas de secrets hardcodés dans le code source
