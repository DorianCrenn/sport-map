import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockUseAuth, mockUseToast } = vi.hoisted(() => ({
  mockUseAuth:  vi.fn(),
  mockUseToast: vi.fn(),
}));

vi.mock('../../contexts/AuthContext.jsx', () => ({ useAuth:  mockUseAuth }));
vi.mock('../../contexts/ToastContext.jsx', () => ({ useToast: mockUseToast }));
vi.mock('../../components/SportLinkLogo.jsx', () => ({ default: () => <span>SportLink</span> }));
vi.mock('../../constants/zIndex.js', () => ({ Z: { auth: 9999 } }));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...p }) => <div onClick={onClick} {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import AuthPage from '../../pages/AuthPage.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultAuth = {
  login:             vi.fn().mockResolvedValue({}),
  register:          vi.fn().mockResolvedValue({ needsConfirmation: false }),
  loginWithGoogle:   vi.fn().mockResolvedValue({}),
  loginWithProvider: vi.fn().mockResolvedValue({}),
};

function renderAuth(props = {}) {
  return render(
    <AuthPage
      onClose={vi.fn()}
      onNeedOnboarding={vi.fn()}
      onShowLegal={vi.fn()}
      {...props}
    />
  );
}

// Sélecteurs réels : placeholder "Ex: Jean-Michel" pour nom, "votre@email.fr" pour email,
// "••••••••" (x2) pour password et confirm.

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AuthPage — mode login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuth);
    mockUseToast.mockReturnValue({ toast: vi.fn() });
  });

  it('affiche le champ email et mot de passe par défaut', () => {
    renderAuth();
    expect(screen.getByPlaceholderText('votre@email.fr')).toBeDefined();
    // Un seul champ password en mode login
    expect(screen.getAllByPlaceholderText('••••••••').length).toBe(1);
  });

  it('n\'affiche pas le champ nom en mode login', () => {
    renderAuth();
    expect(screen.queryByPlaceholderText('Ex: Jean-Michel')).toBeNull();
  });
});

describe('AuthPage — mode register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuth);
    mockUseToast.mockReturnValue({ toast: vi.fn() });
  });

  it('affiche le champ nom en mode register', () => {
    renderAuth();
    fireEvent.click(screen.getByText(/s'inscrire/i));
    expect(screen.getByPlaceholderText('Ex: Jean-Michel')).toBeDefined();
  });

  it('affiche 2 champs password en mode register (mot de passe + confirmation)', () => {
    renderAuth();
    fireEvent.click(screen.getByText(/s'inscrire/i));
    expect(screen.getAllByPlaceholderText('••••••••').length).toBe(2);
  });
});

describe('AuthPage — validation register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuth);
    mockUseToast.mockReturnValue({ toast: vi.fn() });
  });

  it('affiche "Prénom ou surnom requis" si nom vide à la soumission', async () => {
    renderAuth();
    fireEvent.click(screen.getByText(/s'inscrire/i));
    // Ne remplit PAS le nom, remplit email + password + confirm
    fireEvent.change(screen.getByPlaceholderText('votre@email.fr'), { target: { value: 'test@test.com' } });
    const pwds = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwds[0], { target: { value: 'azerty1' } });
    fireEvent.change(pwds[1], { target: { value: 'azerty1' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(screen.getByText('Prénom ou surnom requis')).toBeDefined());
  });

  it('affiche "6 caractères minimum" si mot de passe trop court', async () => {
    renderAuth();
    fireEvent.click(screen.getByText(/s'inscrire/i));
    fireEvent.change(screen.getByPlaceholderText('Ex: Jean-Michel'), { target: { value: 'Dorian' } });
    fireEvent.change(screen.getByPlaceholderText('votre@email.fr'), { target: { value: 'test@test.com' } });
    const pwds = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwds[0], { target: { value: 'abc' } });
    fireEvent.change(pwds[1], { target: { value: 'abc' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(screen.getByText('Mot de passe : 6 caractères minimum')).toBeDefined());
  });

  it('affiche "Les mots de passe ne correspondent pas" si confirm différent', async () => {
    renderAuth();
    fireEvent.click(screen.getByText(/s'inscrire/i));
    fireEvent.change(screen.getByPlaceholderText('Ex: Jean-Michel'), { target: { value: 'Dorian' } });
    fireEvent.change(screen.getByPlaceholderText('votre@email.fr'), { target: { value: 'test@test.com' } });
    const pwds = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwds[0], { target: { value: 'azerty123' } });
    fireEvent.change(pwds[1], { target: { value: 'different' } });
    fireEvent.submit(document.querySelector('form'));
    await waitFor(() => expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeDefined());
  });
});

describe('AuthPage — fermeture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuth);
    mockUseToast.mockReturnValue({ toast: vi.fn() });
  });

  it('appelle onClose sur la touche Escape', () => {
    const onClose = vi.fn();
    renderAuth({ onClose });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('appelle onClose sur le bouton Fermer (aria-label)', () => {
    const onClose = vi.fn();
    renderAuth({ onClose });
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
