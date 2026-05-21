---
name: poster-studio
description: Feature PosterStudio — architecture, state management, persistence, templates, génération d'affiches sportives
---

# PosterStudio — Génération d'Affiches Sportives

## Vue d'ensemble

PosterStudio est un éditeur d'affiches sportives intégré à SportLink. Il permet de créer des visuels pour les événements (matchs, tournois) avec logos de clubs, couleurs, typographie.

**Fichier principal** : `src/components/PosterStudio.jsx`

**Hooks associés** : `src/hooks/usePosterDraft.js`
- `usePosterDraft(eventId)` — brouillon auto-sauvegardé par event
- `usePosterLibrary()` — bibliothèque d'affiches nommées
- `useFavoriteTemplates()` — templates mis en favoris
- `useDefaultTemplate(clubId)` — template par défaut par club

---

## Architecture State

PosterStudio utilise `useReducer` avec un état centralisé :

```js
const [state, dispatch] = useReducer(posterReducer, initialState);
```

### Actions du reducer

- `PATCH` — met à jour des champs du state (payload = objet partiel)
- `RESET` — remet à l'état initial
- `LOAD` — charge un state complet (depuis draft ou library)

### Champs clés du state

```js
{
  format: 'story' | 'square' | 'landscape',
  templateId: string,
  homeLogo: string | null,   // URL ou base64
  awayLogo: string | null,   // URL ou base64
  homeTeam: string,
  awayTeam: string,
  date: string,
  time: string,
  venue: string,
  primaryColor: string,      // couleur principale du template
  // ... autres champs selon le template
}
```

---

## Initialisation depuis les props

Le composant reçoit `event` et `club` en props. Les valeurs initiales (`initialFields`) sont calculées depuis ces props :

```js
const initialFields = useMemo(() => ({
  homeLogo:  club?.logo ?? null,
  awayLogo:  null,
  homeTeam:  club?.name ?? event?.homeTeam ?? '',
  awayTeam:  event?.awayTeam ?? '',
  date:      event?.date ?? '',
  // ...
}), [event, club]);
```

### Règle critique — restauration du draft

Quand on restaure un draft, **ne pas écraser les logos avec des strings vides** :

```js
if (draft?.state) {
  const merged = { ...draft.state };
  if (!merged.homeLogo && initialFields.homeLogo) merged.homeLogo = initialFields.homeLogo;
  if (!merged.awayLogo && initialFields.awayLogo) merged.awayLogo = initialFields.awayLogo;
  dispatch({ type: 'PATCH', payload: merged });
}
```

Un draft sauvegardé sans logo (string vide `""`) ne doit pas remplacer un logo présent dans `initialFields`.

---

## Persistence — dual-persistence

### localStorage (immédiat)

```js
// Clés localStorage
const DRAFT_KEY   = 'sl-poster-draft';   // 1 draft actif
const LIBRARY_KEY = 'sl-poster-library'; // liste des posters sauvegardés
const FAV_TPL_KEY = 'sl-fav-templates';  // IDs templates favoris
const DEF_TPL_KEY = 'sl-default-template'; // template par défaut par club
```

### Supabase (background sync)

Table `posters` :
```sql
id          uuid PK
event_id    uuid FK → events
user_id     uuid FK → profiles
name        text
status      'draft' | 'saved'
format      'story' | 'square' | 'landscape'
template_id text
layers      jsonb  -- state complet
updated_at  timestamptz
created_at  timestamptz
```

Contrainte unique : `(event_id, user_id)` pour les drafts (1 draft par event par user).

### Sync multi-device

Au montage, `usePosterDraft` compare le timestamp localStorage vs Supabase et prend le plus récent :

```js
const lsTs = lsData?.savedAt ? new Date(lsData.savedAt).getTime() : 0;
const dbTs  = new Date(data.updated_at).getTime();
if (dbTs > lsTs) {
  ls_set(DRAFT_KEY, { eventKey, savedAt: data.updated_at, state: data.layers });
}
```

---

## Propagation du prop `club`

Le `club` prop est crucial pour les logos. Sa chaîne de propagation :

```
App (allClubs state)
  → MapPage (allClubs prop → selectedClub useMemo)
    → EventSidebar (clubs prop → inline find par clubId)
      → EventCard (club prop)
        → PosterStudio (club prop)
    → MobileEventSheet (club prop = selectedClub)
      → PosterStudio (club prop)
  → ClubPageView (club prop directement disponible)
    → PosterStudio (club prop directement)
```

Si le logo ne s'affiche pas dans un contexte, vérifier que `club` est bien passé à chaque niveau de cette chaîne.

---

## Templates

Les templates sont définis dans `src/lib/posterTemplates.js` (ou équivalent). Chaque template a :

```js
{
  id: 'simple',
  name: 'Simple',
  formats: ['story', 'square', 'landscape'],
  defaultColors: { primary: '#1a1a2e', secondary: '#ffffff' },
  render: (state, ctx) => { /* canvas drawing logic */ },
}
```

### Template par défaut par club

`useDefaultTemplate(clubId)` — persiste en localStorage + `club_brand_kits.default_template_id` via upsert sur `club_id`.

---

## Export / Génération

La génération finale utilise un `<canvas>` HTML5. Pattern :

```js
function exportPoster() {
  const canvas = canvasRef.current;
  const link = document.createElement('a');
  link.download = `affiche-${event.id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

### Contraintes CORS pour les logos

Les logos chargés depuis des URLs externes (Supabase Storage) doivent être dessinés sur canvas avec l'image en `crossOrigin = 'anonymous'` :

```js
const img = new Image();
img.crossOrigin = 'anonymous';
img.src = logoUrl;
img.onload = () => ctx.drawImage(img, x, y, w, h);
```

Sans ça, le canvas est "tainted" et `toDataURL()` échoue.

---

## Formats d'affiches

| Format       | Ratio  | Usage                          |
|--------------|--------|--------------------------------|
| `story`      | 9:16   | Instagram/WhatsApp stories     |
| `square`     | 1:1    | Posts Instagram                |
| `landscape`  | 16:9   | Partage Twitter/Facebook       |

---

## Points d'attention

- PosterStudio est un composant lourd → lazy-loader avec `React.lazy` si pas encore fait
- Ne jamais sauvegarder en BDD du contenu non-sanitisé (noms d'équipes, venue…)
- Le `isRealEvent` guard dans `usePosterDraft` protège contre les faux saves sur des events temporaires :
  ```js
  const isRealEvent = eventId && typeof eventId === 'string' && eventId.includes('-');
  ```
