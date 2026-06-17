import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, disabled, ...p }) =>
      <button onClick={onClick} disabled={disabled} {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import PresenceButtons from '../../components/planning/PresenceButtons.jsx';

// ── Tests — rendu ─────────────────────────────────────────────────────────────

describe('PresenceButtons — rendu', () => {
  it('affiche les 3 boutons', () => {
    render(<PresenceButtons myStatus={null} onRespond={vi.fn()} />);
    expect(screen.getByText('Présent')).toBeInTheDocument();
    expect(screen.getByText('Absent')).toBeInTheDocument();
    expect(screen.getByText('Incertain')).toBeInTheDocument();
  });

  it('bouton actif a aria-pressed=true', () => {
    render(<PresenceButtons myStatus="present" onRespond={vi.fn()} />);
    const btn = screen.getByText('Présent').closest('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('boutons inactifs ont aria-pressed=false', () => {
    render(<PresenceButtons myStatus="present" onRespond={vi.fn()} />);
    const absent   = screen.getByText('Absent').closest('button');
    const incertain = screen.getByText('Incertain').closest('button');
    expect(absent).toHaveAttribute('aria-pressed', 'false');
    expect(incertain).toHaveAttribute('aria-pressed', 'false');
  });
});

// ── Tests — interactions ───────────────────────────────────────────────────────

describe('PresenceButtons — interactions', () => {
  it('clic sur Présent appelle onRespond("present")', () => {
    const onRespond = vi.fn();
    render(<PresenceButtons myStatus={null} onRespond={onRespond} />);
    fireEvent.click(screen.getByText('Présent'));
    expect(onRespond).toHaveBeenCalledWith('present');
  });

  it('clic sur Absent appelle onRespond("absent")', () => {
    const onRespond = vi.fn();
    render(<PresenceButtons myStatus={null} onRespond={onRespond} />);
    fireEvent.click(screen.getByText('Absent'));
    expect(onRespond).toHaveBeenCalledWith('absent');
  });

  it('clic sur Incertain appelle onRespond("unsure")', () => {
    const onRespond = vi.fn();
    render(<PresenceButtons myStatus={null} onRespond={onRespond} />);
    fireEvent.click(screen.getByText('Incertain'));
    expect(onRespond).toHaveBeenCalledWith('unsure');
  });

  it('clic sur le bouton déjà actif ne rappelle pas onRespond', () => {
    const onRespond = vi.fn();
    render(<PresenceButtons myStatus="present" onRespond={onRespond} />);
    fireEvent.click(screen.getByText('Présent'));
    expect(onRespond).not.toHaveBeenCalled();
  });

  it('disabled=true bloque tous les clics', () => {
    const onRespond = vi.fn();
    render(<PresenceButtons myStatus={null} onRespond={onRespond} disabled />);
    fireEvent.click(screen.getByText('Présent'));
    fireEvent.click(screen.getByText('Absent'));
    expect(onRespond).not.toHaveBeenCalled();
  });
});

// ── Tests — size prop ─────────────────────────────────────────────────────────

describe('PresenceButtons — size', () => {
  it('size=sm rend sans crash', () => {
    render(<PresenceButtons myStatus={null} onRespond={vi.fn()} size="sm" />);
    expect(screen.getByText('Présent')).toBeInTheDocument();
  });

  it('size=md (défaut) rend sans crash', () => {
    render(<PresenceButtons myStatus={null} onRespond={vi.fn()} />);
    expect(screen.getByText('Présent')).toBeInTheDocument();
  });
});
