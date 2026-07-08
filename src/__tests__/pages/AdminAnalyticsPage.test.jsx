import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const ANALYTICS = { data: null, loading: false, fetchDashboard: vi.fn() };

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
// Composants de graphes (canvas) → mockés, on teste la page pas Chart.js
vi.mock('react-chartjs-2', () => ({ Line: () => null, Bar: () => null, Doughnut: () => null }));
vi.mock('../../hooks/useAdminAnalytics.js', () => ({ useAdminAnalytics: () => ANALYTICS }));

import AdminAnalyticsPage from '../../pages/AdminAnalyticsPage.jsx';

describe('AdminAnalyticsPage', () => {
  it('se monte sans crash (data null → états vides)', () => {
    expect(() => render(<AdminAnalyticsPage onBack={vi.fn()} />)).not.toThrow();
  });
  it('rend du contenu', () => {
    const { container } = render(<AdminAnalyticsPage onBack={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });
});
