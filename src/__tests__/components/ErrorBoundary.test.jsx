import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary.jsx';

// Supprime les logs React d'erreur dans la console pendant les tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function Healthy() {
  return <div>Contenu OK</div>;
}

function Broken() {
  throw new Error('Composant cassé');
}

// Composant dont on peut contrôler si il throw
let _shouldThrow = false;
function Conditional() {
  if (_shouldThrow) throw new Error('Erreur conditionnelle');
  return <div>Récupéré</div>;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
  it('rend les enfants normalement quand aucune erreur', () => {
    render(<ErrorBoundary><Healthy /></ErrorBoundary>);
    expect(screen.getByText('Contenu OK')).toBeDefined();
  });

  it('affiche le fallback quand un enfant lève une erreur', () => {
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    expect(screen.getByText('Une erreur est survenue')).toBeDefined();
  });

  it('affiche le message de l\'erreur dans le fallback', () => {
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    expect(screen.getByText(/Composant cassé/)).toBeDefined();
  });

  it('affiche un bouton "Réessayer"', () => {
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    expect(screen.getByRole('button', { name: /Réessayer/i })).toBeDefined();
  });

  it('le bouton Réessayer réinitialise l\'état — permet la récupération si l\'enfant ne throw plus', () => {
    _shouldThrow = true;
    render(<ErrorBoundary><Conditional /></ErrorBoundary>);
    expect(screen.getByText('Une erreur est survenue')).toBeDefined();

    // L'enfant va maintenant rendre normalement
    _shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /Réessayer/i }));
    expect(screen.getByText('Récupéré')).toBeDefined();
  });

  it('le fallback réapparaît si l\'enfant throw encore après retry', () => {
    _shouldThrow = true;
    render(<ErrorBoundary><Conditional /></ErrorBoundary>);
    fireEvent.click(screen.getByRole('button', { name: /Réessayer/i }));
    // _shouldThrow est encore true → l'enfant throw à nouveau
    expect(screen.getByText('Une erreur est survenue')).toBeDefined();
  });

  it('appelle console.error avec le nom de la boundary', () => {
    render(<ErrorBoundary name="TestPage"><Broken /></ErrorBoundary>);
    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary]', 'TestPage', expect.any(Error), expect.any(String)
    );
  });

  it('utilise "page" comme nom par défaut si prop name absent', () => {
    render(<ErrorBoundary><Broken /></ErrorBoundary>);
    expect(console.error).toHaveBeenCalledWith(
      '[ErrorBoundary]', 'page', expect.any(Error), expect.any(String)
    );
  });

  it('ne crashe pas le reste de l\'arbre quand un enfant throw', () => {
    render(
      <div>
        <ErrorBoundary><Broken /></ErrorBoundary>
        <div>Frère OK</div>
      </div>
    );
    expect(screen.getByText('Frère OK')).toBeDefined();
    expect(screen.getByText('Une erreur est survenue')).toBeDefined();
  });
});
