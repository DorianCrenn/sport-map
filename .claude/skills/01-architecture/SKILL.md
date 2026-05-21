---
name: architecture-globale
description: Structure du projet SportLink, conventions de code, patterns state management, prop drilling vs context
---

# Architecture Globale — SportLink

## Stack

- **React 19** JSX (pas TypeScript — ne pas ajouter de `.ts` ou annotations de type)
- **Vite** + `@tailwindcss/vite` (Tailwind v4)
- **Framer Motion v12** — animations
- **Supabase JS v2** — BDD + auth + realtime
- **Leaflet / react-leaflet** — carte interactive
- **Vitest + Testing Library** — tests
- **PWA** via `vite-plugin-pwa`

## Structure des dossiers

```
src/
  components/         # Composants réutilisables
    club/             # Composants spécifiques aux clubs
      blocks/         # Blocs éditables de la page club (UpcomingEventsBlock, etc.)
    ui/               # Composants UI génériques (Button, Modal, etc.)
  contexts/           # React Contexts (AuthContext, ThemeContext…)
  hooks/              # Custom hooks — préfixe `use`
  lib/                # Utilitaires non-React (supabase.js, sanitize.js…)
  pages/              # Pages top-level (MapPage, ClubsPage, ProfilePage…)
  assets/             # Images, icônes statiques
supabase/
  migrations/         # Fichiers SQL numérotés chronologiquement
```

## Conventions fichiers

- Composants React → `.jsx`, PascalCase (`EventCard.jsx`)
- Hooks → `.js`, camelCase, préfixe `use` (`useClubAnnouncements.js`)
- Utilitaires purs → `.js`, camelCase (`sanitize.js`)
- Pages → `.jsx`, PascalCase suffixé `Page` (`ClubsPage.jsx`)
- Migrations SQL → `YYYYMMDD_description.sql`

## State management

### Règles de priorité

1. **État local** (`useState`) — données propres au composant, pas partagées
2. **Props** — pour passer des données 1-2 niveaux de profondeur
3. **Context** — seulement pour les données vraiment globales (auth, theme)
4. **Pas de Zustand/Redux** — ne pas introduire sans discussion

### Contexts existants

- `AuthContext` → `currentUser`, `profile`, `follows`, `followClub`, `unfollowClub`, `refetchProfile`
- `ThemeContext` → `theme` ('light'|'dark'), `toggleTheme`

### Pattern hooks

Tous les hooks de data suivent ce modèle :
```js
export function useXxx(param) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch + realtime subscription
    return () => { /* cleanup */ };
  }, [param, userId]);

  const action = useCallback(async (...) => { /* optimistic + supabase */ }, [deps]);

  return { data, loading, action };
}
```

## Prop drilling autorisé

Le prop drilling est **acceptable jusqu'à 3 niveaux**. Au-delà, envisager un hook dédié ou un context.

Exemple documenté : `allClubs` passe de `App` → `MapPage` → `EventSidebar` → `EventCard` → `PosterStudio`. Acceptable car la chaîne est linéaire et peu fréquente.

## CSS custom properties

Variables globales définies dans le thème — **toujours utiliser ces variables** :

| Variable       | Rôle                          |
|----------------|-------------------------------|
| `--sl-bg`      | Fond de page principal        |
| `--sl-card`    | Fond de carte/panneau         |
| `--sl-border`  | Couleur de bordure            |
| `--sl-t1`      | Texte primaire                |
| `--sl-t2`      | Texte secondaire              |
| `--sl-t3`      | Texte tertiaire/placeholder   |
| `--sl-green`   | Couleur d'accentuation verte  |

Ne pas hardcoder de couleurs `#hex` ou `rgb()` dans les composants — passer par ces variables ou des classes Tailwind qui les utilisent.

## Imports

- Importer `supabase` depuis `../lib/supabase.js`
- Importer `useAuth` depuis `../contexts/AuthContext.jsx`
- Importer `sanitizeText` depuis `../lib/sanitize.js` pour tout input utilisateur écrit en BDD

## Anti-patterns à éviter

- `supabase.auth.getUser()` dans les hooks/composants — utiliser `useAuth()` à la place (getUser fait un appel réseau)
- `supabase.auth.getSession()` directement dans les composants — idem
- `DELETE ALL + INSERT ALL` pour les mises à jour de listes — utiliser UPSERT + DELETE ciblé
- Hardcoder des IDs ou des strings magiques sans constante nommée
- Ajouter des dépendances NPM sans vérifier si une solution native existe
