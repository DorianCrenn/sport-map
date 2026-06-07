# Skill : UX_EXIT_PATH_REVIEW

Exécuter cet audit avant chaque merge / PR sur SportLink.

## Déclenchement

```
/ux-exit-path-review
```

Ou manuellement : "Lance un audit exit paths sur ce composant/cette PR".

---

## Checklist automatique — par composant

Pour chaque écran, modal, drawer, bottom sheet ou overlay :

### 1. Bouton fermer

- [ ] Bouton `×` visible dès l'ouverture (pas caché par le header, pas sous la safe area)
- [ ] `aria-label="Fermer"` présent
- [ ] Taille tactile ≥ 44×44 px (WCAG 2.5.5)
- [ ] Position atteignable au pouce (recommandé : coin supérieur droit ou bas centre)

### 2. Bouton retour

- [ ] Chevron `←` ou texte "Annuler" visible pour les flows multi-étapes
- [ ] Toujours présent à chaque étape (pas seulement à la fin)

### 3. Fermeture par overlay/backdrop

- [ ] `onClick={e => e.target === e.currentTarget && onClose()}` sur le backdrop
- [ ] Le backdrop couvre bien `inset: 0`

### 4. Fermeture clavier (desktop)

- [ ] `useEffect` écoutant `Escape` → `onClose()`
- [ ] Chaîne de priorité si plusieurs overlays empilés (fermer le plus haut d'abord)

### 5. Gestures mobiles

- [ ] Drag handle visible (pill 36×4 px, couleur `var(--sl-border-s)`) pour les bottom sheets
- [ ] Swipe-to-close depuis le handle (seuil ≥ 100 px de glissement vers le bas)
- [ ] `touchAction: 'none'` sur la zone de drag pour éviter les conflits scroll
- [ ] Swipe-from-left (iOS) compatible si overlay en `position: absolute`

### 6. Bouton Android back

- [ ] Pas de `position: fixed` sans Escape listener (sinon Android back = navigation browser)
- [ ] Pas de piège de focus sans moyen d'en sortir au clavier

### 7. Safe areas

- [ ] `paddingBottom: 'env(safe-area-inset-bottom, 0px)'` sur footer/bottom nav
- [ ] Aucun bouton critique caché par Dynamic Island (éviter `top: 0` sans `padding-top: env(safe-area-inset-top)`)

### 8. Accessibilité minimale

- [ ] `role="dialog"` + `aria-modal="true"` sur les modals
- [ ] `aria-labelledby` pointant vers le titre (h2/h3)
- [ ] Focus piégé dans la modal (useFocusTrap) quand en plein écran
- [ ] Retour au focus précédent à la fermeture

### 9. États vides et d'erreur

- [ ] Loading state avec indicateur visible
- [ ] Erreur avec message + bouton "Réessayer" ou "Fermer"
- [ ] Empty state avec CTA clair

### 10. Responsive

- [ ] Testé sur iPhone SE (375×667) — rien de coupé
- [ ] Canvas/preview min-height ≥ 140 px (PosterStudio)
- [ ] Panels inférieurs maxHeight ≤ 38dvh pour laisser visible le contenu principal

---

## Composants à vérifier à chaque PR

| Composant | Type | Points critiques |
|---|---|---|
| `ModalFrame.jsx` | Base modal | drag handle, Escape, overlay click |
| `MobileEventSheet.jsx` | Bottom sheet | snap points, close 44px, drag handle |
| `PosterStudio.jsx` | Overlay full | Escape, submodals chaînés, canvas visible |
| `PosterEditor.jsx` | Overlay full | close toujours visible même en édition |
| `AiElementEditor.jsx` | Overlay full | close 44px header |
| `ClubAdminDrawer.jsx` | Drawer | close 44px, backdrop click |
| `ClubPageView.jsx` | Page overlay | bouton retour, Escape |
| `UserPublicView.jsx` | Slide overlay | Escape, close visible |
| `EventFormModal.jsx` | Modal wizard | annuler à chaque étape |
| `CreateRideModal.jsx` | Modal | overlay click, Escape |
| `ClubFormModal.jsx` | Modal | overlay click, Escape |

---

## Simulation rôles utilisateurs

Avant merge, simuler ces scénarios sur mobile (DevTools 375px) :

**Dirigeant de club :**
1. Ouvre PosterStudio → voit l'affiche → ferme sans exporter
2. Ouvre l'éditeur visuel → sélectionne un bloc → ferme l'éditeur
3. Ouvre le panel Upgrade Premium → ferme

**Parent :**
1. Clique sur un pin carte → bottom sheet s'ouvre → swipe down pour fermer
2. Ouvre une page club → revient à la carte

**Joueur (mobile) :**
1. Ouvre un événement → voit les détails → ferme → retour à la carte
2. Ouvre le profil d'un autre utilisateur → ferme via ←

---

## Scoring UX (sur 100)

| Critère | Points max |
|---|---|
| Boutons fermer présents + taille 44px | 20 |
| Escape key sur tous les overlays | 15 |
| Drag handles + swipe-to-close | 15 |
| Safe areas respectées | 10 |
| Aria-labels + role dialog | 15 |
| Canvas/preview visible sur iPhone SE | 10 |
| Focus trap + retour focus | 10 |
| Responsive (rien de coupé) | 5 |

Score ≥ 85/100 requis pour merge.
