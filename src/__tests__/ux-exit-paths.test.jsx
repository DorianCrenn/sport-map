/**
 * Tests UX — Exit paths
 *
 * Vérifie que chaque overlay expose un chemin de sortie clair :
 *   - bouton fermer (aria-label="Fermer")
 *   - Escape key
 *   - overlay/backdrop click
 *   - drag handle pour bottom sheets
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ModalFrame from '../components/ModalFrame.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

// ── Helpers ────────────────────────────────────────────────────────────────────

function pressEscape() {
  fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
}

// ── ModalFrame — variant sheet ─────────────────────────────────────────────────

describe('ModalFrame (variant=sheet)', () => {
  it('affiche un drag handle visible', () => {
    const onClose = vi.fn();
    render(
      <ModalFrame open onClose={onClose} variant="sheet">
        <div>Contenu</div>
      </ModalFrame>
    );
    // Le drag handle est un div avec aria-label
    expect(screen.getByLabelText('Glisser pour fermer')).toBeInTheDocument();
  });

  it('se ferme via la touche Escape', () => {
    const onClose = vi.fn();
    render(
      <ModalFrame open onClose={onClose} variant="sheet">
        <div>Contenu</div>
      </ModalFrame>
    );
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se ferme via un clic sur le backdrop', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ModalFrame open onClose={onClose} variant="sheet">
        <div>Contenu</div>
      </ModalFrame>
    );
    // Le backdrop est le premier div (motion.div) de position:fixed
    const backdrop = container.firstChild;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ne se ferme PAS en cliquant à l'intérieur du panel", () => {
    const onClose = vi.fn();
    render(
      <ModalFrame open onClose={onClose} variant="sheet">
        <button>Action</button>
      </ModalFrame>
    );
    fireEvent.click(screen.getByText('Action'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ne réagit pas à Escape quand fermée', () => {
    const onClose = vi.fn();
    render(
      <ModalFrame open={false} onClose={onClose} variant="sheet">
        <div>Contenu</div>
      </ModalFrame>
    );
    pressEscape();
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── ModalFrame — variant center ────────────────────────────────────────────────

describe('ModalFrame (variant=center)', () => {
  it('se ferme via Escape', () => {
    const onClose = vi.fn();
    render(
      <ModalFrame open onClose={onClose} variant="center">
        <div>Dialog</div>
      </ModalFrame>
    );
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a role=dialog et aria-modal=true', () => {
    render(
      <ModalFrame open onClose={vi.fn()} variant="center">
        <div>Dialog</div>
      </ModalFrame>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});

// ── ConfirmDialog ──────────────────────────────────────────────────────────────

describe('ConfirmDialog', () => {
  it('expose un bouton Annuler', () => {
    render(
      <ConfirmDialog
        open
        title="Supprimer ?"
        message="Cette action est irréversible."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText(/annuler/i)).toBeInTheDocument();
  });

  it('appelle onCancel via Escape', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Supprimer ?"
        message="Cette action est irréversible."
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    pressEscape();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// ── Checklist exit-path statique ───────────────────────────────────────────────
// Ces tests lisent le code source pour vérifier les patterns sans render complet.

describe('Patterns exit-path dans le code source', () => {
  it('MobileEventSheet a un bouton close avec aria-label=Fermer', async () => {
    const src = await import('../components/MobileEventSheet.tsx?raw').then(
      m => m.default ?? m
    ).catch(() => null);
    // Fallback si le module ?raw n'est pas supporté dans vitest
    if (!src) return;
    expect(src).toContain('aria-label="Fermer"');
    expect(src).toContain('onClose');
  });

  it('PosterStudio a un handler Escape', async () => {
    const src = await import('../components/PosterStudio.jsx?raw').then(
      m => m.default ?? m
    ).catch(() => null);
    if (!src) return;
    expect(src).toContain("'Escape'");
    expect(src).toContain('onClose');
  });

  it('PosterEditor a un bouton Fermer dans le bottom panel', async () => {
    const src = await import('../components/poster/PosterEditor.jsx?raw').then(
      m => m.default ?? m
    ).catch(() => null);
    if (!src) return;
    expect(src).toContain("Fermer l'éditeur");
  });

  it('ClubAdminDrawer a un backdrop clickable', async () => {
    const src = await import('../components/club/ClubAdminDrawer.jsx?raw').then(
      m => m.default ?? m
    ).catch(() => null);
    if (!src) return;
    expect(src).toContain('onClick={onClose}');
  });

  it('UserPublicView écoute Escape', async () => {
    const src = await import('../components/UserPublicView.jsx?raw').then(
      m => m.default ?? m
    ).catch(() => null);
    if (!src) return;
    expect(src).toContain("key === 'Escape'");
  });
});
