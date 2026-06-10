# Skill : error-feedback

Déclencher avec `/error-feedback` avant d'écrire un nouveau bloc `catch`,
un nouveau hook Supabase, ou une nouvelle Edge Function dans SportLink.

Objectif : garantir que toute erreur est automatiquement proposée en rapport
feedback à l'utilisateur, en un clic.

---

## Architecture du système d'erreurs

```
Hook / composant
    ↓ dispatchError(err)  ou  toast({ onReport })
    ↓ window 'sl-hook-error'
    ↓
App.jsx — useErrorBus
    ↓
toast({ message, type:'error', onReport: () => openFeedback({ type:'bug', title:msg }) })
    ↓
ToastItem affiche [message] [Signaler ↗]
                                 ↓ clic
                    FeedbackModal pré-rempli (bug, titre = message d'erreur)
                                 ↓ submit
                    app_feedback en DB ✓

Crash rendu → ErrorBoundary → bouton "Signaler le problème"
                                    ↓ clic
                    FeedbackModal pré-rempli (bug, titre = error.message, desc = stack)
```

---

## Pattern 1 — Erreurs dans les hooks (recommandé)

```js
import { dispatchError } from '../lib/errorBus.js';

async function fetchSomething() {
  const { data, error } = await supabase.from('table').select('*');
  if (error) {
    dispatchError(error);  // traduit + toast + bouton "Signaler" automatique
    return;
  }
  // ...
}
```

**NE PAS** appeler `toast()` directement pour les erreurs dans les hooks —
les hooks n'ont pas accès au ToastContext. Toujours passer par `dispatchError`.

---

## Pattern 2 — Erreurs dans les composants (try/catch locaux)

```js
import { useToast } from '../contexts/ToastContext.jsx';
import { translateSupabaseError } from '../lib/translateSupabaseError.js';

const { toast } = useToast();

} catch (err) {
  toast({
    message: translateSupabaseError(err),
    type: 'error',
    onReport: () => openFeedback({ type: 'bug', title: translateSupabaseError(err), category: 'crash' }),
  });
}
```

`openFeedback` est passé comme prop depuis App.jsx via `handleErrorReport`.

---

## Pattern 3 — ErrorBoundary sur tout nouveau overlay/page

Dans App.jsx, tout `<ErrorBoundary>` doit recevoir `onReport={handleErrorReport}` :

```jsx
<ErrorBoundary name="MonNouveauComposant" onReport={handleErrorReport}>
  <MonComposant />
</ErrorBoundary>
```

---

## Checklist avant commit

- [ ] Chaque `catch` dans un hook appelle `dispatchError(err)` (pas `console.error` seul)
- [ ] Chaque `catch` dans un composant utilise `toast({ onReport: ... })`
- [ ] `translateSupabaseError` importé si message affiché directement
- [ ] Nouveau composant plein-écran enveloppé dans `<ErrorBoundary onReport={handleErrorReport}>`
- [ ] Aucun `alert()` pour les erreurs — toujours `toast` ou `dispatchError`

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `src/lib/errorBus.js` | dispatchError() + useErrorBus() |
| `src/lib/translateSupabaseError.js` | 20 codes d'erreur → français |
| `src/contexts/ToastContext.jsx` | toast({ onReport }) → bouton "Signaler" |
| `src/components/FeedbackModal.jsx` | Modal pré-remplissable (prop prefilled) |
| `src/components/ErrorBoundary.jsx` | prop onReport → bouton "Signaler le problème" |
| `src/App.jsx` | handleErrorReport, errorForReport state |
