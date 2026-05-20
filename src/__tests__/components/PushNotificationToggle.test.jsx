import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockUsePushNotifications } = vi.hoisted(() => ({
  mockUsePushNotifications: vi.fn(),
}));

vi.mock('../../hooks/usePushNotifications.js', () => ({
  usePushNotifications: mockUsePushNotifications,
}));

import PushNotificationToggle from '../../components/PushNotificationToggle.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaults(overrides = {}) {
  return {
    subscribed: false,
    loading:    false,
    error:      null,
    permission: 'default',
    toggle:     vi.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUsePushNotifications.mockReturnValue(defaults());
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PushNotificationToggle — rendu', () => {
  it('affiche le label "Notifications push"', () => {
    render(<PushNotificationToggle />);
    expect(screen.getByText('Notifications push')).toBeInTheDocument();
  });

  it('affiche "Désactivées" quand non abonné', () => {
    render(<PushNotificationToggle />);
    expect(screen.getByText('Désactivées')).toBeInTheDocument();
  });

  it('affiche "Activées" quand abonné', () => {
    mockUsePushNotifications.mockReturnValue(defaults({ subscribed: true, permission: 'granted' }));
    render(<PushNotificationToggle />);
    expect(screen.getByText(/Activées/i)).toBeInTheDocument();
  });

  it('affiche "Bloquées par le navigateur" quand permission denied', () => {
    mockUsePushNotifications.mockReturnValue(defaults({ permission: 'denied' }));
    render(<PushNotificationToggle />);
    expect(screen.getByText(/Bloquées par le navigateur/i)).toBeInTheDocument();
  });
});

describe('PushNotificationToggle — toggle button', () => {
  it('rend le bouton toggle quand permission != denied', () => {
    render(<PushNotificationToggle />);
    const btn = screen.getByRole('button', { name: /activer les notifications/i });
    expect(btn).toBeInTheDocument();
  });

  it('aria-pressed=false quand non abonné', () => {
    render(<PushNotificationToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('aria-pressed=true quand abonné', () => {
    mockUsePushNotifications.mockReturnValue(defaults({ subscribed: true }));
    render(<PushNotificationToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('appelle toggle au clic', () => {
    const toggle = vi.fn();
    mockUsePushNotifications.mockReturnValue(defaults({ toggle }));
    render(<PushNotificationToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(toggle).toHaveBeenCalledOnce();
  });

  it('le bouton est disabled pendant le chargement', () => {
    mockUsePushNotifications.mockReturnValue(defaults({ loading: true }));
    render(<PushNotificationToggle />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('n\'affiche pas le bouton toggle si permission denied', () => {
    mockUsePushNotifications.mockReturnValue(defaults({ permission: 'denied' }));
    render(<PushNotificationToggle />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('affiche aria-label "Désactiver" quand abonné', () => {
    mockUsePushNotifications.mockReturnValue(defaults({ subscribed: true }));
    render(<PushNotificationToggle />);
    expect(screen.getByRole('button', { name: /désactiver les notifications/i })).toBeInTheDocument();
  });
});

describe('PushNotificationToggle — erreur', () => {
  it('affiche un élément sr-only avec le message d\'erreur', () => {
    mockUsePushNotifications.mockReturnValue(defaults({ error: 'Permission denied' }));
    render(<PushNotificationToggle />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toBe('Permission denied');
  });

  it('n\'affiche pas d\'alert si pas d\'erreur', () => {
    render(<PushNotificationToggle />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
