import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClubInvitePanel from '../../components/club/ClubInvitePanel.jsx';

vi.mock('../../hooks/useClubInviteLink.js', () => ({
  useClubInviteLink: () => ({
    url: 'https://sportlink.fr/#join/club-abc',
    qrUrl: 'https://api.qrserver.com/v1/create-qr-code/?data=test',
    copy: vi.fn().mockResolvedValue(true),
    share: vi.fn().mockResolvedValue(true),
  }),
}));

describe('ClubInvitePanel', () => {
  it('affiche le titre', () => {
    render(<ClubInvitePanel clubId="club-abc" clubName="FC Brest" />);
    expect(screen.getByText('Inviter des joueurs')).toBeInTheDocument();
  });

  it('affiche le nom du club dans le texte explicatif', () => {
    render(<ClubInvitePanel clubId="club-abc" clubName="FC Brest" />);
    expect(screen.getByText(/FC Brest/)).toBeInTheDocument();
  });

  it('affiche le QR code', () => {
    render(<ClubInvitePanel clubId="club-abc" />);
    const img = screen.getByAltText('QR code invitation');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('qrserver.com'));
  });

  it('affiche le lien d\'invitation', () => {
    render(<ClubInvitePanel clubId="club-abc" />);
    expect(screen.getByText(/sportlink.fr\/#join\/club-abc/)).toBeInTheDocument();
  });

  it('bouton Copier appelle copy()', async () => {
    render(<ClubInvitePanel clubId="club-abc" />);
    const btn = screen.getByRole('button', { name: /copier/i });
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText(/copié/i)).toBeInTheDocument());
  });
});
