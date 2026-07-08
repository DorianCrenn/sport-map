import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const PERM = { matrix: [], loading: false, saving: false, isAllowed: () => false, togglePermission: vi.fn(), copyRole: vi.fn(), allowAll: vi.fn(), denyAll: vi.fn() };

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
// Mock partiel : garde ROLES/RESOURCES/ACTIONS réels, override seulement le hook
vi.mock('../../hooks/usePermissionMatrix.js', async (orig) => ({ ...(await orig()), usePermissionMatrix: () => PERM }));
vi.mock('../../contexts/ToastContext.jsx', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import AdminPermissionsPage from '../../pages/AdminPermissionsPage.jsx';

describe('AdminPermissionsPage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<AdminPermissionsPage onBack={vi.fn()} />)).not.toThrow();
  });
  it('rend du contenu', () => {
    const { container } = render(<AdminPermissionsPage onBack={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });
});
