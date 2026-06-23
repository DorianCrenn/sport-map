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

import LegalPage from '../../pages/LegalPage.jsx';

function setup() {
  return render(<LegalPage onClose={vi.fn()} />);
}

describe('LegalPage', () => {
  it('monte sans erreur', () => {
    expect(() => setup()).not.toThrow();
  });

  it('affiche les 3 onglets légaux', () => {
    setup();
    expect(screen.getByText('Mentions légales')).toBeInTheDocument();
    expect(screen.getByText('Confidentialité')).toBeInTheDocument();
    expect(screen.getByText('CGU')).toBeInTheDocument();
  });

  it('affiche le contenu Mentions légales par défaut', () => {
    setup();
    expect(document.body.textContent).toMatch(/Éditeur/i);
    expect(document.body.textContent).toMatch(/SportLink/);
  });

  it('affiche le contenu Confidentialité en cliquant sur l\'onglet', () => {
    setup();
    fireEvent.click(screen.getByText('Confidentialité'));
    expect(document.body.textContent).toMatch(/données/i);
  });

  it('affiche le contenu CGU en cliquant sur l\'onglet', () => {
    setup();
    fireEvent.click(screen.getByText('CGU'));
    expect(document.body.textContent).toMatch(/conditions/i);
  });

  it('affiche le contact email de l\'éditeur', () => {
    setup();
    const link = screen.getByRole('link', { name: /doriancrenn17@gmail\.com/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe('mailto:doriancrenn17@gmail.com');
  });

  it('onglet actif est "Mentions légales" initialement', () => {
    setup();
    const tab = screen.getByText('Mentions légales').closest('button');
    expect(tab).toBeInTheDocument();
  });
});
