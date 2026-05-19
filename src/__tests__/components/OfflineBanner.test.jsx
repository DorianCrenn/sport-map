import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

// AnimatePresence garde les enfants en DOM pendant l'animation de sortie.
// Dans jsdom il n'y a pas de layout engine donc on court-circuite.
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, style, className, onClick }) =>
        <div style={style} className={className} onClick={onClick}>{children}</div>,
    },
  };
});

import OfflineBanner from '../../components/OfflineBanner.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function setOnline(value) {
  Object.defineProperty(navigator, 'onLine', {
    value,
    configurable: true,
    writable: true,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OfflineBanner', () => {
  afterEach(() => {
    setOnline(true); // remet en ligne après chaque test
  });

  it('ne rend rien quand navigator.onLine est true', () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByText(/Pas de connexion/)).toBeNull();
  });

  it('affiche la bannière quand navigator.onLine est false au montage', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/Pas de connexion/)).toBeDefined();
  });

  it('la bannière contient un message sur les fonctionnalités indisponibles', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/certaines fonctionnalités/i)).toBeDefined();
  });

  it('le bouton fermer masque la bannière', () => {
    setOnline(false);
    render(<OfflineBanner />);
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Pas de connexion/)).toBeNull();
  });

  it('apparaît quand l\'événement "offline" est déclenché', async () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByText(/Pas de connexion/)).toBeNull();

    setOnline(false);
    await act(async () => { window.dispatchEvent(new Event('offline')); });
    expect(screen.getByText(/Pas de connexion/)).toBeDefined();
  });

  it('disparaît quand l\'événement "online" est déclenché', async () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByText(/Pas de connexion/)).toBeDefined();

    setOnline(true);
    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(screen.queryByText(/Pas de connexion/)).toBeNull();
  });

  it('réapparaît après retour en ligne puis coupure', async () => {
    setOnline(false);
    render(<OfflineBanner />);

    // Dismiss
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByText(/Pas de connexion/)).toBeNull();

    // Retour en ligne
    setOnline(true);
    await act(async () => { window.dispatchEvent(new Event('online')); });

    // Nouvelle coupure → bannière doit réapparaître (dismissed réinitialisé)
    setOnline(false);
    await act(async () => { window.dispatchEvent(new Event('offline')); });
    expect(screen.getByText(/Pas de connexion/)).toBeDefined();
  });

  it('nettoie les event listeners au démontage', () => {
    setOnline(true);
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<OfflineBanner />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('online',  expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
