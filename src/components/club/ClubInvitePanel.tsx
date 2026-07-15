import { useState } from 'react';
import { useClubInviteLink } from '../../hooks/useClubInviteLink.js';

interface ClubInvitePanelProps {
  clubId: string;
  clubName?: string;
}

export default function ClubInvitePanel({ clubId, clubName }: ClubInvitePanelProps) {
  const { url, qrUrl, copy, share } = useClubInviteLink(clubId);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const ok = await copy();
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <div style={{ borderRadius: 'var(--sl-radius-3xl)', border: '1px solid var(--sl-border)', background: 'var(--sl-card)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--sl-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📲</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', margin: 0 }}>Inviter des joueurs</p>
            <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0 }}>Partagez ce QR code ou ce lien</p>
          </div>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* QR code */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ width: 120, height: 120, borderRadius: 'var(--sl-radius-xl)', overflow: 'hidden', border: '1px solid var(--sl-border)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {qrUrl
              ? <img src={qrUrl} alt="QR code invitation" width={112} height={112} style={{ display: 'block' }} />
              : <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>—</span>
            }
          </div>
          <p style={{ fontSize: 9, color: 'var(--sl-t3)', textAlign: 'center', margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scanner pour rejoindre</p>
        </div>

        {/* Texte + boutons */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, color: 'var(--sl-t2)', margin: '0 0 10px', lineHeight: 1.5 }}>
            Un joueur scanne le QR code ou ouvre le lien → il rejoint <strong>{clubName ?? 'le club'}</strong> directement.
          </p>

          {/* Lien */}
          <div style={{ background: 'var(--sl-surface)', borderRadius: 'var(--sl-radius-md)', padding: '6px 10px', marginBottom: 10, border: '1px solid var(--sl-border)' }}>
            <p style={{ fontSize: 10, color: 'var(--sl-t3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</p>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleCopy}
              style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', background: copied ? '#22c55e' : 'var(--sl-surface)', color: copied ? '#fff' : 'var(--sl-t1)', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              {copied ? '✓ Copié !' : '📋 Copier'}
            </button>
            {typeof navigator !== 'undefined' && navigator.share && (
              <button
                onClick={share}
                style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', background: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                📤 Partager
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
