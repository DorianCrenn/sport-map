import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, ...props }) => <div style={style} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import HelpTooltip from '../../components/HelpTooltip.jsx';

describe('HelpTooltip', () => {
  it('affiche le bouton ? par défaut', () => {
    render(<HelpTooltip content="Aide contextuelle" />);
    expect(screen.getByRole('button', { name: /aide/i })).toBeInTheDocument();
  });

  it('n\'affiche pas la bulle au montage', () => {
    render(<HelpTooltip content="Aide contextuelle" />);
    expect(screen.queryByText('Aide contextuelle')).not.toBeInTheDocument();
  });

  it('affiche la bulle au clic', () => {
    render(<HelpTooltip content="Aide contextuelle" />);
    fireEvent.click(screen.getByRole('button', { name: /aide/i }));
    expect(screen.getByText('Aide contextuelle')).toBeInTheDocument();
  });

  it('ferme la bulle sur touche Escape', () => {
    render(<HelpTooltip content="Aide contextuelle" />);
    fireEvent.click(screen.getByRole('button', { name: /aide/i }));
    expect(screen.getByText('Aide contextuelle')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Aide contextuelle')).not.toBeInTheDocument();
  });

  it('ferme la bulle sur clic extérieur', () => {
    render(
      <div>
        <HelpTooltip content="Aide contextuelle" />
        <button data-testid="outside">Dehors</button>
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: /aide/i }));
    expect(screen.getByText('Aide contextuelle')).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Aide contextuelle')).not.toBeInTheDocument();
  });
});
