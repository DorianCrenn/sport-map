import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, style, ...props }) => (
      <button onClick={onClick} style={style} {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import HelpFab from '../../components/HelpFab.jsx';

describe('HelpFab', () => {
  it('s\'affiche quand hidden=false (défaut)', () => {
    render(<HelpFab onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /centre d'aide/i })).toBeInTheDocument();
  });

  it('est masqué quand hidden=true', () => {
    render(<HelpFab onClick={() => {}} hidden={true} />);
    expect(screen.queryByRole('button', { name: /centre d'aide/i })).not.toBeInTheDocument();
  });

  it('appelle onClick au clic', () => {
    const onClick = vi.fn();
    render(<HelpFab onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /centre d'aide/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
