/**
 * Tests DateFilterBar — barre de filtres temporels
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }) => <div {...p}>{children}</div>,
    button: ({ children, ...p }) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../lib/dateUtils.js', () => ({
  formatDate: (d) => d,
}));

import DateFilterBar from '../../components/DateFilterBar.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderBar(props = {}) {
  const defaults = { active: null, onChange: vi.fn() };
  return render(<DateFilterBar {...defaults} {...props} />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DateFilterBar — rendu', () => {
  it('affiche le bouton "Tout"', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /tout/i })).toBeInTheDocument();
  });

  it("affiche les filtres prédéfinis (Aujourd'hui, Ce week-end, Cette semaine)", () => {
    renderBar();
    expect(screen.getByRole('button', { name: /aujourd'hui/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ce week-end/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cette semaine/i })).toBeInTheDocument();
  });

  it('affiche le bouton "Choisir" pour la date personnalisée', () => {
    renderBar();
    expect(screen.getByRole('button', { name: /choisir/i })).toBeInTheDocument();
  });

  it('n\'affiche pas le bouton "À venir" si onUpcomingOnlyChange non fourni', () => {
    renderBar();
    expect(screen.queryByRole('button', { name: /à venir/i })).not.toBeInTheDocument();
  });

  it('affiche le bouton "À venir" si onUpcomingOnlyChange est fourni', () => {
    renderBar({ onUpcomingOnlyChange: vi.fn() });
    expect(screen.getByRole('button', { name: /à venir/i })).toBeInTheDocument();
  });
});

describe('DateFilterBar — interactions', () => {
  it('appelle onChange(null) au clic sur "Tout"', () => {
    const onChange = vi.fn();
    renderBar({ onChange });
    fireEvent.click(screen.getByRole('button', { name: /tout/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('appelle onChange("today") au clic sur Aujourd\'hui', () => {
    const onChange = vi.fn();
    renderBar({ onChange });
    fireEvent.click(screen.getByRole('button', { name: /aujourd'hui/i }));
    expect(onChange).toHaveBeenCalledWith('today');
  });

  it('toggle : clic sur un filtre actif appelle onChange(null)', () => {
    const onChange = vi.fn();
    renderBar({ active: 'today', onChange });
    fireEvent.click(screen.getByRole('button', { name: /aujourd'hui/i }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('appelle onChange("weekend") au clic Ce week-end', () => {
    const onChange = vi.fn();
    renderBar({ onChange });
    fireEvent.click(screen.getByRole('button', { name: /ce week-end/i }));
    expect(onChange).toHaveBeenCalledWith('weekend');
  });

  it('appelle onChange("week") au clic Cette semaine', () => {
    const onChange = vi.fn();
    renderBar({ onChange });
    fireEvent.click(screen.getByRole('button', { name: /cette semaine/i }));
    expect(onChange).toHaveBeenCalledWith('week');
  });

  it('appelle onUpcomingOnlyChange(!upcomingOnly) au clic', () => {
    const onUpcomingOnlyChange = vi.fn();
    renderBar({ onUpcomingOnlyChange, upcomingOnly: true });
    fireEvent.click(screen.getByRole('button', { name: /à venir/i }));
    expect(onUpcomingOnlyChange).toHaveBeenCalledWith(false);
  });
});

describe('DateFilterBar — date personnalisée', () => {
  it('affiche la date formatée si active est une date ISO', () => {
    renderBar({ active: '2026-07-15' });
    // Le bouton Choisir doit afficher la date
    const btn = screen.getAllByRole('button').find(b => b.textContent.includes('2026-07-15'));
    expect(btn).toBeTruthy();
  });

  it('active=null n\'est pas marqué comme date spécifique', () => {
    const { container } = renderBar({ active: null });
    // Le champ date caché doit être vide
    const dateInput = container.querySelector('input[type="date"]');
    expect(dateInput?.value).toBe('');
  });
});
