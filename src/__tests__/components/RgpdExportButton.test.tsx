import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RgpdExportButton from '../../components/RgpdExportButton.jsx';

const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Test User', email: 'test@test.com' } }) }),
});

vi.mock('../../lib/supabase.js', () => ({
  isDemoMode: () => false,
  setDemoMode: () => {},
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          limit: () => vi.fn().mockResolvedValue({ data: [] }),
        }),
        limit: () => ({ eq: () => vi.fn().mockResolvedValue({ data: [] }) }),
      }),
    }),
  },
}));

// Mock createObjectURL
(globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:test');
(globalThis as any).URL.revokeObjectURL = vi.fn();

describe('RgpdExportButton', () => {
  it('affiche le bouton télécharger', () => {
    render(<RgpdExportButton userId="user-123" userEmail="test@test.com" />);
    expect(screen.getByText(/télécharger/i)).toBeInTheDocument();
  });

  it('affiche le texte RGPD', () => {
    render(<RgpdExportButton userId="user-123" userEmail="test@test.com" />);
    expect(screen.getByText(/RGPD/)).toBeInTheDocument();
  });

  it('le bouton est cliquable', () => {
    render(<RgpdExportButton userId="user-123" userEmail="test@test.com" />);
    const btn = screen.getByRole('button');
    expect(btn).not.toBeDisabled();
  });
});
