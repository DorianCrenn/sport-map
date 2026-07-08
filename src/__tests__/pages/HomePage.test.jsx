import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const SPORTS = { allSports: { Football: { label: 'Football', color: '#16a34a' } } };

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }) => <div {...p}>{children}</div>, button: ({ children, onClick, ...p }) => <button onClick={onClick} {...p}>{children}</button>, span: ({ children, ...p }) => <span {...p}>{children}</span>, p: ({ children, ...p }) => <p {...p}>{children}</p>, h1: ({ children, ...p }) => <h1 {...p}>{children}</h1> },
  AnimatePresence: ({ children }) => <>{children}</>,
}));
vi.mock('../../lib/appInfo.js', () => ({ APP_VERSION: '1.0.0-test', APP_NAME: 'SportLink' }));
vi.mock('../../hooks/useSports.js', () => ({ useSports: () => SPORTS }));
vi.mock('../../hooks/useWeekendPosters.js', () => ({ getMockWeekendMatches: () => [] }));
vi.mock('../../components/SportLinkLogo.jsx', () => ({ default: () => null }));
vi.mock('../../components/dashboard/WeekendPosters.tsx', () => ({ default: () => null }));
vi.mock('../../components/home/PlansSection.jsx', () => ({ default: () => null }));
vi.mock('../../components/home/HypeBar.jsx', () => ({ default: () => null }));

import HomePage from '../../pages/HomePage.jsx';

const PROPS = { onNavigate: vi.fn(), stats: {}, clubs: [], allEvents: [], onShowLegal: vi.fn() };

describe('HomePage', () => {
  it('se monte sans crash', () => {
    expect(() => render(<HomePage {...PROPS} />)).not.toThrow();
  });
  it('rend du contenu', () => {
    const { container } = render(<HomePage {...PROPS} />);
    expect(container.firstChild).not.toBeNull();
  });
});
