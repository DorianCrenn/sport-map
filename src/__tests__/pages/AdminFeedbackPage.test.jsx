import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const FB = { items: [], loading: false, total: 0, stats: { byStatus: {}, byType: {} }, fetchAll: vi.fn(), fetchStats: vi.fn(), updateFeedback: vi.fn(), mergeDuplicate: vi.fn(), deleteFeedback: vi.fn(), PAGE_SIZE: 20 };

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../hooks/useFeedbackAdmin.js', () => ({ useFeedbackAdmin: () => FB }));
vi.mock('../../contexts/ToastContext.jsx', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import AdminFeedbackPage from '../../pages/AdminFeedbackPage.jsx';

describe('AdminFeedbackPage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<AdminFeedbackPage onBack={vi.fn()} />)).not.toThrow();
  });
  it('rend du contenu', () => {
    const { container } = render(<AdminFeedbackPage onBack={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });
});
