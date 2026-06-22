import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StripeSuccessModal from '../../components/StripeSuccessModal.js';

// Framer Motion — rend les composants directement
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    motion: new Proxy({} as Record<string, React.FC<any>>, {
      get: (_target, prop: string) => {
        return ({ children, ...rest }: React.PropsWithChildren<Record<string, any>>) => {
          return <div data-testid={`motion-${prop}`} {...rest}>{children}</div>;
        };
      },
    }),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('../../lib/subscriptionFeatures.js', () => ({
  FEATURE_GATES: {
    POSTER_WATERMARK_REMOVE:   'starter',
    CARPOOLING:                'starter',
    CARPOOLING_ALL_TEAMS:      'pro',
    TEAM_LINEUPS:              'pro',
    ADVANCED_ANALYTICS:        'elite',
  },
  PLAN_RANK: { free: 0, starter: 1, pro: 2, elite: 3 },
}));

import React from 'react';

describe('StripeSuccessModal', () => {
  it('renders plan name in headline for starter', () => {
    render(<StripeSuccessModal plan="starter" onClose={vi.fn()} />);
    expect(screen.getByText(/Bienvenue dans le plan Starter/i)).toBeDefined();
  });

  it('renders plan name in headline for pro', () => {
    render(<StripeSuccessModal plan="pro" onClose={vi.fn()} />);
    expect(screen.getByText(/Bienvenue dans le plan Club Pro/i)).toBeDefined();
  });

  it('renders plan name in headline for elite', () => {
    render(<StripeSuccessModal plan="elite" onClose={vi.fn()} />);
    expect(screen.getByText(/Bienvenue dans le plan Elite/i)).toBeDefined();
  });

  it('shows close button and calls onClose on click', async () => {
    const onClose = vi.fn();
    render(<StripeSuccessModal plan="starter" onClose={onClose} />);
    const btn = screen.getByRole('button', { name: /fermer/i });
    fireEvent.click(btn);
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 500 });
  });

  it('shows "Voir mon abonnement" button when onViewSub is provided', () => {
    const onViewSub = vi.fn();
    render(<StripeSuccessModal plan="pro" onClose={vi.fn()} onViewSub={onViewSub} />);
    expect(screen.getByText(/Voir mon abonnement/i)).toBeDefined();
  });

  it('calls onViewSub when clicking the primary CTA', async () => {
    const onClose   = vi.fn();
    const onViewSub = vi.fn();
    render(<StripeSuccessModal plan="pro" onClose={onClose} onViewSub={onViewSub} />);
    fireEvent.click(screen.getByText(/Voir mon abonnement/i));
    await waitFor(() => expect(onViewSub).toHaveBeenCalled(), { timeout: 500 });
  });

  it('hides "Voir mon abonnement" when onViewSub not provided', () => {
    render(<StripeSuccessModal plan="starter" onClose={vi.fn()} />);
    expect(screen.queryByText(/Voir mon abonnement/i)).toBeNull();
  });

  it('shows unlock list for starter plan', () => {
    render(<StripeSuccessModal plan="starter" onClose={vi.fn()} />);
    // Les features unlocked pour starter sont exactement à rank 1
    expect(screen.getByText(/Nouvelles fonctionnalités/i)).toBeDefined();
  });

  it('falls back to starter config for unknown plan', () => {
    render(<StripeSuccessModal plan="unknown_plan" onClose={vi.fn()} />);
    expect(screen.getByText(/Bienvenue dans le plan Starter/i)).toBeDefined();
  });

  it('renders backdrop that closes modal when clicked', async () => {
    const onClose = vi.fn();
    render(<StripeSuccessModal plan="elite" onClose={onClose} />);
    // Le backdrop est le motion-div avec zIndex 3100
    const backdrops = screen.getAllByTestId('motion-div');
    const backdrop = backdrops.find(el => el.style?.zIndex === '3100');
    if (backdrop) {
      fireEvent.click(backdrop);
      await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 500 });
    }
  });
});
