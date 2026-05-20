import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('html-to-image', () => ({ toBlob: vi.fn() }));

vi.mock('../../components/poster/PosterRenderer.jsx', () => ({
  default: function MockRenderer({ innerRef }) {
    return <div ref={innerRef} data-testid="poster-renderer" />;
  },
  BASE_DIMS: { story: { w: 360, h: 640 }, post: { w: 360, h: 450 } },
}));

import { toBlob } from 'html-to-image';
import PosterShareBtn from '../../components/PosterShareBtn.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockEvent = {
  id: 'evt-1',
  title: 'FC Brest vs FC Quimper',
  sport: 'Football',
  date: '2026-06-15T15:00:00',
  city: 'Brest',
  venue: 'Stade Francis-Le Blé',
  level: 'D1',
};

function mockBlob() {
  return new Blob(['img'], { type: 'image/png' });
}

// Attendre que la phase async du hook se termine (150ms timer + toBlob)
async function waitForPhase() {
  await act(async () => { await new Promise(r => setTimeout(r, 300)); });
}

beforeEach(() => {
  vi.clearAllMocks();
  // Réinitialiser canShare/share
  Object.defineProperty(navigator, 'canShare', { value: undefined, writable: true, configurable: true });
  Object.defineProperty(navigator, 'share',    { value: undefined, writable: true, configurable: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PosterShareBtn — rendu initial', () => {
  it('affiche le bouton "Partager l\'affiche"', () => {
    toBlob.mockResolvedValue(mockBlob());
    render(<PosterShareBtn event={mockEvent} />);
    expect(screen.getByRole('button', { name: /partager l'affiche/i })).toBeInTheDocument();
  });

  it('bouton activé au départ (phase idle)', () => {
    toBlob.mockResolvedValue(mockBlob());
    render(<PosterShareBtn event={mockEvent} />);
    expect(screen.getByRole('button', { name: /partager l'affiche/i })).not.toBeDisabled();
  });

  it('PosterRenderer non rendu au départ', () => {
    toBlob.mockResolvedValue(mockBlob());
    render(<PosterShareBtn event={mockEvent} />);
    expect(screen.queryByTestId('poster-renderer')).not.toBeInTheDocument();
  });
});

describe('PosterShareBtn — phase rendering', () => {
  it('monte le PosterRenderer après clic', async () => {
    toBlob.mockImplementation(() => new Promise(() => {})); // ne résout jamais
    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={mockEvent} />);

    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));

    expect(screen.getByTestId('poster-renderer')).toBeInTheDocument();
  });

  it('désactive le bouton pendant l\'export', async () => {
    toBlob.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={mockEvent} />);

    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));

    expect(screen.getByRole('button', { name: /partager l'affiche/i })).toBeDisabled();
  });
});

describe('PosterShareBtn — navigator.share disponible', () => {
  it('appelle navigator.share avec un File image/png', async () => {
    const blob = mockBlob();
    toBlob.mockResolvedValue(blob);
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true), writable: true, configurable: true });
    Object.defineProperty(navigator, 'share',    { value: mockShare, writable: true, configurable: true });

    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={mockEvent} />);
    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));
    await waitForPhase();

    expect(mockShare).toHaveBeenCalledOnce();
    const arg = mockShare.mock.calls[0][0];
    expect(arg.files).toHaveLength(1);
    expect(arg.files[0].type).toBe('image/png');
    expect(arg.title).toBe(mockEvent.title);
  });

  it('revient à idle après partage réussi', async () => {
    toBlob.mockResolvedValue(mockBlob());
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true), writable: true, configurable: true });
    Object.defineProperty(navigator, 'share',    { value: vi.fn().mockResolvedValue(undefined), writable: true, configurable: true });

    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={mockEvent} />);
    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));
    await waitForPhase();

    expect(screen.getByRole('button', { name: /partager l'affiche/i })).not.toBeDisabled();
    expect(screen.queryByTestId('poster-renderer')).not.toBeInTheDocument();
  });
});

describe('PosterShareBtn — fallback téléchargement', () => {
  it('crée un lien de téléchargement si canShare non disponible', async () => {
    toBlob.mockResolvedValue(mockBlob());
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={mockEvent} />);
    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));
    await waitForPhase();

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('le nom du fichier inclut le titre de l\'événement', async () => {
    toBlob.mockResolvedValue(mockBlob());
    let capturedHref = '';
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      capturedHref = this.download;
    });

    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={{ ...mockEvent, title: 'Match Final' }} />);
    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));
    await waitForPhase();

    expect(capturedHref).toContain('match-final');
    clickSpy.mockRestore();
  });
});

describe('PosterShareBtn — cas limites', () => {
  it('ne plante pas si toBlob retourne null', async () => {
    toBlob.mockResolvedValue(null);

    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={mockEvent} />);
    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));
    await waitForPhase();

    expect(screen.getByRole('button', { name: /partager l'affiche/i })).not.toBeDisabled();
  });

  it('ne plante pas si share rejette (annulation utilisateur)', async () => {
    toBlob.mockResolvedValue(mockBlob());
    Object.defineProperty(navigator, 'canShare', { value: vi.fn(() => true), writable: true, configurable: true });
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')),
      writable: true, configurable: true,
    });

    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={mockEvent} />);
    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));

    await expect(waitForPhase()).resolves.not.toThrow();
    expect(screen.getByRole('button', { name: /partager l'affiche/i })).not.toBeDisabled();
  });

  it('fonctionne sans titre dans l\'événement', async () => {
    toBlob.mockResolvedValue(mockBlob());
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = userEvent.setup({ delay: null });
    render(<PosterShareBtn event={{ id: 'x' }} />);
    await user.click(screen.getByRole('button', { name: /partager l'affiche/i }));
    await waitForPhase();

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
