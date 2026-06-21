import { useCallback } from 'react';

export interface ClubInviteLink {
  url: string;
  qrUrl: string;
  copy: () => Promise<boolean>;
  share: () => Promise<boolean>;
}

export function useClubInviteLink(clubId: string | null | undefined): ClubInviteLink {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://sportlink.app';
  const url  = clubId ? `${base}/#join/${clubId}` : '';
  // QR via service public gratuit (aucune clé requise)
  const qrUrl = url ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&ecc=M&data=${encodeURIComponent(url)}` : '';

  const copy = useCallback(async (): Promise<boolean> => {
    if (!url) return false;
    try { await navigator.clipboard.writeText(url); return true; }
    catch { return false; }
  }, [url]);

  const share = useCallback(async (): Promise<boolean> => {
    if (!url) return false;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Rejoindre mon club sur SportLink', url });
        return true;
      }
      return copy();
    } catch { return false; }
  }, [url, copy]);

  return { url, qrUrl, copy, share };
}
