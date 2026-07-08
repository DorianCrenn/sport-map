import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const PLANS = {
  loading: false, features: [], quotas: [], pricing: [],
  featureGates: {}, planQuotas: {}, planMeta: {}, planOrder: [],
  canUseFeature: () => true, getQuotas: () => ({}),
  updateFeatureGate: vi.fn(), updateQuota: vi.fn(), updatePricing: vi.fn(), invalidateCache: vi.fn(),
};

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../hooks/usePlanConfig.js', () => ({ usePlanConfig: () => PLANS }));
vi.mock('../../contexts/ToastContext.jsx', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import AdminPlansPage from '../../pages/AdminPlansPage.jsx';

describe('AdminPlansPage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<AdminPlansPage onBack={vi.fn()} />)).not.toThrow();
  });
  it('rend du contenu', () => {
    const { container } = render(<AdminPlansPage onBack={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });
});
