/**
 * Régression UX — Safe-area-inset-bottom (iPhone home indicator)
 *
 * Sur iPhone X et ultérieur, le bas de l'écran est occupé par la barre home.
 * Les conteneurs défilables et les footers fixes doivent ajouter
 * `env(safe-area-inset-bottom, 0px)` à leur padding-bottom, sinon le
 * dernier élément est masqué derrière la barre.
 *
 * On vérifie directement le contenu des fichiers sources : chaque composant
 * concerné doit contenir au moins une occurrence de la valeur CSS correcte.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

const SRC = resolve(process.cwd(), 'src');
const read = (rel) => readFileSync(resolve(SRC, rel), 'utf8');

// La valeur attendue dans les padding-bottom des conteneurs défilables
const SAFE_AREA = 'env(safe-area-inset-bottom';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Vérifie qu'un fichier contient `env(safe-area-inset-bottom` au moins N fois.
 * Retourne un message d'erreur ou null si OK.
 */
function assertSafeArea(rel, min = 1) {
  const src = read(rel);
  const count = (src.match(/env\(safe-area-inset-bottom/g) || []).length;
  if (count < min) {
    return `${rel} : ${count} occurrence(s) de "${SAFE_AREA}" — attendu ≥ ${min}`;
  }
  return null;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('UX — Safe-area-inset-bottom (iPhone home bar)', () => {

  describe('Pages principales (scroll sous la BottomNav)', () => {
    it('FavorisPage — 3 onglets défilables ont safe-area', () => {
      // FavorisPage délègue le scroll à ses 3 onglets enfants
      const errs = [
        assertSafeArea('pages/favoris/MatchsTab.jsx', 1),
        assertSafeArea('pages/favoris/ClubsTab.jsx', 1),
        assertSafeArea('pages/favoris/CalendarTab.jsx', 1),
      ].filter(Boolean);
      expect(errs, errs.join('\n')).toHaveLength(0);
    });

    it('ClubsPage — liste clubs a safe-area', () => {
      const err = assertSafeArea('pages/ClubsPage.jsx', 1);
      expect(err).toBeNull();
    });

    it('NewsPage — feed a safe-area', () => {
      // NewsPage délègue le rendu scrollable à ClubFeed
      const err = assertSafeArea('components/feed/ClubFeed.tsx', 1);
      expect(err).toBeNull();
    });

    it('ProfilPage — contenu profil a safe-area', () => {
      // Branche auth + branche non-auth = 2 occurences minimum
      const err = assertSafeArea('pages/ProfilPage.jsx', 2);
      expect(err).toBeNull();
    });
  });

  describe('Composants mobiles overlay / sheet', () => {
    it('MobileEventSheet — zone scrollable a safe-area', () => {
      const err = assertSafeArea('components/MobileEventSheet.jsx', 1);
      expect(err).toBeNull();
    });

    it('AnnouncementsCenter — zone scrollable a safe-area', () => {
      const err = assertSafeArea('components/AnnouncementsCenter.jsx', 1);
      expect(err).toBeNull();
    });

    it('PosterStudio — barre de navigation bas a safe-area', () => {
      const err = assertSafeArea('components/PosterStudio.jsx', 1);
      expect(err).toBeNull();
    });
  });

  describe('Modales avec footer fixe', () => {
    it('EventFormModal — footer boutons a safe-area', () => {
      const err = assertSafeArea('components/EventFormModal.jsx', 1);
      expect(err).toBeNull();
    });

    it('FollowModal — padding bottom safe-area', () => {
      // Le sheet a `padding: '0 0 env(safe-area-inset-bottom, 20px)'`
      const err = assertSafeArea('components/FollowModal.jsx', 1);
      expect(err).toBeNull();
    });

    it('ModalFrame — sheet variant a safe-area (utilisé par ConfirmDialog et autres modales)', () => {
      const err = assertSafeArea('components/ModalFrame.jsx', 1);
      expect(err).toBeNull();
    });
  });

  describe('Valeur correcte (pas juste la propriété)', () => {
    /**
     * Vérifie que les occurrences utilisent le fallback 0px.
     * Sans fallback, `env(safe-area-inset-bottom)` échoue sur les navigateurs
     * qui ne supportent pas les variables d'environnement CSS.
     */
    it('les occurrences utilisent le fallback (env(..., 0px))', () => {
      const FILES = [
        'pages/favoris/MatchsTab.jsx',
        'pages/favoris/ClubsTab.jsx',
        'pages/favoris/CalendarTab.jsx',
        'pages/ClubsPage.jsx',
        'components/feed/ClubFeed.tsx',
        'pages/ProfilPage.jsx',
        'components/MobileEventSheet.jsx',
        'components/AnnouncementsCenter.jsx',
        'components/EventFormModal.jsx',
        'components/ConfirmDialog.jsx',
      ];

      const noFallback = [];

      for (const f of FILES) {
        const src = read(f);
        // Trouver les occurrences sans fallback
        // Valide : env(safe-area-inset-bottom, 0px) ou env(safe-area-inset-bottom, 20px) etc.
        // Invalide : env(safe-area-inset-bottom) seul
        const occurrences = [...src.matchAll(/env\(safe-area-inset-bottom([^)]*)\)/g)];
        for (const occ of occurrences) {
          const inside = occ[1]; // ce qui est entre ( et )
          if (!inside.includes(',')) {
            noFallback.push(`${f} : "${occ[0]}" — manque une valeur de fallback`);
          }
        }
      }

      expect(
        noFallback,
        `Occurrences sans fallback :\n${noFallback.map(s => '  ' + s).join('\n')}`
      ).toHaveLength(0);
    });
  });

});
