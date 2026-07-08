import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const GRANTS = { grants: [], activeGrants: [], loading: false, createGrant: vi.fn(), revokeGrant: vi.fn(), refetch: vi.fn(), PLAN_BADGE: {} };

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
// Mock partiel : on garde GRANT_PRESETS réel, on n'override que le hook
vi.mock('../../hooks/useAdminGrants.js', async (orig) => ({ ...(await orig()), useAdminGrants: () => GRANTS }));
vi.mock('../../contexts/ToastContext.jsx', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import AdminLicensesPage from '../../pages/AdminLicensesPage.jsx';

describe('AdminLicensesPage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<AdminLicensesPage onBack={vi.fn()} />)).not.toThrow();
  });
  it('rend du contenu', () => {
    const { container } = render(<AdminLicensesPage onBack={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });
});
