import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const AUDIT = { entries: [], loading: false, hasMore: false, loadMore: vi.fn(), refetch: vi.fn(), ACTION_LABELS: {} };

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../hooks/useAdminAuditLog.js', () => ({ useAdminAuditLog: () => AUDIT }));

import AdminAuditLogPage from '../../pages/AdminAuditLogPage.jsx';

describe('AdminAuditLogPage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<AdminAuditLogPage onBack={vi.fn()} />)).not.toThrow();
  });
  it('rend du contenu', () => {
    const { container } = render(<AdminAuditLogPage onBack={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });
});
