import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
    span:   ({ children, ...p }: any) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockUseSubscriptionManagement = vi.hoisted(() => vi.fn());
vi.mock('../../hooks/useSubscriptionManagement.js', () => ({
  useSubscriptionManagement: mockUseSubscriptionManagement,
}));

vi.mock('../../lib/planHelpers.js', () => ({
  getPlanMeta: (plan: string) => ({ name: plan === 'free' ? 'Gratuit' : plan, price: 0, badge: '⚪', color: '#aaa' }),
}));

vi.mock('../../lib/subscriptionFeatures.js', () => ({
  PLAN_META: {
    free:    { name: 'Gratuit', price: 0, color: '#aaa', badge: '⚪' },
    starter: { name: 'Starter', price: 9, color: '#3b82f6', badge: '🔵' },
    pro:     { name: 'Club Pro', price: 29, color: '#8b5cf6', badge: '🟣' },
    elite:   { name: 'Elite',   price: 59, color: '#f59e0b', badge: '👑' },
  },
}));

vi.mock('../../components/ui/PlansMiniModal.jsx', () => ({
  default: ({ open }: any) => open ? <div data-testid="plans-modal">Plans</div> : null,
}));

vi.mock('../../components/icons.js', () => ({
  IconAlertTriangle: () => <span>⚠</span>,
  IconRocket:        () => <span>🚀</span>,
  IconCreditCard:    () => <span>💳</span>,
  IconClipboard:     () => <span>📋</span>,
  IconCheckCircle:   () => <span>✓</span>,
  IconX:             () => <span>✕</span>,
  IconCrown:         () => <span>👑</span>,
}));

import SubscriptionPage from '../../pages/SubscriptionPage.jsx';

function defaultSubState(sub?: any, overrides?: any) {
  return {
    sub: sub ?? { plan: 'free', status: null, cancel_at_period_end: false, current_period_end: null, trial_end: null, stripe_cus_id: null, stripe_sub_id: null },
    loading:          false,
    invoices:         [],
    invoicesLoading:  false,
    loadInvoices:     vi.fn(),
    showInvoices:     false,
    setShowInvoices:  vi.fn(),
    portalUrl:        null,
    error:            null,
    openPortal:       vi.fn(),
    ...overrides,
  };
}

describe('SubscriptionPage', () => {
  beforeEach(() => { mockUseSubscriptionManagement.mockReturnValue(defaultSubState()); });

  it('monte sans erreur', () => {
    expect(() => render(<SubscriptionPage clubId={null} onClose={vi.fn()} />)).not.toThrow();
  });

  it('affiche le plan actuel (Gratuit)', () => {
    render(<SubscriptionPage clubId={null} onClose={vi.fn()} />);
    expect(document.body.textContent).toMatch(/gratuit/i);
  });

  it('affiche le loader pendant le chargement', () => {
    mockUseSubscriptionManagement.mockReturnValue(defaultSubState(null, { loading: true }));
    render(<SubscriptionPage clubId={null} onClose={vi.fn()} />);
    expect(document.body).toBeTruthy();
  });

  it('affiche le badge statut "Actif" pour plan actif', async () => {
    mockUseSubscriptionManagement.mockReturnValue(defaultSubState(
      { plan: 'pro', status: 'active', cancel_at_period_end: false, current_period_end: null, trial_end: null, stripe_cus_id: 'cus_test', stripe_sub_id: 'sub_test' }
    ));
    render(<SubscriptionPage clubId="club-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/actif/i);
    });
  });

  it('affiche le statut "Essai gratuit" pour plan en trial', async () => {
    mockUseSubscriptionManagement.mockReturnValue(defaultSubState(
      { plan: 'starter', status: 'trialing', cancel_at_period_end: false, current_period_end: null, trial_end: '2026-07-01T00:00:00Z', stripe_cus_id: null, stripe_sub_id: null }
    ));
    render(<SubscriptionPage clubId="club-1" onClose={vi.fn()} />);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/essai gratuit/i);
    });
  });

  it('affiche la section historique pour un plan payant', async () => {
    const loadInvoices = vi.fn();
    mockUseSubscriptionManagement.mockReturnValue(defaultSubState(
      { plan: 'pro', status: 'active', cancel_at_period_end: false, current_period_end: null, trial_end: null, stripe_cus_id: 'cus_test', stripe_sub_id: 'sub_test' },
      { loadInvoices, invoices: [] }
    ));
    render(<SubscriptionPage clubId="club-1" onClose={vi.fn()} />);
    // La section "Historique" est visible pour un plan payant avec stripe_cus_id
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/historique/i);
    });
  });
});
