import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

vi.mock('framer-motion', () => ({
  motion: {
    div:    ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../components/ModalFrame.jsx', () => ({
  default: ({ open, children, onClose }: any) =>
    open ? <div role="dialog">{children}</div> : null,
}));

// ModalFrame est importé relativement, on mock au bon chemin
vi.mock('../../components/ModalFrame.jsx', () => ({
  default: ({ open, children, onClose }: any) =>
    open ? <div role="dialog">{children}</div> : null,
}));

import ConfirmDialog from '../../components/ConfirmDialog.jsx';

describe('ConfirmDialog', () => {
  const baseProps = {
    open:      true,
    title:     'Supprimer le club ?',
    onConfirm: vi.fn(),
    onCancel:  vi.fn(),
  };

  it('n\'affiche rien si open=false', () => {
    render(<ConfirmDialog {...baseProps} open={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('affiche le titre', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.getByText('Supprimer le club ?')).toBeInTheDocument();
  });

  it('affiche le message optionnel', () => {
    render(<ConfirmDialog {...baseProps} message="Cette action est irréversible." />);
    expect(screen.getByText('Cette action est irréversible.')).toBeInTheDocument();
  });

  it('n\'affiche pas de message si omis', () => {
    render(<ConfirmDialog {...baseProps} />);
    expect(screen.queryByText(/irréversible/)).not.toBeInTheDocument();
  });

  it('appelle onConfirm au clic sur Confirmer', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Confirmer'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('appelle onCancel au clic sur Annuler', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('utilise les labels personnalisés', () => {
    render(<ConfirmDialog {...baseProps} confirmLabel="Oui, supprimer" cancelLabel="Non, garder" />);
    expect(screen.getByText('Oui, supprimer')).toBeInTheDocument();
    expect(screen.getByText('Non, garder')).toBeInTheDocument();
  });
});
