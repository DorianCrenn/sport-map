import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../constants/zIndex.js', () => ({ Z: { helpFab: 400 } }));

import ConsentBanner from '../../components/ConsentBanner.jsx';

describe('ConsentBanner', () => {
  it('monte sans erreur', () => {
    expect(() =>
      render(<ConsentBanner onAccept={vi.fn()} onRefuse={vi.fn()} />)
    ).not.toThrow();
  });

  it('affiche le message de consentement', () => {
    render(<ConsentBanner onAccept={vi.fn()} onRefuse={vi.fn()} />);
    expect(screen.getByText(/statistiques/i)).toBeInTheDocument();
  });

  it('a le role="dialog" pour l\'accessibilité', () => {
    render(<ConsentBanner onAccept={vi.fn()} onRefuse={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('a un aria-label descriptif', () => {
    render(<ConsentBanner onAccept={vi.fn()} onRefuse={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toContain('statistiques');
  });

  it('appelle onAccept au clic sur "Accepter et continuer"', () => {
    const onAccept = vi.fn();
    render(<ConsentBanner onAccept={onAccept} onRefuse={vi.fn()} />);
    fireEvent.click(screen.getByText(/accepter et continuer/i));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it('appelle onRefuse au clic sur "Refuser"', () => {
    const onRefuse = vi.fn();
    render(<ConsentBanner onAccept={vi.fn()} onRefuse={onRefuse} />);
    fireEvent.click(screen.getByText(/refuser/i));
    expect(onRefuse).toHaveBeenCalledOnce();
  });

  it('affiche un lien "En savoir plus"', () => {
    render(<ConsentBanner onAccept={vi.fn()} onRefuse={vi.fn()} />);
    expect(screen.getByText(/en savoir plus/i)).toBeInTheDocument();
  });

  it('onAccept et onRefuse ne sont pas appelés simultanément', () => {
    const onAccept = vi.fn();
    const onRefuse = vi.fn();
    render(<ConsentBanner onAccept={onAccept} onRefuse={onRefuse} />);
    fireEvent.click(screen.getByText(/accepter/i));
    expect(onAccept).toHaveBeenCalledOnce();
    expect(onRefuse).not.toHaveBeenCalled();
  });
});
