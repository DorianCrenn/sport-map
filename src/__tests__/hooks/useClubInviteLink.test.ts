import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClubInviteLink } from '../../hooks/useClubInviteLink.js';

// Mock navigator
const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
const mockShare = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, configurable: true });
  Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true });
});

describe('useClubInviteLink', () => {
  it('génère une URL correcte avec clubId', () => {
    const { result } = renderHook(() => useClubInviteLink('club-123'));
    expect(result.current.url).toContain('#join/club-123');
  });

  it('génère une URL vide si clubId est null', () => {
    const { result } = renderHook(() => useClubInviteLink(null));
    expect(result.current.url).toBe('');
    expect(result.current.qrUrl).toBe('');
  });

  it('génère un qrUrl vers api.qrserver.com', () => {
    const { result } = renderHook(() => useClubInviteLink('club-abc'));
    expect(result.current.qrUrl).toContain('api.qrserver.com');
    expect(result.current.qrUrl).toContain('club-abc');
  });

  it('copy() appelle clipboard.writeText', async () => {
    const { result } = renderHook(() => useClubInviteLink('club-123'));
    const ok = await result.current.copy();
    expect(ok).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('club-123'));
  });

  it('copy() retourne false si url vide', async () => {
    const { result } = renderHook(() => useClubInviteLink(null));
    const ok = await result.current.copy();
    expect(ok).toBe(false);
  });

  it('share() utilise navigator.share si disponible', async () => {
    const { result } = renderHook(() => useClubInviteLink('club-xyz'));
    const ok = await result.current.share();
    expect(ok).toBe(true);
    expect(mockShare).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining('club-xyz') }));
  });

  it('share() fallback sur copy() si share non dispo', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    const { result } = renderHook(() => useClubInviteLink('club-xyz'));
    const ok = await result.current.share();
    expect(ok).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalled();
  });
});
