---
name: ui-ux-mobile-first
description: Règles UI/UX mobile-first, safe-area, touch targets, Tailwind v4, Framer Motion, accessibilité
---

# UI/UX Mobile-First — SportLink

## Principes fondamentaux

SportLink est une **PWA mobile-first**. Toute nouvelle UI doit être pensée pour mobile (375px) en premier, puis adaptée desktop.

## Safe-area (iOS / notch / bottom bar)

Toujours respecter les safe areas sur les éléments fixes ou plein écran :

```css
/* Bottom fixed elements (bottom nav, floating buttons) */
padding-bottom: env(safe-area-inset-bottom);

/* Top fixed elements (header sur mobile) */
padding-top: env(safe-area-inset-top);
```

En Tailwind v4 : utiliser `pb-safe` / `pt-safe` si les utilitaires sont définis, sinon style inline.

Les sheets/drawers mobiles doivent avoir `pb-[env(safe-area-inset-bottom)]` pour que le contenu ne soit pas coupé.

## Touch targets

- Taille minimale : **44×44px** pour tout élément interactif (bouton, icône cliquable, lien)
- Zones tactiles trop petites → utiliser `p-2` ou `p-3` autour des icônes
- Ne pas mettre plusieurs boutons côte à côte sans espace suffisant (min 8px de gap)

## Tailwind v4

- Plugin via `@tailwindcss/vite` — pas de `tailwind.config.js` traditionnel
- Utiliser les utilitaires Tailwind pour le layout, les espacements, les couleurs de base
- Pour les couleurs custom → variables CSS `--sl-*` en `style` inline ou via `@layer` dans le CSS global
- **Ne pas** ajouter de `tailwind.config.js` ou de `@apply` dans des `.css` sauf dans le fichier global

## Framer Motion v12

- `motion.div`, `motion.button` etc. pour les animations
- Préférer `AnimatePresence` pour les entrées/sorties (modales, sheets, toasts)
- Pattern standard pour un sheet/modal :
  ```jsx
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        ...
      </motion.div>
    )}
  </AnimatePresence>
  ```
- Ne pas surcharger avec des animations complexes sur des listes longues (perf)

## Composants sheets/modales

- **MobileEventSheet** — sheet plein écran mobile, s'ouvre depuis la carte
- **EventSidebar** — sidebar desktop pour les events
- Pattern : mobile = sheet animée bottom-up, desktop = sidebar ou modal centré
- Toujours prévoir une croix de fermeture accessible (top-right, min 44×44px)

## Responsive breakpoints

```
mobile   : < 768px  (défaut — code sans préfixe)
tablet   : md:      (768px+)
desktop  : lg:      (1024px+)
```

## États de chargement

- Utiliser des skeletons plutôt que des spinners quand la structure est connue
- `loading && <Skeleton />` avant de render les données
- Ne jamais laisser une zone vide sans feedback pendant un fetch

## Feedback utilisateur

- **Optimistic UI** pour toutes les actions utilisateur (toggle favori, réaction, commentaire, follow)
- Rollback visible en cas d'erreur (restaurer l'état précédent + toast d'erreur)
- Toast de confirmation pour les actions irréversibles (suppression)

## Icônes

- Utiliser **Lucide React** (`lucide-react`) — bibliothèque installée
- Taille par défaut : `size={20}` pour inline, `size={24}` pour boutons principaux
- Ne pas importer depuis `react-icons` ou d'autres libs (non installées)

## Accessibilité minimale

- Tout `<button>` sans texte visible doit avoir `aria-label`
- Tout `<img>` doit avoir `alt` (vide `alt=""` si purement décoratif)
- `role="dialog"` et `aria-modal="true"` sur les modales/sheets
- Focus trap dans les modales (ou utiliser un composant qui le gère)

## Pattern dark mode

Le thème dark/light est géré via `ThemeContext`. Les variables CSS `--sl-*` changent selon le thème. Ne pas utiliser `dark:` Tailwind directement — passer par les variables CSS pour la cohérence.
